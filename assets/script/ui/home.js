/**
 * ui/home.js —— 门户首页（封面 + 目录）
 *
 * 封面文案已直接写在 index.html 中（便于修改）；本模块只负责：
 *  - 下滑箭头平滑滚动到目录；
 *  - 从题库信息页返回（#catalog）时直接定位到目录区；
 *  - 从 banks/catalog.json 渲染目录列表。
 */
(function (global) {
  'use strict';
  var App = global.App = global.App || {};

  function qs(sel) { return document.querySelector(sel); }

  App.ready(function () {
    var root = qs('[data-page="home"]');
    if (!root) return;

    var arrow = qs('#coverArrow');
    if (arrow) {
      arrow.addEventListener('click', function () {
        var target = qs('#catalogSection');
        if (target) target.scrollIntoView({ behavior: 'smooth' });
      });
    }

    // 从题库信息页“返回”时（index.html#catalog）直接定位到目录区
    if (location.hash === '#catalog') {
      var section = qs('#catalogSection');
      if (section) section.scrollIntoView({ block: 'start' });
    }

    App.data.getCatalog().then(function (catalog) {
      renderCatalog(catalog.lists || []);
    }).catch(function (err) {
      App.ui.toast('目录加载失败：' + err.message);
    });
  });

  function renderCatalog(lists) {
    var wrap = qs('#catalog');
    if (!wrap) return;
    wrap.innerHTML = '';

    if (!lists.length) {
      wrap.appendChild(App.ui.el('div', {
        class: 'empty',
        text: (App.site && App.site.empty && App.site.empty.home) || '暂无题库，请先在 banks/catalog.json 中配置。'
      }));
      return;
    }

    lists.forEach(function (list) {
      var section = App.ui.el('section', { class: 'list' }, [
        App.ui.el('h2', { class: 'list__title', text: list.title || '未命名分类' })
      ]);

      (list.banks || []).forEach(function (b) {
        var badge = b.badge || (b.id === 'all' ? '总' : String(b.id).toUpperCase());
        var card = App.ui.el('a', { class: 'bank-item', href: App.url('bank.html?id=' + encodeURIComponent(b.id)) }, [
          App.ui.el('span', { class: 'bank-item__badge', text: badge }),
          App.ui.el('div', { class: 'bank-item__main' }, [
            App.ui.el('div', { class: 'bank-item__title', text: b.title || b.id }),
            App.ui.el('div', { class: 'bank-item__brief', text: b.brief || '' })
          ]),
          App.ui.el('div', { class: 'bank-item__meta' }, [
            App.ui.el('span', { class: 'bank-item__count', text: b.count != null ? b.count + ' 题' : '' }),
            App.ui.el('span', { class: 'bank-item__go', html: '&#8250;' })
          ])
        ]);
        section.appendChild(card);
      });

      wrap.appendChild(section);
    });
  }
})(window);
