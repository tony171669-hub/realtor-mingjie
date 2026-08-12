# 上線步驟（劉明杰個人官網 + 預約系統）

目前狀態：程式碼已推上 GitHub，**還沒接資料庫、還沒部署**，所以線上還沒有客戶能用的網址。

照下面兩步做完，就會有正式網址。

---

## 第 1 步：開資料庫（TiDB Cloud，免費）

沒有資料庫，預約按下去會失敗。這步一定要先做。

1. 開 https://tidbcloud.com/ → **Sign up**（可以直接用 Google 帳號登入）
2. 登入後建立叢集：選 **Serverless**（免費方案，個人用量綽綽有餘）
3. 區域選 **Singapore**（離台灣最近，速度最快）
4. 建好後點 **Connect**
5. Connect With 選 **Prisma**
6. 複製畫面上那串 `DATABASE_URL`，長得像這樣：

```
mysql://xxxxx.root:密碼@gateway01.ap-southeast-1.prod.aws.tidbcloud.com:4000/test?sslaccept=strict
```

7. 把那串貼給 Claude，或自己填進 `.env.local` 的 `DATABASE_URL`

建表指令（拿到連線字串後執行一次就好）：

```bash
npx prisma db push
```

---

## 第 2 步：部署到 Vercel（免費）

1. 開 https://vercel.com/ → **Sign up** → 選 **Continue with GitHub**
2. 進去後點 **Add New... → Project**
3. 找到 `realtor-mingjie` 這個 repo → **Import**
4. 在 **Environment Variables** 區塊，把下面這幾個貼進去（一行一個）：

| Name | Value |
|---|---|
| `DATABASE_URL` | 第 1 步拿到的那串 |
| `APPOINTMENT_BASE_URL` | 先填 `https://realtor-mingjie.vercel.app`，部署後如果網址不同再改 |
| `APPOINTMENT_TOKEN_SECRET` | 見下方「本機已產生的值」 |
| `APPOINTMENT_ADMIN_EMAIL` | `tony171669@gmail.com` |
| `ADMIN_EMAILS` | `tony171669@gmail.com` |

5. 按 **Deploy**，等 1～2 分鐘
6. 完成後 Vercel 會給你一個網址，那個就是能發給客戶的網址

> `APPOINTMENT_TOKEN_SECRET` 的值在本機 `.env.local` 裡（那個檔沒有進版控，只有你電腦上有）。
> 要重新產生一組可以跑：
> ```bash
> node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
> ```

---

## 第 3 步（選配，之後再說）

上線後建議補，但不影響「能收預約」：

| 功能 | 需要的變數 | 不設會怎樣 |
|---|---|---|
| 防機器人 | `TURNSTILE_SECRET_KEY`、`NEXT_PUBLIC_TURNSTILE_SITE_KEY` | 可能收到灌爆的假預約 |
| 後台登入 | `AUTH_SECRET`、`AUTH_GOOGLE_ID`、`AUTH_GOOGLE_SECRET` | `/admin/appointments` 進不去 |
| 寄通知信 | `RESEND_API_KEY` | 預約照樣成立，但不會寄信 |
| Google 日曆同步 | `GOOGLE_CALENDAR_*` | 預約只存資料庫，不會進日曆 |
| LINE 通知 | `LINE_CHANNEL_ACCESS_TOKEN`、`LINE_ADMIN_GROUP_ID` | 不會推 LINE 通知 |

---

## 網址對照

| 路徑 | 內容 |
|---|---|
| `/` | 個人官網首頁 |
| `/card` | 電子名片 |
| `/card/booking` | 線上預約 |
| `/admin/appointments` | 預約後台（需登入 + 白名單） |
