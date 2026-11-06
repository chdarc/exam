/**
 * records.js —— 业务处理层：作答记录 / 收藏 / 模拟考试成绩
 *
 * 每个题库单独一份作答记录，结构（仅保存最小必要信息）：
 *   {
 *     answer:   { "<题号>": "correct" | "wrong", ... },  // 每题当前作答状态
 *     favorite: ["<题号>", ...]                           // 收藏题号（按加入顺序）
 *   }
 *
 * 另有一份全局的模拟考试成绩记录（examapp:attempts），每次交卷追加一条，
 * 保存分数与答题明细（题号顺序 / 作答 / 选项顺序 / 判题结果），
 * 供「考试记录」页展示历史成绩、逐题回顾与错题回顾。
 *
 * 语义约定：
 *  - 答对：answer[qid] = "correct"（若此前为错题，自动从错题中消除）；
 *  - 答错：answer[qid] = "wrong"；
 *  - 收藏与对错相互独立。
 *
 * 接口：
 *   App.records.get(bankId)              -> 记录对象（总是返回可用结构）
 *   App.records.setAnswer(bankId, qid, correct)   -> 记录一次作答
 *   App.records.isWrong / isCorrect / isFavorite(bankId, qid) -> boolean
 *   App.records.toggleFavorite(bankId, qid)       -> 返回切换后是否“已收藏”
 *   App.records.wrongList / favoriteList(bankId)  -> 题号数组
 *   App.records.stats(bankId, total)     -> { total, correct, wrong, done }
 *   App.records.addAttempt(attempt)      -> 追加一次模拟考试成绩，返回规范化后的记录（含 id）
 *   App.records.attempts()               -> 全部成绩记录（按时间从旧到新）
 *   App.records.attempt(id)              -> 按 id 查找某次成绩（无则 null）
 *   App.records.clearAttempts(bankId?)   -> 清空全部（或仅指定题库）成绩记录
 *   App.records.clear(bankId)
 */
(function (global) {
  'use strict';
  var App = global.App = global.App || {};

  var ATTEMPTS_KEY = 'attempts';
  var ATTEMPTS_LIMIT = 300;

  function key(bankId) { return 'record.' + bankId; }

  function empty() { return { answer: {}, favorite: [] }; }

  function normalize(r) {
    if (!r || typeof r !== 'object') r = empty();
    if (!r.answer || typeof r.answer !== 'object') r.answer = {};
    if (!Array.isArray(r.favorite)) r.favorite = [];
    return r;
  }

  /** 校验并规范化一条成绩记录；字段不全时返回 null。 */
  function normalizeAttempt(a) {
    if (!a || typeof a !== 'object') return null;
    var bank = String(a.bank || '');
    var at = parseInt(a.at, 10);
    var correct = parseInt(a.correct, 10);
    var total = parseInt(a.total, 10);
    var used = parseInt(a.used, 10);
    if (!bank || !isFinite(at) || !isFinite(correct) || !isFinite(total) || total <= 0) return null;
    if (correct < 0) correct = 0;
    if (correct > total) correct = total;

    var ids = Array.isArray(a.ids) ? a.ids.map(function (id) { return String(id); }) : [];
    var answers = (a.answers && typeof a.answers === 'object' && !Array.isArray(a.answers)) ? a.answers : {};
    var order = (a.order && typeof a.order === 'object' && !Array.isArray(a.order)) ? a.order : {};
    var results = (a.results && typeof a.results === 'object' && !Array.isArray(a.results)) ? a.results : {};

    return {
      id: String(a.id || (bank + '.' + at)),
      bank: bank,
      at: at,
      correct: correct,
      total: total,
      used: isFinite(used) && used > 0 ? used : 0,
      pass: parseInt(a.pass, 10) || 0,
      ids: ids,
      answers: answers,
      order: order,
      results: results,
      detail: ids.length > 0
    };
  }

  App.records = {
    get: function (bankId) { return normalize(App.store.get(key(bankId))); },

    setAnswer: function (bankId, qid, correct) {
      var r = App.records.get(bankId);
      r.answer[String(qid)] = correct ? 'correct' : 'wrong';
      App.store.set(key(bankId), r);
      return r;
    },

    isWrong: function (bankId, qid) {
      return App.records.get(bankId).answer[String(qid)] === 'wrong';
    },

    isCorrect: function (bankId, qid) {
      return App.records.get(bankId).answer[String(qid)] === 'correct';
    },

    toggleFavorite: function (bankId, qid) {
      var r = App.records.get(bankId);
      var s = String(qid);
      var i = r.favorite.indexOf(s);
      if (i >= 0) r.favorite.splice(i, 1);
      else r.favorite.push(s);
      App.store.set(key(bankId), r);
      return i < 0; // 返回是否已收藏
    },

    isFavorite: function (bankId, qid) {
      return App.records.get(bankId).favorite.indexOf(String(qid)) >= 0;
    },

    wrongList: function (bankId) {
      var r = App.records.get(bankId);
      return Object.keys(r.answer).filter(function (q) { return r.answer[q] === 'wrong'; });
    },

    favoriteList: function (bankId) {
      return App.records.get(bankId).favorite.slice();
    },

    stats: function (bankId, total) {
      var r = App.records.get(bankId);
      var correct = 0, wrong = 0;
      Object.keys(r.answer).forEach(function (q) {
        if (r.answer[q] === 'correct') correct++;
        else if (r.answer[q] === 'wrong') wrong++;
      });
      return { total: total, correct: correct, wrong: wrong, done: correct + wrong };
    },

    /** 追加一次模拟考试成绩；字段不全时忽略。返回规范化后的记录（含生成的 id）。 */
    addAttempt: function (attempt) {
      if (!attempt || typeof attempt !== 'object') return null;
      if (!attempt.id) attempt.id = 'a' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      var a = normalizeAttempt(attempt);
      if (!a) return null;
      var list = App.records.attempts();
      list.push(a);
      if (list.length > ATTEMPTS_LIMIT) list = list.slice(list.length - ATTEMPTS_LIMIT);
      App.store.set(ATTEMPTS_KEY, list);
      return a;
    },

    /** 全部成绩记录，按时间从旧到新（便于直接画趋势）；数据结构损坏时自动跳过。 */
    attempts: function () {
      var raw = App.store.get(ATTEMPTS_KEY);
      if (!Array.isArray(raw)) return [];
      var list = [];
      for (var i = 0; i < raw.length; i++) {
        var a = normalizeAttempt(raw[i]);
        if (a) list.push(a);
      }
      list.sort(function (x, y) { return x.at - y.at; });
      if (list.length > ATTEMPTS_LIMIT) list = list.slice(list.length - ATTEMPTS_LIMIT);
      return list;
    },

    /** 按 id 查找某次成绩记录（无则 null）。 */
    attempt: function (id) {
      var key = String(id);
      var list = App.records.attempts();
      for (var i = 0; i < list.length; i++) {
        if (list[i].id === key) return list[i];
      }
      return null;
    },

    /** 清空成绩记录：不传 bankId 清空全部；传入则仅清空该题库。 */
    clearAttempts: function (bankId) {
      if (!bankId) { App.store.remove(ATTEMPTS_KEY); return; }
      var list = App.records.attempts().filter(function (a) { return a.bank !== bankId; });
      if (list.length) App.store.set(ATTEMPTS_KEY, list);
      else App.store.remove(ATTEMPTS_KEY);
    },

    clear: function (bankId) { App.store.remove(key(bankId)); },

    clearFavorites: function (bankId) {
      var r = App.records.get(bankId);
      r.favorite = [];
      App.store.set(key(bankId), r);
    },

    clearWrong: function (bankId) {
      var r = App.records.get(bankId);
      Object.keys(r.answer).forEach(function (q) {
        if (r.answer[q] === 'wrong') delete r.answer[q];
      });
      App.store.set(key(bankId), r);
    }
  };
})(window);
