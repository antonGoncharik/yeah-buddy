import { redirect } from "next/navigation";

import { INVITE_HREF } from "@/lib/share/invite";

export default function SettingsInviteRedirect() {
  redirect(INVITE_HREF);
}
