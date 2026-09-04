import { AppHeader } from "@/components/layout/app-header";
import { TemplateForm } from "@/components/workout/template-form";

export default function NewTemplatePage() {
  return (
    <div className="flex flex-col gap-4">
      <AppHeader title="Новый шаблон" backHref="/workouts/schedule" />
      <div className="px-4 pb-4">
        <TemplateForm />
      </div>
    </div>
  );
}
