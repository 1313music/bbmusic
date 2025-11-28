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
      
      console.log('=== Waline初始化调试信息 ===');
      console.log('当前页面完整URL:', window.location.href);
      console.log('当前页面路径:', currentPath);
      console.log('Waline页面标识符:', pagePath);
      console.log('=== Waline初始化调试信息 ===');
      
      // 初始化Waline，无论容器是否可见
      const walineInstance = Waline.init({
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
      
      // 保存实例到全局，方便后续调用
      window.walineInstance = walineInstance;
      window.walineInitialized = true;
      
      // 如果当前页面是message.html，或者容器已经可见，确保评论已加载
      const walineContainer = document.getElementById('waline');
      if (currentPath.includes('message.html') || 
          walineContainer && (walineContainer.classList.contains('show') || walineContainer.style.display !== 'none')) {
        console.log('Waline容器已可见，评论应已自动加载');
      }
    } else {
      // 如果Waline还未加载，等待100ms后重试
      setTimeout(initWaline, 100);
    }
  }
  
  // 开始初始化
  initWaline();
  
  // 监听留言板显示事件，确保评论在显示时正确加载
  // 检查是否存在CommentsToggle对象
  if (typeof CommentsToggle !== 'undefined') {
    // 重写toggleComments方法，在显示时刷新评论
    const originalToggleComments = CommentsToggle.toggleComments;
    CommentsToggle.toggleComments = function(walineContainer, commentsToggleBtn) {
      // 调用原始方法
      originalToggleComments.call(this, walineContainer, commentsToggleBtn);
      
      // 检查是否是显示操作
      if (walineContainer.classList.contains('show')) {
        console.log('留言板已显示，检查Waline实例...');
        
        // 如果Waline已初始化，尝试刷新评论
        if (window.walineInstance) {
          console.log('Waline实例已存在，尝试刷新评论');
          // 重新加载评论
          window.walineInstance.update();
        } else {
          console.log('Waline实例不存在，重新初始化');
          // 如果实例不存在，重新初始化
          initWaline();
        }
      }
    };
  }
});
