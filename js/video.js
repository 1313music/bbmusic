
// 关键功能初始化
        window.addEventListener('DOMContentLoaded', function() {
            // 创建脚本加载函数
            function loadScript(src, callback) {
                const script = document.createElement('script');
                script.src = src;
                script.defer = true;
                script.onload = callback;
                document.body.appendChild(script);
            }
            
            // 先加载视频数据
            loadScript('https://r2.1701701.xyz/jscss/videoData.js', function() {
                // 加载核心功能
                loadScript('https://cdn.jsdelivr.net/npm/hls.js', function() {
                    // 配置 hls.js，但仅对HLS流使用，不影响MP4播放
                    if (Hls.isSupported()) {
                        Hls.DefaultConfig.enableWorker = true;
                        Hls.DefaultConfig.enableStreaming = true;
                        Hls.DefaultConfig.maxBufferLength = 30;
                        Hls.DefaultConfig.maxMaxBufferLength = 60;
                        Hls.DefaultConfig.liveSyncDurationCount = 3;
                    }
                    loadScript('https://cdn.jsdelivr.net/npm/dplayer/dist/DPlayer.min.js', initializeApp);
                });
            });
        });
        
        // 应用核心逻辑
        function initializeApp() {
           
            disableVideoContextMenu();
            
            // 从外部文件加载的视频数据和分类列表
            const videoData = window.videoData || {};
            const categories = window.categories || [];

            // 全局 DPlayer 实例
            let dp = null;
            let currentVideoUrl = '';

            // 初始化 DPlayer 播放器
            function initDPlayer() {
                if (dp) return dp;
                
                dp = new DPlayer({
                    container: document.getElementById('dplayer-container'),
                    live: false,
                    autoplay: false,
                    theme: '#d4af37', // 金色主题
                    loop: false,
                    lang: 'zh-cn',
                    hotkey: true,
                    volume: 0.7,
                    playbackSpeed: [0.5, 0.75, 1, 1.25, 1.5, 2],
                    mutex: true,
                    contextmenu: [], 
                    video: {
                        url: '',
                        pic: 'https://v.1701701.xyz/img/bg.jpg' // 默认封面
                    },
   
                    errorHandler: function(error) {
                        console.error('DPlayer error:', error);
                        showCompatibilityAlert('视频播放失败: ' + error.message);
                    },
                    // 添加移动端优化配置
                    mobileControls: true,
                    hideControlsAfter: 1000, // 1秒后自动隐藏控制按钮
                    autoHide: true // 默认自动隐藏控制栏
                });
                
                
                disableVideoContextMenu();
                
                // 初始化后立即隐藏控制栏
                setTimeout(() => {
                    if (dp && dp.controller) {
                        dp.controller.hide();
                    }
                }, 1000);
                
                return dp;
            }
            
         
            function disableVideoContextMenu() {
                // 等待DOM加载完成
                setTimeout(() => {
                  
                    const dplayerContainer = document.getElementById('dplayer-container');
                    if (dplayerContainer) {
                        dplayerContainer.addEventListener('contextmenu', function(e) {
                            e.preventDefault();
                            return false;
                        });
                    }
                    
                 
                    const videoElements = document.querySelectorAll('video');
                    videoElements.forEach(video => {
                        video.addEventListener('contextmenu', function(e) {
                            e.preventDefault();
                            return false;
                        });
                        
                       
                        video.addEventListener('dragstart', function(e) {
                            e.preventDefault();
                            return false;
                        });
                    });
                    
               
                    document.addEventListener('contextmenu', function(e) {
                        if (e.target.tagName === 'VIDEO') {
                            e.preventDefault();
                            return false;
                        }
                    });
                    
               
                    document.addEventListener('dragstart', function(e) {
                        if (e.target.tagName === 'VIDEO') {
                            e.preventDefault();
                            return false;
                        }
                    });
                }, 500);
            }

            // 初始化分类导航
            function initCategories() {
                const container = document.getElementById('categories-container');
                container.innerHTML = '';
                
                categories.forEach(category => {
                    const btn = document.createElement('button');
                    btn.className = 'category-btn';
                    btn.dataset.category = category.id;
                    
                    const icon = document.createElement('i');
                    icon.className = category.icon;
                    btn.appendChild(icon);
                    
                    const text = document.createTextNode(` ${category.name}`);
                    btn.appendChild(text);
                    
                    if (category.id === 'knxy') {
                        btn.classList.add('active');
                    }
                    
                    container.appendChild(btn);
                });
            }

            // 当前分类和路径追踪
            let currentCategory = 'knxy';
            let folderHistory = [];
            
            // 加载分类下的视频
            function loadCategoryVideos(categoryId, isSubFolder = false) {
                const listContainer = document.getElementById('videos-list');
                listContainer.innerHTML = '';
                
                // 更新当前分类
                if (!isSubFolder) {
                    currentCategory = categoryId;
                    folderHistory = [];
                }
                
                if (!videoData[categoryId] || videoData[categoryId].length === 0) {
                    listContainer.innerHTML = `
                        <div class="no-videos">
                            <i class="fas fa-video-slash"></i>
                            <div>此分类下暂无视频内容</div>
                        </div>
                    `;
                    return;
                }
                
                // 如果有文件夹历史，添加返回按钮
                if (folderHistory.length > 0) {
                    const backItem = document.createElement('div');
                    backItem.className = 'video-item folder-item back-folder';
                    backItem.innerHTML = `
                        <div class="thumbnail">
                            <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='124' viewBox='0 0 220 124'%3E%3Crect width='220' height='124' fill='%231a1a2e'/%3E%3C/svg%3E" 
                                 data-src="./img/back.jpg" 
                                 alt="返回上一级" 
                                 class="lazyload">
                            <div class="folder-icon"><i class="fas fa-arrow-left"></i></div>
                            <div class="progress-bar" style="height:2px"><div class="progress" style="width:100%"></div></div>
                        </div>
                        <div class="video-title">返回上一级</div>
                    `;
                    listContainer.appendChild(backItem);
                }
                
                // 添加新内容
                videoData[categoryId].forEach(video => {
                    const item = document.createElement('div');
                    
                    // 判断是否为文件夹
                    if (video.isFolder) {
                        item.className = 'video-item folder-item';
                        item.dataset.id = video.id;
                        item.dataset.folderId = video.folderId;
                        item.dataset.thumb = video.thumb;
                        
                        item.innerHTML = `
                            <div class="thumbnail">
                                <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='124' viewBox='0 0 220 124'%3E%3Crect width='220' height='124' fill='%231a1a2e'/%3E%3C/svg%3E" 
                                     data-src="${video.thumb}" 
                                     alt="${video.title}" 
                                     class="lazyload">
                                <div class="folder-icon"><i class="fas fa-folder-open"></i></div>
                                <div class="progress-bar" style="height:2px"><div class="progress" style="width:100%"></div></div>
                            </div>
                            <div class="video-title">${video.title}</div>
                        `;
                    } else {
                        item.className = 'video-item';
                        item.dataset.id = video.id;
                        item.dataset.url = video.url;
                        item.dataset.thumb = video.thumb;
                        
                        item.innerHTML = `
                            <div class="thumbnail">
                                <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='124' viewBox='0 0 220 124'%3E%3Crect width='220' height='124' fill='%231a1a2e'/%3E%3C/svg%3E" 
                                     data-src="${video.thumb}" 
                                     alt="${video.title}" 
                                     class="lazyload">
                                <div class="play-icon"><i class="fas fa-play"></i></div>
                                <div class="progress-bar" style="height:2px"><div class="progress" style="width:100%"></div></div>
                            </div>
                            <div class="video-title">${video.title}</div>
                        `;
                    }
                    
                    listContainer.appendChild(item);
                });
                
                // 初始化懒加载
                initLazyLoad();
            }
            
            // 添加懒加载函数
            function initLazyLoad() {
                const lazyImages = document.querySelectorAll('img.lazyload');
                const observer = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            const img = entry.target;
                            img.src = img.dataset.src;
                            img.classList.remove('lazyload');
                            observer.unobserve(img);
                        }
                    });
                }, { rootMargin: '200px 0px' });
                
                lazyImages.forEach(img => observer.observe(img));
            }

            // 播放视频
            function playVideo(url, thumb = '', title = '精彩视频') {
                if (!url) {
                    showCompatibilityAlert('此视频源不可用，请选择其他视频');
                    return;
                }
                
                // 避免重复加载相同视频
                if (currentVideoUrl === url) {
                    dp.play();
                    return;
                }
                
                currentVideoUrl = url;
                
                // 设置超时处理
                const loadTimeout = setTimeout(() => {
                    showCompatibilityAlert('视频加载时间较长，请耐心等待');
                }, 15000);
                
                try {
                    // 确保播放器已初始化
                    const player = initDPlayer();
                    
                    // 销毁旧播放器实例
                    if (player && player.video) {
                        player.destroy();
                        dp = null;
                    }
                    
                    // 检测是否为 iOS 设备
                    const isIOSMain = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                                 (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
                    
                    // 检查是否为MP4文件
                    const isMP4 = url.toLowerCase().endsWith('.mp4');
                    
                    // 对于iOS设备的处理
                    if (isIOSMain) {
                        if (!isMP4 && Hls.isSupported()) {
                            // 对于HLS流使用hls.js
                            const hls = new Hls({
                                enableWorker: false, // iOS 禁用 Worker
                                maxBufferLength: 30,
                                lowLatencyMode: false
                            });
                            
                            hls.loadSource(url);
                            hls.attachMedia(document.createElement('video'));
                            
                            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                                clearTimeout(loadTimeout);
                                
                                // 检测是否为iOS设备
                                const isIOSPlayer = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
                                
                                dp = new DPlayer({
                                    container: document.getElementById('dplayer-container'),
                                    contextmenu: [], 
                                    video: {
                                        url: url,
                                        pic: thumb,
                                        type: 'customHls',
                                        customType: {
                                            'customHls': function (video, player) {
                                                hls.attachMedia(video);
                                            }
                                        }
                                    },
                                    autoplay: true,
                                    autoHide: true,
                                    hideControlsAfter: 3000 // 3秒后自动隐藏控制按钮
                                });
                                
                               
                                disableVideoContextMenu();
                                
                                dp.on('play', function(){
                                    setTimeout(function(){
                                        document.getElementById('dplayer-container').classList.add('dplayer-hide-controller');
                                        
                                        // 检测是否为iOS设备
                                        const isIOSPlayback = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
                                        if (isIOSPlayback) {
                                            // 为iOS设备添加额外的控制器自动隐藏功能
                                            const dplayerVideo = document.querySelector('.dplayer-video-current');
                                            if (dplayerVideo) {
                                                // 确保视频元素已加载
                                                setupIOSAutoHide(dplayerVideo);
                                            }
                                        }
                                    }, 1000)
                                });
                            });
                            
                            hls.on(Hls.Events.ERROR, (event, data) => {
                                console.error('HLS 错误:', data);
                                clearTimeout(loadTimeout);
                            });
                            
                            return;
                        } else {
                            // 对于MP4文件使用原生播放
                            clearTimeout(loadTimeout);
                            
                            // 检测是否为iOS设备
                            const isIOSNative = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
                            
                            dp = new DPlayer({
                                container: document.getElementById('dplayer-container'),
                                contextmenu: [],
                                video: {
                                    url: url,
                                    pic: thumb,
                                    type: 'auto'
                                },
                                autoplay: true,
                                autoHide: true,
                                hideControlsAfter: 3000 // 3秒后自动隐藏控制按钮
                            });
                            
                           
                            disableVideoContextMenu();
                            
                            dp.on('play', function(){
                                setTimeout(function(){
                                    document.getElementById('dplayer-container').classList.add('dplayer-hide-controller');
                                    
                                    // 检测是否为iOS设备
                                    const isIOSControl = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
                                    if (isIOSControl) {
                                        // 为iOS设备添加额外的控制器自动隐藏功能
                                        const dplayerVideo = document.querySelector('.dplayer-video-current');
                                        if (dplayerVideo) {
                                            // 确保视频元素已加载
                                            setupIOSAutoHide(dplayerVideo);
                                        }
                                    }
                                }, 1000)
                            });
                            return;
                        }
                    }
                    
                    // 非 iOS 或其他情况使用默认逻辑
                    // 检测是否为iOS设备
                    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
                    
                    dp = new DPlayer({
                        container: document.getElementById('dplayer-container'),
                        contextmenu: [], 
                        video: {
                            url: url,
                            pic: thumb,
                            type: (url.toLowerCase().endsWith('.m3u8') || url.toLowerCase().endsWith('.js')) ? 'hls' : 'auto'
                        },
                        
                        // 添加HLS配置优化
                        hls: {
                            liveSyncDurationCount: 3,
                            maxMaxBufferLength: 30,
                            enableWorker: true
                        },
                        autoHide: true, // 默认自动隐藏控制栏
                        hideControlsAfter: isIOSDevice ? 3000 : 3000, // 3秒后自动隐藏控制按钮
                        errorHandler: function(error) {
                            console.error('播放错误:', error);
                            showCompatibilityAlert('视频播放失败，请重试');
                            clearTimeout(loadTimeout);
                        }
                    });
                    
                    // 添加时长稳定处理
                    let durationStabilized = false;
                    let lastDuration = 0;
                    
                   
                    disableVideoContextMenu();
                    
                    // 播放成功回调
                    dp.on('canplay', function() {
                        clearTimeout(loadTimeout);
                        document.getElementById('compatibility-alert').style.display = 'none';
                        
                        // 立即隐藏控制栏
                        setTimeout(() => {
                            dp.controller.hide();
                           
                            
                            // 检测是否为iOS设备
                            const isIOSCanPlay = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
                            if (isIOSCanPlay) {
                                // 为iOS设备添加额外的控制器自动隐藏功能
                                const dplayerVideo = document.querySelector('.dplayer-video-current');
                                if (dplayerVideo) {
                                    // 确保视频元素已加载
                                    setupIOSAutoHide(dplayerVideo);
                                }
                            }
                        }, 100);
                        
                        // 添加时长稳定处理
                        if (!durationStabilized) {
                            // 获取初始时长
                            const initialDuration = dp.video.duration;
                            lastDuration = initialDuration;
                            
                            // 设置定时器检查时长变化
                            const durationCheck = setInterval(() => {
                                if (dp.video.duration !== lastDuration) {
                                    lastDuration = dp.video.duration;
                                } else {
                                    // 时长稳定后更新UI
                                    updateDurationDisplay(lastDuration);
                                    durationStabilized = true;
                                    clearInterval(durationCheck);
                                }
                            }, 500);
                        }
                    });
                    
                 
                    
                    // 播放失败回调
                    dp.on('error', function() {
                        clearTimeout(loadTimeout);
                    });
                    
                    // 开始播放
                    dp.play();
                    
                    // 设置移动端控制器自动隐藏
                    setupMobileControlsAutoHide();
                    
                } catch (error) {
                    console.error('播放错误:', error);
                    showCompatibilityAlert('视频播放失败: ' + error.message);
                    clearTimeout(loadTimeout);
                }
            }

          

            // 设置移动端控制器自动隐藏安卓端
        
            function setupMobileControlsAutoHide() {
                if (!dp || window.innerWidth > 768) return;
                
                const dplayerContainer = document.getElementById('dplayer-container');
                let controlsHideTimer;
                
                // 检测是否为iOS设备
                const isIOSMobile = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
                
                // 监听触摸事件
                dplayerContainer.addEventListener('touchstart', function() {
                    // 清除之前的定时器
                    clearTimeout(controlsHideTimer);
                    
                    // 设置新的定时器，3秒后自动隐藏控制器
                    controlsHideTimer = setTimeout(() => {
                        if (dp && !dp.video.paused) {
                            dp.controller.hide();
                        }
                    }, 3000);
                });
                
                // 针对iOS设备的特殊处理
                if (isIOSMobile) {
                    // 监听视频播放器的点击事件
                    const dplayerVideo = document.querySelector('.dplayer-video-current');
                    if (dplayerVideo) {
                        dplayerVideo.addEventListener('click', function() {
                            // 清除之前的定时器
                            clearTimeout(controlsHideTimer);
                            
                            // 设置新的定时器，3秒后自动隐藏控制器
                            controlsHideTimer = setTimeout(() => {
                                if (dp && !dp.video.paused) {
                                    dp.controller.hide();
                                }
                            }, 3000);
                        });
                    }
                    
                    // 添加额外的事件监听器，确保控制器会自动隐藏
                    document.addEventListener('touchend', function() {
                        if (dp && !dp.video.paused) {
                            clearTimeout(controlsHideTimer);
                            controlsHideTimer = setTimeout(() => {
                                dp.controller.hide();
                            }, 3000);
                        }
                    });
                }
            }
            
            // 显示兼容性提示
            function showCompatibilityAlert(message) {
                const alert = document.getElementById('compatibility-alert');
                const messageElement = document.getElementById('compatibility-message');
                
                messageElement.textContent = message;
                alert.style.display = 'flex';
                
                // 3秒后自动隐藏
                setTimeout(() => {
                    alert.style.display = 'none';
                }, 3000);
            }

            // 为iOS设备设置自动隐藏控制器无操作自动隐藏
            function setupIOSAutoHide(videoElement) {
                if (!dp || !videoElement) return;
                
                let iosControlsHideTimer;
                
                // 监听视频元素的点击事件
                videoElement.addEventListener('click', function() {
                    // 清除之前的定时器
                    clearTimeout(iosControlsHideTimer);
                    
                    // 设置新的定时器，3秒后自动隐藏控制器
                    iosControlsHideTimer = setTimeout(() => {
                        if (dp && !dp.video.paused) {
                            dp.controller.hide();
                        }
                    }, 3000);
                });
           
                
                // 创建observer实例观察播放器元素的class变化
                const observer = new MutationObserver(function(mutations) {
                    mutations.forEach(function(mutation) {
                        if (mutation.attributeName === 'class') {
                            // 清除之前的定时器
                            clearTimeout(iosControlsHideTimer);
                            
                            // 设置新的定时器，3秒后自动隐藏控制器
                            iosControlsHideTimer = setTimeout(() => {
                                if (dp && !dp.video.paused) {
                                    dp.controller.hide();
                                }
                            }, 3000);
                        }
                    });
                });
                
                // 观察播放器元素的class变化
                observer.observe(document.querySelector('.dplayer'), { attributes: true });
            }
            
            // 检测设备兼容性
            function detectCompatibility() {
                // 仅在确实需要时显示提示
                const video = document.createElement('video');
                if (!video.canPlayType('application/vnd.apple.mpegurl') && 
                    !Hls.isSupported()) {
                    showCompatibilityAlert('您的设备可能需要JavaScript兼容模式播放视频');
                }
            }


            


            // 应用初始化
            function initAppUI() {
                // 初始化播放器
                initDPlayer();
                initCategories();
                loadCategoryVideos('knxy');
                detectCompatibility();
                
                // 使用事件委托处理分类点击
                document.getElementById('categories-container').addEventListener('click', (e) => {
                    const btn = e.target.closest('.category-btn');
                    if (btn) {
                        document.querySelectorAll('.category-btn.active').forEach(e => e.classList.remove('active'));
                        btn.classList.add('active');
                        loadCategoryVideos(btn.dataset.category);
                    }
                });
                
                // 使用事件委托处理视频和文件夹点击
                document.getElementById('videos-list').addEventListener('click', (e) => {
                    const item = e.target.closest('.video-item');
                    if (!item) return;
                    
                    // 处理返回上一级
                    if (item.classList.contains('back-folder')) {
                        if (folderHistory.length > 0) {
                            const prevFolder = folderHistory.pop();
                            loadCategoryVideos(prevFolder, true);
                        } else {
                            loadCategoryVideos(currentCategory);
                        }
                        return;
                    }
                    
                    // 处理文件夹点击
                    if (item.classList.contains('folder-item')) {
                        const folderId = item.dataset.folderId;
                        if (folderId && videoData[folderId]) {
                            folderHistory.push(currentCategory);
                            loadCategoryVideos(folderId, true);
                        }
                        return;
                    }
                    
                    // 处理视频点击
                    const url = item.dataset.url;
                    const thumb = item.querySelector('img').dataset.src;
                    playVideo(url, thumb, item.querySelector('.video-title').textContent);
                });
                
                // 初始化留言板展开收起功能
                const commentsToggleBtn = document.getElementById('comments-toggle-btn');
                const walineContainer = document.getElementById('waline');
                
                if (commentsToggleBtn && walineContainer) {
                    commentsToggleBtn.addEventListener('click', function() {
                        const isHidden = !walineContainer.classList.contains('show');
                        const textNode = commentsToggleBtn.childNodes[2]; // 获取文本节点
                        
                        if (isHidden) {
                            // 展开留言板
                            walineContainer.classList.add('show');
                            textNode.textContent = ' 收起留言板 ';
                            commentsToggleBtn.classList.add('active');
                            
                            // 如果留言板尚未初始化，可以在这里触发初始化
                            if (!window.walineInitialized) {
                                // Waline会在其自己的脚本中初始化
                                window.walineInitialized = true;
                            }
                        } else {
                            // 收起留言板
                            walineContainer.classList.remove('show');
                            textNode.textContent = ' 展开留言板 ';
                            commentsToggleBtn.classList.remove('active');
                        }
                    });
                }
                
                // 初始化回到顶部按钮功能
                const backToTopBtn = document.getElementById('back-to-top');
                
                if (backToTopBtn) {
                    // 监听滚动事件，显示/隐藏回到顶部按钮
                    window.addEventListener('scroll', function() {
                        if (window.scrollY > 300) {
                            backToTopBtn.classList.add('visible');
                        } else {
                            backToTopBtn.classList.remove('visible');
                        }
                    });
                    
                    // 点击回到顶部
                    backToTopBtn.addEventListener('click', function() {
                        window.scrollTo({
                            top: 0,
                            behavior: 'smooth'
                        });
                    });
                    
                    // 添加键盘支持
                    backToTopBtn.addEventListener('keydown', function(e) {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            window.scrollTo({
                                top: 0,
                                behavior: 'smooth'
                            });
                        }
                    });
                }
            }

            // 执行初始化
            initAppUI();
        }

        // 实现 updateDurationDisplay 函数，解决未定义错误
        function updateDurationDisplay(duration) {
            // 这个函数目前不需要做具体操作，因为 DPlayer 播放器会自动显示时长
            // 如果需要自定义显示，可以在这里添加代码
            // console.log('视频时长稳定:', formatTime(duration));
        }

        // 格式化时间的辅助函数
        function formatTime(seconds) {
            if (isNaN(seconds)) return '00:00';
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = Math.floor(seconds % 60);
            return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
        }
