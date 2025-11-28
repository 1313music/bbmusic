// 初始化Waline
document.addEventListener('DOMContentLoaded', function() {
  // 等待Waline库加载完成
  function initWaline() {
    if (typeof Waline !== 'undefined') {
      // 简单直接：所有页面都使用相同的评论标识符
      const pagePath = '/shared-comments';
      
      console.log('=== Waline初始化调试信息 ===');
      console.log('当前页面完整URL:', window.location.href);
      console.log('当前页面路径:', window.location.pathname);
      console.log('Waline页面标识符:', pagePath);
      console.log('=== Waline初始化调试信息 ===');
      
      // 初始化Waline
      Waline.init({
        el: '#waline',
        serverURL: 'https://hello.1701701.xyz',
        path: pagePath, // 强制所有页面使用相同的评论标识符
        emoji: [
          'https://unpkg.com/@waline/emojis@1.2.0/weibo',
          'https://unpkg.com/@waline/emojis@1.2.0/qq',
          'https://unpkg.com/@waline/emojis@1.2.0/alus',
          'https://unpkg.com/@waline/emojis@1.2.0/bmoji',
          'https://unpkg.com/@waline/emojis@1.2.0/tieba',
        ],
        search: false,
        lang: 'zh',
        pageSize: 20,
        pagination: true,
        locale: {
          placeholder: ' 保持理智 相信未来',
        }
      });
      
      // 标记为已初始化
      window.walineInitialized = true;
    } else {
      // 如果Waline还未加载，等待100ms后重试
      setTimeout(initWaline, 100);
    }
  }
  
  // 检查留言板容器是否存在
  const walineContainer = document.getElementById('waline');
  if (walineContainer) {
    // 检查当前页面是否是message.html，或者留言板容器是否可见
    const isMessagePage = window.location.pathname.includes('message.html');
    const isContainerVisible = walineContainer.style.display !== 'none' || walineContainer.classList.contains('show');
    
    if (isMessagePage || isContainerVisible) {
      // 如果是留言板页面或者容器已可见，直接初始化
      initWaline();
    } else {
      // 否则，监听留言板显示事件
      const commentsToggleBtn = document.getElementById('comments-toggle-btn');
      if (commentsToggleBtn) {
        commentsToggleBtn.addEventListener('click', function() {
          // 延迟一下，确保容器已经显示
          setTimeout(function() {
            const isNowVisible = walineContainer.style.display !== 'none' || walineContainer.classList.contains('show');
            if (isNowVisible && !window.walineInitialized) {
              initWaline();
            }
          }, 100);
        });
      }
    }
  }
});
