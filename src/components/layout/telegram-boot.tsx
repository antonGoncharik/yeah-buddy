import {
  TELEGRAM_BOOT_SCRIPT,
  TELEGRAM_BOOT_STYLE,
} from "@/lib/telegram/boot-script";

export function TelegramBoot() {
  return (
    <>
      <style>{TELEGRAM_BOOT_STYLE}</style>
      <script>{TELEGRAM_BOOT_SCRIPT}</script>
    </>
  );
}
