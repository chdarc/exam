/**
 * theme.js —— 昼夜主题切换
 *
 * 默认跟随浏览器（prefers-color-scheme）。点击右下角按钮在
 * “跟随系统 → 浅色 → 深色”之间循环切换，选择持久化到 localStorage。
 *
 * 注意：各页面 <head> 内有一段极小的内联脚本，在首屏渲染前先把
 * 主题写到 <html data-theme="...">，避免深色模式下出现白屏闪烁。
 */
(function (global) {
  'use strict';

  var KEY = 'examapp:theme';
  var MODES = ['auto', 'light', 'dark'];

  var ICONS = {
    auto: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="14" rx="2"/><path d="M8 21h8M12 18v3"/></svg>',
    light: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
    dark: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>'
  };

  var LABELS = { auto: '跟随系统', light: '浅色', dark: '深色' };

  function systemPref() {
    return (global.matchMedia && global.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
  }

  function getStored() {
    var t = null;
    try { t = global.localStorage.getItem(KEY); } catch (e) {}
    return (MODES.indexOf(t) >= 0) ? t : 'auto';
  }

  function setStored(mode) {
    try {
      if (mode === 'auto') global.localStorage.removeItem(KEY);
      else global.localStorage.setItem(KEY, mode);
    } catch (e) { /* 忽略 */ }
  }

  function apply(mode) {
    var effective = mode === 'auto' ? systemPref() : mode;
    document.documentElement.setAttribute('data-theme', effective);
  }

  function init() {
    var mode = getStored();
    apply(mode);

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'theme-toggle';
    btn.innerHTML = ICONS[mode];
    btn.setAttribute('aria-label', '切换主题：当前' + LABELS[mode]);
    btn.title = '主题：' + LABELS[mode] + '（点击切换）';

    btn.addEventListener('click', function () {
      var next = MODES[(MODES.indexOf(mode) + 1) % MODES.length];
      mode = next;
      setStored(mode);
      apply(mode);
      btn.innerHTML = ICONS[mode];
      btn.setAttribute('aria-label', '切换主题：当前' + LABELS[mode]);
      btn.title = '主题：' + LABELS[mode] + '（点击切换）';
    });

    document.body.appendChild(btn);

    // 处于“跟随系统”时，监听系统主题变化
    if (global.matchMedia) {
      global.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () {
        if (mode === 'auto') apply('auto');
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(window);
