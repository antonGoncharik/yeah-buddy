import type { ProgramPresetId } from "@/lib/workout/program-preset-data";

export const DEV_ONLY_PROGRAM_PRESET_IDS = [
  "bench_uncompromising",
] as const satisfies readonly ProgramPresetId[];

const devOnlyIds = new Set<ProgramPresetId>(DEV_ONLY_PROGRAM_PRESET_IDS);

export function isDevOnlyProgramPresetId(id: ProgramPresetId): boolean {
  return devOnlyIds.has(id);
}

export interface ProgramAccessOptions {
  devTester?: boolean;
}

export function readDevProgramTester(data: unknown): boolean {
  if (data == null || typeof data !== "object") {
    return false;
  }
  return Reflect.get(data, "dev_program_tester") === true;
}
