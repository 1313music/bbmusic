console.log("\n %c 民谣俱乐部 1701701.xyz 无损专辑 音乐播放器 %c https://1701701.xyz \n", "color: #fadfa3; background: #030307; padding:5px 0;", "background: #fadfa3; padding:5px 0;")
var local = false;
var isScrolling = false; // 添加全局变量 isScrolling，默认为 false
var scrollTimer = null; // 添加定时器变量
var animationFrameId = null; // 添加变量用于跟踪动画帧ID

if (typeof userId === 'undefined') {
  var userId = "8865774369"; // 替换为实际的默认值
}
if (typeof userServer === 'undefined') {
  var userServer = "netease"; // 替换为实际的默认值
}
if (typeof userType === 'undefined') {
  var userType = "playlist"; // 替换为实际的默认值
}

if (typeof remoteMusic !== 'undefined' && remoteMusic) {
  fetch(remoteMusic)
    .then(response => response.json())
    .then(data => {
      if (Array.isArray(data)) {
        localMusic = data;
      }
      loadMusicScript();
    })
    .catch(error => {
      console.error('Error fetching remoteMusic:', error);
      loadMusicScript();
    });
} else {
  loadMusicScript();
}

function loadMusicScript() {
  if (typeof localMusic === 'undefined' || !Array.isArray(localMusic) || localMusic.length === 0) {
    // 如果 localMusic 为空数组或未定义，加载 Meting2.min.js
    var script = document.createElement('script');
    script.src = './js/Meting.js';
    document.body.appendChild(script);
  } else {
    // 否则加载 localEngine.js
    var script = document.createElement('script');
    script.src = './js/localEngine.js?t=' + new Date().getTime();
    document.body.appendChild(script);
    local = true;
  }
}

var volume = 0.8;

// 获取地址栏参数
// 创建URLSearchParams对象并传入URL中的查询字符串
const params = new URLSearchParams(window.location.search);

var heo = {
  // 处理滚动和触摸事件的通用方法
  handleScrollOrTouch: function(event, isTouchEvent) {
    // 检查事件的目标元素是否在相关区域内部
    let targetElement = event.target;
    let isInTargetArea = false;
    
    // 向上遍历DOM树，检查是否在目标区域内
    while (targetElement && targetElement !== document) {
      if (targetElement.classList) {
        if (isTouchEvent) {
          // 触摸事件检查 aplayer-body 或 aplayer-lrc
          if (targetElement.classList.contains('aplayer-body') || 
              targetElement.classList.contains('aplayer-lrc')) {
            isInTargetArea = true;
            break;
          }
        } else {
          // 鼠标滚轮事件只检查 aplayer-body
          if (targetElement.classList.contains('aplayer-body')) {
            isInTargetArea = true;
            break;
          }
        }
      }
      targetElement = targetElement.parentNode;
    }
    
    // 只有当在目标区域内时才改变 isScrolling
    if (isInTargetArea) {
      // 取消任何正在进行的动画
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
      
      // 设置isScrolling为true
      isScrolling = true;
      
      // 清除之前的定时器
      if(scrollTimer !== null) {
        clearTimeout(scrollTimer);
      }
      
      // 设置新的定时器，恢复isScrolling为false
      // 触摸事件给予更长的时间
      const timeoutDuration = isTouchEvent ? 4500 : 4000;
      scrollTimer = setTimeout(function() {
        isScrolling = false;
        heo.scrollLyric();
      }, timeoutDuration);
    }
  },
  
  // 初始化滚动和触摸事件
  initScrollEvents: function() {
    // 监听鼠标滚轮事件
    document.addEventListener('wheel', (event) => {
      this.handleScrollOrTouch(event, false);
    }, { passive: true });
    
    // 监听触摸滑动事件
    document.addEventListener('touchmove', (event) => {
      this.handleScrollOrTouch(event, true);
    }, { passive: true });
  },

  scrollLyric: function () {
    // 当 isScrolling 为 true 时，跳过执行
    if (isScrolling) {
      return;
    }
    
    const lrcContent = document.querySelector('.aplayer-lrc');
    const currentLyric = document.querySelector('.aplayer-lrc-current');

    if (lrcContent && currentLyric) {
      let startScrollTop = lrcContent.scrollTop;
      let targetScrollTop = currentLyric.offsetTop - (window.innerHeight - 150) * 0.3; // 目标位置在30%的dvh位置
      let distance = targetScrollTop - startScrollTop;
      let duration = 600; // 缩短动画时间以提高流畅度
      let startTime = null;

      function easeOutQuad(t) {
        return t * (2 - t);
      }

      function animateScroll(currentTime) {
        // 如果用户正在手动滚动，停止动画
        if (isScrolling) {
          animationFrameId = null;
          return;
        }
        
        if (startTime === null) startTime = currentTime;
        let timeElapsed = currentTime - startTime;
        let progress = Math.min(timeElapsed / duration, 1);
        let easeProgress = window.innerWidth < 768 ? progress : easeOutQuad(progress);
        lrcContent.scrollTop = startScrollTop + (distance * easeProgress);
        
        if (timeElapsed < duration) {
          animationFrameId = requestAnimationFrame(animateScroll);
        } else {
          animationFrameId = null;
        }
      }

      // 取消任何正在进行的动画
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
      }
      
      animationFrameId = requestAnimationFrame(animateScroll);
    }
  },

  getCustomPlayList: function () {
    const heoMusicPage = document.getElementById("heoMusic-page");
    const playlistType = params.get("type") || "playlist";

    if (params.get("id") && params.get("server")) {
      console.log("获取到自定义内容")
      var id = params.get("id")
      var server = params.get("server")
      heoMusicPage.innerHTML = `<meting-js id="${id}" server="${server}" type="${playlistType}" mutex="true" preload="auto" order="random"></meting-js>`;
    } else {
      console.log("无自定义内容")
      heoMusicPage.innerHTML = `<meting-js id="${userId}" server="${userServer}" type="${userType}" mutex="true" preload="auto" order="random"></meting-js>`;
    }
  },

  bindEvents: function () {
    var e = this;
    // 添加歌词点击件
    if (this.lrc) {
      this.template.lrc.addEventListener('click', function (event) {
        // 确保点击的是歌词 p 元素
        var target = event.target;
        if (target.tagName.toLowerCase() === 'p') {
          // 获取所有歌词元素
          var lyrics = e.template.lrc.getElementsByTagName('p');
          // 找到被点击歌词的索引
          for (var i = 0; i < lyrics.length; i++) {
            if (lyrics[i] === target) {
              // 获取对应时间并跳转
              if (e.lrc.current[i]) {
                var time = e.lrc.current[i][0];
                e.seek(time);
                if (e.paused) {
                  e.play();
                }
              }
              break;
            }
          }
        }
      });
    }
  },
  // 添加新方法处理歌词点击
  addLyricClickEvent: function () {
    const lrcContent = document.querySelector('.aplayer-lrc-contents');

    if (lrcContent) {
      lrcContent.addEventListener('click', function (event) {
        if (event.target.tagName.toLowerCase() === 'p') {
          const lyrics = lrcContent.getElementsByTagName('p');
          for (let i = 0; i < lyrics.length; i++) {
            if (lyrics[i] === event.target) {
              // 获取当前播放器实例
              const player = ap;
              // 使用播放器内部的歌词数据
              if (player.lrc.current[i]) {
                const time = player.lrc.current[i][0];
                player.seek(time);
                // 点击歌词后不再等待4s，立即跳转
                isScrolling = false;
                clearTimeout(scrollTimer);
                // 如果当前是暂停状态,则恢复播放
                if (player.paused) {
                  player.play();
                }
              }
              event.stopPropagation(); // 阻止事件冒泡
              break;
            }
          }
        }
      });
    }
  },
  setMediaMetadata: function (aplayerObj, isSongPlaying) {
    const audio = aplayerObj.list.audios[aplayerObj.list.index]
    const coverUrl = audio.cover || './img/icon.webp';
    const currentLrcElement = document.getElementById("heoMusic-page").querySelector(".aplayer-lrc-current");
    const currentLrcContent = currentLrcElement ? currentLrcElement.textContent : '';
    let songName, songArtist;

    if ('mediaSession' in navigator) {
      if (isSongPlaying && currentLrcContent) {
        songName = currentLrcContent;
        songArtist = `${audio.artist} / ${audio.name}`;
      } else {
        songName = audio.name;
        songArtist = audio.artist;
      }
      
      // 检查是否需要更新元数据，避免不必要的更新
      const currentMetadata = navigator.mediaSession.metadata;
      if (currentMetadata && 
          currentMetadata.title === songName && 
          currentMetadata.artist === songArtist && 
          currentMetadata.album === audio.album) {
        return; // 元数据没有变化，不需要更新
      }
      
      navigator.mediaSession.metadata = new MediaMetadata({
        title: songName,
        artist: songArtist,
        album: audio.album,
        artwork: [
          { src: coverUrl, sizes: '96x96', type: 'image/jpeg' },
          { src: coverUrl, sizes: '128x128', type: 'image/jpeg' },
          { src: coverUrl, sizes: '192x192', type: 'image/jpeg' },
          { src: coverUrl, sizes: '256x256', type: 'image/jpeg' },
          { src: coverUrl, sizes: '384x384', type: 'image/jpeg' },
          { src: coverUrl, sizes: '512x512', type: 'image/jpeg' }
        ]
      });
    } else {
      console.log('当前浏览器不支持 Media Session API');
      document.title = `${audio.name} - ${audio.artist}`;
    }
  },
  // 响应 MediaSession 标准媒体交互
  setupMediaSessionHandlers: function (aplayer) {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.setActionHandler('play', () => {
        aplayer.play();
      });

      navigator.mediaSession.setActionHandler('pause', () => {
        aplayer.pause();
      });

      // 移除快进快退按钮
      navigator.mediaSession.setActionHandler('seekbackward', null);
      navigator.mediaSession.setActionHandler('seekforward', null);

      // 设置上一曲下一曲按钮
      navigator.mediaSession.setActionHandler('previoustrack', () => {
        aplayer.skipBack();
      });

      navigator.mediaSession.setActionHandler('nexttrack', () => {
        aplayer.skipForward();
      });

      // 响应进度条拖动
      navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (details.fastSeek && 'fastSeek' in aplayer.audio) {
          aplayer.audio.fastSeek(details.seekTime);
        } else {
          aplayer.audio.currentTime = details.seekTime;
        }
      });

      // 更新 Media Session 元数据
      aplayer.on('loadeddata', () => {
        heo.setMediaMetadata(aplayer, false);
      });

      // 更新播放状态
      aplayer.on('play', () => {
        if ('mediaSession' in navigator) {
          navigator.mediaSession.playbackState = 'playing';
          heo.setMediaMetadata(aplayer, true);
        }
      });

      aplayer.on('pause', () => {
        if ('mediaSession' in navigator) {
          navigator.mediaSession.playbackState = 'paused';
          heo.setMediaMetadata(aplayer, false);
        }
      });

      // 优化歌词更新：使用节流函数减少更新频率
      let lastLrcUpdate = 0;
      let lastLrcContent = '';
      
      aplayer.on('timeupdate', () => {
        const now = Date.now();
        const currentLrcElement = document.getElementById("heoMusic-page").querySelector(".aplayer-lrc-current");
        const currentLrcContent = currentLrcElement ? currentLrcElement.textContent : '';
        
        // 只有当歌词变化且距离上次更新超过1秒时才更新元数据
        if (currentLrcContent !== lastLrcContent && now - lastLrcUpdate > 1000) {
          lastLrcUpdate = now;
          lastLrcContent = currentLrcContent;
          heo.setMediaMetadata(aplayer, true);
        }
      });
    }
  },
  updateThemeColorWithImage(img) {
    if (local) {
      const updateThemeColor = (colorThief) => {
        const dominantColor = colorThief.getColor(img);
        const metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (metaThemeColor) {
          // 叠加rgba(0,0,0,0.4)的效果
          const r = Math.round(dominantColor[0] * 0.6); // 原色 * 0.6 实现叠加黑色透明度0.4的效果
          const g = Math.round(dominantColor[1] * 0.6);
          const b = Math.round(dominantColor[2] * 0.6);
          metaThemeColor.setAttribute('content', `rgb(${r},${g},${b})`);
        }
      };

      if (typeof ColorThief === 'undefined') {
        const script = document.createElement('script');
        script.src = './js/color-thief.min.js';
        script.onload = () => updateThemeColor(new ColorThief());
        document.body.appendChild(script);
      } else {
        updateThemeColor(new ColorThief());
      }
    }

  },
  
  // 新增方法：将歌词滚动到顶部
  scrollLyricToTop: function() {
    const lrcContent = document.querySelector('.aplayer-lrc');
    if (lrcContent) {
      // 使用平滑滚动效果，但不过于缓慢
      lrcContent.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  },
  
  // 初始化所有事件
  init: function() {
    this.getCustomPlayList();
    this.initScrollEvents();
  },

  // 添加播放模式切换功能
  initPlayMode: function() {
    // 等待APlayer初始化完成后再处理按钮
    const checkAPlayer = setInterval(() => {
      if (typeof ap !== 'undefined' && ap.container) {
        clearInterval(checkAPlayer);
        
        // 移除原来的播放模式按钮
        const orderBtn = ap.container.querySelector('.aplayer-icon-order');
        const loopBtn = ap.container.querySelector('.aplayer-icon-loop');
        
        if (orderBtn) {
          orderBtn.style.display = 'none';
          orderBtn.remove();
        }
        
        if (loopBtn) {
          loopBtn.style.display = 'none';
          loopBtn.remove();
        }
        
        // 检查是否已经创建了我们的新按钮
        const existingModeBtn = ap.container.querySelector('.aplayer-icon-mode');
        if (!existingModeBtn) {
          // 创建播放模式按钮
          const playModeBtn = document.createElement('button');
          playModeBtn.className = 'aplayer-icon aplayer-icon-mode';
          playModeBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M8 20V21.9324C8 22.2086 7.77614 22.4324 7.5 22.4324C7.38303 22.4324 7.26977 22.3914 7.17991 22.3165L3.06093 18.8841C2.84879 18.7073 2.82013 18.392 2.99691 18.1799C3.09191 18.0659 3.23264 18 3.38103 18L18 18C19.1046 18 20 17.1045 20 16V7.99997H22V16C22 18.2091 20.2091 20 18 20H8ZM16 3.99997V2.0675C16 1.79136 16.2239 1.5675 16.5 1.5675C16.617 1.5675 16.7302 1.60851 16.8201 1.68339L20.9391 5.11587C21.1512 5.29266 21.1799 5.60794 21.0031 5.82008C20.9081 5.93407 20.7674 5.99998 20.619 5.99998L6 5.99997C4.89543 5.99997 4 6.8954 4 7.99997V16H2V7.99997C2 5.79083 3.79086 3.99997 6 3.99997H16Z"/></svg>';
          playModeBtn.title = '列表循环';
          playModeBtn.type = 'button'; // 明确指定按钮类型
          playModeBtn.setAttribute('aria-label', '播放模式切换'); // 添加可访问性标签
          
          // 将按钮添加到播放器控制栏
          const aplayerTime = ap.container.querySelector('.aplayer-time');
          if (aplayerTime) {
            aplayerTime.appendChild(playModeBtn);
          }
          
          // 播放模式状态
          let playMode = 'loop'; // loop: 列表循环, list: 列表播放, random: 随机播放, single: 单曲循环
          
          // 设置初始播放模式为列表循环
          ap.options.order = 'list';
          ap.options.loop = true;
          
          // 保存原始音频列表顺序
          const originalAudios = [...ap.list.audios];
          
          // 点击事件
          playModeBtn.addEventListener('click', function() {
            // 切换播放模式
            switch(playMode) {
              case 'loop':
                playMode = 'list';
                // 恢复原始顺序
                ap.list.audios = [...originalAudios];
                playModeBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M17 3.99998V2.0675C17 1.79136 17.2239 1.5675 17.5 1.5675C17.617 1.5675 17.7302 1.60851 17.8201 1.68339L21.9391 5.11587C22.1512 5.29266 22.1799 5.60794 22.0031 5.82008C21.9081 5.93407 21.7674 5.99998 21.619 5.99998H2V3.99998H17ZM2 18H22V20H2V18ZM2 11H22V13H2V11Z"/></svg>';
                playModeBtn.title = '列表播放';
                break;
              case 'list':
                playMode = 'random';
                // 随机排序
                ap.list.audios = [...originalAudios];
                ap.list.audios.sort(() => Math.random() - 0.5);
                playModeBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M18 17.8832V16L23 19L18 22V19.9095C14.9224 19.4698 12.2513 17.4584 11.0029 14.5453L11 14.5386L10.9971 14.5453C9.57893 17.8544 6.32508 20 2.72483 20H2V18H2.72483C5.52503 18 8.05579 16.3312 9.15885 13.7574L9.91203 12L9.15885 10.2426C8.05579 7.66878 5.52503 6 2.72483 6H2V4H2.72483C6.32508 4 9.57893 6.14557 10.9971 9.45473L11 9.46141L11.0029 9.45473C12.2513 6.5416 14.9224 4.53022 18 4.09051V2L23 5L18 8V6.11684C15.7266 6.53763 13.7737 8.0667 12.8412 10.2426L12.088 12L12.8412 13.7574C13.7737 15.9333 15.7266 17.4624 18 17.8832Z"/></svg>';
                playModeBtn.title = '随机播放';
                break;
              case 'random':
                playMode = 'single';
                // 恢复原始顺序
                ap.list.audios = [...originalAudios];
                playModeBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M8 20V21.9325C8 22.2086 7.77614 22.4325 7.5 22.4325C7.38303 22.4325 7.26977 22.3915 7.17991 22.3166L3.06093 18.8841C2.84879 18.7073 2.82013 18.392 2.99691 18.1799C3.09191 18.0659 3.23264 18 3.38103 18L18 18C19.1046 18 20 17.1046 20 16V8H22V16C22 18.2091 20.2091 20 18 20H8ZM16 2.0675C16 1.79136 16.2239 1.5675 16.5 1.5675C16.617 1.5675 16.7302 1.60851 16.8201 1.68339L20.9391 5.11587C21.1512 5.29266 21.1799 5.60794 21.0031 5.82008C20.9081 5.93407 20.7674 5.99998 20.619 5.99998L6 6C4.89543 6 4 6.89543 4 8V16H2V8C2 5.79086 3.79086 4 6 4H16V2.0675ZM11 8H13V16H11V10H9V9L11 8Z"/></svg>';
                playModeBtn.title = '单曲循环';
                break;
              case 'single':
                playMode = 'loop';
                // 恢复原始顺序
                ap.list.audios = [...originalAudios];
                playModeBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M8 20V21.9324C8 22.2086 7.77614 22.4324 7.5 22.4324C7.38303 22.4324 7.26977 22.3914 7.17991 22.3165L3.06093 18.8841C2.84879 18.7073 2.82013 18.392 2.99691 18.1799C3.09191 18.0659 3.23264 18 3.38103 18L18 18C19.1046 18 20 17.1045 20 16V7.99997H22V16C22 18.2091 20.2091 20 18 20H8ZM16 3.99997V2.0675C16 1.79136 16.2239 1.5675 16.5 1.5675C16.617 1.5675 16.7302 1.60851 16.8201 1.68339L20.9391 5.11587C21.1512 5.29266 21.1799 5.60794 21.0031 5.82008C20.9081 5.93407 20.7674 5.99998 20.619 5.99998L6 5.99997C4.89543 5.99997 4 6.8954 4 7.99997V16H2V7.99997C2 5.79083 3.79086 3.99997 6 3.99997H16Z"/></svg>';
                playModeBtn.title = '列表循环';
                break;
            }
            
            // 应用播放模式
            ap.options.order = playMode === 'random' ? 'random' : 'list';
            ap.options.loop = playMode === 'single' || playMode === 'loop';
            
            // 更新列表显示
            ap.list.update();
          });
          
          // 监听播放器事件，在歌曲结束时根据播放模式处理
          ap.on('ended', function() {
            if (playMode === 'single') {
              // 单曲循环，重新播放当前歌曲
              setTimeout(() => {
                ap.play();
              }, 500);
            }
          });
        }
      }
    }, 100);
    
    // 设置超时，避免无限等待
    setTimeout(() => {
      clearInterval(checkAPlayer);
    }, 10000); // 10秒超时
  }
}

//空格控制音乐
document.addEventListener("keydown", function (event) {
  // 检查ap变量是否已定义
  if (typeof ap === 'undefined') {
    console.warn('APlayer instance (ap) is not defined yet');
    return;
  }
  
  //暂停开启音乐
  if (event.code === "Space") {
    event.preventDefault();
    ap.toggle();

  };
  //切换下一曲
  if (event.keyCode === 39) {
    event.preventDefault();
    ap.skipForward();

  };
  //切换上一曲
  if (event.keyCode === 37) {
    event.preventDefault();
    ap.skipBack();

  }
  //增加音量
  if (event.keyCode === 38) {
    if (volume <= 1) {
      volume += 0.1;
      ap.volume(volume, true);

    }
  }
  //减小音量
  if (event.keyCode === 40) {
    if (volume >= 0) {
      volume += -0.1;
      ap.volume(volume, true);

    }
  }
});

// 监听窗口大小变化
window.addEventListener('resize', function() {
  // 检查ap变量是否已定义
  if (typeof ap === 'undefined') {
    console.warn('APlayer instance (ap) is not defined yet');
    return;
  }
  
  if (window.innerWidth > 768) {
    ap.list.show();
  } else {
    ap.list.hide();
  }
});

// 调用初始化
heo.init();

// 等待APlayer完全初始化后再初始化播放模式按钮
function waitForAPlayerAndInitPlayMode() {
  // 最大重试次数
  const maxRetries = 50; // 5秒 (50 * 100ms)
  let retryCount = 0;
  
  // 检查APlayer是否已初始化
  function checkAPlayer() {
    if (typeof ap !== 'undefined' && ap.container && ap.container.querySelector('.aplayer-time')) {
      // APlayer已初始化，初始化播放模式按钮
      heo.initPlayMode();
      console.log('播放模式按钮初始化成功');
    } else if (retryCount < maxRetries) {
      // APlayer未初始化，继续等待
      retryCount++;
      setTimeout(checkAPlayer, 100);
    } else {
      // 超时，尝试强制初始化
      console.warn('APlayer初始化超时，尝试强制初始化播放模式按钮');
      if (typeof ap !== 'undefined' && ap.container) {
        heo.initPlayMode();
      } else {
        console.error('无法初始化播放模式按钮：APlayer实例不存在');
      }
    }
  }
  
  // 开始检查
  checkAPlayer();
}

// 监听APlayer的初始化事件
document.addEventListener('DOMContentLoaded', function() {
  // 尝试监听APlayer的初始化完成事件
  if (typeof window.addEventListener === 'function') {
    window.addEventListener('aplayerReady', function() {
      console.log('检测到APlayer初始化完成事件');
      waitForAPlayerAndInitPlayMode();
    });
  }
  
  // 延迟一点时间开始检查，确保DOM已加载
  setTimeout(waitForAPlayerAndInitPlayMode, 300);
});

// 修复iPhone端切换歌曲不隐藏列表的问题
setTimeout(function() {
  if (typeof ap !== 'undefined') {
    ap.on('listswitch', function() {
      // 只在移动端（iPhone/安卓）生效，不影响电脑端
      if (window.innerWidth <= 768) {
        ap.list.hide();
      }
    });
    
    
    if (ap.list && ap.list.element) {
      // 如果列表当前是隐藏的，确保有aplayer-list-hide类
      if (ap.list.element.classList.contains('aplayer-list-hide') === false && 
          window.innerWidth <= 768 && 
          ap.list.element.style.display === 'none') {
        ap.list.element.classList.add('aplayer-list-hide');
      }
    }
  }
}, 2000); // 等待APlayer完全初始化

