/**
 * 寄信佇列處理器（outbox worker）。
 *
 * 🔴 為什麼會有這個檔:原始碼把通知信寫進 appointment_outbox 佇列,
 *    也寫好了 listDueAppointmentOutbox()／claimAppointmentOutbox()／finishAppointmentOutbox(),
 *    但整個專案沒有任何地方呼叫它們 —— 佇列只進不出,信永遠停在 pending。
 *    (實測:預約成立、outbox 有 notify_new pending、notification_log 0 筆。)
 *
 * 由 vercel.json 的 cron 每 5 分鐘打一次。也可手動 GET 觸發（需帶 CRON_SECRET）。
 *
 * 只處理 notify_new;calendar_create／ai_grade／analytics_* 需要額外設定,
 * 沒設定時直接標記完成,免得它們卡在佇列裡不斷重試。
 */
import { NextRequest, NextResponse } from "next/server";
import {
  claimAppointmentOutbox,
  finishAppointmentOutbox,
  getAppointment,
  listDueAppointmentOutbox,
  type AppointmentRow,
} from "@/lib/appointment";
import { notifyNewAppointment, type NotifyInput } from "@/lib/appointment-notify";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** 一次最多處理幾筆,避免超過函式執行時間上限 */
const BATCH_SIZE = 10;

function parseMeetLocation(raw: string | null): NotifyInput["meetLocation"] {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as NotifyInput["meetLocation"];
  } catch {
    return null;
  }
}

function toNotifyInput(appt: AppointmentRow): NotifyInput {
  const slotAt = new Date(appt.slot_at);
  let intent: string[] = [];
  try {
    const parsed = appt.intent ? JSON.parse(appt.intent) : [];
    if (Array.isArray(parsed)) intent = parsed.filter((i): i is string => typeof i === "string");
  } catch {
    intent = [];
  }
  return {
    id: appt.id,
    name: appt.name,
    gender: appt.gender,
    phone: appt.phone,
    email: appt.email,
    lineId: appt.line_id,
    meetType: appt.meet_type,
    meetLocation: parseMeetLocation(appt.meet_location),
    intent,
    urgency: appt.urgency,
    note: appt.note,
    slotAt,
    slotEndAt: appt.slot_end_at || null,
    aiHeat: appt.ai_heat,
    aiSuggestion: appt.ai_suggestion,
    meetUrl: appt.meet_url,
    status: appt.status,
    confirmationDeadline: appt.confirmation_deadline || null,
  };
}

type TaskOutcome = { id: string; taskType: string; result: string };

async function runOne(row: Awaited<ReturnType<typeof listDueAppointmentOutbox>>[number]): Promise<TaskOutcome> {
  const base = { id: row.id, taskType: row.task_type };

  // 先搶鎖:同一筆只會有一個 worker 在跑
  const claimed = await claimAppointmentOutbox(row.id);
  if (!claimed) return { ...base, result: "skipped_locked" };

  try {
    if (row.task_type !== "notify_new") {
      // 這些任務需要額外服務(Google 日曆、AI、GA4／Meta),沒接就別讓它卡在佇列
      await finishAppointmentOutbox(row.id);
      return { ...base, result: "skipped_not_configured" };
    }

    const appt = await getAppointment(row.appointment_id);
    if (!appt) {
      await finishAppointmentOutbox(row.id);
      return { ...base, result: "appointment_missing" };
    }

    let phase: "confirmation_request" | "confirmed" | undefined;
    try {
      const payload = row.payload_json ? (JSON.parse(row.payload_json) as { phase?: string }) : null;
      if (payload?.phase === "confirmation_request" || payload?.phase === "confirmed") {
        phase = payload.phase;
      }
    } catch {
      phase = undefined;
    }

    const dispatch = await notifyNewAppointment(toNotifyInput(appt), { phase, onlyPending: true });

    // 🔴 只看 Email 決定成敗,不要看 LINE。
    //    沒設 LINE_CHANNEL_ACCESS_TOKEN 時 adminLine 一定是 failed,
    //    連帶讓 dispatch.ok=false;若照它判定,任務會永遠 retry、每 5 分鐘重跑一次。
    //    Email 才是這裡真正要保證送達的管道。
    const emailFailed =
      dispatch.adminEmail === "failed" || dispatch.customerEmail === "failed";
    await finishAppointmentOutbox(row.id, emailFailed ? "notification email failed" : null);
    return {
      ...base,
      result: `admin=${dispatch.adminEmail ?? "n/a"} customer=${dispatch.customerEmail} line=${dispatch.adminLine ?? "n/a"}`,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[appointment/worker] ${row.task_type} 失敗:`, message);
    await finishAppointmentOutbox(row.id, message);
    return { ...base, result: `error: ${message}` };
  }
}

async function handle(req: NextRequest) {
  // Vercel Cron 會帶 Authorization: Bearer <CRON_SECRET>。沒設 CRON_SECRET 就不擋,
  // 這支端點不吐個資、也不改預約內容,最壞情況只是被多打幾次。
  const secret = (process.env.CRON_SECRET || "").trim();
  if (secret) {
    const auth = req.headers.get("authorization") || "";
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  try {
    const due = await listDueAppointmentOutbox(BATCH_SIZE);
    const results: TaskOutcome[] = [];
    for (const row of due) {
      results.push(await runOne(row));
    }
    return NextResponse.json({ ok: true, picked: due.length, results });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[appointment/worker] 佇列處理失敗:", message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  return handle(req);
}

export async function POST(req: NextRequest) {
  return handle(req);
}
