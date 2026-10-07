"use client";

import { useCallback, useEffect, useState } from "react";

import {
  dismissProgramEditableHint,
  isProgramEditableHintPending,
  PROGRAM_EDITABLE_HINT_EVENT,
} from "@/lib/workout/program-editable-hint";

export function useProgramEditableHint(): {
  open: boolean;
  dismiss: () => void;
} {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const sync = () => setOpen(isProgramEditableHintPending());
    sync();
    window.addEventListener(PROGRAM_EDITABLE_HINT_EVENT, sync);
    return () => window.removeEventListener(PROGRAM_EDITABLE_HINT_EVENT, sync);
  }, []);

  const dismiss = useCallback(() => {
    dismissProgramEditableHint();
    setOpen(false);
  }, []);

  return { open, dismiss };
}
