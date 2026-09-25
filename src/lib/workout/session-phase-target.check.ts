import { plannedSessionPhaseTarget } from "@/lib/workout/session-rebuild";

function assert(condition: unknown, label: string): asserts condition {
  if (!condition) {
    throw new Error(label);
  }
}

const same = {
  status: "planned" as const,
  phaseId: "volume",
  macroId: "macro",
  hasLoggedSets: false,
  currentPhaseId: "volume",
  currentMacroId: "macro",
};

assert(
  plannedSessionPhaseTarget(same) == null,
  "an open session already on this week stays",
);

const moved = plannedSessionPhaseTarget({
  ...same,
  currentPhaseId: "peak",
});
assert(
  moved?.phaseId === "peak" && moved.macroId === "macro",
  "closing a week moves today's unstarted session onto the next week",
);

assert(
  plannedSessionPhaseTarget({
    ...same,
    currentPhaseId: "peak",
    hasLoggedSets: true,
  }) == null,
  "logged sets stay on the week they were started under",
);

assert(
  plannedSessionPhaseTarget({
    ...same,
    status: "completed",
    currentPhaseId: "peak",
  }) == null,
  "a finished session keeps its week",
);

const nextMacro = plannedSessionPhaseTarget({
  ...same,
  currentMacroId: "next",
});
assert(
  nextMacro?.macroId === "next" && nextMacro.phaseId === "volume",
  "a new cycle retargets today's unstarted session",
);

console.log("session phase target ok");
