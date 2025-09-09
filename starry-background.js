/**
 * 星空背景效果
 * @param {string} element canvas 元素
 * @param {int} width 宽
 * @param {int} height 高
 */
function xingkong(element, width, height) {
    var canvas = document.querySelector(element);
    var w = width || document.documentElement.clientWidth;
    var h = height || document.documentElement.clientHeight;
    canvas.width = w;
    canvas.height = h;
    var context = canvas.getContext("2d");
    
    // 背景
    var gradient = context.createLinearGradient(0, 0, 0, h);
    gradient.addColorStop(0, "#020107");
    gradient.addColorStop(1, "#050309");
    context.fillStyle = gradient;
    context.fillRect(0, 0, w, h);
    
    var stars = [];
    
    // 创建星星
    for (var i = 0; i < 300; i++) {
        stars.push(new star({
            x: Math.random() * w,
            y: Math.random() * h
        }));
    }
    
    // 创建流星
    for (var i = 0; i < 5; i++) {
        stars.push(new meteor());
    }
    
    function run() {
        var gradient = context.createLinearGradient(0, 0, 0, h);
        gradient.addColorStop(0, "#020107");
        gradient.addColorStop(1, "#050309");
        context.fillStyle = gradient;
        context.fillRect(0, 0, w, h);
        
        var color = "rgba(255, 255, 255, 0.8)";
        context.fillStyle = color;
        context.strokeStyle = color;
        
        for (var i = stars.length; i--;) {
            stars[i].update();
        }
        
        window.requestAnimationFrame(run);
    }
    
    run();
    
    // 星星类
    function star(c) {
        this.size = Math.random() * 1.2; // 更小的星星
        this.speed = 0.05 * Math.random() + 0.02; // 明显可见的移动速度
        this.x = c.x;
        this.y = c.y;
        this.opacity = Math.random() * 0.3 + 0.2; // 更暗的星星
        this.twinkleSpeed = 0.002 + Math.random() * 0.005; // 更少的闪烁
        this.twinkleDirection = Math.random() > 0.5 ? 1 : -1;
        
        this.reset = function() {
            this.size = 1.2 * Math.random(); // 更小的星星
            this.speed = 0.08 * Math.random() + 0.03; // 明显可见的移动速度
            this.x = w;
            this.y = Math.random() * h;
            this.opacity = Math.random() * 0.3 + 0.2; // 更暗的星星
        };
        
        this.update = function() {
            this.x -= this.speed;
            // 添加闪烁效果
            this.opacity += this.twinkleSpeed * this.twinkleDirection;
            if (this.opacity > 1 || this.opacity < 0.3) {
                this.twinkleDirection *= -1;
            }
            
            if (this.x < 0) {
                this.reset();
            } else {
                context.globalAlpha = this.opacity;
                context.beginPath();
                context.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                context.fill();
                context.globalAlpha = 1;
            }
        };
    }
    
    // 流星类
    function meteor() {
        this.reset = function() {
            this.x = Math.random() * w;
            this.y = 0;
            this.len = 50 * Math.random() + 30; // 更短的流星
            this.speed = 3 * Math.random() + 2; // 更慢的流星
            this.size = Math.random() * 0.8 + 0.3; // 更小的流星
            this.waitTime = (new Date).getTime() + 5000 * Math.random() + 2000;
            this.active = false;
            this.opacity = 0;
            this.blur = Math.random() * 2 + 1; // 添加模糊效果
        };
        
        this.update = function() {
            if (this.active == undefined) {
                this.reset();
            }
            
            if (this.active) {
                this.x -= this.speed;
                this.y += this.speed;
                
                // 流星淡入淡出效果
                if (this.opacity < 1) {
                    this.opacity += 0.05;
                }
                
                if (this.x < 0 || this.y >= h) {
                    this.reset();
                } else {
                    context.globalAlpha = this.opacity;
                    context.lineWidth = this.size;
                    
                    // 添加模糊效果
                    context.shadowBlur = this.blur;
                    context.shadowColor = 'rgba(255, 255, 255, 0.8)';
                    
                    // 创建流星渐变效果
                    var gradient = context.createLinearGradient(
                        this.x, this.y, 
                        this.x + this.len, this.y - this.len
                    );
                    gradient.addColorStop(0, "rgba(255, 255, 255, 0.7)"); // 更暗的流星
                    gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
                    
                    context.strokeStyle = gradient;
                    context.beginPath();
                    context.moveTo(this.x, this.y);
                    context.lineTo(this.x + this.len, this.y - this.len);
                    context.stroke();
                    
                    // 重置阴影
                    context.shadowBlur = 0;
                    context.globalAlpha = 1;
                }
            } else if (this.waitTime < (new Date).getTime()) {
                this.active = true;
            }
        };
    }
}

// 页面加载完成后初始化星空背景
window.addEventListener('DOMContentLoaded', () => {
    // 创建canvas元素
    var canvas = document.createElement('canvas');
    canvas.id = '_bgCanvas';
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.zIndex = '-1';
    document.body.appendChild(canvas);
    
    // 使用星空背景
    new xingkong("#_bgCanvas");
    
    // 窗口大小改变时重新初始化
    window.addEventListener('resize', function() {
        new xingkong("#_bgCanvas");
    });
});