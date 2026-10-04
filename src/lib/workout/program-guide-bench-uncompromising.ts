import type { ProgramPreset } from "@/lib/workout/program-preset-data";
import { THIRTEEN_WEEK_CYCLE } from "@/lib/workout/cycle-templates";
import { compileBenchGuideWeeks } from "@/lib/workout/program-guide-bench-compile";
import { BENCH_GUIDE_RAW_WEEKS } from "@/lib/workout/program-guide-bench-weeks-data";

const weeks = compileBenchGuideWeeks(BENCH_GUIDE_RAW_WEEKS);

export const BENCH_UNCOMPROMISING_PRESET: ProgramPreset = {
  id: "bench_uncompromising",
  name: "Подними свой жим без компромиссов",
  hint: "Тринадцать недель: жим, присед и подсобка. Каждую неделю план меняется сам.",
  level: "advanced",
  templates: weeks.w1,
  weeks,
  cycle: THIRTEEN_WEEK_CYCLE,
  cycle_auto_end: true,
  cycle_loop: false,
};
