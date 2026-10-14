/**
 * ui/practice.js —— 刷题页（做题页面）
 *
 * 支持模式：顺序 / 乱序 / 模拟考试 / 错题 / 收藏。
 *  - 普通模式：作答后立即判题并记录（对错、错题消除）；
 *  - 考试模式：先作答（可自由跳转），倒计时结束后或手动交卷统一评分。
 *
 * 依赖：App.session（会话构建与判题）、App.records（记录）、App.ui.renderQuestion（渲染）。
 */
(function (global) {
  'use strict';
  var App = global.App = global.App || {};

  function qs(sel) { return document.querySelector(sel); }

  var state = {
    bank: null,
    byId: {},
    mode: 'sequential',
    ids: [],
    index: 0,
    answers: {},   // 题号 -> 用户作答（单选:'A' / 多选:['A','C'] / 主观:'文本'）
    results: {},   // 题号 -> { ok: boolean|null }
    selfMark: {},  // 题号 -> boolean（主观题待自评）
    exam: { active: false, submitted: false, remain: 0, timerId: null }
  };

  App.ready(function () {
    var root = qs('[data-page="practice"]');
    if (!root) return;

    var bankId = App.util.getParam('bank');
    var mode = App.util.getParam('mode') || 'sequential';
    if (App.session.MODES.indexOf(mode) < 0) mode = 'sequential';
    state.mode = mode;
    state.exam.active = (mode === 'exam');
    var examCount = App.util.getIntParam('count', 0);
    var jumpId = App.util.getParam('q');

    bindStatic();

    App.data.getBank(bankId).then(function (bank) {
      state.bank = bank;
      document.title = bank.title + ' · 刷题';
      (bank.questions || []).forEach(function (q) { state.byId[String(q.id)] = q; });

      state.ids = App.session.buildIds(bank, mode, examCount);

      if (state.exam.active) {
        var dur = (bank.exam && bank.exam.duration) ? bank.exam.duration : App.config.defaultExamDuration;
        state.exam.remain = dur;
        startTimer();
      }

      if (jumpId) jumpToId(jumpId);
      render();
    }).catch(function (err) {
      App.ui.toast('题库加载失败：' + err.message);
    });
  });

  /* ---------------- 事件绑定 ---------------- */

  function bindStatic() {
    qs('#exitBtn').addEventListener('click', function () {
      location.href = App.url('bank.html?id=' + encodeURIComponent(state.bank ? state.bank.id : App.util.getParam('bank')));
    });
    qs('#prevBtn').addEventListener('click', prev);
    qs('#nextBtn').addEventListener('click', next);
    qs('#jumpBtn').addEventListener('click', doJump);
    qs('#jumpInput').addEventListener('keydown', function (e) { if (e.key === 'Enter') doJump(); });
    qs('#favBtn').addEventListener('click', toggleFav);
    qs('#closeSummary').addEventListener('click', closeSummary);
    qs('#summaryBack').addEventListener('click', function () {
      location.href = App.url('bank.html?id=' + encodeURIComponent(state.bank.id));
    });
    qs('#summaryReview').addEventListener('click', closeSummary);
  }

  /* ---------------- 状态查询 ---------------- */

  function findQuestion(qid) { return state.byId[String(qid)]; }
  function currentQ() { return findQuestion(state.ids[state.index]); }

  function isEmpty() { return state.ids.length === 0; }

  /* ---------------- 导航 ---------------- */

  function prev() { if (state.index > 0) { state.index--; render(); } }
  function next() { if (state.index < state.ids.length - 1) { state.index++; render(); } }

  function jumpToId(qid) {
    var pos = state.ids.indexOf(String(qid));
    if (pos >= 0) state.index = pos;
  }

  function doJump() {
    var input = qs('#jumpInput');
    var v = (input.value || '').trim();
    if (!v) { App.ui.toast('请输入题号'); return; }
    var pos = state.ids.indexOf(v);
    if (pos >= 0) { state.index = pos; render(); return; }
    var n = parseInt(v, 10);
    if (!isNaN(n) && n >= 1 && n <= state.ids.length) { state.index = n - 1; render(); return; }
    App.ui.toast('未找到该题号');
  }

  function toggleFav() {
    var q = currentQ(); if (!q) return;
    var fav = App.records.toggleFavorite(state.bank.id, q.id);
    renderFav();
    App.ui.toast(fav ? '已收藏' : '已取消收藏');
  }

  /* ---------------- 渲染 ---------------- */

  function render() {
    renderTop();
    renderNav();
    if (isEmpty()) { renderEmpty(); return; }
    renderMeta();
    renderCard();
  }

  function renderTop() {
    qs('#bankTitle').textContent = state.bank ? state.bank.title : '';
    var right = qs('#rightBox');
    right.innerHTML = '';
    if (state.exam.active) {
      if (state.exam.submitted) {
        right.appendChild(App.ui.el('span', { class: 'topbar__hint', text: '已交卷' }));
      } else {
        var timer = App.ui.el('span', { class: 'timer' + (state.exam.remain <= 60 ? ' timer--warn' : ''), text: formatTime(state.exam.remain) });
        var btn = App.ui.el('button', { class: 'btn btn--primary btn--sm', text: '交卷' });
        btn.addEventListener('click', submitExam);
        right.appendChild(timer);
        right.appendChild(btn);
      }
    } else {
      right.appendChild(App.ui.el('span', { class: 'topbar__hint', text: state.ids.length ? (state.index + 1) + ' / ' + state.ids.length : '0 / 0' }));
    }
  }

  function renderNav() {
    qs('#prevBtn').disabled = state.index <= 0;
    qs('#nextBtn').disabled = state.index >= state.ids.length - 1;
  }

  function renderMeta() {
    var q = currentQ(); if (!q) return;
    qs('#qId').textContent = '#' + q.id;
    qs('#qBrief').textContent = q.brief || '';
    renderFav();
  }

  function renderFav() {
    var q = currentQ(); if (!q) return;
    var fav = App.records.isFavorite(state.bank.id, q.id);
    qs('#favBtn').textContent = fav ? '★' : '☆';
    qs('#favBtn').classList.toggle('is-fav', fav);
  }

  function renderEmpty() {
    qs('#qCard').innerHTML = '';
    var msg = state.mode === 'wrong' ? '暂无错题，去刷几道题吧！'
      : state.mode === 'favorite' ? '暂无收藏题目，点题目右侧 ☆ 收藏。'
      : '该题库暂无题目。';
    qs('#qCard').appendChild(App.ui.el('div', { class: 'empty', text: msg }));
    qs('#jumpInput').disabled = true;
  }

  function renderCard() {
    var q = currentQ(); if (!q) return;
    var isExam = state.exam.active;
    App.ui.renderQuestion({
      container: qs('#qCard'),
      bank: state.bank,
      q: q,
      value: state.answers[q.id],
      result: state.results[q.id] || null,
      selfMark: !!state.selfMark[q.id],
      onSingle: isExam ? examSingle : grade,
      onMultipleChange: isExam ? examMultipleChange : normalMultipleChange,
      onMultipleSubmit: isExam ? examMultipleSubmit : grade,
      onSubjectiveChange: isExam ? examSubjectiveChange : function () {},
      onSubjectiveSubmit: isExam ? examSubjectiveSubmit : submitSubjective,
      onSelfMark: selfMark
    });
  }

  /* ---------------- 普通模式：作答即判题 ---------------- */

  function grade(value) {
    var q = currentQ(); if (!q) return;
    state.answers[q.id] = value;
    var ok = App.session.check(q, value);
    state.results[q.id] = { ok: ok };
    App.records.setAnswer(state.bank.id, q.id, ok);
    renderCard();
  }

  function normalMultipleChange(keys) {
    var q = currentQ(); if (!q) return;
    state.answers[q.id] = keys;
    renderCard();
  }

  function submitSubjective(text) {
    var q = currentQ(); if (!q) return;
    state.answers[q.id] = text;
    state.selfMark[q.id] = true;
    renderCard();
  }

  function selfMark(ok) {
    var q = currentQ(); if (!q) return;
    state.selfMark[q.id] = false;
    state.results[q.id] = { ok: ok };
    App.records.setAnswer(state.bank.id, q.id, ok);
    renderCard();
  }

  /* ---------------- 考试模式：保存作答，交卷后评分 ---------------- */

  function examSingle(key) { var q = currentQ(); if (!q) return; state.answers[q.id] = key; renderCard(); }
  function examMultipleChange(keys) { var q = currentQ(); if (!q) return; state.answers[q.id] = keys; renderCard(); }
  function examMultipleSubmit(keys) { var q = currentQ(); if (!q) return; state.answers[q.id] = keys; App.ui.toast('已保存作答'); }
  function examSubjectiveChange(text) { var q = currentQ(); if (!q) return; state.answers[q.id] = text; }
  function examSubjectiveSubmit(text) { var q = currentQ(); if (!q) return; state.answers[q.id] = text; App.ui.toast('已保存作答'); }

  /* ---------------- 计时与交卷 ---------------- */

  function formatTime(s) {
    s = Math.max(0, Math.floor(s));
    var h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    function p(n) { return (n < 10 ? '0' : '') + n; }
    return (h ? p(h) + ':' : '') + p(m) + ':' + p(sec);
  }

  function startTimer() {
    if (state.exam.timerId) return;
    state.exam.timerId = setInterval(function () {
      if (state.exam.submitted) return;
      state.exam.remain--;
      if (state.exam.remain <= 0) { state.exam.remain = 0; submitExam(); return; }
      var el = qs('#rightBox .timer');
      if (el) {
        el.textContent = formatTime(state.exam.remain);
        el.classList.toggle('timer--warn', state.exam.remain <= 60);
      }
    }, 1000);
  }

  function submitExam() {
    if (state.exam.submitted) return;
    state.exam.submitted = true;
    if (state.exam.timerId) { clearInterval(state.exam.timerId); state.exam.timerId = null; }

    var questions = state.ids.map(findQuestion).filter(Boolean);
    var g = App.session.gradeExam(questions, state.answers);

    g.results.forEach(function (r) {
      state.results[r.q.id] = { ok: r.ok };
      if (r.ok !== null) App.records.setAnswer(state.bank.id, r.q.id, r.ok);
    });

    showSummary(g);
    render();
  }

  function showSummary(g) {
    qs('#summaryScore').textContent = g.correct + ' / ' + g.total;
    qs('#summaryNote').textContent = (g.questionCount - g.total > 0)
      ? '另有 ' + (g.questionCount - g.total) + ' 道主观题，请对照参考答案自行判断。' : '';

    var list = qs('#summaryList');
    list.innerHTML = '';
    g.results.forEach(function (r) {
      var cls = r.ok === null ? 'summary-item--subj' : (r.ok ? 'summary-item--ok' : 'summary-item--bad');
      var resHtml = r.ok === null ? '主观题' : (r.ok ? '&#10003; 对' : '&#10007; 错 · ' + App.ui.formatAnswer(r.q));
      var row = App.ui.el('div', { class: 'summary-item ' + cls }, [
        App.ui.el('span', { class: 'summary-item__id', text: '#' + r.q.id }),
        App.ui.el('span', { class: 'summary-item__brief', text: r.q.brief || '' }),
        App.ui.el('span', { class: 'summary-item__res', html: resHtml })
      ]);
      row.addEventListener('click', function () { closeSummary(); jumpToId(String(r.q.id)); render(); });
      list.appendChild(row);
    });

    qs('#summaryOverlay').classList.add('is-open');
  }

  function closeSummary() {
    qs('#summaryOverlay').classList.remove('is-open');
  }
})(window);
