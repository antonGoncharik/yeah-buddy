"use client";

import { useParams } from "next/navigation";

import { AppHeader } from "@/components/layout/app-header";
import { TemplateForm } from "@/components/workout/template-form";

export default function TemplatePage() {
  const params = useParams<{ id: string }>();
  const isNew = params.id === "new";

  return (
    <div className="flex flex-col gap-4">
      <AppHeader
        title={isNew ? "Новая тренировка" : "Тренировка"}
        backHref="/workouts/schedule"
      />
      <div className="px-4 pb-4">
        <TemplateForm templateId={isNew ? undefined : params.id} />
      </div>
    </div>
  );
}
