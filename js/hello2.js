// 初始化Waline
document.addEventListener('DOMContentLoaded', function() {
  // 等待Waline库加载完成
  function initWaline() {
    if (typeof Waline !== 'undefined') {
      Waline.init({
        el: '#waline',
        serverURL: 'https://hello.1701701.xyz',
        emoji: [
          'https://unpkg.com/@waline/emojis@1.2.0/weibo',
          'https://unpkg.com/@waline/emojis@1.2.0/qq',
          'https://unpkg.com/@waline/emojis@1.2.0/alus',
          'https://unpkg.com/@waline/emojis@1.2.0/bmoji',
          'https://unpkg.com/@waline/emojis@1.2.0/tieba',
        ],
        search: false,
        lang: 'zh',
        locale: {
          placeholder: '来到城市已经八百九十六天 热河路一直是相同的容颜 偶尔有干净的潘西路过 她不会说你好再见',
          level0: '潜水',
          level1: '冒泡',
          level2: '吐槽',
          level3: '活跃',
          level4: '话痨',
          level5: '传说',
        }
      });
    } else {
      // 如果Waline还未加载，等待100ms后重试
      setTimeout(initWaline, 100);
    }
  }
  
  // 开始初始化
  initWaline();
});
