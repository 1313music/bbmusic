
// 等待DOM加载完成
        document.addEventListener('DOMContentLoaded', function() {
            // 获取DOM元素 - 使用对象组织提高可读性
            const elements = {
                audioPlayer: document.getElementById('audio-player'),
                playPauseBtn: document.getElementById('play-pause-btn'),
                playIcon: document.getElementById('play-icon'),
                pauseIcon: document.getElementById('pause-icon'),
                prevBtn: document.getElementById('prev-btn'),
                nextBtn: document.getElementById('next-btn'),
                playModeBtn: document.getElementById('play-mode-btn'),
                modeIcon: document.getElementById('mode-icon'),
                progressBar: document.getElementById('progress-bar'),
                progress: document.getElementById('progress'),
                currentTimeElement: document.getElementById('current-time'),
                totalTimeElement: document.getElementById('total-time'),
                songTitleElement: document.getElementById('song-title'),
                songArtistElement: document.getElementById('song-artist'),
                lyricsSongTitleElement: document.getElementById('lyrics-song-title'),
                lyricsSongArtistElement: document.getElementById('lyrics-song-artist'),
                coverImage: document.getElementById('cover-image'),
                albumCover: document.getElementById('album-cover'),
                songsListDesktop: document.getElementById('songs-list-desktop'),
                songsListMobile: document.getElementById('songs-list-mobile'),
                albumsList: document.getElementById('albums-list'),
                cloudBtn: document.getElementById('cloud-btn'),
                
                // 页面切换相关元素
                coverPage: document.getElementById('cover-page'),
                lyricsPage: document.getElementById('lyrics-page'),
                
                mobileSongsCollapse: document.getElementById('mobile-songs-collapse'),
                mobileSongsContainer: document.getElementById('mobile-songs-container'),
                
                // 留言板相关元素
                commentsToggleBtn: document.getElementById('comments-toggle-btn'),
                walineContainer: document.getElementById('waline'),
                backToTopBtn: document.getElementById('back-to-top'),
                
                // 歌词相关元素
                lyricsContainer: document.querySelector('.lyrics-container'),
                lyricsContent: document.querySelector('.lyrics-content')
            };
            
            // 音乐播放状态
            let currentSongIndex = 0;
            let isPlaying = false;
            let playMode = 0; // 0: 顺序播放, 1: 随机播放, 2: 单曲循环, 3: 列表循环
            let currentAlbumId = null;
            let filteredSongs = window.localMusicList || [];
            
            // 歌词相关变量
            let currentLyrics = [];
            let currentLyricIndex = -1;
            
            // 页面切换状态
            let currentPage = 'cover'; // 'cover' 或 'lyrics'
            
            // 事件监听器跟踪
            let currentLoadedMetadataHandler = null;
            let currentErrorHandler = null;
            
            // 设置默认音量
            const defaultVolume = 80;
            elements.audioPlayer.volume = defaultVolume / 100;
            
            // 初始化移动端歌曲列表收起展开功能
            function initMobileSongsToggle() {
                if (!elements.mobileSongsCollapse || !elements.mobileSongsContainer) return;
                
                let isCollapsed = false;
                let isAnimating = false;
                let animationTimeout = null;
                
                // 优化防抖函数，减少延迟时间
                function debounce(func, wait) {
                    return function() {
                        const context = this;
                        const args = arguments;
                        clearTimeout(animationTimeout);
                        animationTimeout = setTimeout(() => {
                            func.apply(context, args);
                        }, wait);
                    };
                }
                
                function toggleCollapse() {
                    // 如果正在动画中，则不执行新的动画
                    if (isAnimating) return;
                    
                    isCollapsed = !isCollapsed;
                    isAnimating = true;
                    
                    // 使用requestAnimationFrame确保动画流畅
                    requestAnimationFrame(() => {
                        if (isCollapsed) {
                            elements.mobileSongsContainer.classList.add('collapsed');
                        } else {
                            elements.mobileSongsContainer.classList.remove('collapsed');
                        }
                        
                        // 减少动画延迟时间，与CSS过渡时间保持一致
                        setTimeout(() => {
                            isAnimating = false;
                        }, 320); // 略大于CSS过渡时间(0.3s)，确保动画完成
                    });
                }
                
                // 减少防抖延迟时间，提高响应速度
                const debouncedToggleCollapse = debounce(toggleCollapse, 30);
                
                elements.mobileSongsCollapse.addEventListener('click', function() {
                    debouncedToggleCollapse();
                });
                
                // 也可以点击标题区域来收起展开
                elements.mobileSongsContainer.querySelector('.songs-header').addEventListener('click', function(e) {
                    // 如果点击的是收起按钮，不触发标题点击事件
                    if (e.target.closest('.collapse-btn')) return;
                    
                    debouncedToggleCollapse();
                });
            }
            
            // 初始化图片懒加载
            function initLazyLoading() {
                // 检查浏览器是否支持IntersectionObserver
                if ('IntersectionObserver' in window) {
                    window.imageObserver = new IntersectionObserver((entries, observer) => {
                        entries.forEach(entry => {
                            // 当图片进入视口
                            if (entry.isIntersecting) {
                                const img = entry.target;
                                const src = img.getAttribute('data-src');
                                
                                if (src) {
                                    img.src = src;
                                    img.removeAttribute('data-src');
                                    
                                    // 图片加载完成后添加淡入效果
                                    img.onload = () => {
                                        img.style.opacity = '0';
                                        img.style.transition = 'opacity 0.3s';
                                        img.classList.add('lazy-loaded');
                                        
                                        // 使用requestAnimationFrame确保过渡效果生效
                                        requestAnimationFrame(() => {
                                            img.style.opacity = '1';
                                        });
                                    };
                                    
                                    // 停止观察已加载的图片
                                    observer.unobserve(img);
                                }
                            }
                        });
                    }, {
                        rootMargin: '50px 0px', // 提前50px加载
                        threshold: 0.01
                    });
                    
                    // 观察所有带有data-src属性的图片
                    document.querySelectorAll('img[data-src]').forEach(img => {
                        window.imageObserver.observe(img);
                    });
                } else {
                    // 如果浏览器不支持IntersectionObserver，则回退到传统方法
                    lazyLoadFallback();
                }
            }
            
            // 懒加载回退方法（适用于不支持IntersectionObserver的浏览器）
            function lazyLoadFallback() {
                const lazyImages = document.querySelectorAll('img[data-src]');
                
                // 立即加载视口内的图片
                loadVisibleImages();
                
                // 添加滚动事件监听
                let scrollTimeout;
                window.addEventListener('scroll', () => {
                    if (scrollTimeout) {
                        clearTimeout(scrollTimeout);
                    }
                    
                    scrollTimeout = setTimeout(() => {
                        loadVisibleImages();
                    }, 200);
                });
                
                // 添加窗口大小改变事件监听
                let resizeTimeout;
                window.addEventListener('resize', () => {
                    if (resizeTimeout) {
                        clearTimeout(resizeTimeout);
                    }
                    
                    resizeTimeout = setTimeout(() => {
                        loadVisibleImages();
                    }, 200);
                });
                
                function loadVisibleImages() {
                    lazyImages.forEach(img => {
                        if (img.getAttribute('data-src')) {
                            const rect = img.getBoundingClientRect();
                            const isVisible = (
                                rect.top <= window.innerHeight && 
                                rect.bottom >= 0 &&
                                rect.left <= window.innerWidth && 
                                rect.right >= 0
                            );
                            
                            if (isVisible) {
                                const src = img.getAttribute('data-src');
                                img.src = src;
                                img.removeAttribute('data-src');
                                
                                // 图片加载完成后添加淡入效果
                                img.onload = () => {
                                    img.style.opacity = '0';
                                    img.style.transition = 'opacity 0.3s';
                                    img.classList.add('lazy-loaded');
                                    
                                    // 使用requestAnimationFrame确保过渡效果生效
                                    requestAnimationFrame(() => {
                                        img.style.opacity = '1';
                                    });
                                };
                            }
                        }
                    });
                    
                    // 更新lazyImages数组，移除已加载的图片
                    const remainingImages = document.querySelectorAll('img[data-src]');
                    if (remainingImages.length === 0) {
                        window.removeEventListener('scroll', loadVisibleImages);
                        window.removeEventListener('resize', loadVisibleImages);
                    }
                }
            }

            // 初始化专辑列表
            function initAlbums() {
                if (musicAlbums && musicAlbums.length > 0) {
                    elements.albumsList.innerHTML = '';
                    
                    // 动态创建网易云歌单专辑项
                    if (neteasePlaylists && neteasePlaylists.length > 0) {
                        neteasePlaylists.forEach(playlist => {
                            const albumItem = document.createElement('div');
                            albumItem.className = 'album-item';
                            albumItem.dataset.id = playlist.id;
                            
                            albumItem.innerHTML = `
                                <div class="album-image">
                                    <img data-src="${playlist.cover}" alt="${playlist.name}" loading="lazy">
                                </div>
                                <div class="album-info">
                                    <h3 class="album-title">${playlist.name}</h3>
                                </div>
                            `;
                            
                            albumItem.addEventListener('click', () => {
                                filterSongsByAlbum(playlist.id);
                            });
                            
                            elements.albumsList.appendChild(albumItem);
                        });
                    }
                    
                    musicAlbums.forEach(album => {
                        // 不再跳过网易云歌单，让它正常显示
                        const albumItem = document.createElement('div');
                        albumItem.className = 'album-item';
                        albumItem.dataset.id = album.id;
                        
                        albumItem.innerHTML = `
                            <div class="album-image">
                                <img data-src="${album.cover}" alt="${album.name}" loading="lazy">
                            </div>
                            <div class="album-info">
                                <h3 class="album-title">${album.name}</h3>
                            </div>
                        `;
                        
                        albumItem.addEventListener('click', () => {
                            filterSongsByAlbum(album.id);
                        });
                        
                        elements.albumsList.appendChild(albumItem);
                    });
                    
                    // 初始化图片懒加载
                    initLazyLoading();
                    
                    // 触发专辑列表动画
                    triggerAlbumsAnimation();
                }
            }
            
            // 触发专辑列表动画
            function triggerAlbumsAnimation() {
                // 获取所有专辑项
                const albumItems = elements.albumsList.querySelectorAll('.album-item');
                
                // 重置动画
                albumItems.forEach((album, index) => {
                    // 重置动画
                    album.style.animation = 'none';
                    album.style.opacity = '0';
                    
                    // 强制重排，确保重置生效
                    void album.offsetWidth;
                    
                    // 应用新的动画，根据索引添加延迟
                    album.style.animation = `bounceIn 0.6s ease-out ${index * 0.1}s both`;
                });
            }
            
            // 根据专辑过滤歌曲
            function filterSongsByAlbum(albumId) {
                if (albumId === currentAlbumId) {
                    // 如果点击的是当前专辑，则显示所有歌曲
                    currentAlbumId = null;
                    // 从所有专辑中提取歌曲列表
                    filteredSongs = [];
                    musicAlbums.forEach(album => {
                        if (album.songs && Array.isArray(album.songs)) {
                            filteredSongs.push(...album.songs);
                        }
                    });
                    
                    // 重置歌曲列表动画
                    resetSongsListAnimation();
                    
                    // 更新歌曲列表显示，添加动画效果
                    renderSongsListWithAnimation();
                    
                    // 如果当前播放的歌曲不在过滤后的列表中，则播放第一首
                    if (filteredSongs.length > 0) {
                        const currentSong = elements.audioPlayer.src;
                        const songExists = filteredSongs.some(song => song.src === currentSong);
                        
                        if (!songExists) {
                            currentSongIndex = 0;
                            loadSong(filteredSongs[currentSongIndex]);
                            if (isPlaying) {
                                // 等待音频加载完成后再播放
                                elements.audioPlayer.addEventListener('loadedmetadata', function onLoaded() {
                                    playSong();
                                    elements.audioPlayer.removeEventListener('loadedmetadata', onLoaded);
                                });
                            }
                        }
                    }
                } else if (albumId.startsWith('netease_playlist_')) {
                    // 处理网易云歌单 - 支持多个歌单
                    currentAlbumId = albumId;
                    
                    // 从MusicList.js导入的网易云歌单配置中找到对应的歌单
                    const playlistConfig = neteasePlaylists.find(playlist => playlist.id === albumId);
                    
                    if (!playlistConfig) {
                        // 如果找不到对应的歌单配置，显示错误
                        elements.songsListDesktop.innerHTML = '<div class="song-item"><div class="song-details"><div class="song-name">未找到网易云歌单配置</div></div></div>';
                        elements.songsListMobile.innerHTML = '<div class="song-item"><div class="song-details"><div class="song-name">未找到网易云歌单配置</div></div></div>';
                        return;
                    }
                    
                    // 显示加载状态
                    elements.songsListDesktop.innerHTML = '<div class="song-item"><div class="song-details"><div class="song-name">正在加载网易云歌单...</div></div></div>';
                    elements.songsListMobile.innerHTML = '<div class="song-item"><div class="song-details"><div class="song-name">正在加载网易云歌单...</div></div></div>';
                    
                    // 通过API获取网易云歌单数据，使用从MusicList.js导入的歌单ID
                    fetch('https://music.zhheo.com/meting-api/?server=netease&type=playlist&id=' + playlistConfig.playlistId + '&r=' + Math.random())
                        .then(response => response.json())
                        .then(data => {
                            // 处理Meting.js API返回的数据
                            if (data && data.length > 0) {
                                // 转换网易云歌单数据格式，保存原始歌曲ID和歌词URL用于歌词获取
                                filteredSongs = data.map((song, index) => ({
                                    name: song.name || '未知歌曲',
                                    artist: song.artist || '未知艺术家',
                                    src: song.url || '', // 使用Meting.js API返回的歌曲URL
                                    cover: song.pic || 'img/default.jpg',
                                    id: `netease_${playlistConfig.id}_${index}`,
                                    neteaseId: song.id, // 保存网易云原始歌曲ID用于歌词获取
                                    lrc: song.lrc // 保存歌词URL，直接用于歌词获取
                                }));
                                
                                // 重置歌曲列表动画
                                resetSongsListAnimation();
                                
                                // 更新歌曲列表显示，添加动画效果
                                renderSongsListWithAnimation();
                                
                                // 如果当前播放的歌曲不在过滤后的列表中，则播放第一首
                                if (filteredSongs.length > 0) {
                                    const currentSong = elements.audioPlayer.src;
                                    const songExists = filteredSongs.some(song => song.src === currentSong);
                                    
                                    if (!songExists) {
                                        currentSongIndex = 0;
                                        loadSong(filteredSongs[currentSongIndex]);
                                        if (isPlaying) {
                                            // 等待音频加载完成后再播放
                                            elements.audioPlayer.addEventListener('loadedmetadata', function onLoaded() {
                                                playSong();
                                                elements.audioPlayer.removeEventListener('loadedmetadata', onLoaded);
                                            });
                                        }
                                    }
                                }
                            } else {
                                // 加载失败
                                elements.songsListDesktop.innerHTML = '<div class="song-item"><div class="song-details"><div class="song-name">加载网易云歌单失败</div></div></div>';
                                elements.songsListMobile.innerHTML = '<div class="song-item"><div class="song-details"><div class="song-name">加载网易云歌单失败</div></div></div>';
                            }
                        })
                        .catch(error => {
                            console.error('加载网易云歌单失败:', error);
                            elements.songsListDesktop.innerHTML = '<div class="song-item"><div class="song-details"><div class="song-name">加载网易云歌单失败</div></div></div>';
                            elements.songsListMobile.innerHTML = '<div class="song-item"><div class="song-details"><div class="song-name">加载网易云歌单失败</div></div></div>';
                        });
                } else {
                    // 否则显示该专辑的歌曲
                    currentAlbumId = albumId;
                    if (musicAlbums) {
                        const album = musicAlbums.find(album => album.id === albumId);
                        if (album) {
                            filteredSongs = [...album.songs];
                        }
                    }
                    
                    // 重置歌曲列表动画
                    resetSongsListAnimation();
                    
                    // 更新歌曲列表显示，添加动画效果
                    renderSongsListWithAnimation();
                    
                    // 如果当前播放的歌曲不在过滤后的列表中，则播放第一首
                    if (filteredSongs.length > 0) {
                        const currentSong = elements.audioPlayer.src;
                        const songExists = filteredSongs.some(song => song.src === currentSong);
                        
                        if (!songExists) {
                            currentSongIndex = 0;
                            loadSong(filteredSongs[currentSongIndex]);
                            if (isPlaying) {
                                // 等待音频加载完成后再播放
                                elements.audioPlayer.addEventListener('loadedmetadata', function onLoaded() {
                                    playSong();
                                    elements.audioPlayer.removeEventListener('loadedmetadata', onLoaded);
                                });
                            }
                        }
                    }
                }
            }
            
            // 重置歌曲列表动画
            function resetSongsListAnimation() {
                // 获取歌曲列表容器
                const songsListDesktop = elements.songsListDesktop;
                const songsListMobile = elements.songsListMobile;
                
                // 重置动画
                songsListDesktop.style.animation = 'none';
                songsListMobile.style.animation = 'none';
                
                // 强制重排，确保重置生效
                void songsListDesktop.offsetWidth;
                void songsListMobile.offsetWidth;
                
                // 应用新的动画
                songsListDesktop.style.animation = 'slideInUp 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
                songsListMobile.style.animation = 'slideInUp 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
            }
            
            // 渲染歌曲列表（带动画效果）
            function renderSongsListWithAnimation() {
                // 清空现有列表
                elements.songsListDesktop.innerHTML = '';
                elements.songsListMobile.innerHTML = '';
                
                // 如果没有歌曲，显示提示
                if (filteredSongs.length === 0) {
                    const emptyMessage = document.createElement('div');
                    emptyMessage.className = 'song-item';
                    emptyMessage.innerHTML = `
                        <div class="song-details">
                            <div class="song-name">暂无歌曲</div>
                        </div>
                    `;
                    elements.songsListDesktop.appendChild(emptyMessage);
                    elements.songsListMobile.appendChild(emptyMessage.cloneNode(true));
                    return;
                }
                
                // 使用文档片段优化DOM操作
                const desktopFragment = document.createDocumentFragment();
                const mobileFragment = document.createDocumentFragment();
                
                // 一次性创建所有歌曲项
                filteredSongs.forEach((song, index) => {
                    // 检查是否是当前播放的歌曲
                    const isCurrentSong = elements.audioPlayer.src.includes(song.src);
                    if (isCurrentSong) {
                        currentSongIndex = index;
                    }
                    
                    // 创建歌曲项HTML
                    const songHTML = `
                        <div class="song-number">${index + 1}</div>
                        <div class="song-details">
                            <div class="song-name">${song.name}</div>
                            <div class="song-artist-name">${song.artist || song.id}</div>
                        </div>
                    `;
                    
                    // 创建桌面端歌曲项
                    const desktopItem = document.createElement('div');
                    desktopItem.className = 'song-item';
                    desktopItem.dataset.index = index;
                    if (isCurrentSong) {
                        desktopItem.classList.add('active');
                    }
                    desktopItem.innerHTML = songHTML;
                    desktopFragment.appendChild(desktopItem);
                    
                    // 创建移动端歌曲项（克隆桌面端）
                    const mobileItem = desktopItem.cloneNode(true);
                    mobileFragment.appendChild(mobileItem);
                });
                
                // 一次性添加到DOM
                elements.songsListDesktop.appendChild(desktopFragment);
                elements.songsListMobile.appendChild(mobileFragment);
                
                // 触发动画效果
                triggerSongsListAnimation();
            }
            
            // 触发歌曲列表动画
            function triggerSongsListAnimation() {
                // 获取所有歌曲项
                const desktopSongs = elements.songsListDesktop.querySelectorAll('.song-item');
                const mobileSongs = elements.songsListMobile.querySelectorAll('.song-item');
                
                // 重置动画
                [...desktopSongs, ...mobileSongs].forEach((song, index) => {
                    // 重置动画
                    song.style.animation = 'none';
                    song.style.opacity = '0';
                    
                    // 强制重排，确保重置生效
                    void song.offsetWidth;
                    
                    // 应用新的动画
                    song.style.animation = `fadeInRight 0.5s ease-out ${index * 0.05}s both`;
                });
            }
            
            // 渲染歌曲列表
            function renderSongsList() {
                // 清空现有列表
                elements.songsListDesktop.innerHTML = '';
                elements.songsListMobile.innerHTML = '';
                
                // 如果没有歌曲，显示提示
                if (filteredSongs.length === 0) {
                    const emptyMessage = document.createElement('div');
                    emptyMessage.className = 'song-item';
                    emptyMessage.innerHTML = `
                        <div class="song-details">
                            <div class="song-name">暂无歌曲</div>
                        </div>
                    `;
                    elements.songsListDesktop.appendChild(emptyMessage);
                    elements.songsListMobile.appendChild(emptyMessage.cloneNode(true));
                    return;
                }
                
                // 使用文档片段优化DOM操作
                const desktopFragment = document.createDocumentFragment();
                const mobileFragment = document.createDocumentFragment();
                
                // 一次性创建所有歌曲项
                filteredSongs.forEach((song, index) => {
                    // 检查是否是当前播放的歌曲
                    const isCurrentSong = elements.audioPlayer.src.includes(song.src);
                    if (isCurrentSong) {
                        currentSongIndex = index;
                    }
                    
                    // 创建歌曲项HTML
                    const songHTML = `
                        <div class="song-number">${index + 1}</div>
                        <div class="song-details">
                            <div class="song-name">${song.name}</div>
                            <div class="song-artist-name">${song.artist || song.id}</div>
                        </div>
                    `;
                    
                    // 创建桌面端歌曲项
                    const desktopItem = document.createElement('div');
                    desktopItem.className = 'song-item';
                    desktopItem.dataset.index = index;
                    if (isCurrentSong) {
                        desktopItem.classList.add('active');
                    }
                    desktopItem.innerHTML = songHTML;
                    desktopFragment.appendChild(desktopItem);
                    
                    // 创建移动端歌曲项（克隆桌面端）
                    const mobileItem = desktopItem.cloneNode(true);
                    mobileFragment.appendChild(mobileItem);
                });
                
                // 一次性添加到DOM
                elements.songsListDesktop.appendChild(desktopFragment);
                elements.songsListMobile.appendChild(mobileFragment);
            }
            
            // 事件委托处理歌曲点击
            function handleSongClick(event) {
                const songItem = event.target.closest('.song-item');
                if (!songItem) return;
                
                const index = parseInt(songItem.dataset.index);
                if (isNaN(index) || index < 0 || index >= filteredSongs.length) return;
                
                currentSongIndex = index;
                showLoadingState();
                
                loadSong(filteredSongs[currentSongIndex]);
                
                // 等待音频加载完成后再播放
                elements.audioPlayer.addEventListener('loadedmetadata', function onLoaded() {
                    hideLoadingState();
                    playSong();
                    elements.audioPlayer.removeEventListener('loadedmetadata', onLoaded);
                });
                
                // 添加加载错误处理
                elements.audioPlayer.addEventListener('error', function onError() {
                    hideLoadingState();
                    showErrorMessage('音频加载失败，请检查网络连接');
                    elements.audioPlayer.removeEventListener('error', onError);
                });
            }
            
            // 显示加载状态
            function showLoadingState() {
                elements.playPauseBtn.classList.add('loading');
                elements.playIcon.style.display = 'none';
                elements.pauseIcon.style.display = 'none';
                
                // 添加加载指示器
                if (!elements.playPauseBtn.querySelector('.loading-indicator')) {
                    const loader = document.createElement('div');
                    loader.className = 'loading-indicator';
                    loader.innerHTML = '<i class="fa fa-spinner fa-spin"></i>';
                    elements.playPauseBtn.appendChild(loader);
                }
            }
            
            // 隐藏加载状态
            function hideLoadingState() {
                elements.playPauseBtn.classList.remove('loading');
                const loader = elements.playPauseBtn.querySelector('.loading-indicator');
                if (loader) {
                    loader.remove();
                }
                
                // 恢复播放/暂停按钮显示
                if (isPlaying) {
                    elements.playIcon.style.display = 'none';
                    elements.pauseIcon.style.display = 'block';
                } else {
                    elements.playIcon.style.display = 'block';
                    elements.pauseIcon.style.display = 'none';
                }
            }
            
            // 显示错误消息
            function showErrorMessage(message) {
                // 创建错误提示元素
                const errorToast = document.createElement('div');
                errorToast.className = 'error-toast';
                errorToast.innerHTML = `
                    <i class="fa fa-exclamation-circle"></i>
                    <span>${message}</span>
                `;
                
                // 添加到页面
                document.body.appendChild(errorToast);
                
                // 3秒后自动移除
                setTimeout(() => {
                    errorToast.classList.add('fade-out');
                    setTimeout(() => {
                        if (errorToast.parentNode) {
                            errorToast.parentNode.removeChild(errorToast);
                        }
                    }, 300);
                }, 3000);
            }
            
            // 加载歌曲
            function loadSong(song) {
                if (!song) return;
                
                // 显示加载状态
                showLoadingState();
                
                elements.songTitleElement.textContent = song.name;
                elements.songArtistElement.textContent = song.artist || song.id;
                
                // 同时更新歌词页面的歌曲信息
                elements.lyricsSongTitleElement.textContent = song.name;
                elements.lyricsSongArtistElement.textContent = song.artist || song.id;
                
                // 获取歌曲所属专辑的封面
                let songCover = 'img/1.jpg'; // 默认封面，使用现有的图片
                
                // 如果是网易云歌单的歌曲，直接使用歌曲自带的封面
                if (song.cover) {
                    songCover = song.cover;
                } else if (currentAlbumId && musicAlbums) {
                    // 否则尝试从当前专辑获取封面
                    const album = musicAlbums.find(album => album.id === currentAlbumId);
                    if (album && album.cover) {
                        songCover = album.cover;
                    } else {
                        // 如果当前专辑没有封面，尝试从所有专辑中查找包含这首歌的专辑
                        for (const album of musicAlbums) {
                            if (album.songs && album.songs.some(s => s.src === song.src)) {
                                if (album.cover) {
                                    songCover = album.cover;
                                    break;
                                }
                            }
                        }
                    }
                }
                
                // 使用懒加载方式设置封面图片
                if (songCover !== 'img/default.jpg') {
                    // 先移除之前的src属性，设置data-src属性
                    elements.coverImage.removeAttribute('src');
                    elements.coverImage.setAttribute('data-src', songCover);
                    
                    // 如果图片已经在视口中，立即加载
                    if (isElementInViewport(elements.coverImage)) {
                        elements.coverImage.src = songCover;
                        elements.coverImage.removeAttribute('data-src');
                        
                        // 图片加载完成后添加淡入效果
                        elements.coverImage.onload = () => {
                            elements.coverImage.style.opacity = '0';
                            elements.coverImage.style.transition = 'opacity 0.3s';
                            elements.coverImage.classList.add('lazy-loaded');
                            
                            // 使用requestAnimationFrame确保过渡效果生效
                            requestAnimationFrame(() => {
                                elements.coverImage.style.opacity = '1';
                            });
                        };
                    } else {
                        // 否则，添加到懒加载观察器
                        if (window.imageObserver) {
                            window.imageObserver.observe(elements.coverImage);
                        } else {
                            // 如果观察器不存在，直接加载
                            elements.coverImage.src = songCover;
                            elements.coverImage.removeAttribute('data-src');
                            
                            // 图片加载完成后添加淡入效果
                            elements.coverImage.onload = () => {
                                elements.coverImage.style.opacity = '0';
                                elements.coverImage.style.transition = 'opacity 0.3s';
                                elements.coverImage.classList.add('lazy-loaded');
                                
                                // 使用requestAnimationFrame确保过渡效果生效
                                requestAnimationFrame(() => {
                                    elements.coverImage.style.opacity = '1';
                                });
                            };
                        }
                    }
                } else {
                    elements.coverImage.src = songCover;
                }
                
                elements.audioPlayer.src = song.src;
                
                // 更新歌曲列表中激活状态
                updateActiveSongInList();
                
                // 加载歌词
                loadLyrics(song.name, currentAlbumId);
                
                // 初始化LRC歌词指示器状态
                updateLyricsIndicator();
                
                // 清除之前的事件监听器防止内存泄漏
                if (currentErrorHandler) {
                    elements.audioPlayer.removeEventListener('error', currentErrorHandler);
                }
                if (currentLoadedMetadataHandler) {
                    elements.audioPlayer.removeEventListener('loadedmetadata', currentLoadedMetadataHandler);
                }
                
                // 添加错误处理
                currentErrorHandler = handleAudioError;
                elements.audioPlayer.addEventListener('error', currentErrorHandler);
                
                // 当歌曲可以播放时，更新总时长
                currentLoadedMetadataHandler = function() {
                    hideLoadingState();
                    updateTotalTime();
                };
                elements.audioPlayer.addEventListener('loadedmetadata', currentLoadedMetadataHandler);
            }
            
            // 检查元素是否在视口中
            function isElementInViewport(el) {
                const rect = el.getBoundingClientRect();
                return (
                    rect.top >= 0 &&
                    rect.left >= 0 &&
                    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
                    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
                );
            }
            
            // 处理音频加载错误
            function handleAudioError(event) {
                hideLoadingState();
                const error = event.target.error;
                let errorMessage = '音频加载失败';
                
                switch (error.code) {
                    case error.MEDIA_ERR_ABORTED:
                        errorMessage = '音频加载被中止';
                        break;
                    case error.MEDIA_ERR_NETWORK:
                        errorMessage = '网络错误，音频加载失败';
                        break;
                    case error.MEDIA_ERR_DECODE:
                        errorMessage = '音频解码失败';
                        break;
                    case error.MEDIA_ERR_SRC_NOT_SUPPORTED:
                        errorMessage = '音频格式不支持';
                        break;
                    default:
                        errorMessage = '音频加载失败，请检查网络连接';
                        break;
                }
                
                showErrorMessage(errorMessage);
                console.error('音频加载错误:', error);
            }
            
            // 更新列表中激活的歌曲
            function updateActiveSongInList() {
                const activeItems = document.querySelectorAll('.song-item.active');
                activeItems.forEach(item => item.classList.remove('active'));
                
                const currentItems = document.querySelectorAll(`.song-item[data-index="${currentSongIndex}"]`);
                currentItems.forEach(item => item.classList.add('active'));
            }
            
            // 播放歌曲
            function playSong() {
                if (filteredSongs.length === 0) return;
                
                showLoadingState();
                
                const playPromise = elements.audioPlayer.play();
                if (playPromise !== undefined) {
                    playPromise.then(() => {
                        hideLoadingState();
                        isPlaying = true;
                        elements.playIcon.style.display = 'none';
                        elements.pauseIcon.style.display = 'block';
                        elements.albumCover.classList.add('playing');
                        

                    }).catch(error => {
                        hideLoadingState();
                        console.error('播放失败:', error);
                        
                        let errorMessage = '播放失败';
                        if (error.name === 'NotAllowedError') {
                            errorMessage = '浏览器阻止了自动播放，请点击播放按钮';
                        } else if (error.name === 'NotSupportedError') {
                            errorMessage = '音频格式不支持';
                        } else {
                            errorMessage = '播放失败，请重试';
                        }
                        
                        showErrorMessage(errorMessage);
                    });
                } else {
                    // 对于不支持Promise的浏览器
                    try {
                        elements.audioPlayer.play();
                        isPlaying = true;
                        elements.playIcon.style.display = 'none';
                        elements.pauseIcon.style.display = 'block';
                        elements.albumCover.classList.add('playing');
                        hideLoadingState();
                    } catch (error) {
                        hideLoadingState();
                        console.error('播放失败:', error);
                        showErrorMessage('播放失败，请重试');
                    }
                }
            }
            
            // 暂停歌曲
            function pauseSong() {
                elements.audioPlayer.pause();
                isPlaying = false;
                elements.playIcon.style.display = 'block';
                elements.pauseIcon.style.display = 'none';
                elements.albumCover.classList.remove('playing');
            }
            

            
            // 播放下一首
            function nextSong() {
                if (filteredSongs.length === 0) return;
                
                if (playMode === 1) {
                    // 随机播放
                    const randomIndex = Math.floor(Math.random() * filteredSongs.length);
                    currentSongIndex = randomIndex;
                } else if (playMode === 2) {
                    // 单曲循环
                    // 保持当前索引不变
                } else {
                    // 顺序播放或列表循环
                    currentSongIndex = (currentSongIndex + 1) % filteredSongs.length;
                }
                
                if (playMode !== 2) {
                    // 单曲循环不重新加载歌曲
                    loadSong(filteredSongs[currentSongIndex]);
                    // 等待音频加载完成后再播放
                    elements.audioPlayer.addEventListener('loadedmetadata', function onLoaded() {
                        playSong();
                        elements.audioPlayer.removeEventListener('loadedmetadata', onLoaded);
                    });
                } else {
                    // 单曲循环直接播放当前歌曲
                    playSong();
                }
            }
            
            // 播放上一首
            function prevSong() {
                if (filteredSongs.length === 0) return;
                
                if (playMode === 1) {
                    // 随机播放
                    const randomIndex = Math.floor(Math.random() * filteredSongs.length);
                    currentSongIndex = randomIndex;
                } else if (playMode === 2) {
                    // 单曲循环
                    // 保持当前索引不变
                } else {
                    // 顺序播放或列表循环
                    currentSongIndex = (currentSongIndex - 1 + filteredSongs.length) % filteredSongs.length;
                }
                
                if (playMode !== 2) {
                    // 单曲循环不重新加载歌曲
                    loadSong(filteredSongs[currentSongIndex]);
                    // 等待音频加载完成后再播放
                    elements.audioPlayer.addEventListener('loadedmetadata', function onLoaded() {
                        playSong();
                        elements.audioPlayer.removeEventListener('loadedmetadata', onLoaded);
                    });
                } else {
                    // 单曲循环直接播放当前歌曲
                    playSong();
                }
            }
            
            // 更新播放进度
            function updateProgress() {
                const { duration, currentTime } = elements.audioPlayer;
                
                if (duration && !isNaN(duration)) {
                    const progressPercent = (currentTime / duration) * 100;
                    elements.progress.style.width = `${progressPercent}%`;
                }
                
                // 更新当前时间显示
                updateCurrentTime();
                
                // 同步歌词
                syncLyrics();
            }
            
            // 更新当前时间
            function updateCurrentTime() {
                const currentTime = elements.audioPlayer.currentTime;
                elements.currentTimeElement.textContent = formatTime(currentTime);
            }
            
            // 更新总时长
            function updateTotalTime() {
                const duration = elements.audioPlayer.duration;
                if (duration && !isNaN(duration)) {
                    elements.totalTimeElement.textContent = formatTime(duration);
                }
            }
            
            // 格式化时间
            function formatTime(seconds) {
                const minutes = Math.floor(seconds / 60);
                const remainingSeconds = Math.floor(seconds % 60);
                return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
            }
            
            // 设置进度条
            function setProgress(e) {
                const width = elements.progressBar.clientWidth;
                const rect = elements.progressBar.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const duration = elements.audioPlayer.duration;
                
                if (duration) {
                    const seekTime = (clickX / width) * duration;
                    elements.audioPlayer.currentTime = seekTime;
                }
            }
            
            // 切换播放模式
            function togglePlayMode() {
                playMode = (playMode + 1) % 4;
                
                // 更新按钮样式和图标
                switch (playMode) {
                    case 0: // 列表循环
                        elements.modeIcon.innerHTML = '<path d="M8 20V21.9324C8 22.2086 7.77614 22.4324 7.5 22.4324C7.38303 22.4324 7.26977 22.3914 7.17991 22.3165L3.06093 18.8841C2.84879 18.7073 2.82013 18.392 2.99691 18.1799C3.09191 18.0659 3.23264 18 3.38103 18L18 18C19.1046 18 20 17.1045 20 16V7.99997H22V16C22 18.2091 20.2091 20 18 20H8ZM16 3.99997V2.0675C16 1.79136 16.2239 1.5675 16.5 1.5675C16.617 1.5675 16.7302 1.60851 16.8201 1.68339L20.9391 5.11587C21.1512 5.29266 21.1799 5.60794 21.0031 5.82008C20.9081 5.93407 20.7674 5.99998 20.619 5.99998L6 5.99997C4.89543 5.99997 4 6.8954 4 7.99997V16H2V7.99997C2 5.79083 3.79086 3.99997 6 3.99997H16Z"/>';
                        elements.playModeBtn.style.backgroundColor = 'transparent';
                        elements.playModeBtn.style.color = 'var(--text-secondary)';
                        break;
                    case 1: // 顺序播放
                        elements.modeIcon.innerHTML = '<path d="M17 3.99998V2.0675C17 1.79136 17.2239 1.5675 17.5 1.5675C17.617 1.5675 17.7302 1.60851 17.8201 1.68339L21.9391 5.11587C22.1512 5.29266 22.1799 5.60794 22.0031 5.82008C21.9081 5.93407 21.7674 5.99998 21.619 5.99998H2V3.99998H17ZM2 18H22V20H2V18ZM2 11H22V13H2V11Z"/>';
                        elements.playModeBtn.style.backgroundColor = 'transparent';
                        elements.playModeBtn.style.color = 'var(--text-secondary)';
                        // 移除可能存在的小圆点
                        const existingDot = elements.playModeBtn.querySelector('.loop-dot');
                        if (existingDot) {
                            existingDot.remove();
                        }
                        break;
                    case 2: // 随机播放
                        elements.modeIcon.innerHTML = '<path d="M18 17.8832V16L23 19L18 22V19.9095C14.9224 19.4698 12.2513 17.4584 11.0029 14.5453L11 14.5386L10.9971 14.5453C9.57893 17.8544 6.32508 20 2.72483 20H2V18H2.72483C5.52503 18 8.05579 16.3312 9.15885 13.7574L9.91203 12L9.15885 10.2426C8.05579 7.66878 5.52503 6 2.72483 6H2V4H2.72483C6.32508 4 9.57893 6.14557 10.9971 9.45473L11 9.46141L11.0029 9.45473C12.2513 6.5416 14.9224 4.53022 18 4.09051V2L23 5L18 8V6.11684C15.7266 6.53763 13.7737 8.0667 12.8412 10.2426L12.088 12L12.8412 13.7574C13.7737 15.9333 15.7266 17.4624 18 17.8832Z"/>';
                        elements.playModeBtn.style.backgroundColor = 'transparent';
                        elements.playModeBtn.style.color = 'var(--text-secondary)';
                        break;
                    case 3: // 单曲循环
                        elements.modeIcon.innerHTML = '<path d="M8 20V21.9325C8 22.2086 7.77614 22.4325 7.5 22.4325C7.38303 22.4325 7.26977 22.3915 7.17991 22.3166L3.06093 18.8841C2.84879 18.7073 2.82013 18.392 2.99691 18.1799C3.09191 18.0659 3.23264 18 3.38103 18L18 18C19.1046 18 20 17.1046 20 16V8H22V16C22 18.2091 20.2091 20 18 20H8ZM16 2.0675C16 1.79136 16.2239 1.5675 16.5 1.5675C16.617 1.5675 16.7302 1.60851 16.8201 1.68339L20.9391 5.11587C21.1512 5.29266 21.1799 5.60794 21.0031 5.82008C20.9081 5.93407 20.7674 5.99998 20.619 5.99998L6 6C4.89543 6 4 6.89543 4 8V16H2V8C2 5.79086 3.79086 4 6 4H16V2.0675ZM11 8H13V16H11V10H9V9L11 8Z"/>';
                        elements.playModeBtn.style.backgroundColor = 'transparent';
                        elements.playModeBtn.style.color = 'var(--text-secondary)';
                        break;
                }
            }
            
            // 分享功能
            // 显示云盘二维码
            function showCloudQRCode() {
                // 创建二维码弹窗
                const qrModal = document.createElement('div');
                qrModal.className = 'qr-modal';
                qrModal.innerHTML = `
                    <div class="qr-modal-content">
                        <div class="qr-modal-header">
                            <h3>上传歌曲至网易云盘</h3>
                            <button class="qr-modal-close">&times;</button>
                        </div>
                        <div class="qr-modal-body">
                            <img src="img/xcx.jpg" alt="云盘二维码" class="qr-code-image">
                            <p>扫码使用小程序上传歌曲</p>
                            <p><a href="https://mp.weixin.qq.com/s/pHsFSPTn3Cd7MXV81J4NHg" target="_blank">使用指南</a></p>
                        </div>
                    </div>
                `;
                
                // 添加到页面
                document.body.appendChild(qrModal);
                
                // 点击关闭按钮关闭弹窗
                const closeBtn = qrModal.querySelector('.qr-modal-close');
                closeBtn.addEventListener('click', function() {
                    // 添加关闭动画
                    const modalContent = qrModal.querySelector('.qr-modal-content');
                    modalContent.style.animation = 'modalBounceOut 0.4s ease-in forwards';
                    
                    // 延迟移除弹窗，等待动画完成
                    setTimeout(() => {
                        document.body.removeChild(qrModal);
                    }, 400);
                });
                
                // 点击弹窗外部关闭弹窗
                qrModal.addEventListener('click', function(e) {
                    if (e.target === qrModal) {
                        // 添加关闭动画
                        const modalContent = qrModal.querySelector('.qr-modal-content');
                        modalContent.style.animation = 'modalBounceOut 0.4s ease-in forwards';
                        
                        // 延迟移除弹窗，等待动画完成
                        setTimeout(() => {
                            document.body.removeChild(qrModal);
                        }, 400);
                    }
                });
            }
            
            // 事件监听器管理 - 存储所有监听器以便清理
            const eventListeners = {
                playPause: null,
                prev: null,
                next: null,
                playMode: null,
                cloud: null,
                timeupdate: null,
                progressClick: null,
                ended: null,
                albumCover: null,
                songClickDesktop: null,
                songClickMobile: null,
                lyricsToggle: null
            };
            
            // 清理所有事件监听器
            function cleanupEventListeners() {
                if (eventListeners.playPause) {
                    elements.playPauseBtn.removeEventListener('click', eventListeners.playPause);
                }
                if (eventListeners.prev) {
                    elements.prevBtn.removeEventListener('click', eventListeners.prev);
                }
                if (eventListeners.next) {
                    elements.nextBtn.removeEventListener('click', eventListeners.next);
                }
                if (eventListeners.playMode) {
                    elements.playModeBtn.removeEventListener('click', eventListeners.playMode);
                }
                if (eventListeners.cloud) {
                    elements.cloudBtn.removeEventListener('click', eventListeners.cloud);
                }
                if (eventListeners.timeupdate) {
                    elements.audioPlayer.removeEventListener('timeupdate', eventListeners.timeupdate);
                }
                if (eventListeners.progressClick) {
                    elements.progressBar.removeEventListener('click', eventListeners.progressClick);
                }
                if (eventListeners.ended) {
                    elements.audioPlayer.removeEventListener('ended', eventListeners.ended);
                }
                if (eventListeners.albumCover) {
                    elements.albumCover.removeEventListener('click', eventListeners.albumCover);
                }
                if (eventListeners.songClickDesktop) {
                    elements.songsListDesktop.removeEventListener('click', eventListeners.songClickDesktop);
                }
                if (eventListeners.songClickMobile) {
                    elements.songsListMobile.removeEventListener('click', eventListeners.songClickMobile);
                }
                
            }
            
            // 添加事件监听器
            function addEventListeners() {
                // 播放/暂停按钮
                eventListeners.playPause = () => {
                    if (elements.playPauseBtn.classList.contains('loading')) return;
                    isPlaying ? pauseSong() : playSong();
                };
                elements.playPauseBtn.addEventListener('click', eventListeners.playPause);
                
                // 控制按钮
                eventListeners.prev = prevSong;
                elements.prevBtn.addEventListener('click', eventListeners.prev);
                
                eventListeners.next = nextSong;
                elements.nextBtn.addEventListener('click', eventListeners.next);
                
                eventListeners.playMode = togglePlayMode;
                elements.playModeBtn.addEventListener('click', eventListeners.playMode);
                
                // 添加播放模式按钮的悬停效果
                elements.playModeBtn.addEventListener('mouseenter', function() {
                    // 应用与控制按钮相同的悬停效果
                    this.style.background = 'rgba(212, 175, 55, 0.15)';
                    this.style.color = 'var(--primary)';
                    this.style.border = '1px solid rgba(212, 175, 55, 0.4)';
                    this.style.boxShadow = '0 0 15px rgba(212, 175, 55, 0.3)';
                    this.style.borderRadius = 'var(--radius-md)';
                    this.style.transform = 'translateY(-2px)';
                });
                
                elements.playModeBtn.addEventListener('mouseleave', function() {
                    // 恢复默认样式
                    this.style.background = 'rgba(255, 255, 255, 0.05)';
                    this.style.color = 'var(--text-secondary)';
                    this.style.border = '1px solid rgba(212, 175, 55, 0.2)';
                    this.style.boxShadow = 'none';
                    this.style.borderRadius = 'var(--radius-md)';
                    this.style.transform = 'none';
                });
                
                eventListeners.cloud = showCloudQRCode;
                elements.cloudBtn.addEventListener('click', eventListeners.cloud);
                
                // 歌词收起按钮
                
                
                // 音频事件
                eventListeners.timeupdate = updateProgress;
                elements.audioPlayer.addEventListener('timeupdate', eventListeners.timeupdate);
                
                eventListeners.ended = () => {
                    if (playMode === 2) {
                        elements.audioPlayer.currentTime = 0;
                        playSong();
                    } else {
                        nextSong();
                    }
                };
                elements.audioPlayer.addEventListener('ended', eventListeners.ended);
                
                // 进度条点击
                eventListeners.progressClick = setProgress;
                elements.progressBar.addEventListener('click', eventListeners.progressClick);
                
                // 专辑封面点击事件已移除，只保留页面切换功能
                
                // 歌曲列表点击事件（使用事件委托）
                eventListeners.songClickDesktop = handleSongClick;
                elements.songsListDesktop.addEventListener('click', eventListeners.songClickDesktop);
                
                eventListeners.songClickMobile = handleSongClick;
                elements.songsListMobile.addEventListener('click', eventListeners.songClickMobile);
            }
            
            // 添加事件监听器
            addEventListeners();
            
            // 页面卸载时清理事件监听器防止内存泄漏
            window.addEventListener('beforeunload', cleanupEventListeners);
            
            // 初始化
            initAlbums();
            
            // 初始化移动端歌曲列表收起展开功能
            initMobileSongsToggle();
            
            // 初始化留言板展开收起功能
            if (elements.commentsToggleBtn && elements.walineContainer) {
                // 默认展开留言板
                elements.walineContainer.classList.add('show');
                const textNode = elements.commentsToggleBtn.childNodes[2]; // 获取文本节点
                textNode.textContent = ' 收起留言板 ';
                elements.commentsToggleBtn.classList.add('active');
                
                elements.commentsToggleBtn.addEventListener('click', function() {
                    const isHidden = !elements.walineContainer.classList.contains('show');
                    const textNode = elements.commentsToggleBtn.childNodes[2]; // 获取文本节点
                    
                    if (isHidden) {
                        // 展开留言板
                        elements.walineContainer.classList.add('show');
                        textNode.textContent = ' 收起留言板 ';
                        elements.commentsToggleBtn.classList.add('active');
                        
                        // 如果留言板尚未初始化，可以在这里触发初始化
                        if (!window.walineInitialized) {
                            // Waline会在其自己的脚本中初始化
                            window.walineInitialized = true;
                        }
                    } else {
                        // 收起留言板
                        elements.walineContainer.classList.remove('show');
                        textNode.textContent = ' 展开留言板 ';
                        elements.commentsToggleBtn.classList.remove('active');
                    }
                });
            }
            
            // 初始化回到顶部按钮功能
            if (elements.backToTopBtn) {
                // 监听滚动事件
                window.addEventListener('scroll', function() {
                    if (window.scrollY > 300) {
                        elements.backToTopBtn.classList.add('visible');
                    } else {
                        elements.backToTopBtn.classList.remove('visible');
                    }
                });
                
                // 点击回到顶部
                elements.backToTopBtn.addEventListener('click', function() {
                    window.scrollTo({
                        top: 0,
                        behavior: 'smooth'
                    });
                });
                
                // 键盘支持：Enter和空格键
                elements.backToTopBtn.addEventListener('keydown', function(e) {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        window.scrollTo({
                            top: 0,
                            behavior: 'smooth'
                        });
                    }
                });
            }
            
            // 默认加载第一个网易云歌单，如果没有则加载第一张专辑
            if (neteasePlaylists && neteasePlaylists.length > 0) {
                filterSongsByAlbum(neteasePlaylists[0].id);
            } else if (musicAlbums && musicAlbums.length > 0) {
                filterSongsByAlbum(musicAlbums[0].id);
            } else {
                renderSongsList();
            }
            
            // 设置初始播放模式图标为列表循环
            playMode = 0; // 确保初始为列表循环模式
            // 直接设置图标，不调用togglePlayMode()以避免改变playMode值
            elements.modeIcon.innerHTML = '<path d="M8 20V21.9324C8 22.2086 7.77614 22.4324 7.5 22.4324C7.38303 22.4324 7.26977 22.3914 7.17991 22.3165L3.06093 18.8841C2.84879 18.7073 2.82013 18.392 2.99691 18.1799C3.09191 18.0659 3.23264 18 3.38103 18L18 18C19.1046 18 20 17.1045 20 16V7.99997H22V16C22 18.2091 20.2091 20 18 20H8ZM16 3.99997V2.0675C16 1.79136 16.2239 1.5675 16.5 1.5675C16.617 1.5675 16.7302 1.60851 16.8201 1.68339L20.9391 5.11587C21.1512 5.29266 21.1799 5.60794 21.0031 5.82008C20.9081 5.93407 20.7674 5.99998 20.619 5.99998L6 5.99997C4.89543 5.99997 4 6.8954 4 7.99997V16H2V7.99997C2 5.79083 3.79086 3.99997 6 3.99997H16Z"/>';
            elements.playModeBtn.style.backgroundColor = 'transparent';
            elements.playModeBtn.style.color = 'var(--text-secondary)';
            
            // 加载第一首歌曲
            if (filteredSongs.length > 0) {
                loadSong(filteredSongs[0]);
            }
            
            // 初始化歌词功能
            initLyrics();
            
            // 初始化页面切换功能
            initPageToggle();
            
            // ===== 页面切换功能 =====
            
            // 切换页面显示
            function togglePage() {
                if (currentPage === 'cover') {
                    // 切换到歌词页面
                    elements.coverPage.classList.remove('active');
                    elements.lyricsPage.classList.add('active');
                    currentPage = 'lyrics';
                } else {
                    // 切换到封面页面
                    elements.lyricsPage.classList.remove('active');
                    elements.coverPage.classList.add('active');
                    currentPage = 'cover';
                }
            }
            
            // 初始化页面切换功能
            function initPageToggle() {
                if (!elements.albumCover || !elements.coverPage || !elements.lyricsPage) return;
                
                // 点击专辑封面切换页面
                elements.albumCover.addEventListener('click', function() {
                    togglePage();
                });
                
                // 点击LRC指示器切换页面
                const lyricsIndicator1 = document.getElementById('lyrics-indicator');
                const lyricsIndicator2 = document.getElementById('lyrics-indicator-2');
                
                if (lyricsIndicator1) {
                    lyricsIndicator1.addEventListener('click', function() {
                        // 只在封面页面时切换
                        if (currentPage === 'cover') {
                            togglePage();
                        }
                    });
                }
                
                if (lyricsIndicator2) {
                    lyricsIndicator2.addEventListener('click', function() {
                        // 只在封面页面时切换
                        if (currentPage === 'cover') {
                            togglePage();
                        }
                    });
                }
                
                // 点击歌词页面也可以切换回封面页面，但排除进度条区域
                elements.lyricsPage.addEventListener('click', function(e) {
                    // 检查点击事件是否来自进度条或其子元素
                    if (currentPage === 'lyrics') {
                        const progressBar = document.getElementById('progress-bar');
                        const progressContainer = document.querySelector('.progress-container');
                        
                        // 如果点击的是进度条或进度条容器，不切换页面
                        if (e.target === progressBar || 
                            e.target === progressContainer || 
                            progressBar.contains(e.target) || 
                            progressContainer.contains(e.target)) {
                            return;
                        }
                        
                        // 否则切换页面
                        togglePage();
                    }
                });
                
                // 初始化页面状态
                elements.coverPage.classList.add('active');
                elements.lyricsPage.classList.remove('active');
                currentPage = 'cover';
            }
            
            // ===== 歌词功能 =====
            
            // 解析LRC歌词文件
            function parseLRC(lrcText) {
                const lines = lrcText.split('\n');
                const lyrics = [];
                
                for (let i = 0; i < lines.length; i++) {
                    const line = lines[i].trim();
                    if (!line) continue;
                    
                    // 匹配时间标签和歌词内容 [mm:ss.xx]歌词内容 或 [mm:ss]歌词内容
                    // 改进正则表达式，使其更灵活地匹配各种格式
                    const timeMatch = line.match(/\[(\d{1,2}):(\d{1,2})(?:\.(\d{2,3}))?\](.*)/);
                    if (timeMatch) {
                        const minutes = parseInt(timeMatch[1]);
                        const seconds = parseInt(timeMatch[2]);
                        // 处理毫秒，可能是2位或3位
                        let milliseconds = 0;
                        if (timeMatch[3]) {
                            if (timeMatch[3].length === 2) {
                                milliseconds = parseInt(timeMatch[3]) * 10;
                            } else {
                                milliseconds = parseInt(timeMatch[3]);
                            }
                        }
                        const text = timeMatch[4].trim();
                        
                        const time = minutes * 60 + seconds + milliseconds / 1000;
                        
                        // 添加所有行，即使歌词内容为空
                        lyrics.push({
                            time: time,
                            text: text || '♪' // 如果歌词为空，使用音乐符号代替
                        });
                    }
                }
                
                // 按时间排序
                lyrics.sort((a, b) => a.time - b.time);
                
                return lyrics;
            }
            
            // 加载歌词文件
            async function loadLyrics(songName, albumId) {
                // 重置歌词状态
                currentLyrics = [];
                currentLyricIndex = -1;
                
                // 清空歌词显示
                if (elements.lyricsContent) {
                    elements.lyricsContent.innerHTML = '<div class="lyrics-empty">加载歌词中...</div>';
                }
                
                try {
                    // 检查是否是网易云歌单
                    const isNeteaseAlbum = neteasePlaylists && neteasePlaylists.some(playlist => playlist.id === albumId);
                    
                    if (isNeteaseAlbum) {
                        // 对于网易云歌单，尝试从API获取歌词
                        await loadNeteaseLyrics(songName);
                    } else {
                        // 对于本地专辑，从lrc文件夹加载
                        await loadLocalLyrics(songName, albumId);
                    }
                    
                    // 如果没有加载到歌词，显示提示
                    if (currentLyrics.length === 0) {
                        if (elements.lyricsContent) {
                            elements.lyricsContent.innerHTML = '<div class="lyrics-empty">暂无歌词</div>';
                        }
                    }
                } catch (error) {
                    console.error('加载歌词失败:', error);
                    if (elements.lyricsContent) {
                        elements.lyricsContent.innerHTML = '<div class="lyrics-empty">歌词加载失败</div>';
                    }
                }
            }
            
            // 加载网易云歌词
            async function loadNeteaseLyrics(songName) {
                try {
                    // 获取当前播放的歌曲信息
                    const currentSong = filteredSongs[currentSongIndex];
                    if (!currentSong) {
                        throw new Error('无法获取当前歌曲信息');
                    }
                    
                    console.log('当前歌曲信息:', currentSong);
                    
                    // 检查歌曲对象中是否直接包含歌词URL
                    if (currentSong.lrc) {
                        console.log('使用歌曲对象中的歌词URL:', currentSong.lrc);
                        const lyricResponse = await fetch(currentSong.lrc);
                        const lyricText = await lyricResponse.text();
                        
                        if (lyricText && lyricText.trim() !== '' && !lyricText.includes('error') && !lyricText.includes('暂无歌词')) {
                            currentLyrics = parseLRC(lyricText);
                            console.log(`成功加载歌词，歌词行数: ${currentLyrics.length}`);
                            renderLyrics();
                            return;
                        }
                    }
                    
                    // 如果没有直接歌词URL，使用歌曲ID获取歌词
                    let songId = currentSong.neteaseId;
                    
                    // 如果没有保存的ID，则通过搜索API获取
                    if (!songId) {
                        console.log('未找到保存的歌曲ID，通过搜索API获取');
                        const searchUrl = `https://music.zhheo.com/meting-api/?server=netease&type=search&id=${encodeURIComponent(songName)}`;
                        
                        const searchResponse = await fetch(searchUrl);
                        const searchData = await searchResponse.json();
                        
                        if (!searchData || searchData.length === 0) {
                            throw new Error('未找到歌曲信息');
                        }
                        
                        // 获取第一个匹配的歌曲ID
                        songId = searchData[0].id;
                        
                        if (!songId) {
                            throw new Error('无法获取歌曲ID');
                        }
                    }
                    
                    console.log(`获取歌词，歌曲ID: ${songId}`);
                    
                    // 使用歌曲ID获取歌词
                    const lyricUrl = `https://music.zhheo.com/meting-api/?server=netease&type=lrc&id=${songId}`;
                    
                    const lyricResponse = await fetch(lyricUrl);
                    const lyricText = await lyricResponse.text();
                    
                    // 检查返回的内容是否是有效的歌词
                    if (!lyricText || lyricText.trim() === '' || lyricText.includes('error') || lyricText.includes('暂无歌词')) {
                        // 如果没有歌词，尝试使用备用API
                        console.log('主API无歌词，尝试备用API');
                        const backupLyricUrl = `https://api.injahow.cn/meting/?type=lrc&id=${songId}`;
                        const backupResponse = await fetch(backupLyricUrl);
                        const backupText = await backupResponse.text();
                        
                        if (!backupText || backupText.trim() === '' || backupText.includes('error') || backupText.includes('暂无歌词')) {
                            throw new Error('该歌曲暂无歌词');
                        }
                        
                        currentLyrics = parseLRC(backupText);
                    } else {
                        currentLyrics = parseLRC(lyricText);
                    }
                    
                    console.log(`成功加载歌词，歌词行数: ${currentLyrics.length}`);
                    renderLyrics();
                } catch (error) {
                    console.error('加载网易云歌词失败:', error);
                    // 显示错误信息
                    if (elements.lyricsContent) {
                        elements.lyricsContent.innerHTML = `<div class="lyrics-empty">歌词加载失败: ${error.message}</div>`;
                    }
                    throw error;
                }
            }
            
            // 加载本地歌词文件
            async function loadLocalLyrics(songName, albumId) {
                try {
                    console.log(`尝试加载歌词: 歌曲名=${songName}, 专辑ID=${albumId}`);
                    
                    // 获取专辑名称
                    let albumName = '';
                    if (albumId === 'dy') {
                        albumName = '2024 In Tokyo live';
                    } else if (albumId === 'yq') {
                        albumName = '1701';
                    } else if (albumId === 'gs') {
                        albumName = '勾三搭四';
                    } else if (albumId === 'io') {
                        albumName = 'IO';
                    } else if (albumId === 'kj') {
                        albumName = '看见';
                    } else if (albumId === 'bjb') {
                        albumName = '北京不插电';
                    } else if (albumId === 'fg') {
                        albumName = '梵高先生';
                    } else if (albumId === 'bjj') {
                        albumName = '被禁忌的游戏';
                    } else if (albumId === 'gt') {
                        albumName = '工体东路没有人';
                    } else if (albumId === 'im') {
                        albumName = 'IMAGINE';
                    } else if (albumId === 'nh') {
                        albumName = '你好，郑州';
                    } else if (albumId === 'dj') {
                        albumName = '动静';
                    } else if (albumId === 'gj') {
                        albumName = '108个关键词';
                    } else if (albumId === 'zg') {
                        albumName = '这个世界会好吗';
                    } else if (albumId === 'zy') {
                        albumName = '在每一条伤心的应天大街上';
                    } else if (albumId === 'wa') {
                        albumName = '我爱南京';
                    } else if (albumId === 'ej') {
                        albumName = '二零零九年十月十六日事件';
                    } else if (albumId === 'dyy') {
                        albumName = '电声与管弦乐';
                    } else if (albumId === 'dye') {
                        albumName = '电声与管弦乐II';
                    } else if (albumId === 'js') {
                        albumName = '爵士乐与不插电';
                    } else if (albumId === '8') {
                        albumName = '8';
                    } else if (albumId === 'f') {
                        albumName = 'F';
                    } else if (albumId === '洗心革面') {
                        albumName = '洗心革面';
                    } else if (albumId === 'xx') {
                        albumName = '洗心革面';
                    }
                    
                    if (!albumName) {
                        throw new Error(`未知专辑: ${albumId}`);
                    }
                    
                    // 构建歌词文件路径，首先尝试标准文件名
                    let lrcPath = `lrc/${albumName}/${songName}.lrc`;
                    console.log(`歌词文件路径: ${lrcPath}`);
                    
                    // 尝试加载歌词文件 - 添加Cloudflare Pages兼容性
                    let response;
                    try {
                        // 首先尝试相对路径
                        response = await fetch(lrcPath);
                        
                        // 如果相对路径失败，尝试绝对路径（针对Cloudflare Pages）
                        if (!response.ok) {
                            const absolutePath = window.location.origin + '/' + lrcPath;
                            console.log(`尝试绝对路径: ${absolutePath}`);
                            response = await fetch(absolutePath);
                        }
                        
                        // 如果绝对路径也失败，尝试基于当前页面路径构建路径（Cloudflare Pages可能部署在子路径）
                        if (!response.ok) {
                            const basePath = window.location.pathname.split('/').slice(0, -1).join('/');
                            const basePathLrc = basePath + '/' + lrcPath;
                            console.log(`尝试基于页面路径: ${basePathLrc}`);
                            response = await fetch(basePathLrc);
                        }
                        
                        // 添加缓存破坏参数，避免Cloudflare缓存问题
                        if (!response.ok) {
                            const cacheBusterPath = lrcPath + '?t=' + Date.now();
                            console.log(`尝试带缓存破坏参数: ${cacheBusterPath}`);
                            response = await fetch(cacheBusterPath);
                        }
                    } catch (fetchError) {
                        console.warn(`歌词文件加载失败: ${fetchError.message}`);
                        response = { ok: false, status: 404 };
                    }
                    
                    // 如果标准文件名不存在，尝试一些特殊处理
                    if (!response.ok) {
                        // 特殊处理勾三搭四专辑中的复合文件名
                        if (albumName === '勾三搭四') {
                            // 尝试查找包含歌曲名的复合文件
                            const specialFiles = [
                                '你的早晨&天空之城&暧昧',
                                '杭州&我们不能失去信仰'
                            ];
                            
                            for (const specialFile of specialFiles) {
                                if (specialFile.includes(songName)) {
                                    lrcPath = `lrc/${albumName}/${specialFile}.lrc`;
                                    console.log(`尝试特殊歌词文件路径: ${lrcPath}`);
                                    
                                    // 使用相同的Cloudflare Pages兼容性逻辑
                                    try {
                                        response = await fetch(lrcPath);
                                        if (!response.ok) {
                                            const absolutePath = window.location.origin + '/' + lrcPath;
                                            response = await fetch(absolutePath);
                                        }
                                        if (!response.ok) {
                                            const basePath = window.location.pathname.split('/').slice(0, -1).join('/');
                                            const basePathLrc = basePath + '/' + lrcPath;
                                            response = await fetch(basePathLrc);
                                        }
                                        if (!response.ok) {
                                            const cacheBusterPath = lrcPath + '?t=' + Date.now();
                                            response = await fetch(cacheBusterPath);
                                        }
                                        if (response.ok) break;
                                    } catch (error) {
                                        console.warn(`特殊歌词文件加载失败: ${error.message}`);
                                    }
                                }
                            }
                        }
                        
                        // 如果仍然没有找到，尝试处理一些特殊字符
                        if (!response.ok) {
                            // 处理特殊字符，比如将"（"替换为"("
                            let modifiedSongName = songName.replace(/（/g, '(').replace(/）/g, ')');
                            if (modifiedSongName !== songName) {
                                lrcPath = `lrc/${albumName}/${modifiedSongName}.lrc`;
                                console.log(`尝试修改后的歌词文件路径: ${lrcPath}`);
                                
                                // 使用相同的Cloudflare Pages兼容性逻辑
                                try {
                                    response = await fetch(lrcPath);
                                    if (!response.ok) {
                                        const absolutePath = window.location.origin + '/' + lrcPath;
                                        response = await fetch(absolutePath);
                                    }
                                    if (!response.ok) {
                                        const basePath = window.location.pathname.split('/').slice(0, -1).join('/');
                                        const basePathLrc = basePath + '/' + lrcPath;
                                        response = await fetch(basePathLrc);
                                    }
                                    if (!response.ok) {
                                        const cacheBusterPath = lrcPath + '?t=' + Date.now();
                                        response = await fetch(cacheBusterPath);
                                    }
                                } catch (error) {
                                    console.warn(`修改后的歌词文件加载失败: ${error.message}`);
                                }
                            }
                        }
                        
                        // 如果仍然失败，尝试URL编码文件名（针对GitHub Pages）
                        if (!response.ok) {
                            const encodedSongName = encodeURIComponent(songName);
                            const encodedAlbumName = encodeURIComponent(albumName);
                            lrcPath = `lrc/${encodedAlbumName}/${encodedSongName}.lrc`;
                            console.log(`尝试URL编码后的歌词文件路径: ${lrcPath}`);
                            
                            try {
                                response = await fetch(lrcPath);
                                if (!response.ok) {
                                    const absolutePath = window.location.origin + '/' + lrcPath;
                                    response = await fetch(absolutePath);
                                }
                                if (!response.ok) {
                                    const basePath = window.location.pathname.split('/').slice(0, -1).join('/');
                                    const basePathLrc = basePath + '/' + lrcPath;
                                    response = await fetch(basePathLrc);
                                }
                                if (!response.ok) {
                                    const cacheBusterPath = lrcPath + '?t=' + Date.now();
                                    response = await fetch(cacheBusterPath);
                                }
                            } catch (error) {
                                console.warn(`URL编码后的歌词文件加载失败: ${error.message}`);
                            }
                        }
                    }
                    
                    // 如果还是没有找到歌词文件，记录警告并返回空歌词
                    if (!response.ok) {
                        console.warn(`歌词文件不存在: ${lrcPath}, 状态码: ${response.status}`);
                        currentLyrics = [];
                        renderLyrics();
                        return;
                    }
                    
                    const lrcText = await response.text();
                    console.log(`歌词文件内容长度: ${lrcText.length}`);
                    
                    if (!lrcText || lrcText.trim() === '') {
                        console.warn(`歌词文件为空: ${lrcPath}`);
                        currentLyrics = [];
                        renderLyrics();
                        return;
                    }
                    
                    currentLyrics = parseLRC(lrcText);
                    console.log(`解析后的歌词数量: ${currentLyrics.length}`);
                    console.log(`解析后的歌词内容:`, currentLyrics);
                    
                    renderLyrics();
                } catch (error) {
                    console.error('加载本地歌词失败:', error);
                    // 不要抛出错误，而是显示空歌词
                    currentLyrics = [];
                    renderLyrics();
                }
            }
            
            // 更新LRC歌词指示器状态
            function updateLyricsIndicator() {
                const indicator1 = document.getElementById('lyrics-indicator');
                const indicator2 = document.getElementById('lyrics-indicator-2');
                
                // 检查是否有歌词（排除空歌词或纯音乐的情况）
                const hasLyrics = currentLyrics.length > 0 && 
                    !(currentLyrics.length === 1 && currentLyrics[0].text === '♪') &&
                    !(currentLyrics.length === 1 && currentLyrics[0].text === '纯音乐') &&
                    !(currentLyrics.length === 1 && currentLyrics[0].text === '无歌词');
                
                if (indicator1) {
                    if (hasLyrics) {
                        indicator1.classList.add('active');
                        indicator1.title = '有歌词';
                    } else {
                        indicator1.classList.remove('active');
                        indicator1.title = '无歌词';
                    }
                }
                
                if (indicator2) {
                    if (hasLyrics) {
                        indicator2.classList.add('active');
                        indicator2.title = '有歌词';
                    } else {
                        indicator2.classList.remove('active');
                        indicator2.title = '无歌词';
                    }
                }
            }
            
            // 渲染歌词
            function renderLyrics() {
                if (!elements.lyricsContent) return;
                
                // 移除之前的single-line类
                elements.lyricsContent.classList.remove('single-line');
                
                // 更新LRC歌词指示器状态
                updateLyricsIndicator();
                
                if (currentLyrics.length === 0) {
                    elements.lyricsContent.innerHTML = '<div class="lyrics-empty">暂无歌词</div>';
                    return;
                }
                
                // 检测是否只有一句歌词或纯音乐
                const isSingleLine = currentLyrics.length === 1 || 
                    (currentLyrics.length === 2 && currentLyrics[1].text === '♪') ||
                    (currentLyrics.length === 2 && currentLyrics[1].text === '纯音乐') ||
                    (currentLyrics.length === 2 && currentLyrics[1].text === '无歌词');
                
                // 如果是只有一句歌词或纯音乐，添加single-line类
                if (isSingleLine) {
                    elements.lyricsContent.classList.add('single-line');
                }
                
                let lyricsHTML = '';
                for (let i = 0; i < currentLyrics.length; i++) {
                    lyricsHTML += `<div class="lyrics-line" data-index="${i}" data-time="${currentLyrics[i].time}">${currentLyrics[i].text}</div>`;
                }
                
                elements.lyricsContent.innerHTML = lyricsHTML;
                
                // 重置当前歌词索引
                currentLyricIndex = -1;
                
                // 如果正在播放，立即同步歌词
                if (isPlaying) {
                    syncLyrics();
                }
            }
            
            // 同步歌词
            function syncLyrics() {
                if (!elements.audioPlayer || currentLyrics.length === 0) return;
                
                const currentTime = elements.audioPlayer.currentTime;
                let newLyricIndex = -1;
                
                // 找到当前时间对应的歌词行
                for (let i = currentLyrics.length - 1; i >= 0; i--) {
                    if (currentTime >= currentLyrics[i].time) {
                        newLyricIndex = i;
                        break;
                    }
                }
                
                // 如果歌词行有变化，更新显示
                if (newLyricIndex !== currentLyricIndex) {
                    // 移除所有歌词行的特殊样式
                    const allLyricLines = elements.lyricsContent.querySelectorAll('.lyrics-line');
                    allLyricLines.forEach(line => {
                        line.classList.remove('active', 'past', 'next', 'past-1', 'past-2', 'past-3', 'next-1', 'next-2', 'next-3');
                    });
                    
                    // 添加新的当前行样式
                    if (newLyricIndex >= 0) {
                        const currentLine = elements.lyricsContent.querySelector(`.lyrics-line[data-index="${newLyricIndex}"]`);
                        if (currentLine) {
                            currentLine.classList.add('active');
                            
                            // 为已播放的歌词添加透明度层级
                            for (let i = 1; i <= 3; i++) {
                                const pastLineIndex = newLyricIndex - i;
                                if (pastLineIndex >= 0) {
                                    const pastLine = elements.lyricsContent.querySelector(`.lyrics-line[data-index="${pastLineIndex}"]`);
                                    if (pastLine) {
                                        pastLine.classList.add(`past-${i}`);
                                    }
                                }
                            }
                            
                            // 为即将播放的歌词添加透明度层级
                            for (let i = 1; i <= 3; i++) {
                                const nextLineIndex = newLyricIndex + i;
                                if (nextLineIndex < currentLyrics.length) {
                                    const nextLine = elements.lyricsContent.querySelector(`.lyrics-line[data-index="${nextLineIndex}"]`);
                                    if (nextLine) {
                                        nextLine.classList.add(`next-${i}`);
                                    }
                                }
                            }
                            
                            // 滚动到当前歌词行 - 只在歌词容器内滚动
                            const lyricsContainer = elements.lyricsContent;
                            const containerHeight = lyricsContainer.clientHeight;
                            const lineHeight = currentLine.clientHeight;
                            const lineOffsetTop = currentLine.offsetTop;
                            
                            // 计算滚动位置，使当前行居中
                            const scrollTo = lineOffsetTop - (containerHeight / 2) + (lineHeight / 2);
                            
                            // 使用scrollTop而不是scrollIntoView，避免影响整个页面
                            lyricsContainer.scrollTop = scrollTo;
                        }
                    }
                    
                    currentLyricIndex = newLyricIndex;
                }
            }
            
            
            
            // 初始化歌词功能
            function initLyrics() {
                // 歌词功能已初始化，无需收起展开功能
            }
            
            // 初始化歌词功能
            initLyrics();
        });
