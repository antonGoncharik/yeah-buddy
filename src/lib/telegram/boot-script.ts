import { DARK_THEME_COLOR, LIGHT_THEME_COLOR } from "@/lib/theme";

export const TELEGRAM_INIT_STORAGE_KEY = "__telegram__initParams";

export const TELEGRAM_BOOT_HIDE_CLASS = "tg-boot";

// Applied before the landing markup parses. next/script beforeInteractive only
// queues work until hydration, so the public page paints and then redirects.
export const TELEGRAM_BOOT_STYLE = `html.${TELEGRAM_BOOT_HIDE_CLASS}{background-color:var(--background,${LIGHT_THEME_COLOR})}html.dark.${TELEGRAM_BOOT_HIDE_CLASS}{background-color:var(--background,${DARK_THEME_COLOR})}html.${TELEGRAM_BOOT_HIDE_CLASS} body{visibility:hidden}`;

export const TELEGRAM_BOOT_SCRIPT = `(function(){try{var h=location.hash||"";if(h.indexOf("tgWebApp")===-1)return;var q=h.charAt(0)==="#"?h.slice(1):h;var i=q.indexOf("?");if(i>=0)q=q.slice(i+1);var p={};q.split("&").forEach(function(part){var e=part.indexOf("=");if(e<0)return;var k=decodeURIComponent((part.slice(0,e)||"").replace(/\\+/g," "));var v=decodeURIComponent((part.slice(e+1)||"").replace(/\\+/g," "));if(k)p[k]=v;});if(p.tgWebAppData||p.tgWebAppVersion){sessionStorage.setItem("${TELEGRAM_INIT_STORAGE_KEY}",JSON.stringify(p));if(location.pathname==="/"){var root=document.documentElement;root.classList.add("${TELEGRAM_BOOT_HIDE_CLASS}");new MutationObserver(function(){root.classList.contains("${TELEGRAM_BOOT_HIDE_CLASS}")||root.classList.add("${TELEGRAM_BOOT_HIDE_CLASS}");}).observe(root,{attributes:true,attributeFilter:["class"]});location.replace("/today"+location.search+location.hash);}}}catch(e){}})();`;

export function telegramInitParamsFromHash(
  hash: string,
): Record<string, string> | null {
  if (!hash.includes("tgWebApp")) {
    return null;
  }
  let query = hash.startsWith("#") ? hash.slice(1) : hash;
  const qIndex = query.indexOf("?");
  if (qIndex >= 0) {
    query = query.slice(qIndex + 1);
  }
  const params: Record<string, string> = {};
  for (const part of query.split("&")) {
    const eq = part.indexOf("=");
    if (eq < 0) {
      continue;
    }
    const key = decodeURIComponent(part.slice(0, eq).replace(/\+/g, " "));
    const value = decodeURIComponent(part.slice(eq + 1).replace(/\+/g, " "));
    if (key) {
      params[key] = value;
    }
  }
  if (!params.tgWebAppData && !params.tgWebAppVersion) {
    return null;
  }
  return params;
}
