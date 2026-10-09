import { createClient } from "@supabase/supabase-js";

import { linkStarterExercisesToCatalog } from "@/lib/workout/starter-catalog-link";

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required",
    );
  }

  const userId = process.argv[2];
  if (!userId) {
    throw new Error(
      "usage: tsx --env-file=.env.local scripts/backfill-exercise-catalog-links.ts <user_id>",
    );
  }

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  await linkStarterExercisesToCatalog(supabase, userId);
  console.log(`linked starter catalog for user ${userId}`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
