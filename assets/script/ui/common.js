/**
 * ui/common.js —— 显示交互层：跨页面共用的渲染与工具函数
 *
 * 职责：
 *  - DOM 创建 / HTML 转义 / 题型文案等纯展示工具；
 *  - 题目卡片渲染（题干、附加题干、选项、作答区、反馈），
 *    供 practice.js 复用（普通模式与考试模式共用）；
 *  - 轻提示、确认弹窗。
 *
 * 接口：
 *   App.ui.h(str)                    -> HTML 转义
 *   App.ui.el(tag, attrs, children)  -> 创建 DOM 节点
 *   App.ui.typeMeta(type)            -> { label, cls }
 *   App.ui.formatAnswer(q)           -> 把正确答案渲染为可读文本（含 HTML）
 *   App.ui.renderMedia(bank, list)   -> 渲染附加题干，返回容器元素
 *   App.ui.renderQuestion(opts)      -> 渲染题目卡片（见下方 opts 说明）
 *   App.ui.confirm(message, onOk)    -> 确认弹窗
 *   App.ui.toast(msg)                -> 轻提示
 */
(function (global) {
  'use strict';
  var App = global.App = global.App || {};

  var TYPE_META = {
    single:     { label: '单选', cls: 'chip--single' },
    multiple:   { label: '多选', cls: 'chip--multiple' },
    subjective: { label: '主观', cls: 'chip--subjective' }
  };

  var T = (App.site && App.site.ui) || {};

  App.ui = App.ui || {};

  /* ---------- 基础工具 ---------- */

  App.ui.h = function (s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  };

  App.ui.el = function (tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        var v = attrs[k];
        if (v == null || v === false) return;
        if (k === 'class') node.className = v;
        else if (k === 'html') node.innerHTML = v;
        else if (k === 'text') node.textContent = v;
        else if (k.indexOf('on') === 0 && typeof v === 'function') node.addEventListener(k.slice(2), v);
        else node.setAttribute(k, v);
      });
    }
    (children || []).forEach(function (c) {
      node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    });
    return node;
  };

  App.ui.typeMeta = function (type) { return TYPE_META[type] || { label: '未知', cls: '' }; };

  App.ui.toast = function (msg) {
    var t = App.ui.el('div', { class: 'toast', text: msg });
    document.body.appendChild(t);
    setTimeout(function () { t.classList.add('toast--show'); }, 10);
    setTimeout(function () {
      t.classList.remove('toast--show');
      setTimeout(function () { t.parentNode && t.parentNode.removeChild(t); }, 300);
    }, 1800);
  };

  /** 确认弹窗：message 为提示文字，onOk 在用户点击“确定”后调用。 */
  App.ui.confirm = function (message, onOk) {
    var overlay = App.ui.el('div', { class: 'overlay' });
    var modal = App.ui.el('div', { class: 'modal modal--confirm' }, [
      App.ui.el('div', { class: 'modal__body', text: message }),
      App.ui.el('div', { class: 'modal__actions' }, [
        App.ui.el('button', { class: 'btn btn--ghost', type: 'button', text: T.cancel || '取消', onclick: close }),
        App.ui.el('button', { class: 'btn btn--danger', type: 'button', text: T.confirm || '确定', onclick: ok })
      ])
    ]);

    function close() { overlay.parentNode && overlay.parentNode.removeChild(overlay); }
    function ok() { close(); if (onOk) onOk(); }

    overlay.appendChild(modal);
    overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });
    document.body.appendChild(overlay);
    requestAnimationFrame(function () { overlay.classList.add('is-open'); });
  };

  /* ---------- 题目渲染 ---------- */

  function optionText(q, key) {
    var opts = q.options || [];
    var i = App.session.optionKeys(opts.length).indexOf(key);
    return opts[i] != null ? opts[i] : '';
  }

  /** 把正确答案转成可读文本（用于反馈、答题卡） */
  App.ui.formatAnswer = function (q) {
    if (q.type === 'subjective') return App.ui.h(q.answer || '（无参考答案）');
    if (q.type === 'multiple') {
      return (q.answer || []).map(function (k) { return App.ui.h(k); }).join('、');
    }
    var txt = optionText(q, q.answer);
    return App.ui.h(q.answer) + (txt ? ' · ' + App.ui.h(txt) : '');
  };

  /** 渲染附加题干（图片自动展示 / 文件下载 / 音频 / 视频），返回容器 */
  App.ui.renderMedia = function (bank, media) {
    var box = App.ui.el('div', { class: 'q-media' });
    (media || []).forEach(function (m) {
      var url = App.data.mediaUrl(bank, m.src);
      if (!url) return;
      if (m.type === 'image') {
        box.appendChild(App.ui.el('figure', { class: 'media media--image' }, [
          App.ui.el('img', { src: url, alt: m.alt || '', loading: 'lazy' }),
          m.alt ? App.ui.el('figcaption', { text: m.alt }) : null
        ].filter(Boolean)));
      } else if (m.type === 'file') {
        box.appendChild(App.ui.el('a', {
          class: 'media media--file', href: url, download: m.label || '', target: '_blank', rel: 'noopener'
        }, [
          App.ui.el('span', { class: 'media__icon', html: '&#8681;' }),
          App.ui.el('span', { text: m.label || (T.download || '下载附件') })
        ]));
      } else if (m.type === 'audio') {
        box.appendChild(App.ui.el('div', { class: 'media media--audio' }, [
          App.ui.el('audio', { src: url, controls: 'controls', preload: 'metadata' })
        ]));
      } else if (m.type === 'video') {
        box.appendChild(App.ui.el('div', { class: 'media media--video' }, [
          App.ui.el('video', { src: url, controls: 'controls', preload: 'metadata' })
        ]));
      }
    });
    return box;
  };

  /**
   * 渲染题目卡片。
   * opts: {
   *   container,            // 渲染目标节点
   *   bank, q,              // 题库与题目
   *   mode,                 // 'normal' | 'exam'
   *   value,                // 当前已保存作答（单选:'A' / 多选:['A','C'] / 主观:'文本'）
   *   order,                // 选项展示顺序（原选项索引数组，可选；缺省按原顺序）
   *   result,               // null | { ok: boolean } —— 非空时展示反馈并锁定
   *   selfMark,             // boolean —— 主观题“提交后待自评”状态
   *   onSingle(key),        // 单选点击（normal 模式=判题，exam 模式=保存）
   *   onMultipleChange(keys), onMultipleSubmit(keys),
   *   onSubjectiveSubmit(text), onSelfMark(ok)   // 主观题自评
   * }
   */
  App.ui.renderQuestion = function (opts) {
    var c = opts.container;
    c.innerHTML = '';

    var meta = App.ui.typeMeta(opts.q.type);
    c.appendChild(App.ui.el('div', { class: 'q-chip ' + meta.cls, text: meta.label }));

    c.appendChild(App.ui.el('div', { class: 'q-stem', html: App.ui.h(opts.q.stem) }));

    // 附加题干
    if (opts.q.media && opts.q.media.length) {
      c.appendChild(App.ui.renderMedia(opts.bank, opts.q.media));
    }

    // 作答区
    if (opts.q.type === 'subjective') {
      c.appendChild(renderSubjective(opts));
    } else {
      c.appendChild(renderOptions(opts));
    }

    // 反馈区
    if (opts.selfMark) {
      c.appendChild(renderSelfMark(opts));
    } else if (opts.result) {
      c.appendChild(renderFeedback(opts.q, opts.result.ok));
    }
  };

  function renderOptions(opts) {
    var q = opts.q;
    var multi = q.type === 'multiple';
    var optTexts = q.options || [];
    var keys = App.session.optionKeys(optTexts.length);

    // 选项展示顺序：默认原顺序；可传入打乱后的“原索引”数组
    var order = opts.order;
    if (!order || order.length !== optTexts.length) {
      order = [];
      for (var k = 0; k < optTexts.length; k++) order.push(k);
    }

    var selected = multi
      ? (Array.isArray(opts.value) ? opts.value : [])
      : (opts.value != null ? [String(opts.value)] : []);

    var locked = !!opts.result; // 判题后锁定
    var wrap = App.ui.el('div', { class: 'q-options' });

    order.forEach(function (oi) {
      var key = keys[oi];
      var text = optTexts[oi];
      var isOn = selected.indexOf(key) >= 0;
      var cls = ['opt', multi ? 'opt--multiple' : 'opt--single'];
      if (isOn) cls.push('is-selected');
      if (locked) {
        var correctKeys = multi ? (q.answer || []) : [q.answer];
        if (correctKeys.indexOf(key) >= 0) cls.push('is-correct');
        else if (isOn) cls.push('is-wrong');
        cls.push('is-locked');
      }
      var btn = App.ui.el('button', { class: cls.join(' '), type: 'button', 'data-key': key }, [
        App.ui.el('span', { class: 'opt__key' + (multi ? ' opt__key--square' : ' opt__key--circle'), text: key }),
        App.ui.el('span', { class: 'opt__text', html: App.ui.h(text) })
      ]);
      if (!locked) {
        btn.addEventListener('click', function () {
          if (multi) {
            var sel = selected.slice();
            var p = sel.indexOf(key);
            if (p >= 0) sel.splice(p, 1); else sel.push(key);
            sel.sort(function (a, b) { return keys.indexOf(a) - keys.indexOf(b); });
            if (opts.onMultipleChange) opts.onMultipleChange(sel);
          } else if (opts.onSingle) {
            opts.onSingle(key);
          }
        });
      }
      wrap.appendChild(btn);
    });

    // 多选：确定键
    if (multi && !locked) {
      var confirmBtn = App.ui.el('button', { class: 'btn btn--primary q-options__confirm', type: 'button', text: T.confirm || '确定' });
      confirmBtn.addEventListener('click', function () {
        if (opts.onMultipleSubmit) opts.onMultipleSubmit(selected.slice());
      });
      wrap.appendChild(App.ui.el('div', { class: 'q-options__actions' }, [confirmBtn]));
    }
    return wrap;
  }

  function renderSubjective(opts) {
    var wrap = App.ui.el('div', { class: 'q-subjective' });
    var locked = !!opts.result || !!opts.selfMark;
    var ta = App.ui.el('textarea', {
      class: 'q-subjective__area',
      placeholder: T.answerPlaceholder || '请输入你的作答…'
    });
    ta.value = opts.value || '';
    ta.disabled = locked;
    if (!locked) {
      ta.addEventListener('input', function () {
        if (opts.onSubjectiveChange) opts.onSubjectiveChange(ta.value);
      });
    }
    wrap.appendChild(ta);

    if (!locked) {
      var btn = App.ui.el('button', { class: 'btn btn--primary q-subjective__submit', type: 'button', text: T.submitAnswer || '提交答案' });
      btn.addEventListener('click', function () {
        if (opts.onSubjectiveSubmit) opts.onSubjectiveSubmit(ta.value);
      });
      wrap.appendChild(App.ui.el('div', { class: 'q-subjective__actions' }, [btn]));
    }
    return wrap;
  }

  function renderSelfMark(opts) {
    var q = opts.q;
    var box = App.ui.el('div', { class: 'feedback feedback--selfmark' }, [
      App.ui.el('div', { class: 'feedback__ref', html: '<strong>' + (T.reference || '参考答案：') + '</strong>' + App.ui.formatAnswer(q) }),
      App.ui.el('div', { class: 'feedback__ref-desc', html: App.ui.h(q.explain || '') }),
      App.ui.el('div', { class: 'feedback__selfmark' }, [
        App.ui.el('button', { class: 'btn btn--success', type: 'button', text: T.selfRight || '我答对了', onclick: function () { opts.onSelfMark && opts.onSelfMark(true); } }),
        App.ui.el('button', { class: 'btn btn--danger-ghost', type: 'button', text: T.selfWrong || '我答错了', onclick: function () { opts.onSelfMark && opts.onSelfMark(false); } })
      ])
    ]);
    return box;
  }

  function renderFeedback(q, ok) {
    var box = App.ui.el('div', { class: 'feedback ' + (ok ? 'feedback--ok' : 'feedback--bad') });

    // 主观题：只展示参考答案与题解（ok 可为 true/false/null，表示自评结果或“待对照”）
    if (q.type === 'subjective') {
      box.classList.add('feedback--subjective');
      var headHtml = ok === true
        ? '<span class="feedback__icon">&#10003;</span> ' + (T.markedRight || '已标记：回答正确')
        : ok === false
          ? '<span class="feedback__icon">&#10007;</span> ' + (T.markedWrong || '已标记：回答错误')
          : '<span class="feedback__icon">&#9998;</span> ' + (T.subjectiveHead || '主观题（对照参考答案）');
      box.appendChild(App.ui.el('div', { class: 'feedback__head', html: headHtml }));
      box.appendChild(App.ui.el('div', { class: 'feedback__ref', html: '<strong>' + (T.reference || '参考答案：') + '</strong>' + App.ui.formatAnswer(q) }));
      if (q.explain) box.appendChild(App.ui.el('div', { class: 'feedback__explain', html: '<strong>' + (T.explain || '题解：') + '</strong>' + App.ui.h(q.explain) }));
      return box;
    }

    box.appendChild(App.ui.el('div', { class: 'feedback__head', html: ok
      ? '<span class="feedback__icon">&#10003;</span> ' + (T.correct || '回答正确')
      : '<span class="feedback__icon">&#10007;</span> ' + (T.wrongAnswer || '回答错误，正确答案：') + '<b>' + App.ui.formatAnswer(q) + '</b>' }));
    if (q.explain) box.appendChild(App.ui.el('div', { class: 'feedback__explain', html: '<strong>' + (T.explain || '题解：') + '</strong>' + App.ui.h(q.explain) }));
    return box;
  }
})(window);
