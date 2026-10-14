/**
 * session.js —— 业务处理层：刷题会话构建与判题
 *
 * 职责（纯逻辑，不触碰 DOM、不直接读写存储）：
 *  - 按模式生成题目顺序列表（顺序 / 乱序 / 模拟考试 / 错题 / 收藏）；
 *  - 选项键（A、B、C…）生成；
 *  - 判题与模拟考试批量评分。
 *
 * 接口：
 *   App.session.MODES                       -> 支持的刷题模式数组
 *   App.session.shuffle(arr)                -> 返回打乱后的副本
 *   App.session.optionKeys(count)           -> ['A','B',...]
 *   App.session.buildIds(bank, mode, n)     -> 题目 id 顺序列表
 *   App.session.check(question, userAnswer) -> boolean（是否答对）
 *   App.session.gradeExam(questions, answers) -> { correct, total, results }
 */
(function (global) {
  'use strict';
  var App = global.App = global.App || {};

  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function optionKeys(count) {
    var keys = [];
    for (var i = 0; i < count; i++) {
      var n = i, s = '';
      do {
        s = String.fromCharCode(65 + (n % 26)) + s;
        n = Math.floor(n / 26) - 1;
      } while (n >= 0);
      keys.push(s);
    }
    return keys;
  }

  function normArray(x) { return Array.isArray(x) ? x.slice().sort() : []; }

  App.session = {
    MODES: ['sequential', 'random', 'exam', 'wrong', 'favorite'],

    shuffle: shuffle,
    optionKeys: optionKeys,

    buildIds: function (bank, mode, examCount) {
      var ids = (bank.questions || []).map(function (q) { return String(q.id); });
      if (mode === 'sequential') return ids;
      if (mode === 'random') return shuffle(ids);
      if (mode === 'exam') {
        var a = shuffle(ids);
        var n = examCount > 0 ? Math.min(examCount, a.length) : a.length;
        return a.slice(0, n);
      }
      if (mode === 'wrong') return App.records.wrongList(bank.id);
      if (mode === 'favorite') return App.records.favoriteList(bank.id);
      return ids;
    },

    check: function (question, userAnswer) {
      if (question.type === 'multiple') {
        var ans = normArray(question.answer);
        var u = normArray(userAnswer);
        if (ans.length === 0 || ans.length !== u.length) return false;
        for (var i = 0; i < ans.length; i++) if (ans[i] !== u[i]) return false;
        return true;
      }
      return String(userAnswer == null ? '' : userAnswer) === String(question.answer == null ? '' : question.answer);
    },

    gradeExam: function (questions, answers) {
      var correct = 0;
      var results = questions.map(function (q) {
        // 主观题不自动判分
        var ok = q.type === 'subjective' ? null : App.session.check(q, answers[String(q.id)]);
        if (ok === true) correct++;
        return { q: q, ok: ok };
      });
      var scored = results.filter(function (r) { return r.ok !== null; }).length;
      return { correct: correct, total: scored, questionCount: questions.length, results: results };
    }
  };
})(window);
