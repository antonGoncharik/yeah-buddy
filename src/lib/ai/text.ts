export function formatReviewMessage(input: {
  headline: string;
  observations: string[];
  watch: string[];
}): string {
  const lines = [
    input.headline,
    "",
    ...input.observations.map((item) => `• ${item}`),
  ];
  if (input.watch.length > 0) {
    lines.push("", "Дальше", ...input.watch.map((item) => `• ${item}`));
  }
  return lines.join("\n");
}
