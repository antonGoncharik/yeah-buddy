import { createHmac } from "node:crypto";

import {
  readStartParamFromInitData,
  verifyTelegramInitData,
} from "@/lib/telegram/verify-init-data";

const TOKEN = "123456:test-token";

function assertEqual(actual: unknown, expected: unknown, label: string) {
  const left = JSON.stringify(actual);
  const right = JSON.stringify(expected);
  if (left !== right) {
    throw new Error(`${label}: got ${left}, expected ${right}`);
  }
}

function signedInitData(fields: Record<string, string>, token = TOKEN): string {
  const params = new URLSearchParams(fields);
  const dataCheckString = [...params.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");
  const secretKey = createHmac("sha256", "WebAppData").update(token).digest();
  const hash = createHmac("sha256", secretKey)
    .update(dataCheckString)
    .digest("hex");
  params.set("hash", hash);
  return params.toString();
}

const now = Math.floor(Date.now() / 1000);
const user = JSON.stringify({
  id: 42,
  first_name: "Антон",
  username: "anton",
  language_code: "ru",
});

const valid = signedInitData({
  auth_date: String(now),
  query_id: "q1",
  user,
  start_param: "open",
});

assertEqual(
  verifyTelegramInitData(valid, TOKEN),
  {
    id: 42,
    username: "anton",
    first_name: "Антон",
    language_code: "ru",
  },
  "valid init data",
);
assertEqual(readStartParamFromInitData(valid), "open", "start param");
assertEqual(verifyTelegramInitData(valid, "other"), null, "wrong token");
assertEqual(
  verifyTelegramInitData(valid.replace("hash=", "hash=00"), TOKEN),
  null,
  "tampered hash",
);
assertEqual(verifyTelegramInitData("", TOKEN), null, "empty payload");
assertEqual(verifyTelegramInitData(valid, ""), null, "empty token");
assertEqual(
  verifyTelegramInitData(
    signedInitData({
      auth_date: String(now - 6 * 60),
      user,
    }),
    TOKEN,
  ),
  null,
  "expired auth date",
);
assertEqual(
  verifyTelegramInitData(
    signedInitData({
      auth_date: String(now + 120),
      user,
    }),
    TOKEN,
  ),
  null,
  "future auth date",
);
assertEqual(
  verifyTelegramInitData(
    signedInitData({
      auth_date: String(now),
    }),
    TOKEN,
  ),
  null,
  "missing user",
);
assertEqual(readStartParamFromInitData("auth_date=1"), null, "no start param");

console.log("verify init data ok");
