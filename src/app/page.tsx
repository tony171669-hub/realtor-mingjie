/**
 * / — 個人官網首頁（SEO 主要入口）
 *
 * 對外形象頁：形象照 → 服務區域 → 戰績 → 服務項目 → 預約。
 * 「立即預約」直接接到本站的預約系統 /card/booking，不是靜態表單。
 * 內容一律讀 src/config/owner.ts，改資料只改那一個檔。
 */
import type { Metadata } from "next";
import Link from "next/link";
import { OWNER, SOCIAL, SITE_URL } from "@/config/owner";
import styles from "./home.module.css";

const AREA = "雲林虎尾高鐵特區";
const COMMUNITY = "鋐大麗緻";

const SERVICES = [
  {
    key: "asset",
    title: "資產配置",
    desc: "依照你的預算與需求，協助規劃合理的購屋配置與長期資產布局，讓每一分錢花在刀口上。",
    icon: "M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6",
  },
  {
    key: "tax",
    title: "稅務諮詢",
    desc: "買賣房產牽涉的稅費眉角多，協助你把持有期間、取得方式與實拿金額算清楚，避免多繳冤枉稅。",
    icon: "M4 4h16v16H4zM8 9h8M8 13h8M8 17h4",
  },
  {
    key: "decor",
    title: "簡易裝潢",
    desc: "交屋後的簡易裝潢與空間規劃建議，讓新家用最有效率的預算，住得舒適又實用。",
    icon: "M3 10l9-7 9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1zM9 21v-8h6v8",
  },
];

const AWARDS = [
  { year: "114 年度", title: "單月百萬經紀人員", desc: "單月業績突破百萬，獲公司肯定表揚" },
  { year: "114 年度", title: "新秀獎", desc: "年度新秀獎得主，專業服務深受客戶肯定" },
];

export const metadata: Metadata = {
  title: `${OWNER.name}｜${AREA}房仲顧問｜資產配置・稅務諮詢・簡易裝潢`,
  description: `${OWNER.name}，${AREA}在地房仲顧問，專營${COMMUNITY}。提供資產配置、稅務諮詢、簡易裝潢等服務，114 年度單月百萬經紀人員、新秀獎得主。線上預約諮詢，加 LINE 快速聯繫。`,
  keywords: ["雲林房仲", "虎尾房仲", "高鐵特區房屋", COMMUNITY, "雲林買房", "虎尾買房", OWNER.name, "資產配置", "稅務諮詢"],
  alternates: { canonical: SITE_URL },
  openGraph: {
    type: "profile",
    title: `${OWNER.name}｜${AREA}房仲顧問`,
    description: `專營${COMMUNITY}，提供資產配置、稅務諮詢、簡易裝潢服務。114 年度單月百萬經紀人員、新秀獎得主。`,
    url: SITE_URL,
    siteName: OWNER.company,
    locale: "zh_TW",
    images: [{ url: `${SITE_URL}${OWNER.photoUrl}`, alt: OWNER.name }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${OWNER.name}｜${AREA}房仲顧問`,
    description: `專營${COMMUNITY}，資產配置、稅務諮詢、簡易裝潢一站式服務。`,
    images: [`${SITE_URL}${OWNER.photoUrl}`],
  },
};

const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "RealEstateAgent",
  name: OWNER.name,
  image: `${SITE_URL}${OWNER.photoUrl}`,
  url: SITE_URL,
  telephone: `+886-${OWNER.phoneRaw.slice(1)}`,
  areaServed: { "@type": "Place", name: `雲林縣虎尾鎮高鐵特區` },
  address: {
    "@type": "PostalAddress",
    addressLocality: "虎尾鎮",
    addressRegion: "雲林縣",
    addressCountry: "TW",
  },
  award: AWARDS.map((a) => `${a.year}${a.title}`),
  makesOffer: SERVICES.map((s) => ({
    "@type": "Offer",
    itemOffered: { "@type": "Service", name: s.title },
  })),
};

function Icon({ path, size = 26 }: { path: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={path} />
    </svg>
  );
}

export default function HomePage() {
  return (
    <div className={styles.page}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }} />

      <header className={styles.header}>
        <nav className={styles.nav}>
          <div className={styles.brand}>雲林囝仔<span>・</span>房仲明杰</div>
          <ul className={styles.navLinks}>
            <li><a href="#area">服務區域</a></li>
            <li><a href="#awards">戰績</a></li>
            <li><a href="#services">服務項目</a></li>
            <li><a href="#booking">預約諮詢</a></li>
          </ul>
          <div className={styles.navCta}>
            <a href={SOCIAL.line} target="_blank" rel="noopener noreferrer" className={`${styles.btn} ${styles.btnLine}`}>加 LINE 諮詢</a>
          </div>
        </nav>
      </header>

      {/* ---------- Hero ---------- */}
      <section className={styles.hero}>
        <div className={`${styles.wrap} ${styles.heroGrid}`}>
          <div>
            <span className={styles.heroEyebrow}>{AREA}・在地房產顧問</span>
            <h1 className={styles.heroTitle}>
              買房不踩坑<br />找懂雲林在地的<em>房仲明杰</em>
            </h1>
            <p className={styles.heroSub}>{OWNER.slogan}</p>
            <div className={styles.heroActions}>
              <Link href="/card/booking" className={`${styles.btn} ${styles.btnPrimary}`}>立即預約諮詢</Link>
              <a href={SOCIAL.line} target="_blank" rel="noopener noreferrer" className={`${styles.btn} ${styles.btnLine}`}>加 LINE 好友</a>
            </div>
          </div>
          <div className={styles.heroPhotoWrap}>
            <div className={styles.heroPhoto}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={OWNER.photoUrl} alt={`${OWNER.name} - ${AREA}房仲顧問`} width={340} height={400} />
            </div>
            <div className={styles.heroBadge}>{OWNER.name} <span>{OWNER.title}</span></div>
          </div>
        </div>
      </section>

      {/* ---------- 服務區域 ---------- */}
      <section className={`${styles.section} ${styles.area}`} id="area">
        <div className={styles.wrap}>
          <div className={`${styles.sectionHead} ${styles.sectionHeadLeft}`}>
            <span className={styles.eyebrow}>Service Area</span>
            <h2>我服務的區域</h2>
          </div>
          <div className={styles.areaGrid}>
            <div className={styles.areaCard}>
              <h3>{AREA}</h3>
              <p>深耕虎尾在地，熟悉高鐵特區生活機能與房產行情，專營社區：</p>
              <ul className={styles.areaList}>
                <li><span className={styles.dot} />主力社區：<strong>&nbsp;{COMMUNITY}</strong></li>
                <li><span className={styles.dot} />在地服務，快速到場、即時回覆</li>
                <li><span className={styles.dot} />熟悉高鐵特區周邊行情與生活機能</li>
              </ul>
            </div>
            <div className={styles.areaMap}>
              <div>
                <div className={styles.pinDot} />
                <div style={{ fontWeight: 800, fontSize: 20 }}>雲林・虎尾</div>
                <div style={{ fontSize: 14, opacity: .8, marginTop: 6 }}>高鐵特區</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- 戰績 ---------- */}
      <section className={styles.section} id="awards">
        <div className={styles.wrap}>
          <div className={styles.sectionHead}>
            <span className={styles.eyebrow}>Track Record</span>
            <h2>我的戰績</h2>
            <p>用實際成績證明專業，也用同樣的用心服務每一位客戶。</p>
          </div>
          <div className={styles.achvGrid}>
            {AWARDS.map((a) => (
              <div key={a.title} className={styles.achvCard}>
                <span className={styles.achvYear}>{a.year}</span>
                <div className={styles.achvTitle}>{a.title}</div>
                <div className={styles.achvDesc}>{a.desc}</div>
              </div>
            ))}
            <div className={`${styles.achvCard} ${styles.achvStat}`}>
              <div className={styles.achvNum}>100%</div>
              <div className={styles.achvLabel}>在地服務・全程陪同</div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- 服務項目 ---------- */}
      <section className={`${styles.section} ${styles.services}`} id="services">
        <div className={styles.wrap}>
          <div className={styles.sectionHead}>
            <span className={styles.eyebrow}>What I Offer</span>
            <h2>我提供的服務項目</h2>
            <p>不只是帶看房子，更是幫你把關風險、規劃資產的房產顧問。</p>
          </div>
          <div className={styles.servicesGrid}>
            {SERVICES.map((s) => (
              <div key={s.key} className={styles.serviceCard}>
                <div className={styles.serviceIcon}><Icon path={s.icon} /></div>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- 預約 ---------- */}
      <section className={`${styles.section} ${styles.booking}`} id="booking">
        <div className={styles.wrap}>
          <div className={styles.sectionHead}>
            <span className={styles.eyebrow}>Contact &amp; Booking</span>
            <h2>預約諮詢</h2>
            <p>線上自己挑時段，或直接加 LINE 找我聊。</p>
          </div>
          <div className={styles.bookingGrid}>
            <div className={styles.bookingPanel}>
              <h3>線上預約系統</h3>
              <p>不用等回覆、不用來回喬時間，自己挑一個方便的時段就好。</p>
              <ul className={styles.stepList}>
                <li><span className={styles.stepNum}>1</span>選擇諮詢主題（買賣、資產配置、稅務、裝潢）</li>
                <li><span className={styles.stepNum}>2</span>選擇見面方式：公司面談、現場看屋、電話或視訊</li>
                <li><span className={styles.stepNum}>3</span>挑選你方便的日期與時段，送出即完成</li>
              </ul>
              <div className={styles.bookingActions}>
                <Link href="/card/booking" className={`${styles.btn} ${styles.btnPrimary}`}>開始線上預約</Link>
                <Link href="/card" className={`${styles.btn} ${styles.btnGhost}`}>查看電子名片</Link>
              </div>
            </div>

            <div className={styles.contactPanel}>
              <div className={styles.contactCard}>
                <div className={`${styles.contactIcon} ${styles.iconLine}`}>
                  <Icon path="M21 11.5a8.5 7.5 0 1 0-4.2 6.4L21 20l-1-3.6a7.3 7.3 0 0 0 1-4.9Z" size={22} />
                </div>
                <div>
                  <div className={styles.contactLabel}>LINE 諮詢</div>
                  <div className={styles.contactValue}>{OWNER.phoneRaw}</div>
                </div>
                <a href={SOCIAL.line} target="_blank" rel="noopener noreferrer" className={`${styles.btn} ${styles.btnLine}`}>加好友</a>
              </div>
              <div className={styles.contactCard}>
                <div className={`${styles.contactIcon} ${styles.iconPhone}`}>
                  <Icon path="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .3 1.9.6 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.1a2 2 0 0 1 2.1-.5c.9.3 1.8.5 2.8.6a2 2 0 0 1 1.7 2Z" size={22} />
                </div>
                <div>
                  <div className={styles.contactLabel}>電話聯繫</div>
                  <div className={styles.contactValue}>{OWNER.phone}</div>
                </div>
                <a href={`tel:${OWNER.phoneRaw}`} className={`${styles.btn} ${styles.btnGhost}`}>撥打</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className={styles.footer}>
        <div className={styles.wrap}>
          <div><strong>{OWNER.name}</strong>｜{AREA}房產顧問｜專營{COMMUNITY}</div>
          <div style={{ marginTop: 8 }}>電話：{OWNER.phone}　｜　LINE：{OWNER.phoneRaw}</div>
          <div className={styles.footerDim}>&copy; {new Date().getFullYear()} {OWNER.company}. All rights reserved.</div>
        </div>
      </footer>

      <div className={styles.stickyCta}>
        <a href={`tel:${OWNER.phoneRaw}`} className={`${styles.btn} ${styles.btnOutline}`}>電話</a>
        <Link href="/card/booking" className={`${styles.btn} ${styles.btnPrimary}`}>線上預約</Link>
      </div>
    </div>
  );
}
