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
 * 🔴 一定要用官方的 ?onload= callback:腳本的 load 事件會早於 window.turnstile 指派完成,
 *    在 load 事件裡直接呼叫 render() 會拿到 undefined 而靜默失敗(實測過:腳本載入、
 *    window.turnstile 存在、但容器永遠空的)。
 */
import { useEffect, useRef } from "react";

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "";
const CALLBACK_NAME = "__turnstileReadyCallback";
const SCRIPT_SRC = `https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=${CALLBACK_NAME}`;

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
    [CALLBACK_NAME]?: () => void;
  }
}

/** 解析成「turnstile API 真的可以用了」。整頁共用一份,重複掛載不會重複載腳本。 */
let readyPromise: Promise<void> | null = null;

function whenTurnstileReady(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.turnstile?.render) return Promise.resolve();
  if (readyPromise) return readyPromise;

  readyPromise = new Promise<void>((resolve, reject) => {
    window[CALLBACK_NAME] = () => resolve();

    const existing = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`);
    if (existing) {
      // 腳本已在載入中 —— callback 還是會被呼叫,等著就好
      existing.addEventListener("error", () => reject(new Error("turnstile script failed")));
      return;
    }

    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onerror = () => reject(new Error("turnstile script failed"));
    document.head.appendChild(script);
  });

  return readyPromise;
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

    whenTurnstileReady()
      .then(() => {
        if (cancelled || widgetIdRef.current) return;
        const box = boxRef.current;
        const api = window.turnstile;
        if (!box || !api?.render) return;
        widgetIdRef.current =
          api.render(box, {
            sitekey: SITE_KEY,
            theme: "light",
            callback: (token) => onTokenRef.current(token),
            "expired-callback": () => onTokenRef.current(""),
            "error-callback": () => onTokenRef.current(""),
          }) ?? null;
      })
      .catch(() => {
        // 腳本載不到(擋廣告外掛、離線)—— 交給後端回 503,前端不要卡死使用者
        onTokenRef.current("");
      });

    return () => {
      cancelled = true;
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
