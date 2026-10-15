/**
 * ui/bank.js —— 题库信息页
 *
 * 数据来源：banks/<id>/info.json + App.records 作答记录
 * 内容：题库标题/简介、题型数量、模拟考试信息、作答进度（作对/错题/总共）、四种刷题入口卡片。
 * 卡片文案来自 App.site.modes（见 site.js），图标为内联 SVG（不使用 emoji）。
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
    if (back) back.addEventListener('click', function () { location.href = App.url('index.html#catalog'); });

    App.data.getBank(id).then(function (bank) {
      document.title = bank.title + ' · 刷题';
      render(bank);
    }).catch(function (err) {
      App.ui.toast('题库加载失败：' + err.message);
    });
  });

  function typeText(type) { return App.ui.typeMeta(type).label; }

  /** 模拟考试卡片描述：优先根据题库 exam 配置动态生成。 */
  function examDesc(exam, fallback) {
    if (!exam) return fallback;
    var parts = [];
    if (exam.count) parts.push(exam.count + ' 题');
    if (exam.distribution) {
      var d = [];
      Object.keys(exam.distribution).forEach(function (t) {
        d.push(typeText(t) + ' ' + exam.distribution[t]);
      });
      parts.push(d.join(' · '));
    }
    if (exam.duration) parts.push(Math.round(exam.duration / 60) + ' 分钟');
    return parts.length ? parts.join(' · ') : fallback;
  }

  function render(bank) {
    qs('#bankTitle').textContent = bank.title || '';
    qs('#headTitle').textContent = bank.title || '';
    qs('#bankBrief').textContent = bank.brief || '';

    // 题型数量（题库总体）
    var typesBox = qs('#bankTypes');
    typesBox.innerHTML = '';
    var types = bank.types || {};
    Object.keys(types).forEach(function (t) {
      typesBox.appendChild(App.ui.el('span', { class: 'bank__type', text: typeText(t) + ' ' + types[t] }));
    });

    // 模拟考试信息
    renderExam(bank);

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
    renderModes(bank);
  }

  function renderExam(bank) {
    var box = qs('#bankExam');
    if (!box) return;
    box.innerHTML = '';
    var ex = bank.exam;
    if (!ex) return;

    var parts = [];
    if (ex.count) parts.push(ex.count + ' 题');
    if (ex.distribution) {
      var d = [];
      Object.keys(ex.distribution).forEach(function (t) {
        d.push(typeText(t) + ' ' + ex.distribution[t]);
      });
      parts.push(d.join(' · '));
    }
    if (ex.duration) parts.push(Math.round(ex.duration / 60) + ' 分钟');
    if (ex.pass) parts.push('及格 ' + ex.pass + ' 题');
    if (!parts.length) return;

    box.appendChild(App.ui.el('span', { class: 'bank__exam-label', text: '模拟考试' }));
    box.appendChild(App.ui.el('span', { class: 'bank__exam-text', text: parts.join(' · ') }));
  }

  function renderModes(bank) {
    var cards = qs('#modeCards');
    cards.innerHTML = '';
    var siteModes = (App.site && App.site.modes) || {};

    function cfg(key, fallback) {
      var m = siteModes[key] || {};
      return { title: m.title || fallback.title, desc: m.desc || fallback.desc, icon: m.icon || '' };
    }

    var modes = [
      extend({ key: 'sequential', cls: 'mode-card__icon--1' }, cfg('sequential', { title: '顺序刷题', desc: '' })),
      extend({ key: 'random', cls: 'mode-card__icon--2' }, cfg('random', { title: '乱序刷题', desc: '' })),
      extend({ key: 'exam', cls: 'mode-card__icon--3' }, cfg('exam', { title: '模拟考试', desc: '' })),
      extend({ key: 'records', cls: 'mode-card__icon--4' }, cfg('records', { title: '错题 · 收藏', desc: '' }))
    ];

    modes.forEach(function (m) {
      if (m.key === 'exam') m.desc = examDesc(bank.exam, m.desc);

      var href = m.key === 'records'
        ? App.url('records.html?bank=' + encodeURIComponent(bank.id))
        : App.url('practice.html?bank=' + encodeURIComponent(bank.id) + '&mode=' + m.key);

      cards.appendChild(App.ui.el('a', { class: 'mode-card', href: href }, [
        App.ui.el('span', { class: 'mode-card__icon ' + m.cls, html: m.icon }),
        App.ui.el('div', { class: 'mode-card__body' }, [
          App.ui.el('div', { class: 'mode-card__title', text: m.title }),
          App.ui.el('div', { class: 'mode-card__desc', text: m.desc })
        ])
      ]));
    });
  }

  function extend(target, src) {
    Object.keys(src).forEach(function (k) { target[k] = src[k]; });
    return target;
  }
})(window);
