// 音乐播放器加载脚本
function loadMusicPlayer() {
    // 歌单加载完成后，再加载音乐播放器
    const musicScript = document.createElement('script');
    musicScript.src = 'js/music.js?t=2025120222';
    musicScript.onload = function() {
        // 手动触发音乐播放器初始化
        if (typeof initMusicPlayer === 'function') {
            initMusicPlayer();
        }
    };
    document.head.appendChild(musicScript);
}

// 根据URL参数加载对应的歌单
document.addEventListener('DOMContentLoaded', function() {
    
    console.log('\n %c 欢迎来到【民谣俱乐部】- 音乐播放器 %c https://1701701.xyz \n\n', 'color: #fadfa3; background: #030307; padding:5px 0;', 'background: #fadfa3; padding:5px 0;');
    
    const urlParams = new URLSearchParams(window.location.search);
    const quality = urlParams.get('quality') || 'mp3'; // 默认为mp3
    
    // 根据音质参数加载对应的歌单
    if (quality === 'mp3') {
        // HQ模式：先加载other.js，再加载jlp.js，最后加载mp3list.js
        const otherScript = document.createElement('script');
        otherScript.src = 'js/other.js?t=' + Date.now();
        otherScript.onload = function() {
            const jlpScript = document.createElement('script');
            jlpScript.src = 'js/jlp.js?t=' + Date.now();
            jlpScript.onload = function() {
                const mp3Script = document.createElement('script');
                mp3Script.src = 'js/mp3list.js?t=2025120222';
                mp3Script.onload = function() {
                    loadMusicPlayer();
                };
                document.head.appendChild(mp3Script);
            };
            document.head.appendChild(jlpScript);
        };
        document.head.appendChild(otherScript);
    } else {
        // SQ模式：直接加载flaclist.js
        const flacScript = document.createElement('script');
        flacScript.src = 'js/flaclist.js?t=2025120222';
        flacScript.onload = function() {
            loadMusicPlayer();
        };
        document.head.appendChild(flacScript);
    }
});
