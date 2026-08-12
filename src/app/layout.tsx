import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "劉明杰｜雲林虎尾高鐵特區房仲顧問",
  description: "雲林虎尾高鐵特區在地房仲顧問，專營鋐大麗緻。資產配置、稅務諮詢、簡易裝潢一站式服務。",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-Hant">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
