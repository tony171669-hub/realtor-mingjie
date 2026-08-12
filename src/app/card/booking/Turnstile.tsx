"use client";
/**
 * Cloudflare Turnstile 前端元件。
 *
 * 🔴 為什麼會有這個檔:後端 (appointment-public-validation.ts) 一直都會驗 Turnstile token,
 *    但這套原始碼沒有前端元件 —— 只要設了 TURNSTILE_SECRET_KEY,所有預約都會被擋成
 *    「人機驗證未完成」。這裡把缺的那半補上。
 *
 * 沒設 NEXT_PUBLIC_TURNSTILE_SITE_KEY 時整個元件不渲染,後端也會自動跳過驗證,行為與原本一致。
 *
 * 🔴 用輪詢等 window.turnstile 就緒,不要相信腳本的 load 事件或 ?onload= callback:
 *    兩種都在正式站實測失敗過(腳本載入、window.turnstile 存在、容器卻永遠是空的),
 *    但手動呼叫 turnstile.render() 一定成功。輪詢最笨但最可靠。
 */
import { useEffect, useRef } from "react";

// 🔴 一定要 trim:從 Cloudflare 後台複製金鑰很容易夾帶前導 tab/換行,
//    貼進 Vercel 環境變數後肉眼看不出來,Cloudflare 會直接回
//    「Invalid input for parameter "sitekey"」而整個元件靜默不渲染。
const SITE_KEY = (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "").trim();
const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
const POLL_INTERVAL_MS = 100;
const POLL_TIMEOUT_MS = 15_000;

export const turnstileEnabled = Boolean(SITE_KEY);

type RenderOptions = {
  sitekey: string;
  callback: (token: string) => void;
  "expired-callback"?: () => void;
  "error-callback"?: () => void;
  theme?: "auto" | "light" | "dark";
};

type TurnstileApi = {
  render: (el: HTMLElement, opts: RenderOptions) => string | undefined;
  remove: (id: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
    __tsDebug?: { version: number; effect: number; ticks: number; rendered: number; error: string };
  }
}

function ensureScript(): void {
  if (document.querySelector(`script[src="${SCRIPT_SRC}"]`)) return;
  const script = document.createElement("script");
  script.src = SCRIPT_SRC;
  script.async = true;
  script.defer = true;
  document.head.appendChild(script);
}

/**
 * onToken 在驗證通過時拿到 token;過期或失敗時回傳空字串,
 * 讓表單知道要擋住送出(而不是送一個過期 token 給後端吃 400)。
 */
export default function Turnstile({ onToken }: { onToken: (token: string) => void }) {
  const boxRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const onTokenRef = useRef(onToken);
  onTokenRef.current = onToken;

  useEffect(() => {
    if (!SITE_KEY) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const deadline = Date.now() + POLL_TIMEOUT_MS;

    // 部署驗證用:正式站曾出現「腳本在、API 在、容器在,但 render 沒被呼叫」,
    // 靠這個 marker 才分得出是程式沒跑、還是 Cloudflare 拒絕。
    const dbg = (window.__tsDebug ??= { version: 4, effect: 0, ticks: 0, rendered: 0, error: "" });
    dbg.effect += 1;

    ensureScript();

    const tryRender = () => {
      if (cancelled || widgetIdRef.current) return;
      dbg.ticks += 1;
      const box = boxRef.current;
      const api = window.turnstile;
      if (box && typeof api?.render === "function") {
        dbg.rendered += 1;
        try {
          widgetIdRef.current =
            api.render(box, {
              sitekey: SITE_KEY,
              theme: "light",
              callback: (token) => onTokenRef.current(token),
              "expired-callback": () => onTokenRef.current(""),
              "error-callback": () => onTokenRef.current(""),
            }) ?? null;
        } catch (e) {
          dbg.error = e instanceof Error ? e.message : String(e);
          onTokenRef.current("");
        }
        return;
      }
      if (Date.now() > deadline) {
        // 腳本被廣告攔截器擋掉或離線 —— 交給後端回 503,不要讓使用者卡在空白處
        onTokenRef.current("");
        return;
      }
      timer = setTimeout(tryRender, POLL_INTERVAL_MS);
    };

    tryRender();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      const id = widgetIdRef.current;
      if (id && window.turnstile) {
        try {
          window.turnstile.remove(id);
        } catch {
          // 元件已被移除,忽略
        }
      }
      widgetIdRef.current = null;
    };
  }, []);

  if (!SITE_KEY) return null;
  return <div ref={boxRef} style={{ margin: "18px 0 4px" }} />;
}
