// 產生日記 App 設計稿的 .dc.html 畫板與 canvas.json
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));

// ---------- 色彩與字體 ----------
const L = {
  paper: '#F4EDE0', card: '#FCF9F3', ink: '#2B231B', ink2: '#7A6C5D', ink3: '#A89A8A',
  line: '#E2D7C3', accent: '#B4552F', accentSoft: '#F3E1D3', today: '#EBCDA9', chip: '#EFE6D6',
};
const D = {
  paper: '#241B15', card: '#2F251E', ink: '#F2E9DB', ink2: '#B4A492', ink3: '#7E6F60',
  line: '#43362C', accent: '#DB8358', accentSoft: '#4A3325', today: '#5B4230', chip: '#3A2E25',
};

const FONTS = `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Serif+TC:wght@500;700&family=Noto+Sans+TC:wght@400;500;700&display=swap">`;

function css(t) {
  return `<style>
    body { margin: 0; background: ${t.paper}; color: ${t.ink}; font-family: "Noto Sans TC", "PingFang TC", "Microsoft JhengHei", sans-serif; -webkit-font-smoothing: antialiased; }
    a { color: ${t.accent}; } a:hover { color: ${t.ink}; }
    .serif { font-family: "Noto Serif TC", "PingFang TC", "Songti TC", serif; }
    p { margin: 0; }
  </style>`;
}

function page(t, body) {
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
  ${FONTS}
  ${css(t)}
</helmet>
${body}
</x-dc>
</body>
</html>
`;
}

// ---------- 圖示（描邊 SVG，20px 網格） ----------
const svg = (paths, size = 22, color = 'currentColor') =>
  `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;
const I = {
  calendar: (s, c) => svg('<rect x="3" y="5" width="18" height="16" rx="3"></rect><path d="M3 10h18M8 3v4M16 3v4"></path>', s, c),
  timeline: (s, c) => svg('<path d="M4 6h16M4 12h10M4 18h13"></path>', s, c),
  stats: (s, c) => svg('<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"></path>', s, c),
  settings: (s, c) => svg('<circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"></path>', s, c),
  back: (s, c) => svg('<path d="M15 5l-7 7 7 7"></path>', s, c),
  more: (s, c) => svg('<circle cx="5" cy="12" r="1.3" fill="currentColor"></circle><circle cx="12" cy="12" r="1.3" fill="currentColor"></circle><circle cx="19" cy="12" r="1.3" fill="currentColor"></circle>', s, c),
  prev: (s, c) => svg('<path d="M14 6l-6 6 6 6"></path>', s, c),
  next: (s, c) => svg('<path d="M10 6l6 6-6 6"></path>', s, c),
  image: (s, c) => svg('<rect x="3" y="4" width="18" height="16" rx="3"></rect><circle cx="9" cy="10" r="1.6"></circle><path d="M21 16l-5-5-9 9"></path>', s, c),
  smile: (s, c) => svg('<circle cx="12" cy="12" r="9"></circle><path d="M8.5 14.5c1 1.2 2.2 1.8 3.5 1.8s2.5-.6 3.5-1.8"></path><path d="M9 9.5h.01M15 9.5h.01" stroke-width="2.4"></path>', s, c),
  bold: (s, c) => svg('<path d="M7 5h6a3.5 3.5 0 0 1 0 7H7zM7 12h7a3.5 3.5 0 0 1 0 7H7z"></path>', s, c),
  italic: (s, c) => svg('<path d="M10 5h8M6 19h8M14 5l-4 14"></path>', s, c),
  heading: (s, c) => svg('<path d="M5 5v14M13 5v14M5 12h8M17 12l2-1.5V19"></path>', s, c),
  list: (s, c) => svg('<path d="M9 6h12M9 12h12M9 18h12"></path><circle cx="4.5" cy="6" r="1" fill="currentColor"></circle><circle cx="4.5" cy="12" r="1" fill="currentColor"></circle><circle cx="4.5" cy="18" r="1" fill="currentColor"></circle>', s, c),
  quote: (s, c) => svg('<path d="M7 7h4v5H7zM13 7h4v5h-4zM7 12c0 3-1 4-3 5M13 12c0 3-1 4-3 5"></path>', s, c),
  plus: (s, c) => svg('<path d="M12 5v14M5 12h14"></path>', s, c),
  pen: (s, c) => svg('<path d="M4 20l4-1 10.5-10.5a2 2 0 0 0-3-3L5 16z"></path><path d="M13 7l3 3"></path>', s, c),
  chevron: (s, c) => svg('<path d="M9 6l6 6-6 6"></path>', s, c),
  moon: (s, c) => svg('<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"></path>', s, c),
  cloud: (s, c) => svg('<path d="M7 18h10a4 4 0 0 0 .5-8A6 6 0 0 0 6 11a3.5 3.5 0 0 0 1 7z"></path>', s, c),
  download: (s, c) => svg('<path d="M12 4v11M7 10l5 5 5-5M4 20h16"></path>', s, c),
  trash: (s, c) => svg('<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"></path>', s, c),
  search: (s, c) => svg('<circle cx="11" cy="11" r="6.5"></circle><path d="M20 20l-4-4"></path>', s, c),
};

// 相片占位（暖色調的簡單風景，不是照片）
function photo(t, w = '100%', h = 180, radius = 12) {
  return `<div style="width: ${w}; height: ${h}px; border-radius: ${radius}px; overflow: hidden; background: #DCC7AC; flex-shrink: 0;">
    <svg width="100%" height="100%" viewBox="0 0 400 240" preserveAspectRatio="xMidYMid slice">
      <rect width="400" height="240" fill="#E7D5BC"></rect>
      <circle cx="310" cy="70" r="34" fill="#F1E2C8"></circle>
      <path d="M0 190 C80 130 140 160 200 150 S330 110 400 160 V240 H0 Z" fill="#B99A77"></path>
      <path d="M0 215 C90 175 170 205 250 190 S360 170 400 200 V240 H0 Z" fill="#8E7256"></path>
    </svg>
  </div>`;
}

// ---------- 資料 ----------
const MONTH_TITLE = '二〇二六年 九月';
const WEEK = ['一', '二', '三', '四', '五', '六', '日'];
// 9 月 1 日是星期二 → 前面留 1 格
const moods = { 1: '😊', 2: '😌', 3: '🥱', 4: '😊', 5: '🤩', 6: '😌', 7: '😐', 8: '😊', 9: '😔', 10: '😌', 11: '😊' };
const TODAY = 11;

function calendarGrid(t, { cell = 46, font = 14, emoji = 18, gap = 6 } = {}) {
  const head = WEEK.map(w => `<div style="text-align: center; font-size: 12px; color: ${t.ink3}; padding-bottom: 4px;">${w}</div>`).join('\n');
  const cells = [];
  cells.push(`<div></div>`);
  for (let d = 1; d <= 30; d++) {
    const isToday = d === TODAY;
    const m = moods[d];
    const future = d > TODAY;
    const bg = isToday ? t.today : (m ? t.card : 'transparent');
    const color = future ? t.ink3 : t.ink;
    const border = isToday ? `1px solid ${t.accent}` : (m ? `1px solid ${t.line}` : '1px solid transparent');
    cells.push(`<div style="height: ${cell}px; border-radius: 10px; background: ${bg}; border: ${border}; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1px;">
      <span style="font-size: ${font}px; line-height: 1; color: ${color}; font-weight: ${isToday ? 700 : 500};">${d}</span>
      ${m ? `<span style="font-size: ${emoji}px; line-height: 1.1;">${m}</span>` : `<span style="height: ${emoji}px;"></span>`}
    </div>`);
  }
  return `<div style="display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: ${gap}px;">
    ${head}
    ${cells.join('\n')}
  </div>`;
}

function moodPicker(t, selected = '😊', size = 44) {
  const list = ['😊', '😌', '🤩', '😐', '😔', '🥱', '😤'];
  return `<div style="display: flex; gap: 8px; flex-wrap: wrap;">
    ${list.map(e => `<div style="width: ${size}px; height: ${size}px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: ${Math.round(size * 0.52)}px; background: ${e === selected ? t.accentSoft : t.chip}; border: 2px solid ${e === selected ? t.accent : 'transparent'};">${e}</div>`).join('\n')}
  </div>`;
}

function toolbar(t, { compact = false } = {}) {
  const btn = (icon, active = false) => `<div style="width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: ${active ? t.accent : t.ink2}; background: ${active ? t.accentSoft : 'transparent'};">${icon(20)}</div>`;
  const sep = `<div style="width: 1px; height: 22px; background: ${t.line}; margin: 0 4px;"></div>`;
  return `<div style="display: flex; align-items: center; gap: 2px; padding: 4px 6px; background: ${t.card}; border: 1px solid ${t.line}; border-radius: 14px; ${compact ? '' : 'width: fit-content;'}">
    ${btn(I.heading)}${btn(I.bold, true)}${btn(I.italic)}${sep}${btn(I.list)}${btn(I.quote)}${sep}${btn(I.image)}${btn(I.smile)}
  </div>`;
}

function entryBody(t, { fontSize = 16, imgH = 200 } = {}) {
  return `<div style="display: flex; flex-direction: column; gap: 18px; font-size: ${fontSize}px; line-height: 1.85; color: ${t.ink};">
    <p>早上七點就醒了，窗外的光線很柔。煮了咖啡，坐在陽台看了一會兒書，覺得這樣的開始很好 ☕️</p>
    <p>下午去河堤走了一圈，天空是那種快要入秋的顏色。拍了幾張照片，回來的路上在麵包店買了肉桂捲。</p>
    ${photo(t, '100%', imgH)}
    <p style="font-size: ${fontSize - 3}px; color: ${t.ink3}; margin-top: -8px;">河堤，傍晚五點半</p>
    <p>晚上整理了這個月的照片，發現其實過得比想像中充實。明天想早點睡。</p>
  </div>`;
}

// ---------- 手機共用 ----------
const PHONE = { w: 390, h: 844 };

function phoneNav(t, active) {
  const items = [['calendar', '月曆'], ['timeline', '時間軸'], ['stats', '統計'], ['settings', '設定']];
  return `<div style="display: flex; justify-content: space-around; align-items: center; padding: 10px 8px 26px; border-top: 1px solid ${t.line}; background: ${t.card};">
    ${items.map(([k, label]) => `<div style="display: flex; flex-direction: column; align-items: center; gap: 3px; min-width: 64px; min-height: 44px; justify-content: center; color: ${k === active ? t.accent : t.ink3};">
      ${I[k](22)}
      <span style="font-size: 11px; font-weight: ${k === active ? 700 : 500};">${label}</span>
    </div>`).join('\n')}
  </div>`;
}

function phoneFrame(t, body, nav) {
  return `<div style="width: ${PHONE.w}px; height: ${PHONE.h}px; background: ${t.paper}; display: flex; flex-direction: column; overflow: hidden;">
    <div style="flex-grow: 1; overflow: hidden; display: flex; flex-direction: column;">${body}</div>
    ${nav ?? ''}
  </div>`;
}

function phoneHeader(t, { left, title, right }) {
  return `<div style="display: flex; align-items: center; justify-content: space-between; padding: 54px 16px 8px; min-height: 44px;">
    <div style="width: 44px; height: 44px; display: flex; align-items: center; justify-content: flex-start; color: ${t.ink};">${left ?? ''}</div>
    <div class="serif" style="font-size: 17px; font-weight: 700; color: ${t.ink};">${title ?? ''}</div>
    <div style="width: 44px; height: 44px; display: flex; align-items: center; justify-content: flex-end; color: ${t.ink};">${right ?? ''}</div>
  </div>`;
}

// 手機 · 月曆首頁
function mobileCalendar(t) {
  const body = `
  <div style="padding: 60px 20px 0; display: flex; flex-direction: column; gap: 22px;">
    <div style="display: flex; flex-direction: column; gap: 4px;">
      <span style="font-size: 13px; color: ${t.ink2}; letter-spacing: 0.08em;">星期五</span>
      <h1 class="serif" style="margin: 0; font-size: 30px; font-weight: 700; line-height: 1.2; color: ${t.ink};">九月十一日</h1>
    </div>
    <div style="display: flex; align-items: center; justify-content: space-between;">
      <div style="width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; color: ${t.ink2};">${I.prev(22)}</div>
      <span class="serif" style="font-size: 16px; font-weight: 500; color: ${t.ink};">${MONTH_TITLE}</span>
      <div style="width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; color: ${t.ink2};">${I.next(22)}</div>
    </div>
    ${calendarGrid(t, { cell: 48, font: 14, emoji: 18, gap: 4 })}
    <div style="display: flex; align-items: center; gap: 14px; padding: 16px; background: ${t.card}; border: 1px solid ${t.line}; border-radius: 16px;">
      <span style="font-size: 34px; line-height: 1;">😊</span>
      <div style="display: flex; flex-direction: column; gap: 4px; flex-grow: 1; min-width: 0;">
        <span style="font-size: 13px; color: ${t.ink2};">今天的日記</span>
        <span style="font-size: 15px; color: ${t.ink}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">早上七點就醒了，窗外的光線很柔…</span>
      </div>
      <div style="color: ${t.ink3};">${I.chevron(20)}</div>
    </div>
  </div>`;
  return phoneFrame(t, body, phoneNav(t, 'calendar'));
}

// 手機 · 編輯頁
function mobileEntry(t) {
  const body = `
  ${phoneHeader(t, { left: I.back(24), title: '九月十一日 · 星期五', right: I.more(24) })}
  <div style="flex-grow: 1; overflow: hidden; padding: 8px 20px 0; display: flex; flex-direction: column; gap: 18px;">
    <div style="display: flex; flex-direction: column; gap: 10px;">
      <span style="font-size: 12px; color: ${t.ink2}; letter-spacing: 0.08em;">今天的心情</span>
      ${moodPicker(t, '😊', 40)}
    </div>
    <div style="height: 1px; background: ${t.line};"></div>
    ${entryBody(t, { fontSize: 16, imgH: 170 })}
  </div>
  <div style="padding: 10px 16px 24px; display: flex; flex-direction: column; gap: 10px; background: ${t.paper};">
    ${toolbar(t, { compact: true })}
    <div style="display: flex; align-items: center; justify-content: space-between;">
      <span style="font-size: 12px; color: ${t.ink3};">已自動儲存 · 下午 6:12</span>
      <div style="height: 44px; padding: 0 22px; border-radius: 22px; background: ${t.accent}; color: #FFF7EE; font-size: 15px; font-weight: 700; display: flex; align-items: center;">完成</div>
    </div>
  </div>`;
  return phoneFrame(t, body, null);
}

// 手機 · 空狀態
function mobileEmpty(t) {
  const body = `
  ${phoneHeader(t, { left: I.back(24), title: '九月十二日 · 星期六', right: '' })}
  <div style="flex-grow: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 0 36px 80px; gap: 26px; text-align: center;">
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
      <rect x="22" y="14" width="76" height="92" rx="8" fill="${t.card}" stroke="${t.line}" stroke-width="2"></rect>
      <path d="M36 40h48M36 54h48M36 68h30" stroke="${t.line}" stroke-width="2.5" stroke-linecap="round"></path>
      <path d="M78 96l22-22a5 5 0 0 0-7-7L71 89l-2 9z" fill="${t.accentSoft}" stroke="${t.accent}" stroke-width="2" stroke-linejoin="round"></path>
    </svg>
    <div style="display: flex; flex-direction: column; gap: 8px;">
      <h2 class="serif" style="margin: 0; font-size: 22px; font-weight: 700; color: ${t.ink};">這一天還是空白的</h2>
      <p style="font-size: 14px; line-height: 1.7; color: ${t.ink2};">先選一個心情，或直接寫下一句話就好。</p>
    </div>
    ${moodPicker(t, '', 40)}
    <div style="height: 48px; padding: 0 28px; border-radius: 24px; background: ${t.accent}; color: #FFF7EE; font-size: 15px; font-weight: 700; display: flex; align-items: center; gap: 8px;">${I.pen(18, '#FFF7EE')}開始寫這一天</div>
  </div>`;
  return phoneFrame(t, body, null);
}

// 時間軸卡片
function timelineCard(t, { day, week, mood, text, withPhoto, size = 'm' }) {
  const big = size === 'l';
  return `<div style="display: flex; gap: 14px;">
    <div style="display: flex; flex-direction: column; align-items: center; width: 44px; flex-shrink: 0; gap: 2px; padding-top: 6px;">
      <span class="serif" style="font-size: ${big ? 26 : 22}px; font-weight: 700; line-height: 1; color: ${t.ink};">${day}</span>
      <span style="font-size: 11px; color: ${t.ink3};">${week}</span>
    </div>
    <div style="flex-grow: 1; min-width: 0; display: flex; flex-direction: column; gap: 12px; padding: 14px 16px; background: ${t.card}; border: 1px solid ${t.line}; border-radius: 16px;">
      <div style="display: flex; align-items: center; gap: 10px;">
        <span style="font-size: 22px; line-height: 1;">${mood}</span>
        <p style="font-size: ${big ? 15 : 14}px; line-height: 1.7; color: ${t.ink}; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${text}</p>
      </div>
      ${withPhoto ? photo(t, '100%', big ? 160 : 120, 10) : ''}
    </div>
  </div>`;
}

const TL = [
  { day: 11, week: '週五', mood: '😊', text: '早上七點就醒了，窗外的光線很柔。煮了咖啡，坐在陽台看了一會兒書。', withPhoto: true },
  { day: 10, week: '週四', mood: '😌', text: '加班到八點，但把拖了兩週的報告交出去了，回家路上很輕鬆。', withPhoto: false },
  { day: 9, week: '週三', mood: '😔', text: '和阿哲的對話有點不愉快，晚上想了很久，其實是我沒把話說清楚。', withPhoto: false },
  { day: 8, week: '週二', mood: '😊', text: '媽媽寄來的柚子到了，剝了一顆分給同事，整個辦公室都是香味。', withPhoto: true },
  { day: 7, week: '週一', mood: '😐', text: '普通的一天。', withPhoto: false },
];

// 手機 · 時間軸
function mobileTimeline(t) {
  const body = `
  <div style="padding: 60px 20px 0; display: flex; flex-direction: column; gap: 18px; overflow: hidden;">
    <div style="display: flex; align-items: flex-end; justify-content: space-between;">
      <h1 class="serif" style="margin: 0; font-size: 28px; font-weight: 700; color: ${t.ink};">時間軸</h1>
      <span class="serif" style="font-size: 14px; color: ${t.ink2}; padding-bottom: 6px;">${MONTH_TITLE}</span>
    </div>
    <div style="display: flex; flex-direction: column; gap: 14px;">
      ${TL.slice(0, 4).map(c => timelineCard(t, c)).join('\n')}
    </div>
  </div>`;
  return phoneFrame(t, body, phoneNav(t, 'timeline'));
}

// 設定列
function settingRow(t, icon, label, value, { danger = false } = {}) {
  return `<div style="display: flex; align-items: center; gap: 14px; min-height: 52px; padding: 0 16px;">
    <div style="color: ${danger ? t.accent : t.ink2};">${icon(20)}</div>
    <span style="flex-grow: 1; font-size: 15px; color: ${danger ? t.accent : t.ink};">${label}</span>
    <span style="font-size: 13px; color: ${t.ink3};">${value ?? ''}</span>
    ${danger ? '' : `<div style="color: ${t.ink3};">${I.chevron(18)}</div>`}
  </div>`;
}
function settingGroup(t, title, rows) {
  return `<div style="display: flex; flex-direction: column; gap: 8px;">
    <span style="font-size: 12px; color: ${t.ink3}; letter-spacing: 0.08em; padding: 0 4px;">${title}</span>
    <div style="background: ${t.card}; border: 1px solid ${t.line}; border-radius: 16px; display: flex; flex-direction: column;">${rows.join(`<div style="height: 1px; background: ${t.line}; margin: 0 16px;"></div>`)}</div>
  </div>`;
}
function themeRow(t, current = '淺色') {
  const opts = ['淺色', '深色', '跟隨系統'];
  return `<div style="display: flex; align-items: center; gap: 14px; min-height: 52px; padding: 10px 16px;">
    <div style="color: ${t.ink2};">${I.moon(20)}</div>
    <span style="flex-grow: 1; font-size: 15px; color: ${t.ink};">外觀</span>
    <div style="display: flex; gap: 4px; padding: 3px; background: ${t.chip}; border-radius: 10px;">
      ${opts.map(o => `<span style="font-size: 12px; padding: 6px 10px; border-radius: 8px; background: ${o === current ? t.card : 'transparent'}; color: ${o === current ? t.ink : t.ink2}; font-weight: ${o === current ? 700 : 400};">${o}</span>`).join('')}
    </div>
  </div>`;
}
function settingsContent(t) {
  return `
    ${settingGroup(t, '外觀', [themeRow(t)])}
    ${settingGroup(t, '儲存空間', [
      settingRow(t, I.cloud, '圖片儲存', '已連線 · S3'),
      settingRow(t, I.image, '本月上傳', '23 張'),
    ])}
    ${settingGroup(t, '資料', [
      settingRow(t, I.download, '匯出所有日記', 'JSON'),
      settingRow(t, I.trash, '清除本機快取', '', { danger: true }),
    ])}`;
}

// 手機 · 設定
function mobileSettings(t) {
  const body = `
  <div style="padding: 60px 20px 0; display: flex; flex-direction: column; gap: 22px;">
    <h1 class="serif" style="margin: 0; font-size: 28px; font-weight: 700; color: ${t.ink};">設定</h1>
    ${settingsContent(t)}
    <span style="font-size: 12px; color: ${t.ink3}; text-align: center; padding-top: 8px;">已安裝為應用程式 · 版本 0.1.0</span>
  </div>`;
  return phoneFrame(t, body, phoneNav(t, 'settings'));
}

// 心情分布（單一色相長條，emoji 標示身分）
const STATS = [['😊', 12], ['😌', 8], ['🤩', 3], ['😐', 2], ['😔', 2], ['🥱', 1]];
function moodBars(t, { rowH = 34 } = {}) {
  const max = STATS[0][1];
  return `<div style="display: flex; flex-direction: column; gap: 10px;">
    ${STATS.map(([e, n]) => `<div style="display: flex; align-items: center; gap: 12px; height: ${rowH}px;">
      <span style="font-size: 22px; line-height: 1; width: 28px; text-align: center;">${e}</span>
      <div style="flex-grow: 1; height: 10px; background: ${t.chip}; border-radius: 4px; overflow: hidden;">
        <div style="width: ${Math.round(n / max * 100)}%; height: 100%; background: ${t.accent}; border-radius: 0 4px 4px 0;"></div>
      </div>
      <span style="font-size: 13px; color: ${t.ink2}; width: 36px; text-align: right;">${n} 天</span>
    </div>`).join('\n')}
  </div>`;
}
function statTile(t, label, value, unit) {
  return `<div style="flex: 1 1 0; display: flex; flex-direction: column; gap: 4px; padding: 16px; background: ${t.card}; border: 1px solid ${t.line}; border-radius: 16px;">
    <span style="font-size: 12px; color: ${t.ink2};">${label}</span>
    <div style="display: flex; align-items: baseline; gap: 4px;">
      <span class="serif" style="font-size: 30px; font-weight: 700; line-height: 1; color: ${t.ink};">${value}</span>
      <span style="font-size: 13px; color: ${t.ink3};">${unit}</span>
    </div>
  </div>`;
}
function statsContent(t, opts = {}) {
  return `
    <div style="display: flex; gap: 12px;">
      ${statTile(t, '本月寫了', '28', '天')}
      ${statTile(t, '連續書寫', '11', '天')}
    </div>
    <div style="display: flex; flex-direction: column; gap: 14px; padding: 18px 16px; background: ${t.card}; border: 1px solid ${t.line}; border-radius: 16px;">
      <span class="serif" style="font-size: 15px; font-weight: 700; color: ${t.ink};">本月心情分布</span>
      ${moodBars(t, opts)}
    </div>`;
}

// 手機 · 統計
function mobileStats(t) {
  const body = `
  <div style="padding: 60px 20px 0; display: flex; flex-direction: column; gap: 22px;">
    <div style="display: flex; align-items: flex-end; justify-content: space-between;">
      <h1 class="serif" style="margin: 0; font-size: 28px; font-weight: 700; color: ${t.ink};">統計</h1>
      <span class="serif" style="font-size: 14px; color: ${t.ink2}; padding-bottom: 6px;">${MONTH_TITLE}</span>
    </div>
    ${statsContent(t)}
  </div>`;
  return phoneFrame(t, body, phoneNav(t, 'stats'));
}

// ---------- 桌機共用 ----------
const DESK = { w: 1440, h: 900 };

function sidebar(t, active) {
  const items = [['calendar', '月曆'], ['timeline', '時間軸'], ['stats', '統計'], ['settings', '設定']];
  return `<div style="width: 232px; flex-shrink: 0; display: flex; flex-direction: column; gap: 28px; padding: 32px 20px; border-right: 1px solid ${t.line}; background: ${t.card};">
    <div style="display: flex; flex-direction: column; gap: 2px; padding: 0 10px;">
      <span class="serif" style="font-size: 20px; font-weight: 700; color: ${t.ink};">日記</span>
      <span style="font-size: 12px; color: ${t.ink3};">一天，一頁</span>
    </div>
    <div style="display: flex; flex-direction: column; gap: 4px;">
      ${items.map(([k, label]) => `<div style="display: flex; align-items: center; gap: 12px; height: 44px; padding: 0 12px; border-radius: 10px; background: ${k === active ? t.accentSoft : 'transparent'}; color: ${k === active ? t.accent : t.ink2};">
        ${I[k](20)}<span style="font-size: 14px; font-weight: ${k === active ? 700 : 500}; color: ${k === active ? t.accent : t.ink};">${label}</span>
      </div>`).join('\n')}
    </div>
    <div style="flex-grow: 1;"></div>
    <div style="display: flex; align-items: center; gap: 12px; height: 44px; padding: 0 12px; border-radius: 10px; background: ${t.accent}; color: #FFF7EE;">
      ${I.pen(18, '#FFF7EE')}<span style="font-size: 14px; font-weight: 700;">寫今天的日記</span>
    </div>
  </div>`;
}

function deskFrame(t, active, main) {
  return `<div style="width: ${DESK.w}px; height: ${DESK.h}px; background: ${t.paper}; display: flex; overflow: hidden;">
    ${sidebar(t, active)}
    <div style="flex-grow: 1; min-width: 0; display: flex; overflow: hidden;">${main}</div>
  </div>`;
}

function deskTitle(t, title, sub) {
  return `<div style="display: flex; align-items: flex-end; justify-content: space-between;">
    <h1 class="serif" style="margin: 0; font-size: 32px; font-weight: 700; color: ${t.ink};">${title}</h1>
    ${sub ? `<span class="serif" style="font-size: 15px; color: ${t.ink2}; padding-bottom: 8px;">${sub}</span>` : ''}
  </div>`;
}

// 桌機 · 月曆首頁（左大月曆、右預覽）
function deskCalendar(t) {
  const main = `
  <div style="flex-grow: 1; min-width: 0; padding: 40px 48px; display: flex; flex-direction: column; gap: 28px; overflow: hidden;">
    <div style="display: flex; align-items: center; justify-content: space-between;">
      ${deskTitle(t, MONTH_TITLE)}
      <div style="display: flex; align-items: center; gap: 6px;">
        <div style="width: 44px; height: 44px; border-radius: 10px; border: 1px solid ${t.line}; background: ${t.card}; display: flex; align-items: center; justify-content: center; color: ${t.ink2};">${I.prev(20)}</div>
        <div style="height: 44px; padding: 0 16px; border-radius: 10px; border: 1px solid ${t.line}; background: ${t.card}; display: flex; align-items: center; font-size: 14px; color: ${t.ink};">今天</div>
        <div style="width: 44px; height: 44px; border-radius: 10px; border: 1px solid ${t.line}; background: ${t.card}; display: flex; align-items: center; justify-content: center; color: ${t.ink2};">${I.next(20)}</div>
      </div>
    </div>
    ${calendarGrid(t, { cell: 118, font: 15, emoji: 26, gap: 8 })}
  </div>
  <div style="width: 400px; flex-shrink: 0; border-left: 1px solid ${t.line}; background: ${t.card}; padding: 40px 32px; display: flex; flex-direction: column; gap: 22px; overflow: hidden;">
    <div style="display: flex; flex-direction: column; gap: 4px;">
      <span style="font-size: 13px; color: ${t.ink2}; letter-spacing: 0.08em;">星期五 · 今天</span>
      <h2 class="serif" style="margin: 0; font-size: 26px; font-weight: 700; color: ${t.ink};">九月十一日</h2>
    </div>
    <span style="font-size: 44px; line-height: 1;">😊</span>
    <div style="display: flex; flex-direction: column; gap: 14px; font-size: 15px; line-height: 1.85; color: ${t.ink};">
      <p>早上七點就醒了，窗外的光線很柔。煮了咖啡，坐在陽台看了一會兒書，覺得這樣的開始很好 ☕️</p>
      ${photo(t, '100%', 150, 10)}
      <p>下午去河堤走了一圈，天空是那種快要入秋的顏色。</p>
    </div>
    <div style="flex-grow: 1;"></div>
    <div style="height: 44px; border-radius: 10px; border: 1px solid ${t.line}; display: flex; align-items: center; justify-content: center; gap: 8px; font-size: 14px; color: ${t.ink}; background: ${t.paper};">${I.pen(18)}繼續寫</div>
  </div>`;
  return deskFrame(t, 'calendar', main);
}

// 桌機 · 編輯頁（左迷你月曆、右編輯器）
function deskEntry(t) {
  const main = `
  <div style="width: 340px; flex-shrink: 0; border-right: 1px solid ${t.line}; padding: 40px 28px; display: flex; flex-direction: column; gap: 20px;">
    <div style="display: flex; align-items: center; justify-content: space-between;">
      <div style="color: ${t.ink2};">${I.prev(20)}</div>
      <span class="serif" style="font-size: 15px; font-weight: 500; color: ${t.ink};">${MONTH_TITLE}</span>
      <div style="color: ${t.ink2};">${I.next(20)}</div>
    </div>
    ${calendarGrid(t, { cell: 38, font: 12, emoji: 14, gap: 3 })}
    <div style="height: 1px; background: ${t.line};"></div>
    <div style="display: flex; flex-direction: column; gap: 10px;">
      <span style="font-size: 12px; color: ${t.ink3}; letter-spacing: 0.08em;">最近</span>
      ${TL.slice(1, 4).map(c => `<div style="display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 10px; background: ${t.card}; border: 1px solid ${t.line};">
        <span style="font-size: 18px; line-height: 1;">${c.mood}</span>
        <span style="font-size: 12px; color: ${t.ink2}; width: 30px;">${c.day} 日</span>
        <span style="font-size: 13px; color: ${t.ink}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${c.text}</span>
      </div>`).join('\n')}
    </div>
  </div>
  <div style="flex-grow: 1; min-width: 0; display: flex; flex-direction: column; overflow: hidden;">
    <div style="display: flex; align-items: center; justify-content: space-between; padding: 24px 48px 0;">
      ${toolbar(t)}
      <div style="display: flex; align-items: center; gap: 14px;">
        <span style="font-size: 13px; color: ${t.ink3};">已自動儲存 · 下午 6:12</span>
        <div style="color: ${t.ink2};">${I.more(22)}</div>
      </div>
    </div>
    <div style="flex-grow: 1; overflow: hidden; padding: 36px 48px 0; display: flex; justify-content: center;">
      <div style="width: 640px; display: flex; flex-direction: column; gap: 24px;">
        <div style="display: flex; flex-direction: column; gap: 6px;">
          <span style="font-size: 13px; color: ${t.ink2}; letter-spacing: 0.08em;">星期五</span>
          <h1 class="serif" style="margin: 0; font-size: 36px; font-weight: 700; color: ${t.ink};">九月十一日</h1>
        </div>
        ${moodPicker(t, '😊', 44)}
        <div style="height: 1px; background: ${t.line};"></div>
        ${entryBody(t, { fontSize: 17, imgH: 260 })}
      </div>
    </div>
  </div>`;
  return deskFrame(t, 'calendar', main);
}

// 桌機 · 空狀態
function deskEmpty(t) {
  const main = `
  <div style="width: 340px; flex-shrink: 0; border-right: 1px solid ${t.line}; padding: 40px 28px; display: flex; flex-direction: column; gap: 20px;">
    <div style="display: flex; align-items: center; justify-content: space-between;">
      <div style="color: ${t.ink2};">${I.prev(20)}</div>
      <span class="serif" style="font-size: 15px; font-weight: 500; color: ${t.ink};">${MONTH_TITLE}</span>
      <div style="color: ${t.ink2};">${I.next(20)}</div>
    </div>
    ${calendarGrid(t, { cell: 38, font: 12, emoji: 14, gap: 3 })}
  </div>
  <div style="flex-grow: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 28px; text-align: center; padding-bottom: 40px;">
    <svg width="140" height="140" viewBox="0 0 120 120" fill="none">
      <rect x="22" y="14" width="76" height="92" rx="8" fill="${t.card}" stroke="${t.line}" stroke-width="2"></rect>
      <path d="M36 40h48M36 54h48M36 68h30" stroke="${t.line}" stroke-width="2.5" stroke-linecap="round"></path>
      <path d="M78 96l22-22a5 5 0 0 0-7-7L71 89l-2 9z" fill="${t.accentSoft}" stroke="${t.accent}" stroke-width="2" stroke-linejoin="round"></path>
    </svg>
    <div style="display: flex; flex-direction: column; gap: 8px;">
      <span style="font-size: 13px; color: ${t.ink2}; letter-spacing: 0.08em;">星期六 · 九月十二日</span>
      <h2 class="serif" style="margin: 0; font-size: 28px; font-weight: 700; color: ${t.ink};">這一天還是空白的</h2>
      <p style="font-size: 15px; line-height: 1.7; color: ${t.ink2};">先選一個心情，或直接寫下一句話就好。</p>
    </div>
    ${moodPicker(t, '', 46)}
    <div style="height: 48px; padding: 0 28px; border-radius: 24px; background: ${t.accent}; color: #FFF7EE; font-size: 15px; font-weight: 700; display: flex; align-items: center; gap: 8px;">${I.pen(18, '#FFF7EE')}開始寫這一天</div>
  </div>`;
  return deskFrame(t, 'calendar', main);
}

// 桌機 · 時間軸
function deskTimeline(t) {
  const main = `
  <div style="flex-grow: 1; min-width: 0; padding: 40px 48px; display: flex; flex-direction: column; gap: 28px; overflow: hidden;">
    <div style="display: flex; align-items: center; justify-content: space-between;">
      ${deskTitle(t, '時間軸', MONTH_TITLE)}
      <div style="display: flex; align-items: center; gap: 10px; height: 44px; padding: 0 14px; width: 260px; border-radius: 10px; border: 1px solid ${t.line}; background: ${t.card}; color: ${t.ink3};">${I.search(18)}<span style="font-size: 14px;">搜尋日記內容</span></div>
    </div>
    <div style="width: 720px; display: flex; flex-direction: column; gap: 18px;">
      ${TL.map(c => timelineCard(t, { ...c, size: 'l' })).join('\n')}
    </div>
  </div>`;
  return deskFrame(t, 'timeline', main);
}

// 桌機 · 設定
function deskSettings(t) {
  const main = `
  <div style="flex-grow: 1; padding: 40px 48px; display: flex; flex-direction: column; gap: 28px;">
    ${deskTitle(t, '設定')}
    <div style="width: 560px; display: flex; flex-direction: column; gap: 24px;">
      ${settingsContent(t)}
      <span style="font-size: 12px; color: ${t.ink3}; padding: 0 4px;">已安裝為應用程式 · 版本 0.1.0</span>
    </div>
  </div>`;
  return deskFrame(t, 'settings', main);
}

// 桌機 · 統計
function deskStats(t) {
  const main = `
  <div style="flex-grow: 1; padding: 40px 48px; display: flex; flex-direction: column; gap: 28px;">
    ${deskTitle(t, '統計', MONTH_TITLE)}
    <div style="width: 640px; display: flex; flex-direction: column; gap: 20px;">
      ${statsContent(t, { rowH: 38 })}
    </div>
  </div>`;
  return deskFrame(t, 'stats', main);
}

// ---------- 輸出 ----------
const boards = [
  ['Main', mobileCalendar(L), '手機 · 月曆首頁', PHONE],
  ['MobileEntry', mobileEntry(L), '手機 · 編輯頁', PHONE],
  ['MobileEmpty', mobileEmpty(L), '手機 · 空狀態', PHONE],
  ['MobileTimeline', mobileTimeline(L), '手機 · 時間軸', PHONE],
  ['MobileStats', mobileStats(L), '手機 · 統計', PHONE],
  ['MobileSettings', mobileSettings(L), '手機 · 設定', PHONE],
  ['MobileEntryDark', mobileEntry(D), '手機 · 編輯頁（深色）', PHONE],
  ['DesktopCalendar', deskCalendar(L), '桌機 · 月曆首頁', DESK],
  ['DesktopEntry', deskEntry(L), '桌機 · 編輯頁', DESK],
  ['DesktopEmpty', deskEmpty(L), '桌機 · 空狀態', DESK],
  ['DesktopTimeline', deskTimeline(L), '桌機 · 時間軸', DESK],
  ['DesktopStats', deskStats(L), '桌機 · 統計', DESK],
  ['DesktopSettings', deskSettings(L), '桌機 · 設定', DESK],
];

const artboards = [];
let x = 0;
for (const [name, html, title, size] of boards.slice(0, 7)) {
  writeFileSync(join(here, `${name}.dc.html`), page(name.endsWith('Dark') ? D : L, html));
  artboards.push({ file: `${name}.dc.html`, title, x, y: 0, w: size.w, h: size.h });
  x += size.w + 90;
}
x = 0;
const y2 = PHONE.h + 160;
let row = 0;
for (const [name, html, title, size] of boards.slice(7)) {
  writeFileSync(join(here, `${name}.dc.html`), page(L, html));
  artboards.push({ file: `${name}.dc.html`, title, x, y: y2 + row * (DESK.h + 140), w: size.w, h: size.h });
  x += size.w + 100;
  if (x > 3000) { x = 0; row++; }
}

const canvas = {
  artboards,
  annotations: [
    { id: 'brief', x: 0, y: -170, w: 520, text: '日記 App 設計稿 v1\n單人使用 · 一天一篇 · 心情 emoji + Tiptap 內文 · 圖片存 S3 · PWA 僅安裝\n溫暖紙質感：米白紙底、Noto Serif TC 標題、Noto Sans TC 內文、赤陶色強調\n上排：手機 390×844（含一張深咖啡深色範例）　下排：桌機 1440×900' },
  ],
  launch: { view: 'canvas' },
};
writeFileSync(join(here, 'canvas.json'), JSON.stringify(canvas, null, 2));
console.log(`wrote ${boards.length} artboards + canvas.json`);
