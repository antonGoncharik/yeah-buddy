export interface SessionCsvRow {
  date: string;
  exercise: string;
  setNumber: number;
  weight: number | null;
  reps: number | null;
}

export function sessionsToCsv(rows: readonly SessionCsvRow[]): string {
  const lines = ["date,exercise,set,weight_kg,reps"];
  for (const row of rows) {
    lines.push(
      [
        row.date,
        csvCell(row.exercise),
        String(row.setNumber),
        row.weight == null ? "" : String(row.weight),
        row.reps == null ? "" : String(row.reps),
      ].join(","),
    );
  }
  return `${lines.join("\n")}\n`;
}

function csvCell(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replaceAll('"', '""')}"`;
  }
  return value;
}
