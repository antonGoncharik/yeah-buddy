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
      placeholder="Поиск продукта"
      className="h-14 rounded-2xl text-base"
      inputMode="search"
      enterKeyHint="search"
    />
  );
}
