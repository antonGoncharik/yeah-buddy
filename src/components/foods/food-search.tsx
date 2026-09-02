"use client";

import { Input } from "@/components/ui/input";

export function FoodSearch({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <Input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder="Поиск"
      className="h-12 text-base"
      inputMode="search"
      enterKeyHint="search"
    />
  );
}
