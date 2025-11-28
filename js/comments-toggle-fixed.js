// 留言板展开收起功能模块 - 修复版本
// 修复GitHub Pages路径识别问题

(function() {
    'use strict';
    
    // 留言板功能配置
    const CommentsToggle = {
        // 初始化留言板功能
        init: function() {
            this.bindEvents();
            this.setDefaultState();
        },
        
        // 绑定事件
        bindEvents: function() {
            const commentsToggleBtn = document.getElementById('comments-toggle-btn');
            const walineContainer = document.getElementById('waline');
            
            if (commentsToggleBtn && walineContainer) {
                commentsToggleBtn.addEventListener('click', () => {
                    this.toggleComments(walineContainer, commentsToggleBtn);
                });
            }
        },
        
        // 设置默认状态 - 修复路径检测逻辑
        setDefaultState: function() {
            const commentsToggleBtn = document.getElementById('comments-toggle-btn');
            const walineContainer = document.getElementById('waline');
            
            if (commentsToggleBtn && walineContainer) {
                // 改进的路径检测逻辑
                const currentPath = window.location.pathname;
                const isMessagePage = this.isMessagePage(currentPath);
                
                console.log('当前路径:', currentPath);
                console.log('是否为留言板页面:', isMessagePage);
                
                if (isMessagePage) {
                    // 留言板页面默认展开
                    walineContainer.classList.add('show');
                    walineContainer.style.display = 'block';
                    commentsToggleBtn.classList.add('active');
                    console.log('留言板已展开');
                } else {
                    // 其他页面默认收起留言板
                    walineContainer.classList.remove('show');
                    commentsToggleBtn.classList.remove('active');
                    walineContainer.style.display = 'none';
                    console.log('留言板已收起');
                }
            }
        },
        
        // 改进的页面判断逻辑
        isMessagePage: function(path) {
            // 方法1：检查是否包含message.html 或 test-message-detection
            if (path.includes('message.html') || path.includes('test-message-detection')) {
                return true;
            }
            
            // 方法2：检查当前页面的标题或其他标识
            const pageTitle = document.title;
            if (pageTitle.includes('留言板')) {
                return true;
            }
            
            // 方法3：检查页面中是否有特定的留言板元素
            const pageHeading = document.querySelector('h1');
            if (pageHeading && pageHeading.textContent.includes('留言板')) {
                return true;
            }
            
            // 方法4：检查URL中的hash
            if (window.location.hash === '#message') {
                return true;
            }
            
            return false;
        },
        
        // 切换留言板显示状态
        toggleComments: function(walineContainer, commentsToggleBtn) {
            const isHidden = !walineContainer.classList.contains('show');
            
            if (isHidden) {
                // 展开留言板
                walineContainer.classList.add('show');
                walineContainer.style.display = 'block';
                commentsToggleBtn.classList.add('active');
                
                // 如果留言板尚未初始化，可以在这里触发初始化
                if (!window.walineInitialized) {
                    window.walineInitialized = true;
                }
            } else {
                // 收起留言板
                walineContainer.classList.remove('show');
                commentsToggleBtn.classList.remove('active');
                
                // 延迟隐藏以确保过渡动画完成
                setTimeout(() => {
                    if (!walineContainer.classList.contains('show')) {
                        walineContainer.style.display = 'none';
                    }
                }, 800); // 与CSS过渡时间匹配
            }
        },
        
        // 手动设置留言板状态（供外部调用）
        setState: function(isVisible) {
            const commentsToggleBtn = document.getElementById('comments-toggle-btn');
            const walineContainer = document.getElementById('waline');
            
            if (commentsToggleBtn && walineContainer) {
                if (isVisible) {
                    walineContainer.classList.add('show');
                    walineContainer.style.display = 'block';
                    commentsToggleBtn.classList.add('active');
                } else {
                    walineContainer.classList.remove('show');
                    commentsToggleBtn.classList.remove('active');
                    
                    setTimeout(() => {
                        if (!walineContainer.classList.contains('show')) {
                            walineContainer.style.display = 'none';
                        }
                    }, 800);
                }
            }
        },
        
        // 获取当前留言板状态
        getState: function() {
            const walineContainer = document.getElementById('waline');
            return walineContainer ? walineContainer.classList.contains('show') : false;
        }
    };
    
    // 页面加载完成后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            CommentsToggle.init();
        });
    } else {
        CommentsToggle.init();
    }
    
    // 暴露到全局作用域，供其他脚本调用
    window.CommentsToggle = CommentsToggle;
    
})();