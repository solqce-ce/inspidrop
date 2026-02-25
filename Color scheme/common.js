/**
 * common.js — 共通ユーティリティ
 * テーマ・トースト通知・ナビゲーション・ログアウトボタンを共通化
 */

// ========== テーマ ==========

function applyTheme() {
  const saved = localStorage.getItem("theme") ||
    (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  document.documentElement.className = saved;
  return saved;
}

function toggleTheme() {
  const isDark = document.documentElement.classList.contains("dark");
  const next = isDark ? "light" : "dark";
  document.documentElement.className = next;
  localStorage.setItem("theme", next);
  return next;
}

// ========== トースト通知 ==========

function showToast(msg, duration = 2500) {
  let toast = document.getElementById("toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast";
    toast.className = "toast";
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add("show");
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove("show"), duration);
}

// ========== ナビゲーションバー（ログアウトボタン付き） ==========

/**
 * 各ページ右上のナビゲーションを動的に生成
 * @param {string} activePage — 現在のページ ('index'|'gallery'|'emoji'|'settings'|'profile')
 */
function buildNav(activePage = "") {
  const nav = document.getElementById("mainNav");
  if (!nav) return;

  const user = getCurrentUser(); // auth.js から
  const userName = user ? user.name : "ゲスト";

  const links = [
    { href: "index.html",           icon: "🏠", label: "ホーム",        key: "index"    },
    { href: "gallery.html",         icon: "🎨", label: "ギャラリー",     key: "gallery"  },
    { href: "emoji-generator.html", icon: "😊", label: "絵文字",         key: "emoji"    },
    { href: "pose-generator.html",  icon: "🧍", label: "ポーズ",         key: "pose"     },
    { href: "chara-generator.html", icon: "👥", label: "キャラ構成",     key: "chara"    },
    { href: "settings.html",        icon: "⚙️", label: "設定",           key: "settings" },
    { href: "profile.html",         icon: "👤", label: "プロフィール",    key: "profile"  },
  ];

  const linkHTML = links.map(l => {
    const isActive = l.key === activePage;
    return `<a href="${l.href}" class="nav-link${isActive ? " nav-active" : ""}" title="${l.label}">
      <span class="mobile-text">${l.icon}</span>
      <span class="pc-text">${l.icon} ${l.label}</span>
    </a>`;
  }).join("");

  nav.innerHTML = `
    <div class="nav-user">
      <span class="nav-username" title="${userName}">👤 ${userName}</span>
    </div>
    ${linkHTML}
    <button class="nav-link nav-logout" onclick="confirmLogout()" title="ログアウト">
      <span class="mobile-text">🚪</span>
      <span class="pc-text">🚪 ログアウト</span>
    </button>
  `;
}

function confirmLogout() {
  if (confirm("ログアウトしますか？")) {
    logout(); // auth.js から
  }
}

// ========== 共通 CSS (動的に挿入) ==========

function injectCommonStyles() {
  if (document.getElementById("common-styles")) return;
  const style = document.createElement("style");
  style.id = "common-styles";
  style.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');

    /* ===== ナビゲーション ===== */
    body { padding-top: 0 !important; }

    #mainNav {
      position: fixed;
      top: 12px; right: 12px;
      display: flex;
      flex-direction: column;
      gap: 5px;
      z-index: 999;
      max-height: calc(100vh - 24px);
      overflow-y: auto;
    }

    .nav-link {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 7px 13px;
      border-radius: 9px;
      background: #007bff;
      color: #fff;
      text-decoration: none;
      font-family: 'DM Sans', sans-serif;
      font-weight: 700;
      font-size: 13px;
      border: none;
      cursor: pointer;
      text-align: left;
      white-space: nowrap;
      transition: transform 0.18s, filter 0.18s;
      box-shadow: 0 2px 8px rgba(0,0,0,0.18);
    }
    .nav-link:hover { transform: translateY(-2px); filter: brightness(1.1); }
    .nav-link.active { outline: 2px solid rgba(255,255,255,0.6); outline-offset: 1px; }
    .nav-link.logout-btn { background: #ef4444; margin-top: 4px; }

    /* ライト/ダーク両対応のナビ背景 */
    html.light #mainNav .nav-link { box-shadow: 0 2px 10px rgba(0,0,0,0.15); }
    html.dark  #mainNav .nav-link { box-shadow: 0 2px 10px rgba(0,0,0,0.4); }

    /* ===== トースト ===== */
    .common-toast {
      position: fixed;
      bottom: 28px; left: 50%;
      transform: translateX(-50%) translateY(10px);
      background: rgba(10,10,18,0.9);
      color: #fff;
      padding: 11px 22px;
      border-radius: 50px;
      font-family: 'DM Sans', sans-serif;
      font-size: 14px;
      font-weight: 600;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.28s, transform 0.28s;
      z-index: 3000;
      white-space: nowrap;
    }
    .common-toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }

    /* モバイル: ナビを横並び下部に */
    @media (max-width: 600px) {
      #mainNav {
        top: auto; right: auto;
        bottom: 0; left: 0;
        width: 100%;
        flex-direction: row;
        overflow-x: auto;
        overflow-y: visible;
        padding: 8px 10px;
        background: rgba(10,10,20,0.92);
        backdrop-filter: blur(12px);
        border-top: 1px solid rgba(255,255,255,0.08);
        max-height: none;
        gap: 6px;
      }
      html.light #mainNav {
        background: rgba(255,255,255,0.95);
        border-top: 1px solid rgba(0,0,0,0.1);
      }
      .nav-link { font-size: 12px; padding: 6px 11px; }
      body { padding-bottom: 70px !important; }
    }
  ``;
  document.head.appendChild(style);
}
