import { publicHttpOrigin, siteOriginUrl } from "@/lib/site-url";

function assertEqual(actual: unknown, expected: unknown, label: string): void {
  const left = JSON.stringify(actual);
  const right = JSON.stringify(expected);
  if (left !== right) {
    throw new Error(`${label}: got ${left}, expected ${right}`);
  }
}

assertEqual(
  publicHttpOrigin("https://diary.example/path?x=1#hash")?.origin,
  "https://diary.example",
  "strips path",
);
assertEqual(publicHttpOrigin("https://t.me/bot"), null, "skips t.me");
assertEqual(publicHttpOrigin("https://www.t.me/bot"), null, "skips www.t.me");
assertEqual(publicHttpOrigin("ftp://diary.example"), null, "skips non-http");
assertEqual(publicHttpOrigin("not a url"), null, "skips junk");

assertEqual(
  siteOriginUrl(["https://t.me/bot", "https://diary.example"]).origin,
  "https://diary.example",
  "picks first public origin",
);
assertEqual(
  siteOriginUrl(["https://t.me/bot"]).origin,
  "http://localhost:3000",
  "falls back to local",
);

console.log("site url ok");
