"use client";

import { useEffect, useState } from "react";

import { cachedGet } from "@/lib/api-cache";
import { readSettingsPayload } from "@/lib/settings/map";
import {
  type ProgramPresetId,
  parseGrantedPrograms,
} from "@/lib/workout/program-presets";

export function useGrantedPrograms() {
  const [granted, setGranted] = useState<ProgramPresetId[]>([]);

  useEffect(() => {
    void cachedGet("/api/settings", (data) => {
      const settings = readSettingsPayload(data);
      if (!settings) {
        return false;
      }
      setGranted(parseGrantedPrograms(settings.granted_programs));
      return true;
    }).catch(() => {
      setGranted([]);
    });
  }, []);

  return granted;
}
