/**
 * ui/scores.js —— 考试记录页
 *
 * 数据来源：App.records.attempts()（每次交卷写入，含分数与答题明细）。
 * 结构（每个题库分开）：
 *  - 顶部题库切换：有多个题库成绩时出现，切换即只看该题库；
 *  - 详情卡：当前选中那次的分数、及格情况、答对/用时，以及「返回 / 逐题查看 / 查看错题」；
 *  - 考试记录列表：点击某条即切换详情（不跳转）；
 *  - 成绩概览：该题库的平均/最好/最新 + 得分与用时趋势（次要信息，放最下面）。
 *
 * 只负责展示与交互，成绩的读写全部经由业务层 App.records。
 */
(function (global) {
  'use strict';
  var App = global.App = global.App || {};

  function qs(sel) { return document.querySelector(sel); }
  function pad2(n) { return (n < 10 ? '0' : '') + n; }

  var T = (App.site && App.site.scores) || {};
  var SVG_NS = 'http://www.w3.org/2000/svg';

  var state = {
    all: [],      // 全部成绩记录（旧 → 新）
    titles: {},   // 题库 id -> 标题
    bank: '',     // 当前题库 id（空 = 还没有任何记录）
    attempt: null // 当前选中的那次考试
  };

  var resizeTimer = null;

  App.ready(function () {
    var root = qs('[data-page="scores"]');
    if (!root) return;

    qs('#backBtn').addEventListener('click', goBack);
    qs('#clearBtn').addEventListener('click', clearBank);

    state.all = App.records.attempts();
    state.bank = resolveBank(App.util.getParam('bank'));
    state.attempt = resolveAttempt(App.util.getParam('attempt'));

    render();

    // 题库标题用于顶部切换与详情展示；拿不到时退回题库 id
    App.data.getCatalog().then(function (catalog) {
      (catalog.lists || []).forEach(function (list) {
        (list.banks || []).forEach(function (b) {
          if (b && b.id) state.titles[b.id] = b.title || b.id;
        });
      });
      render();
    }).catch(function () { /* 目录加载失败时保留 id 展示 */ });

    global.addEventListener('resize', function () {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        if (bankAttempts().length) renderChart(bankAttempts());
      }, 150);
    });

    // 从 bfcache 恢复时重新读取，避免显示旧数据
    global.addEventListener('pageshow', function (e) {
      if (!e.persisted) return;
      state.all = App.records.attempts();
      state.attempt = state.attempt ? App.records.attempt(state.attempt.id) : null;
      if (!state.attempt) state.attempt = resolveAttempt('');
      render();
    });
  });

  /* ---------------- 数据 ---------------- */

  function scoreOf(a) {
    return a.total > 0 ? Math.round(a.correct / a.total * 100) : 0;
  }

  function wrongCount(a) {
    var n = 0;
    Object.keys(a.results || {}).forEach(function (id) {
      if (a.results[id] === false) n++;
    });
    return n;
  }

  function bankAttempts() {
    if (!state.bank) return [];
    return state.all.filter(function (a) { return a.bank === state.bank; });
  }

  function allBanks() {
    var out = [];
    state.all.forEach(function (a) {
      if (out.indexOf(a.bank) < 0) out.push(a.bank);
    });
    if (state.bank && out.indexOf(state.bank) < 0) out.unshift(state.bank);
    return out;
  }

  function resolveBank(param) {
    if (param) return param;
    if (state.all.length) return state.all[state.all.length - 1].bank;
    return '';
  }

  function resolveAttempt(param) {
    var list = bankAttempts();
    if (!list.length) return null;
    if (param) {
      for (var i = 0; i < list.length; i++) {
        if (list[i].id === String(param)) return list[i];
      }
    }
    return list[list.length - 1];
  }

  function bankTitle() {
    if (!state.bank) return '';
    return state.titles[state.bank] || bankLabel(state.bank);
  }

  function bankLabel(id) {
    if (id === 'all') return T.totalBank || '总题库';
    var title = state.titles[id];
    if (title) {
      var m = /^([A-Za-z])\s*类/.exec(title);
      return m ? m[1].toUpperCase() + ' 类' : title;
    }
    return String(id).toUpperCase();
  }

  function fmtDate(ts) {
    var d = new Date(ts);
    var year = d.getFullYear() === new Date().getFullYear() ? '' : d.getFullYear() + '-';
    return year + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()) + ' ' +
      pad2(d.getHours()) + ':' + pad2(d.getMinutes());
  }

  function fmtDuration(s) {
    s = Math.max(0, Math.floor(s));
    var h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    function p(n) { return (n < 10 ? '0' : '') + n; }
    return (h ? p(h) + ':' : '') + p(m) + ':' + p(sec);
  }

  function attemptIndex(a) {
    var list = bankAttempts();
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === a.id) return i + 1;
    }
    return 0;
  }

  /* ---------------- URL ---------------- */

  function updateUrl(bank, attempt) {
    var q = '?bank=' + encodeURIComponent(bank);
    if (attempt) q += '&attempt=' + encodeURIComponent(attempt.id);
    try { history.replaceState(null, '', location.pathname + q); } catch (e) { /* 忽略 */ }
  }

  function goBack() {
    if (state.bank) location.href = App.url('bank.html?id=' + encodeURIComponent(state.bank));
    else location.href = App.url('index.html#catalog');
  }

  function reviewUrl(a, scope) {
    return App.url('practice.html?bank=' + encodeURIComponent(a.bank) +
      '&mode=review&attempt=' + encodeURIComponent(a.id) + '&scope=' + scope);
  }

  /* ---------------- 渲染 ---------------- */

  function render() {
    document.title = bankTitle() ? bankTitle() + ' · 考试记录' : '考试记录';
    renderBanks();
    renderDetail();
    renderHistory();
    renderOverview();
    var clearBtn = qs('#clearBtn');
    if (clearBtn) clearBtn.disabled = bankAttempts().length === 0;
  }

  function renderBanks() {
    var box = qs('#scoreBanks');
    if (!box) return;
    box.innerHTML = '';
    var banks = allBanks();
    if (banks.length < 2) { box.style.display = 'none'; return; }
    box.style.display = '';

    banks.forEach(function (id) {
      var btn = App.ui.el('button', {
        type: 'button',
        class: 'score-filter' + (state.bank === id ? ' is-active' : ''),
        text: bankLabel(id)
      });
      btn.addEventListener('click', function () { switchBank(id); });
      box.appendChild(btn);
    });
  }

  function switchBank(id) {
    if (state.bank === id) return;
    state.bank = id;
    state.attempt = resolveAttempt('');
    updateUrl(state.bank, state.attempt);
    render();
    window.scrollTo(0, 0);
  }

  function renderDetail() {
    var box = qs('#scoreDetail');
    if (!box) return;
    box.innerHTML = '';

    var a = state.attempt;
    if (!a) {
      box.appendChild(App.ui.el('div', { class: 'score-detail__empty' }, [
        App.ui.el('p', { text: T.empty || '该题库还没有考试记录。' }),
        state.bank ? App.ui.el('a', {
          class: 'btn btn--primary score-detail__cta',
          href: App.url('bank.html?id=' + encodeURIComponent(state.bank)),
          text: T.emptyBtn || '去模拟考试'
        }) : null
      ].filter(Boolean)));
      return;
    }

    var score = scoreOf(a);
    var pass = a.pass > 0 ? a.correct >= a.pass : null;
    var wrong = wrongCount(a);
    var hasDetail = !!a.detail;

    box.appendChild(App.ui.el('div', { class: 'score-detail__head' }, [
      App.ui.el('div', { class: 'score-detail__bank', text: bankTitle() }),
      App.ui.el('div', { class: 'score-detail__date', text: fmtDate(a.at) })
    ]));

    box.appendChild(App.ui.el('div', { class: 'score-detail__value' }, [
      App.ui.el('span', { class: 'score-detail__num', text: String(score) }),
      App.ui.el('span', { class: 'score-detail__unit', text: '分' })
    ]));
    if (pass !== null) {
      box.appendChild(App.ui.el('span', {
        class: 'score-detail__badge ' + (pass ? 'is-pass' : 'is-fail'),
        text: pass ? (T.pass || '及格') : (T.fail || '未及格')
      }));
    }

    var meta = T.correct || '答对';
    box.appendChild(App.ui.el('div', { class: 'score-detail__meta', text: meta + ' ' + a.correct + ' / ' + a.total + ' 题 · ' + (T.used || '用时') + ' ' + fmtDuration(a.used) + ' · 本题库第 ' + attemptIndex(a) + ' 次' }));

    if (!hasDetail) {
      box.appendChild(App.ui.el('div', { class: 'score-detail__hint', text: T.noDetail || '该记录没有保存答题明细，无法回顾。' }));
    }

    var actions = App.ui.el('div', { class: 'score-actions' });

    actions.appendChild(App.ui.el('a', {
      class: 'btn btn--ghost',
      href: App.url('bank.html?id=' + encodeURIComponent(a.bank)),
      text: T.back || '返回'
    }));

    actions.appendChild(actionBtn(hasDetail, 'ghost', T.reviewAll || '逐题查看', reviewUrl(a, 'all'), T.noDetail || '无答题明细'));
    actions.appendChild(actionBtn(hasDetail && wrong > 0, 'primary', T.reviewWrong || '查看错题', reviewUrl(a, 'wrong'), wrong > 0 ? '' : (T.noWrong || '本次考试没有错题')));

    box.appendChild(actions);
  }

  /** 生成一个可点击或置灰的动作按钮。 */
  function actionBtn(enabled, variant, text, href, tip) {
    if (enabled) {
      return App.ui.el('a', { class: 'btn btn--' + variant, href: href, text: text });
    }
    return App.ui.el('span', { class: 'btn btn--' + variant + ' is-disabled', text: text, title: tip });
  }

  function renderHistory() {
    var box = qs('#scoreTable');
    var hint = qs('#historyHint');
    if (!box) return;

    var list = bankAttempts().slice().reverse();
    if (hint) hint.textContent = list.length ? '共 ' + list.length + ' 次 · 点击查看详情' : '';

    box.innerHTML = '';
    if (!list.length) {
      box.appendChild(App.ui.el('div', { class: 'score-table__empty' }, [
        App.ui.el('p', { text: T.emptyHistory || '该题库还没有考试记录。' })
      ]));
      return;
    }

    box.appendChild(App.ui.el('div', { class: 'score-table__head' }, [
      App.ui.el('span', { text: T.date || '日期' }),
      App.ui.el('span', { text: T.score || '得分' }),
      App.ui.el('span', { text: T.time || '用时' })
    ]));

    list.forEach(function (a) {
      var pass = a.pass > 0 ? a.correct >= a.pass : null;
      var cls = 'score-row' + (state.attempt && state.attempt.id === a.id ? ' is-active' : '');
      var scoreCls = pass === true ? ' is-pass' : (pass === false ? ' is-fail' : '');
      var row = App.ui.el('div', { class: cls }, [
        App.ui.el('span', { class: 'score-row__date', text: fmtDate(a.at) }),
        App.ui.el('span', {
          class: 'score-row__score' + scoreCls,
          text: String(scoreOf(a)),
          title: a.correct + ' / ' + a.total + (pass === null ? '' : (pass ? ' · 及格' : ' · 未及格'))
        }),
        App.ui.el('span', { class: 'score-row__time', text: fmtDuration(a.used) })
      ]);
      row.addEventListener('click', function () { selectAttempt(a); });
      box.appendChild(row);
    });
  }

  function selectAttempt(a) {
    if (state.attempt && state.attempt.id === a.id) return;
    state.attempt = a;
    updateUrl(state.bank, a);
    render();
    var el = qs('#scoreDetail');
    if (el && el.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function renderOverview() {
    var list = bankAttempts();
    var sec = qs('#scoreOverview');
    if (!sec) return;
    if (!list.length) { sec.hidden = true; return; }
    sec.hidden = false;

    var hint = qs('#scoreChartHint');
    if (hint) hint.textContent = list.length > 12 ? '最近 12 次' : '最近 ' + list.length + ' 次';

    renderRings(list);
    renderChart(list);
  }

  function renderRings(list) {
    var box = qs('#scoreRings');
    if (!box) return;
    box.innerHTML = '';

    var scores = list.map(scoreOf);
    var avg = null, best = null, latest = null;
    if (scores.length) {
      var sum = 0;
      scores.forEach(function (s) { sum += s; });
      avg = Math.round(sum / scores.length);
      best = Math.max.apply(null, scores);
      latest = scores[scores.length - 1];
    }

    var rings = [
      { label: T.average || '平均成绩', value: avg, color: '#2f6bff' },
      { label: T.best || '最好成绩', value: best, color: '#16b364' },
      { label: T.latest || '最新成绩', value: latest, color: '#38bdf8' }
    ];

    rings.forEach(function (r) {
      var pct = r.value == null ? 0 : Math.max(0, Math.min(100, r.value));
      var inner = [
        App.ui.el('span', { class: 'score-ring__num', text: r.value == null ? '—' : String(r.value) })
      ];
      if (r.value != null) inner.push(App.ui.el('span', { class: 'score-ring__unit', text: '分' }));

      box.appendChild(App.ui.el('div', { class: 'score-ring-wrap' }, [
        App.ui.el('div', {
          class: 'score-ring',
          style: '--pct:' + pct + ';--ring-color:' + r.color
        }, [App.ui.el('div', { class: 'score-ring__inner' }, inner)]),
        App.ui.el('span', { class: 'score-ring__label', text: r.label })
      ]));
    });
  }

  function renderChart(list) {
    var box = qs('#scoreChart');
    if (!box) return;
    box.innerHTML = '';
    drawChart(box, list.slice(-12));
  }

  /** 用原生 SVG 画「得分 + 用时」双折线，尺寸随容器宽度重绘。 */
  function drawChart(box, list) {
    var W = Math.max(240, box.clientWidth || 0);
    var H = 240;
    var pad = { l: 34, r: 16, t: 14, b: 30 };
    var plotW = W - pad.l - pad.r;
    var plotH = H - pad.t - pad.b;
    var n = list.length;

    function xAt(i) { return pad.l + (n === 1 ? plotW / 2 : plotW * i / (n - 1)); }
    function yAt(v) { return pad.t + plotH * (1 - Math.max(0, Math.min(100, v)) / 100); }

    var svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('width', W);
    svg.setAttribute('height', H);
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    svg.setAttribute('class', 'chart');
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', '考试成绩趋势：得分与用时');

    function add(tag, attrs, text) {
      var node = document.createElementNS(SVG_NS, tag);
      Object.keys(attrs || {}).forEach(function (k) { node.setAttribute(k, attrs[k]); });
      if (text != null) node.textContent = text;
      svg.appendChild(node);
      return node;
    }

    for (var v = 0; v <= 100; v += 20) {
      add('line', { x1: pad.l, y1: yAt(v), x2: W - pad.r, y2: yAt(v), class: 'chart-grid' });
      add('text', { x: pad.l - 8, y: yAt(v) + 4, 'text-anchor': 'end', class: 'chart-label' }, String(v));
    }

    var step = Math.max(1, Math.ceil(n / 5));
    list.forEach(function (a, i) {
      if (i % step !== 0 && i !== n - 1) return;
      var d = new Date(a.at);
      add('text', {
        x: xAt(i), y: H - 8, 'text-anchor': 'middle', class: 'chart-label'
      }, pad2(d.getMonth() + 1) + '.' + pad2(d.getDate()));
    });

    var scorePts = [];
    var timePts = [];
    list.forEach(function (a, i) {
      scorePts.push({ x: xAt(i), y: yAt(scoreOf(a)), a: a });
      timePts.push({ x: xAt(i), y: yAt(a.used / 60), a: a });
    });

    function line(points, cls) {
      if (points.length < 2) return;
      add('polyline', {
        points: points.map(function (p) {
          return p.x.toFixed(1) + ',' + p.y.toFixed(1);
        }).join(' '),
        class: 'chart-line ' + cls
      });
    }

    function dots(points, cls, isScore) {
      points.forEach(function (p) {
        var c = add('circle', { cx: p.x, cy: p.y, r: 4, class: 'chart-dot ' + cls });
        var tip = document.createElementNS(SVG_NS, 'title');
        tip.textContent = bankLabel(p.a.bank) + ' · ' + fmtDate(p.a.at) + ' · ' +
          (isScore ? '得分 ' + scoreOf(p.a) : '用时 ' + (p.a.used / 60).toFixed(1) + ' 分钟');
        c.appendChild(tip);
      });
    }

    line(scorePts, 'chart-line--score');
    line(timePts, 'chart-line--time');
    dots(scorePts, 'chart-dot--score', true);
    dots(timePts, 'chart-dot--time', false);

    box.appendChild(svg);
  }

  /* ---------------- 清空 ---------------- */

  function clearBank() {
    var list = bankAttempts();
    if (!list.length) { App.ui.toast(T.noClear || '暂无考试记录'); return; }
    App.ui.confirm(T.clearConfirm || '确定清空该题库的全部考试记录？', function () {
      App.records.clearAttempts(state.bank);
      state.all = App.records.attempts();

      // 清空后若当前题库已无记录，但还有别的题库记录，则跳到最近有记录的那个题库
      var stillHere = state.all.some(function (a) { return a.bank === state.bank; });
      if (!stillHere && state.all.length) state.bank = state.all[state.all.length - 1].bank;
      state.attempt = resolveAttempt('');

      updateUrl(state.bank, state.attempt);
      render();
      App.ui.toast(T.cleared || '已清空考试记录');
    });
  }
})(window);
