/**
 * store.js —— 存储读取层（唯一直接接触 localStorage 的模块）
 *
 * 职责：
 *  - 带命名空间、自动 JSON 序列化的键值读写；
 *  - 屏蔽 localStorage 的异常（隐私模式 / 空间不足），保证上层不因存储失败而崩溃。
 *
 * 为什么用 localStorage 而不是 cookie：
 *  - cookie 单条上限约 4KB 且每次请求都会发送（浪费带宽），localStorage 通常 5MB 且只在本地；
 *  - localStorage 满足“长期保存”需求，且不受 HTTP 请求影响，适合保存题量较大的作答记录。
 *
 * 接口：
 *   App.store.get(key[, fallback])  -> 反序列化后的值
 *   App.store.set(key, value)       -> boolean（是否写入成功）
 *   App.store.remove(key)
 *   App.store.keys(prefix)          -> 匹配前缀的键名列表（去掉命名空间前缀）
 */
(function (global) {
  'use strict';
  var App = global.App = global.App || {};

  var PREFIX = App.config.storagePrefix;

  App.store = {
    get: function (key, fallback) {
      if (fallback === undefined) fallback = null;
      try {
        var raw = global.localStorage.getItem(PREFIX + key);
        return raw === null ? fallback : JSON.parse(raw);
      } catch (e) {
        return fallback;
      }
    },

    set: function (key, value) {
      try {
        global.localStorage.setItem(PREFIX + key, JSON.stringify(value));
        return true;
      } catch (e) {
        return false;
      }
    },

    remove: function (key) {
      try { global.localStorage.removeItem(PREFIX + key); } catch (e) { /* 忽略 */ }
    },

    keys: function (prefix) {
      var out = [];
      try {
        for (var i = 0; i < global.localStorage.length; i++) {
          var k = global.localStorage.key(i);
          if (k && k.indexOf(PREFIX + prefix) === 0) out.push(k.slice(PREFIX.length));
        }
      } catch (e) { /* 忽略 */ }
      return out;
    }
  };
})(window);
