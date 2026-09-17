export interface AccountExport {
  v: 1;
  exported_at: string;
  user: {
    id: string;
    telegram_id: number;
    username: string | null;
    first_name: string | null;
    created_at: string;
  };
  tables: Record<string, unknown[]>;
}

export function accountExportFilename(exportedAt: string): string {
  const day = exportedAt.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(day)
    ? `yeah-buddy-${day}.json`
    : "yeah-buddy.json";
}
