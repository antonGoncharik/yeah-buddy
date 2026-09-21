"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { PROGRAM_COPIED_LINK, PROGRAM_COPY_LINK } from "@/lib/messages";

export function CopyLinkButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function onCopy() {
    const href = absoluteHref(url);
    try {
      await navigator.clipboard.writeText(href);
    } catch {
      const field = document.createElement("textarea");
      field.value = href;
      field.setAttribute("readonly", "");
      field.style.position = "fixed";
      field.style.left = "-9999px";
      document.body.append(field);
      field.select();
      const ok = document.execCommand("copy");
      field.remove();
      if (!ok) {
        return;
      }
    }
    setCopied(true);
  }

  return (
    <Button
      type="button"
      variant="secondary"
      className="h-10 shrink-0 px-3 text-sm"
      onClick={() => void onCopy()}
    >
      {copied ? PROGRAM_COPIED_LINK : PROGRAM_COPY_LINK}
    </Button>
  );
}

function absoluteHref(url: string): string {
  if (url.startsWith("https://") || url.startsWith("http://")) {
    return url;
  }
  return new URL(url, window.location.origin).href;
}
