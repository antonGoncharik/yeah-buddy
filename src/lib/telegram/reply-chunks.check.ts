import { splitTelegramText } from "@/lib/telegram/reply-chunks";

function assert(condition: boolean, label: string) {
  if (!condition) {
    throw new Error(label);
  }
}

export default (() => {
  assert(splitTelegramText("  ").length === 0, "blank text sends nothing");
  assert(
    splitTelegramText("короткий ответ").join("") === "короткий ответ",
    "short text stays one message",
  );

  const long = `${"абзац один.\n".repeat(200)}${"слово ".repeat(900)}`;
  const chunks = splitTelegramText(long);
  assert(chunks.length > 1, "long answer splits");
  assert(
    chunks.every((chunk) => chunk.length <= 4000 && chunk.length > 0),
    "each chunk fits telegram",
  );
  assert(
    chunks.join("").replace(/\s+/g, "") === long.replace(/\s+/g, ""),
    "split keeps the text",
  );

  console.log("reply chunks ok");
})();
