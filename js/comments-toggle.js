// 留言板展开收起功能模块
// 统一管理留言板按钮的交互逻辑

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
        
        // 设置默认状态
        setDefaultState: function() {
            const commentsToggleBtn = document.getElementById('comments-toggle-btn');
            const walineContainer = document.getElementById('waline');
            
            if (commentsToggleBtn && walineContainer) {
                // 检查当前是否是留言板页面
                if (window.location.pathname.includes('message.html')) {
                    // 留言板页面默认展开
                    walineContainer.classList.add('show');
                    walineContainer.style.display = 'block';
                    commentsToggleBtn.classList.add('active');
                } else {
                    // 其他页面默认收起留言板
                    walineContainer.classList.remove('show');
                    commentsToggleBtn.classList.remove('active');
                    walineContainer.style.display = 'none';
                }
            }
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
