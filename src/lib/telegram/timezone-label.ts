import { resolveTimeZone } from "@/lib/telegram/reminder-clock";

export interface TimezoneChoice {
  id: string;
  label: string;
}

export const TIMEZONE_CHOICES: TimezoneChoice[] = [
  { id: "Europe/Kaliningrad", label: "Калининград" },
  { id: "Europe/Moscow", label: "Москва" },
  { id: "Europe/Samara", label: "Самара" },
  { id: "Asia/Yekaterinburg", label: "Екатеринбург" },
  { id: "Asia/Omsk", label: "Омск" },
  { id: "Asia/Krasnoyarsk", label: "Красноярск" },
  { id: "Asia/Irkutsk", label: "Иркутск" },
  { id: "Asia/Yakutsk", label: "Якутск" },
  { id: "Asia/Vladivostok", label: "Владивосток" },
  { id: "Asia/Magadan", label: "Магадан" },
  { id: "Asia/Kamchatka", label: "Камчатка" },
  { id: "Europe/Minsk", label: "Минск" },
  { id: "Europe/Kyiv", label: "Киев" },
  { id: "Asia/Almaty", label: "Алматы" },
  { id: "Asia/Tashkent", label: "Ташкент" },
  { id: "Asia/Tbilisi", label: "Тбилиси" },
  { id: "Asia/Yerevan", label: "Ереван" },
  { id: "Asia/Baku", label: "Баку" },
  { id: "Asia/Dubai", label: "Дубай" },
  { id: "Europe/Berlin", label: "Берлин" },
  { id: "Europe/London", label: "Лондон" },
  { id: "UTC", label: "UTC" },
];

export function timezoneZoneName(timeZone: string): string {
  return resolveTimeZone(timeZone).replaceAll("_", " ");
}

export function timezoneChoiceLabel(timeZone: string): string {
  const zone = resolveTimeZone(timeZone);
  return (
    TIMEZONE_CHOICES.find((choice) => choice.id === zone)?.label ??
    timezoneZoneName(zone)
  );
}

export function timezoneChoicesFor(current: string): TimezoneChoice[] {
  const zone = resolveTimeZone(current);
  if (TIMEZONE_CHOICES.some((choice) => choice.id === zone)) {
    return TIMEZONE_CHOICES;
  }

  return [{ id: zone, label: timezoneZoneName(zone) }, ...TIMEZONE_CHOICES];
}

export function timezoneCaption(timeZone: string, now = new Date()): string {
  const zone = resolveTimeZone(timeZone);
  const label = timezoneChoiceLabel(zone);
  try {
    const time = new Intl.DateTimeFormat("ru-RU", {
      timeZone: zone,
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).format(now);
    return `${label} · сейчас ${time}`;
  } catch {
    return label;
  }
}
