// 共通ナビゲーションバーを動的に挿入するモジュール
(function () {
  // 現在のページを判定する
  var currentPage = location.pathname.split("/").pop() || "index.html";

  // ナビゲーションのHTMLを定義する
  var navHTML = '<nav class="site-nav">' +
    '<div class="nav-inner">' +
      '<a href="index.html" class="nav-logo">T</a>' +
      '<button class="nav-toggle" id="navToggle" aria-label="メニュー">' +
        '<span></span><span></span><span></span>' +
      '</button>' +
      '<ul class="nav-links" id="navLinks">' +
        '<li><a href="index.html"' + (currentPage === 'index.html' ? ' class="active"' : '') + '>&#127968; ホーム</a></li>' +
        '<li><a href="todo.html"' + (currentPage === 'todo.html' ? ' class="active"' : '') + '>&#9745; ToDo</a></li>' +
        '<li><a href="sales.html"' + (currentPage === 'sales.html' ? ' class="active"' : '') + '>&#128202; 売上集計</a></li>' +
      '</ul>' +
    '</div>' +
  '</nav>';

  // ナビゲーションのCSSを定義する
  var navCSS =
    '.site-nav {' +
      'position: sticky;' +
      'top: 0;' +
      'z-index: 1000;' +
      'background: linear-gradient(135deg, #0b8457, #11998e);' +
      'box-shadow: 0 2px 20px rgba(0, 0, 0, 0.15);' +
      'width: 100%;' +
      'flex-shrink: 0;' +
    '}' +
    '.nav-inner {' +
      'max-width: 900px;' +
      'margin: 0 auto;' +
      'display: flex;' +
      'align-items: center;' +
      'justify-content: space-between;' +
      'padding: 0 20px;' +
      'height: 56px;' +
    '}' +
    '.nav-logo {' +
      'width: 36px;' +
      'height: 36px;' +
      'background: rgba(255, 255, 255, 0.2);' +
      'border: 2px solid rgba(255, 255, 255, 0.4);' +
      'border-radius: 50%;' +
      'display: flex;' +
      'align-items: center;' +
      'justify-content: center;' +
      'color: #fff;' +
      'font-size: 18px;' +
      'font-weight: bold;' +
      'text-decoration: none;' +
      'flex-shrink: 0;' +
    '}' +
    '.nav-links {' +
      'list-style: none;' +
      'display: flex;' +
      'gap: 4px;' +
      'margin: 0;' +
      'padding: 0;' +
    '}' +
    '.nav-links a {' +
      'color: rgba(255, 255, 255, 0.8);' +
      'text-decoration: none;' +
      'padding: 8px 16px;' +
      'border-radius: 8px;' +
      'font-size: 14px;' +
      'font-weight: 500;' +
      'transition: background 0.3s, color 0.3s;' +
      'display: block;' +
      'white-space: nowrap;' +
    '}' +
    '.nav-links a:hover {' +
      'background: rgba(255, 255, 255, 0.15);' +
      'color: #fff;' +
    '}' +
    '.nav-links a.active {' +
      'background: rgba(255, 255, 255, 0.2);' +
      'color: #fff;' +
      'font-weight: bold;' +
    '}' +
    '.nav-toggle {' +
      'display: none;' +
      'background: none;' +
      'border: none;' +
      'cursor: pointer;' +
      'padding: 8px;' +
      'flex-direction: column;' +
      'gap: 5px;' +
    '}' +
    '.nav-toggle span {' +
      'display: block;' +
      'width: 24px;' +
      'height: 2px;' +
      'background: #fff;' +
      'border-radius: 2px;' +
      'transition: transform 0.3s, opacity 0.3s;' +
    '}' +
    '.nav-toggle.open span:nth-child(1) {' +
      'transform: translateY(7px) rotate(45deg);' +
    '}' +
    '.nav-toggle.open span:nth-child(2) {' +
      'opacity: 0;' +
    '}' +
    '.nav-toggle.open span:nth-child(3) {' +
      'transform: translateY(-7px) rotate(-45deg);' +
    '}' +
    '@media (max-width: 768px) {' +
      '.nav-toggle {' +
        'display: flex;' +
      '}' +
      '.nav-links {' +
        'display: none;' +
        'position: absolute;' +
        'top: 56px;' +
        'left: 0;' +
        'right: 0;' +
        'background: linear-gradient(135deg, #0b8457, #11998e);' +
        'flex-direction: column;' +
        'padding: 8px 20px 16px;' +
        'gap: 2px;' +
        'box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);' +
      '}' +
      '.nav-links.open {' +
        'display: flex;' +
      '}' +
      '.nav-links a {' +
        'padding: 12px 16px;' +
        'font-size: 15px;' +
      '}' +
      '.nav-inner {' +
        'position: relative;' +
      '}' +
    '}' +
    'body {' +
      'flex-direction: column !important;' +
      'align-items: stretch !important;' +
    '}';

  // CSSをheadに挿入する
  var style = document.createElement("style");
  style.textContent = navCSS;
  document.head.appendChild(style);

  // HTMLをbodyの先頭に挿入する
  document.body.insertAdjacentHTML("afterbegin", navHTML);

  // ハンバーガーメニューのトグル処理
  document.getElementById("navToggle").addEventListener("click", function () {
    this.classList.toggle("open");
    document.getElementById("navLinks").classList.toggle("open");
  });
})();
