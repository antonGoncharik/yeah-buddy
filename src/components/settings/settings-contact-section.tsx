"use client";

import { useEffect, useState } from "react";

import { SectionHeading } from "@/components/layout/section-heading";
import { SettingsAuthor } from "@/components/settings/settings-author";
import { SettingsInbox } from "@/components/settings/settings-inbox";
import { mutateJson } from "@/lib/api-cache";
import { readInboxOpenUrl } from "@/lib/inbox/open-url";
import { isRecord } from "@/lib/read";

function readDonateOpen(data: unknown): boolean {
  return isRecord(data) && data.open === true;
}

export function SettingsContactSection() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void Promise.all([
      mutateJson("/api/inbox").catch(() => null),
      mutateJson("/api/donate").catch(() => null),
    ]).then(([inbox, donate]) => {
      if (cancelled) {
        return;
      }
      setShow(readInboxOpenUrl(inbox) != null || readDonateOpen(donate));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!show) {
    return null;
  }

  return (
    <section className="flex flex-col gap-2">
      <SectionHeading title="Связь" />
      <SettingsInbox />
      <SettingsAuthor />
    </section>
  );
}
