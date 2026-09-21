import { redirect } from "next/navigation";

import { INVITE_HREF } from "@/lib/share/invite";

export default function WorkoutsInviteRedirect() {
  redirect(INVITE_HREF);
}
