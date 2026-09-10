const TOKEN_ALPHABET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-";
const TOKEN_LENGTH = 12;
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{8,64}$/;

export function isPackToken(value: string): boolean {
  return TOKEN_PATTERN.test(value);
}

export function createPackToken(): string {
  const bytes = new Uint8Array(TOKEN_LENGTH);
  crypto.getRandomValues(bytes);
  let token = "";
  for (const byte of bytes) {
    token += TOKEN_ALPHABET[byte % TOKEN_ALPHABET.length];
  }
  return token;
}
