function dark() {
    window.requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
    var n, e, i, h, t = .05,
        s = document.getElementById("universe"),
        o = !0,
        a = "180,184,240",
        r = "226,225,142",
        d = "226,225,224",
        c = [],
        lastTime = 0,
        targetFPS = 30,
        frameInterval = 1000 / targetFPS;

    function f() {
        if (s) {
            // 获取视口尺寸
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            
            // 设置canvas的实际尺寸
            n = viewportWidth;
            e = viewportHeight;
            i = .216 * n;
            
            // 获取设备像素比，确保canvas的清晰度
            const dpr = window.devicePixelRatio || 1;
            
            // 设置canvas的实际像素尺寸，确保清晰显示
            s.width = viewportWidth * dpr;
            s.height = viewportHeight * dpr;
            
            // 设置canvas的显示尺寸
            s.style.width = viewportWidth + 'px';
            s.style.height = viewportHeight + 'px';
            
            // 关键：设置上下文的缩放比例，确保绘制的星空清晰
            if (h) {
                h.setTransform(1, 0, 0, 1, 0, 0);
                h.scale(dpr, dpr);
            }
        }
    }

    function u() {
        if (s) {
            h.fillStyle = "#0f1117";
            h.fillRect(0, 0, n, e);
            for (var t = c.length, i = 0; i < t; i++) {
                var o = c[i];
                o.move(), o.fadeIn(), o.fadeOut(), o.draw()
            }
        }
    }

    function y() {
        this.reset = function() {
            this.giant = m(3), this.comet = !this.giant && !o && m(10), this.x = l(0, n - 10), this.y = l(0, e), this.r = l(1.1, 2.6), this.dx = l(t, 6 * t) + (this.comet + 1 - 1) * t * l(50, 120) + 2 * t, this.dy = -l(t, 6 * t) - (this.comet + 1 - 1) * t * l(50, 120), this.fadingOut = null, this.fadingIn = !0, this.opacity = 0, this.opacityTresh = l(.2, 1 - .4 * (this.comet + 1 - 1)), this.do = l(5e-4, .002) + .001 * (this.comet + 1 - 1)
        }, this.fadeIn = function() {
            this.fadingIn && (this.fadingIn = !(this.opacity > this.opacityTresh), this.opacity += this.do)
        }, this.fadeOut = function() {
            this.fadingOut && (this.fadingOut = !(this.opacity < 0), this.opacity -= this.do / 2, (this.x > n || this.y < 0) && (this.fadingOut = !1, this.reset()))
        }, this.draw = function() {
            if (h.beginPath(), this.giant) h.fillStyle = "rgba(" + a + "," + this.opacity + ")", h.arc(this.x, this.y, 2, 0, 2 * Math.PI, !1);
            else if (this.comet) {
                h.fillStyle = "rgba(" + d + "," + this.opacity + ")", h.arc(this.x, this.y, 1.5, 0, 2 * Math.PI, !1);
                for (var t = 0; t < 30; t++) h.fillStyle = "rgba(" + d + "," + (this.opacity - this.opacity / 20 * t) + ")", h.rect(this.x - this.dx / 4 * t, this.y - this.dy / 4 * t - 2, 2, 2), h.fill()
            } else h.fillStyle = "rgba(" + r + "," + this.opacity + ")", h.rect(this.x, this.y, this.r, this.r);
            h.closePath(), h.fill()
        }, this.move = function() {
            this.x += this.dx, this.y += this.dy, !1 === this.fadingOut && this.reset(), (this.x > n - n / 4 || this.y < 0) && (this.fadingOut = !0)
        }, setTimeout(function() {
            o = !1
        }, 50)
    }

    function m(t) {
        return Math.floor(1e3 * Math.random()) + 1 < 10 * t
    }

    function l(t, i) {
        return Math.random() * (i - t) + t
    }

    if (s) {
        h = s.getContext("2d");
        f();
        window.addEventListener("resize", f, !1);
        
        function getStarCount() {
            const isMobile = window.innerWidth < 768;
            return isMobile ? Math.floor(i * 0.6) : i;
        }
        
        for (var p = 0; p < getStarCount(); p++) c[p] = new y, c[p].reset();
        function g(timestamp) {
            if (!lastTime) lastTime = timestamp;
            
            const elapsed = timestamp - lastTime;
            
            if (elapsed > frameInterval) {
                lastTime = timestamp - (elapsed % frameInterval);
                u();
            }
            
            window.requestAnimationFrame(g);
        }
        g()
    }
}

// 在DOM加载完成后初始化星空背景
document.addEventListener('DOMContentLoaded', function() {
    dark();
});