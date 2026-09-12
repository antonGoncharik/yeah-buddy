"use client";

import { Input } from "@/components/ui/input";

export function FoodSearch({
  value,
  onChange,
  placeholder = "Поиск продукта",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <Input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className="h-14 rounded-2xl text-base"
      inputMode="search"
      enterKeyHint="search"
    />
  );
}
