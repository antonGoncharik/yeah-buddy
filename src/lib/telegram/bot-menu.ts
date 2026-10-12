import type { Api } from "grammy";

const COMMANDS = [
  { command: "today", description: "Открыть дневник" },
  { command: "weight", description: "Записать вес: /weight 82.5" },
  { command: "week", description: "Карточка недели" },
  { command: "settings", description: "Настройки" },
  { command: "help", description: "Справка по командам" },
  { command: "donate", description: "Поддержать звёздами" },
  { command: "start", description: "Начать" },
  { command: "yeah", description: "YeahBuddy" },
] as const;

let synced = false;

export async function syncBotMenuCommands(api: Api): Promise<void> {
  if (synced) {
    return;
  }
  synced = true;
  try {
    await api.setMyCommands([...COMMANDS]);
  } catch (error) {
    synced = false;
    console.error("setMyCommands failed", error);
  }
}
