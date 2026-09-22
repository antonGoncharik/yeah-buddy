import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  isListedProgramPresetId,
  isProgramPresetId,
  parseGrantedPrograms,
  programPresetById,
} from "@/lib/workout/program-presets";

const USAGE =
  "usage: npm run program:grant -- <telegram-username> <preset-id> [--revoke]";

async function main() {
  const args = process.argv.slice(2).filter((arg) => arg !== "--");
  const revoke = args.includes("--revoke");
  const positional = args.filter((arg) => arg !== "--revoke");
  const username = positional[0]?.replace(/^@/, "");
  const presetId = positional[1];

  if (!username || !presetId || positional.length !== 2) {
    throw new Error(USAGE);
  }
  if (!isProgramPresetId(presetId)) {
    throw new Error(`нет такой программы: ${presetId}`);
  }
  if (isListedProgramPresetId(presetId)) {
    throw new Error(`${presetId} уже в общем списке`);
  }

  const supabase = createSupabaseServerClient();
  const found = await supabase
    .from("users")
    .select("id, username, first_name")
    .ilike("username", username);

  if (found.error) {
    throw found.error;
  }

  const matches = found.data ?? [];
  if (matches.length === 0) {
    throw new Error(`user not found: ${username}`);
  }
  if (matches.length > 1) {
    throw new Error(
      `multiple users match ${username}: ${matches.map((row) => row.id).join(", ")}`,
    );
  }

  const user = matches[0];
  if (!user || typeof user.id !== "string") {
    throw new Error(`user not found: ${username}`);
  }

  const settings = await supabase
    .from("user_settings")
    .select("granted_programs")
    .eq("user_id", user.id)
    .maybeSingle();

  if (settings.error) {
    throw settings.error;
  }
  if (!settings.data) {
    throw new Error(`settings not found: ${username}`);
  }

  const current = parseGrantedPrograms(settings.data.granted_programs);
  const next = revoke
    ? current.filter((id) => id !== presetId)
    : current.includes(presetId)
      ? current
      : [...current, presetId];

  const saved = await supabase
    .from("user_settings")
    .update({
      granted_programs: next,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id)
    .select("granted_programs")
    .single();

  if (saved.error) {
    throw saved.error;
  }

  const preset = programPresetById(presetId);
  console.log(
    JSON.stringify(
      {
        user: user.username,
        program: preset?.name ?? presetId,
        revoked: revoke,
        granted_programs: parseGrantedPrograms(saved.data.granted_programs),
      },
      null,
      2,
    ),
  );
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
