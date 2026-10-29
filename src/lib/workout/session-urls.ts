export function sessionDetailUrl(sessionId: string): string {
  return `/api/sessions/${sessionId}`;
}

export function sessionDateUrl(date: string): string {
  return `/api/sessions?date=${encodeURIComponent(date)}`;
}

export function sessionExerciseUrl(
  sessionId: string,
  sessionExerciseId: string,
): string {
  return `${sessionDetailUrl(sessionId)}/exercises/${sessionExerciseId}`;
}

export function sessionSetUrl(setId: string): string {
  return `/api/sets/${setId}`;
}

export function sessionDetailCacheUrls(detail: {
  session: { id: string; session_date: string };
}): string[] {
  return [
    sessionDetailUrl(detail.session.id),
    sessionDateUrl(detail.session.session_date),
  ];
}
