export function rememberPreview(
  file: File,
  previewRef: { current: string | null },
): string {
  revokePreview(previewRef.current);
  const url = URL.createObjectURL(file);
  previewRef.current = url;
  return url;
}

export function revokePreview(url: string | null) {
  if (url) {
    URL.revokeObjectURL(url);
  }
}

export function guessHtmlCamera(): boolean {
  if (typeof navigator === "undefined") {
    return true;
  }
  return /android/i.test(navigator.userAgent);
}

export function stopMedia(stream: MediaStream | null) {
  if (!stream) {
    return;
  }
  for (const track of stream.getTracks()) {
    track.stop();
  }
}
