
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
                coverImage: document.getElementById('cover-image'),
                albumCover: document.getElementById('album-cover'),
                songsListDesktop: document.getElementById('songs-list-desktop'),
                songsListMobile: document.getElementById('songs-list-mobile'),
                albumsList: document.getElementById('albums-list'),
                shareBtn: document.getElementById('share-btn'),
                mobileMenuBtn: document.getElementById('mobile-menu-btn'),
                mobileMenu: document.getElementById('mobile-menu'),
                mobileMenuClose: document.getElementById('mobile-menu-close'),
                mobileSongsCollapse: document.getElementById('mobile-songs-collapse'),
                mobileSongsContainer: document.getElementById('mobile-songs-container')
            };
            
            // 音乐播放状态
            let currentSongIndex = 0;
            let isPlaying = false;
            let playMode = 0; // 0: 顺序播放, 1: 随机播放, 2: 单曲循环, 3: 列表循环
            let currentAlbumId = null;
            let filteredSongs = window.localMusicList || [];
            
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
                
                elements.mobileSongsCollapse.addEventListener('click', function() {
                    isCollapsed = !isCollapsed;
                    
                    if (isCollapsed) {
                        elements.mobileSongsContainer.classList.add('collapsed');
                    } else {
                        elements.mobileSongsContainer.classList.remove('collapsed');
                    }
                });
                
                // 也可以点击标题区域来收起展开
                elements.mobileSongsContainer.querySelector('.songs-header').addEventListener('click', function(e) {
                    // 如果点击的是收起按钮，不触发标题点击事件
                    if (e.target.closest('.collapse-btn')) return;
                    
                    isCollapsed = !isCollapsed;
                    
                    if (isCollapsed) {
                        elements.mobileSongsContainer.classList.add('collapsed');
                    } else {
                        elements.mobileSongsContainer.classList.remove('collapsed');
                    }
                });
            }
            
            // 初始化专辑列表
            function initAlbums() {
                if (musicAlbums && musicAlbums.length > 0) {
                    elements.albumsList.innerHTML = '';
                    
                    musicAlbums.forEach(album => {
                        const albumItem = document.createElement('div');
                        albumItem.className = 'album-item';
                        albumItem.dataset.id = album.id;
                        
                        albumItem.innerHTML = `
                            <div class="album-image">
                                <img src="${album.cover}" alt="${album.name}">
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
                }
            }
            
            // 根据专辑过滤歌曲
            function filterSongsByAlbum(albumId) {
                if (albumId === currentAlbumId) {
                    // 如果点击的是当前专辑，则显示所有歌曲
                    currentAlbumId = null;
                    filteredSongs = [...localMusicList];
                } else {
                    // 否则显示该专辑的歌曲
                    currentAlbumId = albumId;
                    if (musicAlbums) {
                        const album = musicAlbums.find(album => album.id === albumId);
                        if (album) {
                            filteredSongs = [...album.songs];
                        }
                    }
                }
                
                // 更新歌曲列表显示
                renderSongsList();
                
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
                            <div class="song-artist-name">${song.id}</div>
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
                elements.songArtistElement.textContent = song.id;
                elements.coverImage.src = song.cover || 'img/default.jpg';
                elements.audioPlayer.src = song.src;
                
                // 更新歌曲列表中激活状态
                updateActiveSongInList();
                
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
                    case 0: // 顺序播放
                        elements.modeIcon.className = 'fa fa-list';
                        elements.playModeBtn.style.backgroundColor = 'transparent';
                        elements.playModeBtn.style.color = 'var(--text-secondary)';
                        // 移除可能存在的小圆点
                        const existingDot = elements.playModeBtn.querySelector('.loop-dot');
                        if (existingDot) {
                            existingDot.remove();
                        }
                        break;
                    case 1: // 随机播放
                        elements.modeIcon.className = 'fa fa-random';
                        elements.playModeBtn.style.backgroundColor = 'transparent';
                        elements.playModeBtn.style.color = 'var(--text-secondary)';
                        break;
                    case 2: // 单曲循环
                        elements.modeIcon.className = 'fa fa-repeat';
                        elements.playModeBtn.style.backgroundColor = 'transparent';
                        elements.playModeBtn.style.color = 'var(--text-secondary)';
                        // 添加一个小圆点表示单曲循环
                        if (!elements.playModeBtn.querySelector('.loop-dot')) {
                            const dot = document.createElement('span');
                            dot.className = 'loop-dot';
                            dot.style.cssText = 'position: absolute; width: 6px; height: 6px; background-color: var(--primary); border-radius: 50%; bottom: 8px; right: 8px;';
                            elements.playModeBtn.appendChild(dot);
                        }
                        break;
                    case 3: // 列表循环
                        // 移除单曲循环的小圆点
                        const dot = elements.playModeBtn.querySelector('.loop-dot');
                        if (dot) {
                            dot.remove();
                        }
                        elements.modeIcon.className = 'fa fa-repeat';
                        elements.playModeBtn.style.backgroundColor = 'transparent';
                        elements.playModeBtn.style.color = 'var(--text-secondary)';
                        break;
                }
            }
            
            // 分享功能
            function shareMusic() {
                // 获取当前播放歌曲的信息
                const songTitle = elements.songTitleElement.textContent;
                const songArtist = elements.songArtistElement.textContent;
                
                // 构造分享文本
                const shareText = `我正在听 ${songTitle} - ${songArtist}，来自民谣俱乐部音乐播放器`;
                
                // 尝试使用Web Share API
                if (navigator.share) {
                    navigator.share({
                        title: '民谣俱乐部音乐分享',
                        text: shareText,
                        url: window.location.href
                    }).catch(error => {
                        console.log('分享失败:', error);
                        // 如果Web Share API失败，回退到复制链接
                        copyToClipboard(shareText + ' ' + window.location.href);
                    });
                } else {
                    // 如果浏览器不支持Web Share API，回退到复制链接
                    copyToClipboard(shareText + ' ' + window.location.href);
                }
            }
            
            // 复制文本到剪贴板
            function copyToClipboard(text) {
                // 创建临时textarea元素
                const textarea = document.createElement('textarea');
                textarea.value = text;
                document.body.appendChild(textarea);
                
                // 选择并复制文本
                textarea.select();
                try {
                    const successful = document.execCommand('copy');
                    if (successful) {
                        alert('分享链接已复制到剪贴板:\n' + text);
                    } else {
                        alert('复制失败，请手动复制链接:\n' + text);
                    }
                } catch (err) {
                    alert('复制失败，请手动复制链接:\n' + text);
                }
                
                // 移除临时元素
                document.body.removeChild(textarea);
            }
            
            // 移动端菜单控制
            function toggleMobileMenu() {
                elements.mobileMenu.classList.toggle('active');
                elements.mobileMenuBtn.classList.toggle('active');
                // 为菜单项添加索引
                const menuLinks = document.querySelectorAll('.mobile-menu .nav-link');
                menuLinks.forEach((link, index) => {
                    link.style.setProperty('--index', index);
                });
            }
            
            // 事件监听器管理 - 存储所有监听器以便清理
            const eventListeners = {
                playPause: null,
                prev: null,
                next: null,
                playMode: null,
                share: null,
                timeupdate: null,
                progressClick: null,
                ended: null,
                albumCover: null,
                mobileMenuBtn: null,
                mobileMenuClose: null,
                songClickDesktop: null,
                songClickMobile: null
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
                if (eventListeners.share) {
                    elements.shareBtn.removeEventListener('click', eventListeners.share);
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
                if (eventListeners.mobileMenuBtn && elements.mobileMenuBtn) {
                    elements.mobileMenuBtn.removeEventListener('click', eventListeners.mobileMenuBtn);
                }
                if (eventListeners.mobileMenuClose && elements.mobileMenuClose) {
                    elements.mobileMenuClose.removeEventListener('click', eventListeners.mobileMenuClose);
                }
                if (eventListeners.songClickDesktop) {
                    elements.songsListDesktop.removeEventListener('click', eventListeners.songClickDesktop);
                }
                if (eventListeners.songClickMobile) {
                    elements.songsListMobile.removeEventListener('click', eventListeners.songClickMobile);
                }
                
                // 清理移动端菜单项事件监听器
                const mobileMenuItems = elements.mobileMenu.querySelectorAll('a');
                mobileMenuItems.forEach(item => {
                    item.removeEventListener('click', toggleMobileMenu);
                });
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
                
                eventListeners.share = shareMusic;
                elements.shareBtn.addEventListener('click', eventListeners.share);
                
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
                
                // 专辑封面点击
                eventListeners.albumCover = () => {
                    isPlaying ? pauseSong() : playSong();
                };
                elements.albumCover.addEventListener('click', eventListeners.albumCover);
                
                // 移动端菜单
                if (elements.mobileMenuBtn) {
                    eventListeners.mobileMenuBtn = toggleMobileMenu;
                    elements.mobileMenuBtn.addEventListener('click', eventListeners.mobileMenuBtn);
                }
                
                if (elements.mobileMenuClose) {
                    eventListeners.mobileMenuClose = toggleMobileMenu;
                    elements.mobileMenuClose.addEventListener('click', eventListeners.mobileMenuClose);
                }
                
                // 移动端菜单项点击事件
                const mobileMenuItems = elements.mobileMenu.querySelectorAll('a');
                mobileMenuItems.forEach(item => {
                    item.addEventListener('click', toggleMobileMenu);
                });
                
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
            
            // 默认加载第一张专辑
            if (musicAlbums && musicAlbums.length > 0) {
                filterSongsByAlbum(musicAlbums[0].id);
            } else {
                renderSongsList();
            }
            
            // 设置初始播放模式图标为顺序播放
            playMode = 0; // 确保初始为顺序播放模式
            elements.modeIcon.className = 'fa fa-list';
            
            // 加载第一首歌曲
            if (filteredSongs.length > 0) {
                loadSong(filteredSongs[0]);
            }
        });
   