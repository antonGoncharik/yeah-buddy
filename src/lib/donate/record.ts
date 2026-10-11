import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function recordDonation(input: {
  userId: string;
  stars: number;
  telegramPaymentChargeId: string;
}): Promise<void> {
  try {
    const supabase = createSupabaseServerClient();
    const inserted = await supabase.from("donations").insert({
      user_id: input.userId,
      stars: input.stars,
      telegram_payment_charge_id: input.telegramPaymentChargeId,
    });
    if (inserted.error) {
      if (
        inserted.error.code === "23505" ||
        inserted.error.code === "42P01" ||
        inserted.error.code === "PGRST205"
      ) {
        return;
      }
      console.error("donation insert failed", inserted.error);
    }
  } catch (error) {
    console.error("donation insert failed", error);
  }
}

export async function findUserIdByTelegramId(
  telegramId: number,
): Promise<string | null> {
  const supabase = createSupabaseServerClient();
  const result = await supabase
    .from("users")
    .select("id")
    .eq("telegram_id", telegramId)
    .maybeSingle();
  if (result.error || !result.data) {
    return null;
  }
  return String(result.data.id);
}
