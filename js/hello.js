// 初始化Waline
document.addEventListener('DOMContentLoaded', function() {
  // 等待Waline库加载完成
  function initWaline() {
    if (typeof Waline !== 'undefined') {
      // 设置统一的页面路径，让index和message页面共享评论
      const currentPath = window.location.pathname;
      let pagePath = currentPath;
      
      // 如果是留言板相关页面（index.html, message.html, test-message-detection.html），
      // 或者是根路径（/），使用统一的标识符来共享评论
      if (currentPath === '/' || 
          currentPath.includes('index.html') || 
          currentPath.includes('message.html') || 
          currentPath.includes('test-message-detection')) {
        pagePath = '/shared-comments'; // 统一的评论标识符
      }
      
      console.log('当前页面路径:', currentPath);
      console.log('Waline页面标识符:', pagePath);
      
      Waline.init({
        el: '#waline',
        serverURL: 'https://hello.1701701.xyz',
        path: pagePath, // 指定页面路径，实现评论共享
        emoji: [
          'https://unpkg.com/@waline/emojis@1.2.0/weibo',
          'https://unpkg.com/@waline/emojis@1.2.0/qq',
          'https://unpkg.com/@waline/emojis@1.2.0/alus',
          'https://unpkg.com/@waline/emojis@1.2.0/bmoji',
          'https://unpkg.com/@waline/emojis@1.2.0/tieba',
        ],
        search: false,
        lang: 'zh',
        pageSize: 20, // 设置合理的每页评论数量
        pagination: true, // 启用分页功能
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
