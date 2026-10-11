import { isPackToken, PACK_TOKEN_LENGTH } from "@/lib/share/token";

export function makePackStart(prefix: string) {
  function payload(token: string): string {
    return `${prefix}${token}`;
  }

  function parse(value: string): string | null {
    const trimmed = value.trim();
    if (!trimmed.startsWith(prefix)) {
      return null;
    }

    const token = trimmed.slice(prefix.length);
    if (token.length !== PACK_TOKEN_LENGTH || !isPackToken(token)) {
      return null;
    }

    return token;
  }

  function read(value: string): string | null {
    const trimmed = value.trim();
    return parse(trimmed) ?? parse(payload(trimmed));
  }

  return { payload, parse, read };
}
