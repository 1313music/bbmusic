// 音乐播放器加载脚本
function loadMusicPlayer() {
    // 歌单加载完成后，再加载音乐播放器
    const musicScript = document.createElement('script');
    musicScript.src = 'js/music.js?t=2025111501';
    musicScript.onload = function() {
        console.log('音乐播放器加载完成');
        // 手动触发音乐播放器初始化
        if (typeof initMusicPlayer === 'function') {
            console.log('调用initMusicPlayer函数');
            initMusicPlayer();
        }
    };
    document.head.appendChild(musicScript);
}

// 根据URL参数加载对应的歌单
document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const quality = urlParams.get('quality') || 'mp3'; // 默认为mp3
    
    // 根据音质参数加载对应的歌单
    if (quality === 'mp3') {
        // HQ模式：先加载other.js，再加载mp3list.js
        const otherScript = document.createElement('script');
        otherScript.src = 'js/other.js?t=' + Date.now();
        otherScript.onload = function() {
            console.log('other.js加载完成');
            const mp3Script = document.createElement('script');
            mp3Script.src = 'js/mp3list.js?t=2025111501';
            mp3Script.onload = function() {
                console.log('mp3list.js加载完成');
                loadMusicPlayer();
            };
            document.head.appendChild(mp3Script);
        };
        document.head.appendChild(otherScript);
    } else {
        // SQ模式：直接加载flaclist.js
        const flacScript = document.createElement('script');
        flacScript.src = 'js/flaclist.js?t=2025111501';
        flacScript.onload = function() {
            console.log('flaclist.js加载完成');
            loadMusicPlayer();
        };
        document.head.appendChild(flacScript);
    }
});
