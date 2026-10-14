/**
 * ui/bank.js —— 题库信息页
 *
 * 数据来源：banks/<id>/info.json + App.records 作答记录
 * 内容：题库标题/简介、题型数量、作答进度（作对/错题/总共）、四种刷题入口卡片。
 */
(function (global) {
  'use strict';
  var App = global.App = global.App || {};

  function qs(sel) { return document.querySelector(sel); }

  App.ready(function () {
    var root = qs('[data-page="bank"]');
    if (!root) return;

    var id = App.util && App.util.getParam('id');
    if (!id) { App.ui.toast('缺少题库 id'); return; }

    var back = qs('#backBtn');
    if (back) back.addEventListener('click', function () { location.href = App.url('index.html'); });

    App.data.getBank(id).then(function (bank) {
      document.title = bank.title + ' · 刷题';
      render(bank);
    }).catch(function (err) {
      App.ui.toast('题库加载失败：' + err.message);
    });
  });

  function typeText(type) { return App.ui.typeMeta(type).label; }

  function render(bank) {
    qs('#bankTitle').textContent = bank.title || '';
    qs('#headTitle').textContent = bank.title || '';
    qs('#bankBrief').textContent = bank.brief || '';

    // 题型数量
    var typesBox = qs('#bankTypes');
    typesBox.innerHTML = '';
    var types = bank.types || {};
    Object.keys(types).forEach(function (t) {
      typesBox.appendChild(App.ui.el('span', { class: 'bank__type', text: typeText(t) + ' ' + types[t] }));
    });

    // 作答统计
    var total = bank.total || (bank.questions || []).length;
    var st = App.records.stats(bank.id, total);
    qs('#statCorrect').textContent = st.correct;
    qs('#statWrong').textContent = st.wrong;
    qs('#statTotal').textContent = st.total;
    var pct = st.total ? Math.round(st.done / st.total * 100) : 0;
    var bar = qs('#progressBar');
    if (bar) bar.style.width = pct + '%';
    qs('#progressText').textContent = pct + '%';

    // 四种刷题入口
    var cards = qs('#modeCards');
    cards.innerHTML = '';
    var modes = [
      { key: 'sequential', icon: '📚', cls: 'mode-card__icon--1', title: '顺序刷题', desc: '按题号顺序逐题练习' },
      { key: 'random', icon: '🔀', cls: 'mode-card__icon--2', title: '乱序刷题', desc: '随机打乱顺序练习' },
      { key: 'exam', icon: '⏱️', cls: 'mode-card__icon--3', title: '模拟考试', desc: '限时答题，交卷后评分' },
      { key: 'records', icon: '⭐', cls: 'mode-card__icon--4', title: '错题 / 收藏', desc: '针对错题与收藏重点练习' }
    ];
    modes.forEach(function (m) {
      var href = m.key === 'records'
        ? App.url('records.html?bank=' + encodeURIComponent(bank.id))
        : App.url('practice.html?bank=' + encodeURIComponent(bank.id) + '&mode=' + m.key);
      cards.appendChild(App.ui.el('a', { class: 'mode-card', href: href }, [
        App.ui.el('span', { class: 'mode-card__icon ' + m.cls, text: m.icon }),
        App.ui.el('div', { class: 'mode-card__body' }, [
          App.ui.el('div', { class: 'mode-card__title', text: m.title }),
          App.ui.el('div', { class: 'mode-card__desc', text: m.desc })
        ])
      ]));
    });
  }
})(window);
