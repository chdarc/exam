/**
 * data.js —— 数据读取层（题库文件加载与缓存）
 *
 * 职责：
 *  - 拉取并解析题库总目录 catalog.json 与单个题库 info.json；
 *  - 内存缓存，避免重复请求；
 *  - 统一注入题库的 base 目录，供解析题库内相对资源地址使用。
 *
 * 接口：
 *   App.data.fetchJSON(url)        -> Promise<对象>
 *   App.data.getCatalog()          -> Promise<总目录>
 *   App.data.getBank(id)           -> Promise<题库（含 id 与 _base）>
 *   App.data.mediaUrl(bank, src)   -> 把题库内相对资源地址解析为完整地址
 */
(function (global) {
  'use strict';
  var App = global.App = global.App || {};

  var cache = {}; // url -> 解析结果

  App.data = {
    fetchJSON: function (url) {
      if (cache[url]) return Promise.resolve(cache[url]);
      return fetch(url, { cache: 'default' })
        .then(function (res) {
          if (!res.ok) throw new Error('HTTP ' + res.status + ' 加载失败: ' + url);
          return res.json();
        })
        .then(function (data) {
          cache[url] = data;
          return data;
        });
    },

    getCatalog: function () {
      return App.data.fetchJSON(App.url(App.config.catalogPath));
    },

    getBank: function (id) {
      var dir = App.config.bankDir + '/' + encodeURIComponent(id);
      var url = App.url(dir + '/info.json');
      return App.data.fetchJSON(url).then(function (bank) {
        bank.id = id;
        bank._base = App.config.base + dir + '/';
        return bank;
      });
    },

    mediaUrl: function (bank, src) {
      if (!src) return '';
      if (/^([a-z][a-z0-9+.-]*:)?\/\//i.test(src) || src.charAt(0) === '/') return src;
      return bank._base + src;
    }
  };
})(window);
