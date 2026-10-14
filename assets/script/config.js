/**
 * config.js —— 全局配置与路径基准
 *
 * 职责：
 *  1. 通过当前脚本的真实地址反推“站点根路径”，支持部署在任意子目录（如 https://xxx.cn/exam/）。
 *  2. 提供统一的 URL 拼接工具 App.url()，所有资源加载、页面跳转都经由它，保证相对路径正确。
 *  3. 提供 App.ready() DOM 就绪辅助。
 *
 * 说明：本文件必须最先加载（后续模块依赖 App.config / App.url）。
 */
(function (global) {
  'use strict';

  var base = './';

  // 例：https://xxx.cn/exam/assets/script/config.js?v=1  =>  https://xxx.cn/exam/
  var cur = document.currentScript;
  if (cur && cur.src) {
    var marker = 'assets/script/config.js';
    var idx = cur.src.indexOf(marker);
    if (idx >= 0) base = cur.src.slice(0, idx);
  }

  var App = global.App = global.App || {};

  App.config = {
    base: base,                             // 站点根路径（以 / 结尾）
    storagePrefix: 'examapp:',              // 本地存储键名前缀（见 store.js）
    catalogPath: 'banks/catalog.json',      // 题库总目录（相对站点根）
    bankDir: 'banks',                       // 题库文件夹名
    defaultExamDuration: 30 * 60,           // 模拟考试默认时长（秒）
    version: '1.0.0'
  };

  /** 把“相对站点根”的路径拼成完整地址；已是绝对地址时原样返回。 */
  App.url = function (rel) {
    if (/^([a-z][a-z0-9+.-]*:)?\/\//i.test(rel) || rel.charAt(0) === '/') return rel;
    return base + rel;
  };

  /** URL 查询参数工具。 */
  App.util = {
    getParam: function (name) {
      var m = new RegExp('[?&]' + name + '=([^&]*)').exec(location.search);
      return m ? decodeURIComponent(m[1]) : '';
    },
    getIntParam: function (name, fallback) {
      var n = parseInt(App.util.getParam(name), 10);
      return isNaN(n) ? fallback : n;
    }
  };

  /** DOM 就绪后执行 fn（脚本位于 </body> 前时通常已就绪）。 */
  App.ready = function (fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else {
      fn();
    }
  };
})(window);
