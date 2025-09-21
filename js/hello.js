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
        pageSize: 10, // 每页显示的评论数量
        locale: {
          placeholder: ' 保持理智 相信未来',
         
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