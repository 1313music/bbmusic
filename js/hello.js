// 初始化Waline
document.addEventListener('DOMContentLoaded', function() {
  // 等待Waline库加载完成
  function initWaline() {
    if (typeof Waline !== 'undefined') {
      // 简单直接：所有页面都使用相同的评论标识符
      const pagePath = '/shared-comments';
      

      
      // 初始化Waline
      Waline.init({
        el: '#waline',
        serverURL: 'https://hello.1701701.xyz',
        path: pagePath, // 强制所有页面使用相同的评论标识符
        avatar: 'wavatar', // 设置默认头像样式为卡通头像
        // 注意：Waline v3.8.0的客户端不再直接处理头像CDN配置
        // 头像URL生成主要由服务端的GRAVATAR_STR环境变量控制
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
    // 检查当前页面是否是message.html
    const isMessagePage = window.location.pathname.includes('message.html');
    
    if (isMessagePage) {
      // 如果是留言板页面，直接初始化
      initWaline();
    } else {
      // 对于index.html页面，我们需要确保留言板在显示时初始化
      // 方法1：直接初始化，不管容器是否可见
      // 方法2：监听容器的显示状态变化
      
      // 采用方法1：直接初始化，Waline会处理容器隐藏的情况
      initWaline();
      
      // 同时添加一个安全保障：监听切换按钮的点击事件，确保在显示时能正常工作
      const commentsToggleBtn = document.getElementById('comments-toggle-btn');
      if (commentsToggleBtn) {
        commentsToggleBtn.addEventListener('click', function() {
          // 延迟一下，确保容器已经显示
          setTimeout(function() {
            const isNowVisible = walineContainer.style.display !== 'none' || walineContainer.classList.contains('show');
            if (isNowVisible && !window.walineInitialized) {
              console.log('安全保障：留言板已显示但未初始化，重新初始化');
              initWaline();
            }
          }, 200); // 增加延迟时间，确保comments-toggle.js的逻辑已经执行完毕
        });
      }
    }
  }
});
