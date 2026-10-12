const PERMANENT_BLOCK_MARKERS = [
  "bot was blocked by the user",
  "user is deactivated",
  "can't initiate conversation",
  "bot was kicked",
  "chat not found",
];

export function isPermanentChatBlock(error: {
  error_code: number;
  description?: string | null;
}): boolean {
  if (error.error_code !== 403 && error.error_code !== 400) {
    return false;
  }
  const description = (error.description ?? "").toLowerCase();
  return PERMANENT_BLOCK_MARKERS.some((marker) => description.includes(marker));
}
