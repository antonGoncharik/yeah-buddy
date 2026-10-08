import { MEAL_CHAT_HINT } from "@/lib/messages";
import { cn } from "@/lib/utils";

export function MealChatHint({ className }: { className?: string }) {
  return (
    <p className={cn("text-sm leading-snug text-muted-foreground", className)}>
      {MEAL_CHAT_HINT}
    </p>
  );
}
