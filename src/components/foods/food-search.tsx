"use client";

import { ScanBarcode } from "lucide-react";
import { useRef, useState } from "react";

import { BarcodeScanner } from "@/components/foods/barcode-scanner";
import { Button } from "@/components/ui/button";
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
  const inputRef = useRef<HTMLInputElement>(null);
  const [scanning, setScanning] = useState(false);

  function closeScanner() {
    setScanning(false);
    window.setTimeout(() => inputRef.current?.focus(), 0);
  }

  return (
    <>
      <div className="relative">
        <Input
          ref={inputRef}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="h-14 rounded-2xl pr-14 text-base"
          inputMode="search"
          enterKeyHint="search"
        />
        <Button
          type="button"
          variant="ghost"
          size="icon-lg"
          className="absolute top-1/2 right-1.5 -translate-y-1/2 text-muted-foreground"
          aria-label="Сканировать штрихкод"
          onClick={() => setScanning(true)}
        >
          <ScanBarcode className="size-5" />
        </Button>
      </div>
      {scanning ? (
        <BarcodeScanner
          onDetected={(ean) => {
            setScanning(false);
            onChange(ean);
          }}
          onClose={closeScanner}
        />
      ) : null}
    </>
  );
}
