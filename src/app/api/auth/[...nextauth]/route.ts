/**
 * next-auth 路由處理器。
 *
 * 🔴 為什麼會有這個檔:src/auth.ts 已經匯出 handlers,auth.ts 也指定
 *    pages.signIn = "/api/auth/signin",但原始碼沒有把 handlers 掛到任何路由上 ——
 *    /api/auth/* 整段不存在,登入流程無處可去,後台永遠進不去。
 */
import { handlers } from "@/auth";

export const { GET, POST } = handlers;
