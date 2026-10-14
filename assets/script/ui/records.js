/**
 * ui/records.js —— 题库记录页（收藏 / 错题列表）
 *
 * 顶部 tabs 切换“收藏 / 错题”，下方列出题号；点击可跳转到对应题目练习。
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

    App.data.getBank(bankId).then(function (bank) {
      state.bank = bank;
      (bank.questions || []).forEach(function (q) { state.byId[String(q.id)] = q; });
      qs('#bankTitle').textContent = bank.title;
      document.title = (state.tab === 'favorite' ? '收藏' : '错题') + ' · ' + bank.title;
      setTab(state.tab);
    }).catch(function (err) {
      App.ui.toast('题库加载失败：' + err.message);
    });
  });

  function currentIds() {
    return state.tab === 'favorite'
      ? App.records.favoriteList(state.bank.id)
      : App.records.wrongList(state.bank.id);
  }

  function setTab(tab) {
    state.tab = tab;
    Array.prototype.forEach.call(document.querySelectorAll('[data-tab]'), function (t) {
      t.classList.toggle('is-active', t.getAttribute('data-tab') === tab);
    });
    renderList();
  }

  function renderList() {
    var ids = currentIds();
    var list = qs('#recordList');
    list.innerHTML = '';
    qs('#recordCount').textContent = '共 ' + ids.length + ' 题';

    if (!ids.length) {
      list.appendChild(App.ui.el('div', {
        class: 'empty',
        text: state.tab === 'favorite' ? '还没有收藏的题目，做题时点 ☆ 即可收藏。' : '暂无错题，继续保持！'
      }));
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
