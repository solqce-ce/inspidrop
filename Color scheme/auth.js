/**
 * auth.js — 認証ユーティリティ
 * パスワードハッシュ化・ユーザー管理の共通ロジック
 */

// ========== パスワードハッシュ化 ==========

/**
 * SHA-256でパスワードをハッシュ化（非同期）
 * ブラウザ標準の Web Crypto API を使用
 */
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + "palette_salt_v1"); // アプリ固有のsalt
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

// ========== テストユーザー（ハッシュ済み） ==========
// "1234" のSHA-256ハッシュ (palette_salt_v1 付き) — 事前計算済み
const TEST_USERS = [
  {
    username: "admin",
    passwordHash: null, // 初回起動時に生成
    name: "管理者",
    _plainForInit: "1234"
  },
  {
    username: "user1",
    passwordHash: null,
    name: "ユーザー1",
    _plainForInit: "password"
  }
];

/** テストユーザーのハッシュを初期化（初回のみ） */
async function initTestUsers() {
  const key = "testUsersInitialized";
  if (localStorage.getItem(key)) return;

  for (const u of TEST_USERS) {
    u.passwordHash = await hashPassword(u._plainForInit);
  }
  localStorage.setItem("_testUsers", JSON.stringify(
    TEST_USERS.map(({ username, passwordHash, name }) => ({ username, passwordHash, name }))
  ));
  localStorage.setItem(key, "1");
}

/** テストユーザーを取得 */
function getTestUsers() {
  return JSON.parse(localStorage.getItem("_testUsers")) || [];
}

// ========== ユーザー認証 ==========

/**
 * ログイン認証
 * @returns {object|null} ユーザーオブジェクト or null
 */
async function authenticate(username, password) {
  await initTestUsers();
  const hash = await hashPassword(password);

  // 登録ユーザーを確認
  const registeredUsers = JSON.parse(localStorage.getItem("registeredUsers")) || [];
  let user = registeredUsers.find(u => u.username === username && u.passwordHash === hash);

  // テストユーザーを確認
  if (!user) {
    const testUsers = getTestUsers();
    user = testUsers.find(u => u.username === username && u.passwordHash === hash);
  }

  return user || null;
}

/**
 * 新規ユーザー登録
 * @returns {{ success: boolean, error?: string }}
 */
async function registerUser(displayName, username, password) {
  const registeredUsers = JSON.parse(localStorage.getItem("registeredUsers")) || [];

  // 重複チェック（登録済み + テストユーザー）
  const testUsers = getTestUsers();
  const allUsernames = [
    ...registeredUsers.map(u => u.username),
    ...testUsers.map(u => u.username)
  ];
  if (allUsernames.includes(username)) {
    return { success: false, error: "このユーザー名は既に使用されています" };
  }

  const passwordHash = await hashPassword(password);
  const newUser = {
    displayName,
    username,
    passwordHash,
    createdAt: new Date().toISOString()
  };

  registeredUsers.push(newUser);
  localStorage.setItem("registeredUsers", JSON.stringify(registeredUsers));
  return { success: true };
}

// ========== セッション管理 ==========

function getCurrentUser() {
  const raw = localStorage.getItem("currentUser");
  return raw ? JSON.parse(raw) : null;
}

function setCurrentUser(user) {
  localStorage.setItem("currentUser", JSON.stringify({
    username: user.username,
    name: user.displayName || user.name || user.username,
    loginTime: new Date().toISOString()
  }));
}

function logout() {
  localStorage.removeItem("currentUser");
  window.location.href = "login.html";
}

/**
 * 認証ガード — ログインしていなければ login.html へリダイレクト
 */
function requireAuth() {
  const user = getCurrentUser();
  if (!user) {
    window.location.href = "login.html";
    return null;
  }
  return user;
}

/**
 * 既にログイン済みなら index.html へリダイレクト（login/register ページ用）
 */
function redirectIfLoggedIn() {
  if (getCurrentUser()) {
    window.location.href = "index.html";
  }
}

// ========== アカウント削除 ==========

function deleteAccount(username) {
  localStorage.removeItem(`profile_${username}`);
  let registeredUsers = JSON.parse(localStorage.getItem("registeredUsers")) || [];
  registeredUsers = registeredUsers.filter(u => u.username !== username);
  localStorage.setItem("registeredUsers", JSON.stringify(registeredUsers));
  localStorage.removeItem("currentUser");
}
