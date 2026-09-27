"use client";

import { useEffect, useRef, useState } from "react";

import { SPEECH_MAX_SECONDS } from "@/lib/ai/speech-wav";

export function useSpeechRecorder() {
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const discardRef = useRef(false);
  const stoppingRef = useRef(false);
  const takeRef = useRef<((blob: Blob) => void) | null>(null);
  const liveRef = useRef(false);

  useEffect(() => {
    return () => {
      discardRef.current = true;
      liveRef.current = false;
      clearTimer(timerRef);
      const recorder = recorderRef.current;
      recorderRef.current = null;
      if (recorder && recorder.state !== "inactive") {
        recorder.onstop = null;
        recorder.stop();
      }
      stopTracks(streamRef.current);
      streamRef.current = null;
    };
  }, []);

  async function start(onTake: (blob: Blob) => void): Promise<boolean> {
    if (liveRef.current) {
      return true;
    }
    if (
      typeof MediaRecorder === "undefined" ||
      !navigator.mediaDevices?.getUserMedia
    ) {
      return false;
    }

    liveRef.current = true;

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
        video: false,
      });
    } catch {
      liveRef.current = false;
      return false;
    }

    const mime = recorderMime();
    let recorder: MediaRecorder;
    try {
      recorder = mime
        ? new MediaRecorder(stream, { mimeType: mime })
        : new MediaRecorder(stream);
    } catch {
      liveRef.current = false;
      stopTracks(stream);
      return false;
    }

    chunksRef.current = [];
    discardRef.current = false;
    stoppingRef.current = false;
    takeRef.current = onTake;
    streamRef.current = stream;
    recorderRef.current = recorder;
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, {
        type: recorder.mimeType || mime || "audio/webm",
      });
      chunksRef.current = [];
      stopTracks(streamRef.current);
      streamRef.current = null;
      recorderRef.current = null;
      clearTimer(timerRef);
      liveRef.current = false;
      setRecording(false);
      if (!discardRef.current && blob.size > 0) {
        takeRef.current?.(blob);
      }
    };

    recorder.start(250);
    setSeconds(0);
    setRecording(true);
    const started = Date.now();
    timerRef.current = window.setInterval(() => {
      const elapsed = Math.min(
        SPEECH_MAX_SECONDS,
        Math.floor((Date.now() - started) / 1000),
      );
      setSeconds(elapsed);
      if (elapsed >= SPEECH_MAX_SECONDS) {
        finish();
      }
    }, 250);
    return true;
  }

  function finish() {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === "inactive" || stoppingRef.current) {
      return;
    }
    stoppingRef.current = true;
    discardRef.current = false;
    recorder.stop();
  }

  function cancel() {
    discardRef.current = true;
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === "inactive") {
      clearTimer(timerRef);
      stopTracks(streamRef.current);
      streamRef.current = null;
      recorderRef.current = null;
      liveRef.current = false;
      setRecording(false);
      return;
    }
    stoppingRef.current = true;
    recorder.stop();
  }

  return { recording, seconds, start, finish, cancel };
}

function recorderMime(): string {
  if (typeof MediaRecorder === "undefined") {
    return "";
  }
  const types = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/aac",
  ];
  return types.find((type) => MediaRecorder.isTypeSupported(type)) ?? "";
}

function clearTimer(timerRef: { current: number | null }) {
  if (timerRef.current != null) {
    window.clearInterval(timerRef.current);
    timerRef.current = null;
  }
}

function stopTracks(stream: MediaStream | null) {
  if (!stream) {
    return;
  }
  for (const track of stream.getTracks()) {
    track.stop();
  }
}
