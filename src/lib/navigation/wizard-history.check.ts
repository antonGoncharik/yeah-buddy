import {
  pushWizardScreenEntry,
  readWizardScreenEntry,
  replaceWizardScreenEntry,
  writeWizardScreenEntry,
  WIZARD_SCREEN_KEY,
} from "@/lib/navigation/wizard-history";

function assertEqual(actual: unknown, expected: unknown, label: string): void {
  if (actual !== expected) {
    throw new Error(
      `${label}: got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`,
    );
  }
}

const entry = { flow: "onboarding", step: "sex", sub: null };
const merged = writeWizardScreenEntry({ ybExitAnchor: true }, entry);
assertEqual(merged.ybExitAnchor, true, "keeps prior history fields");
assertEqual(
  readWizardScreenEntry(merged)?.step,
  "sex",
  "round-trips step",
);

assertEqual(
  readWizardScreenEntry({ [WIZARD_SCREEN_KEY]: { flow: "x", step: "y" } })?.sub,
  null,
  "missing sub is null",
);

assertEqual(
  readWizardScreenEntry({
    [WIZARD_SCREEN_KEY]: { flow: "onboarding", step: "guide", sub: "g:1" },
  })?.sub,
  "g:1",
  "reads sub",
);

if (typeof window !== "undefined") {
  const base = window.history.state;
  assertEqual(replaceWizardScreenEntry(entry), true, "replace works");
  assertEqual(
    readWizardScreenEntry(window.history.state)?.step,
    "sex",
    "replace in window",
  );
  assertEqual(pushWizardScreenEntry({ ...entry, step: "weight" }), true, "push works");
  assertEqual(
    readWizardScreenEntry(window.history.state)?.step,
    "weight",
    "push updates state",
  );
  window.history.replaceState(base, "");
}

console.log("wizard history ok");
