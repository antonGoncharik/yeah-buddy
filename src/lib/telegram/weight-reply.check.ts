import { parseWeightReply } from "@/lib/telegram/weight-reply";

function assertEqual(actual: unknown, expected: unknown, label: string): void {
  if (actual !== expected) {
    throw new Error(
      `${label}: got ${String(actual)}, expected ${String(expected)}`,
    );
  }
}

const comma = parseWeightReply("81,4");
const dot = parseWeightReply("81.4");
assertEqual(comma.kind, "save", "comma");
assertEqual(dot.kind, "save", "dot");
assertEqual(comma.kind === "save" ? comma.kg : null, 81.4, "kg");
assertEqual(parseWeightReply("8").kind, "ask", "too light");
assertEqual(parseWeightReply("900").kind, "ask", "too heavy");
assertEqual(parseWeightReply("овсянка 80 г").kind, "ignore", "food line");
assertEqual(parseWeightReply("/weight 82").kind, "ignore", "command");

console.log("weight reply ok");
