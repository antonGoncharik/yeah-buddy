import { TELEGRAM_FULLSCREEN_STORAGE_KEY } from "@/lib/telegram/fullscreen-storage";
import { DARK_THEME_COLOR, LIGHT_THEME_COLOR } from "@/lib/theme";

export const TELEGRAM_INIT_STORAGE_KEY = "__telegram__initParams";
export const TELEGRAM_INIT_LOCAL_STORAGE_KEY = "__telegram__initParams_local";
export const TELEGRAM_INIT_RELOAD_FLAG = "__telegram__init_reload_done";
export const TELEGRAM_WEBAPP_SCRIPT_URL =
  "https://telegram.org/js/telegram-web-app.js";
export const TELEGRAM_SDK_WAIT_MS = 1_200;

export const TELEGRAM_BOOT_HIDE_CLASS = "tg-boot";

// Applied before the landing markup parses. next/script beforeInteractive only
// queues work until hydration, so the public page paints and then redirects.
export const TELEGRAM_BOOT_STYLE = `html.${TELEGRAM_BOOT_HIDE_CLASS}{background-color:var(--background,${LIGHT_THEME_COLOR})}html.dark.${TELEGRAM_BOOT_HIDE_CLASS}{background-color:var(--background,${DARK_THEME_COLOR})}html.${TELEGRAM_BOOT_HIDE_CLASS} body{visibility:hidden}`;

export const TELEGRAM_BOOT_SCRIPT = `(function(){try{var KEY="${TELEGRAM_INIT_STORAGE_KEY}";var FS_KEY="${TELEGRAM_FULLSCREEN_STORAGE_KEY}";function parseLaunchHash(h){h=h||"";if(h.indexOf("tgWebApp")===-1)return null;var q=h.charAt(0)==="#"?h.slice(1):h;var i=q.indexOf("?");if(i>=0)q=q.slice(i+1);var p={};q.split("&").forEach(function(part){var e=part.indexOf("=");if(e<0)return;var k=decodeURIComponent((part.slice(0,e)||"").replace(/\\+/g," "));var v=decodeURIComponent((part.slice(e+1)||"").replace(/\\+/g," "));if(k)p[k]=v;});if(p.tgWebAppData||p.tgWebAppVersion)return p;return null;}function mergePersist(p){try{var merged=p;var prev=sessionStorage.getItem(KEY);if(prev){try{merged=Object.assign(JSON.parse(prev),p);}catch(err){}}sessionStorage.removeItem(FS_KEY);sessionStorage.setItem(KEY,JSON.stringify(merged));return merged;}catch(err){return null;}}function askFs(){try{var w=typeof window==="undefined"?null:window;if(!w)return;if(w.TelegramWebviewProxy&&w.TelegramWebviewProxy.postEvent){w.TelegramWebviewProxy.postEvent("web_app_request_fullscreen","{}");}else if(w.external&&typeof w.external.notify==="function"){w.external.notify(JSON.stringify({eventType:"web_app_request_fullscreen",eventData:{}}));}}catch(err){}}function isAndroidLaunch(p){var plat=p&&p.tgWebAppPlatform;if(plat&&String(plat).toLowerCase()==="android")return true;try{return /android/i.test(navigator.userAgent);}catch(err){return false;}}function scheduleAskFs(){try{var raw=sessionStorage.getItem(KEY);var p=raw?JSON.parse(raw):null;if(isAndroidLaunch(p))return;}catch(err){}askFs();if(typeof setTimeout==="function"){setTimeout(askFs,150);setTimeout(askFs,600);setTimeout(askFs,1200);}}function hydrateLocal(){try{if(sessionStorage.getItem(KEY))return;var l=localStorage.getItem("${TELEGRAM_INIT_LOCAL_STORAGE_KEY}");if(l)sessionStorage.setItem(KEY,l);}catch(err){}}function parseLaunchSearch(){try{var s=location.search||"";if(s.indexOf("tgWebApp")===-1)return null;var q=s.charAt(0)==="?"?s.slice(1):s;var p={};q.split("&").forEach(function(part){var e=part.indexOf("=");if(e<0)return;var k=decodeURIComponent((part.slice(0,e)||"").replace(/\\+/g," "));var v=decodeURIComponent((part.slice(e+1)||"").replace(/\\+/g," "));if(k.indexOf("tgWebApp")===0)p[k]=v;});if(p.tgWebAppData||p.tgWebAppVersion)return p;return null;}catch(err){return null;}}function restoreHashFromStorage(){try{if(parseLaunchHash(location.hash))return;var prev=sessionStorage.getItem(KEY);if(!prev)return;var s=JSON.parse(prev);if(!s.tgWebAppData&&!s.tgWebAppVersion)return;var parts=[];for(var k in s){if(Object.prototype.hasOwnProperty.call(s,k)&&s[k]!=null&&s[k]!=="")parts.push(encodeURIComponent(k)+"="+encodeURIComponent(String(s[k])));}if(!parts.length)return;history.replaceState(history.state,"",location.pathname+location.search+"#"+parts.join("&"));}catch(err){}}var SDK_URL="${TELEGRAM_WEBAPP_SCRIPT_URL}";var RELOAD_KEY="${TELEGRAM_INIT_RELOAD_FLAG}";var SDK_WAIT_MS=${TELEGRAM_SDK_WAIT_MS};var sdkRequested=false;function hasLaunchParams(){return!!(parseLaunchHash(location.hash)||parseLaunchSearch());}function storedLaunchReady(){try{var raw=sessionStorage.getItem(KEY);if(!raw)return false;var s=JSON.parse(raw);return!!(s.tgWebAppData||s.tgWebAppVersion);}catch(err){return false;}}function telegramSdkPresent(){return!!(window.Telegram&&window.Telegram.WebApp);}function telegramInitReady(){try{return!!(window.Telegram&&window.Telegram.WebApp&&String(window.Telegram.WebApp.initData||"").length>0);}catch(err){return false;}}function loadTelegramSdk(){if(sdkRequested)return;sdkRequested=true;if(telegramSdkPresent())return;try{var s=document.createElement("script");if(!s)return;s.src=SDK_URL;s.async=false;var target=document.head||document.documentElement;if(!target||!target.appendChild)return;target.appendChild(s);}catch(err){}}function maybeReloadStaleWebApp(params){if(!params||!params.tgWebAppData)return;try{if(telegramSdkPresent()&&!telegramInitReady()){if(sessionStorage.getItem(RELOAD_KEY)==="1")return;sessionStorage.setItem(RELOAD_KEY,"1");location.reload();}}catch(err){}}function scheduleTelegramSdk(){if(hasLaunchParams()||storedLaunchReady()){loadTelegramSdk();return;}var deadline=Date.now()+SDK_WAIT_MS;var tick=function(){hydrateLocal();restoreHashFromStorage();var late=parseLaunchHash(location.hash);if(late){mergePersist(late);maybeReloadStaleWebApp(late);}if(hasLaunchParams()||storedLaunchReady()){loadTelegramSdk();return;}if(Date.now()<deadline){setTimeout(tick,40);return;}loadTelegramSdk();};tick();}function onLaunch(){hydrateLocal();restoreHashFromStorage();var fromSearch=parseLaunchSearch();if(fromSearch)mergePersist(fromSearch);var p=parseLaunchHash(location.hash);if(!p)return;mergePersist(p);maybeReloadStaleWebApp(p);if(location.pathname==="/"){var root=document.documentElement;root.classList.add("${TELEGRAM_BOOT_HIDE_CLASS}");new MutationObserver(function(){root.classList.contains("${TELEGRAM_BOOT_HIDE_CLASS}")||root.classList.add("${TELEGRAM_BOOT_HIDE_CLASS}");}).observe(root,{attributes:true,attributeFilter:["class"]});location.replace("/today"+location.search+location.hash);return;}scheduleAskFs();}function boot(){scheduleTelegramSdk();onLaunch();}function onHashChange(){hydrateLocal();restoreHashFromStorage();var fromSearch=parseLaunchSearch();if(fromSearch)mergePersist(fromSearch);var late=parseLaunchHash(location.hash);if(late){mergePersist(late);maybeReloadStaleWebApp(late);}onLaunch();if(!sdkRequested)scheduleTelegramSdk();}boot();if(typeof window!=="undefined"&&window.addEventListener){window.addEventListener("hashchange",onHashChange);}}catch(e){}})();`;

export function telegramLaunchHashFromParams(
  params: Record<string, string>,
): string | null {
  if (!params.tgWebAppData && !params.tgWebAppVersion) {
    return null;
  }
  const parts: string[] = [];
  for (const [key, value] of Object.entries(params)) {
    if (!key || value === "") {
      continue;
    }
    parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
  }
  if (parts.length === 0) {
    return null;
  }
  return `#${parts.join("&")}`;
}

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
