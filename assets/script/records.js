/**
 * records.js —— 业务处理层：作答记录 / 收藏
 *
 * 每个题库单独一份记录，结构（仅保存最小必要信息）：
 *   {
 *     answer:   { "<题号>": "correct" | "wrong", ... },  // 每题当前作答状态
 *     favorite: ["<题号>", ...]                           // 收藏题号（按加入顺序）
 *   }
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
 *   App.records.clear(bankId)
 */
(function (global) {
  'use strict';
  var App = global.App = global.App || {};

  function key(bankId) { return 'record.' + bankId; }

  function empty() { return { answer: {}, favorite: [] }; }

  function normalize(r) {
    if (!r || typeof r !== 'object') r = empty();
    if (!r.answer || typeof r.answer !== 'object') r.answer = {};
    if (!Array.isArray(r.favorite)) r.favorite = [];
    return r;
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
