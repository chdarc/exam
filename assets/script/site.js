/**
 * site.js —— 站点文案配置（把“文字信息”集中到一处，便于整体替换）
 *
 * 说明：
 *  - 门户封面 / 页脚等“品牌文案”已直接写在对应 HTML 里（index.html 的封面、各页 <title> 等）；
 *  - 题库标题、简介等“数据”在 banks/catalog.json 与 banks/<id>/info.json 中；
 *  - 其余 JS 需要展示的界面文案统一放在本文件的 App.site 里，避免散落在各 ui 模块中。
 *    若想把这个站点改作其他用途，改本文件 + HTML 文案 + 题库 JSON 即可。
 */
(function (global) {
  'use strict';
  var App = global.App = global.App || {};

  App.site = {
    /* ---------- 刷题模式（题库信息页四张入口卡片） ---------- */
    modes: {
      sequential: {
        title: '顺序刷题',
        desc: '按题号顺序逐题练习',
        icon: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6h13M8 12h13M8 18h13"/><circle cx="3.5" cy="6" r="1"/><circle cx="3.5" cy="12" r="1"/><circle cx="3.5" cy="18" r="1"/></svg>'
      },
      random: {
        title: '乱序刷题',
        desc: '随机打乱顺序练习',
        icon: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M16 3h5v5"/><path d="M4 20L21 3"/><path d="M21 16v5h-5"/><path d="M15 15l6 6"/><path d="M4 4l5 5"/></svg>'
      },
      exam: {
        title: '模拟考试',
        desc: '限时答题，交卷后评分',
        icon: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/></svg>'
      },
      records: {
        title: '错题 · 收藏',
        desc: '针对错题与收藏重点练习',
        icon: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l2.9 5.9 6.5.9-4.7 4.6 1.1 6.4L12 18.4l-5.8 3.1 1.1-6.4L2.6 9.8l6.5-.9z"/></svg>'
      }
    },

    /* ---------- 空状态文案 ---------- */
    empty: {
      home: '暂无题库，请先在 banks/catalog.json 中配置。',
      practice: {
        wrong: '暂无错题，去刷几道题吧！',
        favorite: '暂无收藏题目，点题目右侧 ☆ 收藏。',
        none: '该题库暂无题目。'
      },
      records: {
        favorite: '还没有收藏的题目，做题时点 ☆ 即可收藏。',
        wrong: '暂无错题，继续保持！'
      }
    },

    /* ---------- 记录页（清除记录确认） ---------- */
    records: {
      clearFavorite: '确定清除全部收藏记录？',
      clearWrong: '确定清除全部错题记录？'
    },

    /* ---------- 模拟考试相关 ---------- */
    exam: {
      saved: '已保存作答',
      submitted: '已交卷',
      submit: '交卷',
      subjectiveNote: '另有 {n} 道主观题，请对照参考答案自行判断。',
      subjective: '主观题',
      right: '对',
      wrong: '错',
      pass: '及格',
      fail: '未及格'
    },

    /* ---------- 通用界面文案（由 JS 渲染的部分） ---------- */
    ui: {
      confirm: '确定',
      submitAnswer: '提交答案',
      answerPlaceholder: '请输入你的作答…',
      reference: '参考答案：',
      explain: '题解：',
      selfRight: '我答对了',
      selfWrong: '我答错了',
      markedRight: '已标记：回答正确',
      markedWrong: '已标记：回答错误',
      subjectiveHead: '主观题（对照参考答案）',
      correct: '回答正确',
      wrongAnswer: '回答错误，正确答案：',
      download: '下载附件',
      cancel: '取消'
    }
  };
})(window);
