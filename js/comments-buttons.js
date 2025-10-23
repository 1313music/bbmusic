// 留言板按钮交互功能
document.addEventListener('DOMContentLoaded', function() {
    // 创建二维码弹窗
    const qrModal = document.createElement('div');
    qrModal.className = 'qr-modal';
    qrModal.innerHTML = `
        <div class="qr-content">
            <div class="qr-close">
                <svg class="svg-icon"><use href="#icon-close"></use></svg>
            </div>
            <h3 class="qr-title"></h3>
            <div class="qr-image">
                <img src="" alt="二维码">
            </div>
            <p class="qr-description">扫描上方二维码</p>
        </div>
    `;
    document.body.appendChild(qrModal);
    

    
    // 添加关闭图标
    const closeIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    closeIcon.setAttribute('style', 'display: none;');
    closeIcon.innerHTML = `
        <symbol id="icon-close" viewBox="0 0 24 24">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
        </symbol>
    `;
    document.body.insertBefore(closeIcon, document.body.firstChild);
    
    // 二维码标题映射
    const qrTitles = {
        'gzh.jpg': '关注民谣俱乐部',
        'wx.jpg': '交个朋友🍻',
        'zs.jpg': '加个鸡腿🍗'
    };
    
    // 获取所有二维码按钮
    const qrBtns = document.querySelectorAll('.comments-btn.qr-btn');
    const qrClose = document.querySelector('.qr-close');
    const qrImage = qrModal.querySelector('.qr-image img');
    const qrTitle = qrModal.querySelector('.qr-title');
    

    
    // 点击按钮显示二维码或弹窗
    qrBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const qrFile = btn.getAttribute('data-qr');
            const link = btn.getAttribute('data-link');
            
            // 如果是flac-btn按钮，显示确认弹窗
            if (btn.id === 'flac-btn' && link) {
                e.preventDefault();
                
                // 创建FLAC确认弹窗
                const flacModal = document.createElement('div');
                flacModal.className = 'qr-modal';
                flacModal.innerHTML = `
                    <div class="qr-content flac-content">
                        <div class="qr-close">
                            <svg class="svg-icon"><use href="#icon-close"></use></svg>
                        </div>
                        <h3 class="qr-title">FLAC无损播放器</h3>
                        <div class="flac-message">
                            <p>即将跳转到FLAC无损音质页面</p>
                            <p>该页面包含高品质无损音乐文件 加载较慢</p>
                        </div>
                        <div class="flac-buttons">
                            <button class="flac-confirm">确认跳转</button>
                            <button class="flac-cancel">取消</button>
                        </div>
                    </div>
                `;
                document.body.appendChild(flacModal);
                
                // 显示弹窗
                flacModal.classList.add('active');
                
                // 确认按钮事件
                const confirmBtn = flacModal.querySelector('.flac-confirm');
                confirmBtn.addEventListener('click', () => {
                    window.open(link, '_blank');
                    flacModal.classList.remove('active');
                    setTimeout(() => {
                        if (document.body.contains(flacModal)) {
                            document.body.removeChild(flacModal);
                        }
                    }, 300);
                });
                
                // 取消按钮事件
                const cancelBtn = flacModal.querySelector('.flac-cancel');
                cancelBtn.addEventListener('click', () => {
                    flacModal.classList.remove('active');
                    setTimeout(() => {
                        if (document.body.contains(flacModal)) {
                            document.body.removeChild(flacModal);
                        }
                    }, 300);
                });
                
                // 关闭按钮事件
                const closeBtn = flacModal.querySelector('.qr-close');
                closeBtn.addEventListener('click', () => {
                    flacModal.classList.remove('active');
                    setTimeout(() => {
                        if (document.body.contains(flacModal)) {
                            document.body.removeChild(flacModal);
                        }
                    }, 300);
                });
                
                // 点击背景关闭
                flacModal.addEventListener('click', (event) => {
                    if (event.target === flacModal) {
                        flacModal.classList.remove('active');
                        setTimeout(() => {
                            if (document.body.contains(flacModal)) {
                                document.body.removeChild(flacModal);
                            }
                        }, 300);
                    }
                });
                
                return;
            }
            
            // 如果有data-link属性，则跳转链接，不显示二维码
            if (link) {
                window.open(link, '_blank');
                return;
            }
            
            // 阻止默认行为，显示二维码
            e.preventDefault();
            qrImage.src = `img/${qrFile}`;
            qrTitle.textContent = qrTitles[qrFile];
            
            const qrDescription = qrModal.querySelector('.qr-description');
            if (qrDescription) {
                qrDescription.textContent = '扫描上方二维码';
            }
            
            qrModal.classList.add('active');
        });
    });
    
    // 点击关闭按钮关闭弹窗
    qrClose.addEventListener('click', () => {
        qrModal.classList.remove('active');
    });
    
    // 点击弹窗背景关闭弹窗
    qrModal.addEventListener('click', (e) => {
        if (e.target === qrModal) {
            qrModal.classList.remove('active');
        }
    });
    

    
    // 添加弹窗样式
    const style = document.createElement('style');
    style.textContent = `
        .qr-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.7);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 8888;
            opacity: 0;
            visibility: hidden;
            transition: all 0.3s ease;
        }
        
        .qr-modal.active {
            opacity: 1;
            visibility: visible;
        }
        
        .qr-content {
            background: rgba(30, 30, 40, 0.95);
            border: 1px solid rgba(212, 175, 55, 0.3);
            border-radius: 10px;
            padding: 20px;
            max-width: 300px;
            width: 90%;
            text-align: center;
            position: relative;
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            transform: scale(0.8);
            transition: transform 0.3s ease;
        }
        
        .qr-modal.active .qr-content {
            transform: scale(1);
        }
        
        .qr-close {
            position: absolute;
            top: 10px;
            right: 10px;
            cursor: pointer;
            width: 24px;
            height: 24px;
            display: flex;
            justify-content: center;
            align-items: center;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.1);
            transition: background 0.3s ease;
        }
        
        .qr-close:hover {
            background: rgba(255, 255, 255, 0.2);
        }
        
        .qr-close .svg-icon {
            width: 16px;
            height: 16px;
            color: #fff;
        }
        
        .qr-title {
            margin: 0 0 15px;
            color: var(--primary);
            font-size: 18px;
        }
        
        .qr-image img {
            max-width: 200px;
            max-height: 200px;
            border-radius: 5px;
        }
        
        .qr-description {
            margin: 15px 0 0;
            color: #a0a8c0;
            font-size: 14px;
        }
        
        .guide-button {
            display: inline-block;
            margin-top: 8px;
            padding: 4px 8px;
            background: rgba(212, 175, 55, 0.2);
            border: 1px solid rgba(212, 175, 55, 0.3);
            border-radius: 4px;
            color: var(--primary);
            text-decoration: none;
            font-size: 12px;
            transition: all 0.3s ease;
        }
        
        .guide-button:hover {
            background: rgba(212, 175, 55, 0.3);
            color: var(--accent);
        }
        
        /* FLAC弹窗样式 */
        .flac-content {
            max-width: 350px;
            padding: 25px;
        }
        
        .flac-message {
            margin: 15px 0;
            text-align: center;
            color: #a0a8c0;
            line-height: 1.5;
        }
        
        .flac-message p {
            margin: 8px 0;
        }
        
        .flac-buttons {
            display: flex;
            justify-content: center;
            gap: 15px;
            margin-top: 20px;
        }
        
        .flac-confirm, .flac-cancel {
            padding: 10px 20px;
            border: none;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .flac-confirm {
            background: var(--primary);
            color: #000;
        }
        
        .flac-confirm:hover {
            background: rgba(212, 175, 55, 0.9);
            transform: translateY(-2px);
        }
        
        .flac-cancel {
            background: rgba(255, 255, 255, 0.1);
            color: #fff;
            border: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .flac-cancel:hover {
            background: rgba(255, 255, 255, 0.2);
            transform: translateY(-2px);
        }
        
        @media (max-width: 768px) {
            .flac-content {
                max-width: 300px;
                padding: 20px;
            }
            
            .flac-message {
                font-size: 14px;
            }
            
            .flac-confirm, .flac-cancel {
                padding: 8px 16px;
                font-size: 14px;
            }
            
            .flac-buttons {
                gap: 10px;
            }
        }
    `;
    document.head.appendChild(style);
});
