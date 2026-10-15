/**
 * ui/records.js —— 题库记录页（收藏 / 错题列表）
 *
 * 顶部 tabs 切换“收藏 / 错题”；每个 Tab 独立处理：
 *  - “开始练习”进入该 Tab 对应题目的练习；
 *  - “清除记录”仅清除当前 Tab 的记录（收藏或错题，需确认）。
 * 从刷题页返回时（pageshow / bfcache）自动刷新列表，并保持当前 Tab。
 */
(function (global) {
  'use strict';
  var App = global.App = global.App || {};

  function qs(sel) { return document.querySelector(sel); }

  var state = { bank: null, byId: {}, tab: 'favorite' };

  App.ready(function () {
    var root = qs('[data-page="records"]');
    if (!root) return;

    var bankId = App.util.getParam('bank');
    if (!bankId) { App.ui.toast('缺少题库 id'); return; }

    state.tab = getInitialTab(bankId);

    qs('#backBtn').addEventListener('click', function () {
      location.href = App.url('bank.html?id=' + encodeURIComponent(bankId));
    });

    Array.prototype.forEach.call(document.querySelectorAll('[data-tab]'), function (t) {
      t.addEventListener('click', function () { setTab(t.getAttribute('data-tab')); });
    });

    qs('#practiceBtn').addEventListener('click', function () {
      var ids = currentIds();
      if (!ids.length) { App.ui.toast(state.tab === 'favorite' ? '暂无收藏题目' : '暂无错题'); return; }
      location.href = App.url('practice.html?bank=' + encodeURIComponent(bankId) + '&mode=' + state.tab);
    });

    qs('#clearBtn').addEventListener('click', function () {
      if (!currentIds().length) {
        App.ui.toast(state.tab === 'favorite' ? '暂无收藏可清除' : '暂无错题可清除');
        return;
      }
      var msg = state.tab === 'favorite'
        ? (App.site && App.site.records && App.site.records.clearFavorite)
        : (App.site && App.site.records && App.site.records.clearWrong);
      App.ui.confirm(msg || '确定清除？', function () {
        if (state.tab === 'favorite') App.records.clearFavorites(bankId);
        else App.records.clearWrong(bankId);
        renderList();
        App.ui.toast('已清除');
      });
    });

    // 从刷题页返回（含 bfcache 恢复）时刷新列表，保持当前 Tab
    window.addEventListener('pageshow', function () {
      if (state.bank) renderList();
    });

    App.data.getBank(bankId).then(function (bank) {
      state.bank = bank;
      (bank.questions || []).forEach(function (q) { state.byId[String(q.id)] = q; });
      qs('#bankTitle').textContent = bank.title;
      setTab(state.tab);
    }).catch(function (err) {
      App.ui.toast('题库加载失败：' + err.message);
    });
  });

  function getInitialTab(bankId) {
    var t = App.util.getParam('tab');
    if (t === 'wrong' || t === 'favorite') return t;
    try { t = sessionStorage.getItem('examapp:recordsTab:' + bankId); } catch (e) { t = null; }
    return t === 'wrong' ? 'wrong' : 'favorite';
  }

  function currentIds() {
    return state.tab === 'favorite'
      ? App.records.favoriteList(state.bank.id)
      : App.records.wrongList(state.bank.id);
  }

  function setTab(tab) {
    state.tab = tab;
    try { sessionStorage.setItem('examapp:recordsTab:' + state.bank.id, tab); } catch (e) { /* 忽略 */ }
    Array.prototype.forEach.call(document.querySelectorAll('[data-tab]'), function (t) {
      t.classList.toggle('is-active', t.getAttribute('data-tab') === tab);
    });
    document.title = (tab === 'favorite' ? '收藏' : '错题') + ' · ' + state.bank.title;
    renderList();
  }

  function renderList() {
    var ids = currentIds();
    var list = qs('#recordList');
    list.innerHTML = '';
    qs('#recordCount').textContent = '共 ' + ids.length + ' 题';

    if (!ids.length) {
      var empty = state.tab === 'favorite'
        ? (App.site && App.site.empty && App.site.empty.records && App.site.empty.records.favorite)
        : (App.site && App.site.empty && App.site.empty.records && App.site.empty.records.wrong);
      list.appendChild(App.ui.el('div', { class: 'empty', text: empty || '暂无记录' }));
      return;
    }

    ids.forEach(function (id) {
      var q = state.byId[String(id)];
      var item = App.ui.el('div', { class: 'record-item' }, [
        App.ui.el('span', { class: 'record-item__id', text: '#' + id }),
        App.ui.el('span', { class: 'record-item__brief', text: q ? q.brief : '' }),
        App.ui.el('span', { class: 'record-item__go', html: '&#8250;' })
      ]);
      item.addEventListener('click', function () {
        location.href = App.url('practice.html?bank=' + encodeURIComponent(state.bank.id) +
          '&mode=' + state.tab + '&q=' + encodeURIComponent(id));
      });
      list.appendChild(item);
    });
  }
})(window);
