"use client";

import { useParams } from "next/navigation";

import { AppHeader } from "@/components/layout/app-header";
import { TemplateForm } from "@/components/workout/template-form";

export default function EditTemplatePage() {
  const params = useParams<{ id: string }>();

  return (
    <div className="flex flex-col gap-4">
      <AppHeader title="Шаблон" backHref="/workouts/schedule" />
      <div className="px-4 pb-4">
        <TemplateForm templateId={params.id} />
      </div>
    </div>
  );
}
