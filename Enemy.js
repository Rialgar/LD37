function Enemy (x, y, size, ctx) {
    this.x = x;
    this.y = y;
    this.ctx = ctx;

    this.size = size;
    this.radius = Enemy.getRadiusForSize(size);
    this.initialRadius = this.radius;
    this.moveDir = Math.random() > 0.5 ? 1 : -1;

    this.canvas = CanvasProvider.getCanvas();
    this.canvas.width = this.radius * 2 + 1;
    this.canvas.height = this.radius * 2 + 1;
    this.innerContext = this.canvas.getContext('2d');
    this.imageData = this.innerContext.getImageData(0, 0, 2 * this.radius + 1, 2 * this.radius + 1);

    this.grains = [];
    var color = Enemy.getColorForSize(size);
    for (var dx = -this.radius; dx <= this.radius; dx++) {
        for (var dy = -this.radius; dy <= this.radius; dy++) {
            if (dx * dx + dy * dy <= this.radius * this.radius) {
                var grain = {
                    x: dx,
                    y: dy,
                    r: color.r,
                    g: color.g,
                    b: color.b
                };
                this.grains.push(grain);
                var gy = this.radius - dy;
                var gx = dx + this.radius;
                var base = (gy * this.imageData.width + gx) * 4;
                this.imageData.data[base] = grain.r;
                this.imageData.data[base + 1] = grain.g;
                this.imageData.data[base + 2] = grain.b;
                this.imageData.data[base + 3] = 255;
            }
        }
    }
    this.innerContext.putImageData(this.imageData, 0, 0);

    this.lostGrains = [];

    this.wasKilled = false;
    this.wasHit = false;

    this.age = Math.round(Math.random() * 600);
    this.cooldown = Math.random() * 100 + 100;
}

Enemy.getRadiusForSize = function (size) {
    return size + 2;
};

var definedColors = [
    {r:0, g:255, b:0},
    {r:0, g:255, b:0},
    {r:255, g:0, b:0},
    {r:128, g:0, b:0},
    {r:128, g:128, b:0},
    {r:128, g:0, b:128},
    {r:0, g:128, b:128},
    {r:0, g:255, b:128},
    {r:128, g:255, b:0},
    {r:128, g:0, b:255},
    {r:255, g:0, b:255}
];

Enemy.getColorForSize = function (size) {
    while(size >= definedColors.length){
        definedColors.push({
            r: 50 + Math.random() * 205,
            g: 50 + Math.random() * 205,
            b: 50 + Math.random() * 205
        })
    }
    return definedColors[size];
};

Enemy.prototype.disanceToSq = function (x, y) {
    var dx = this.x - x;
    var dy = this.y - y;
    return dx * dx + dy * dy;
};

Enemy.prototype.move = function (grains, bullets, deathScroll) {
    if (this.wasKilled) {
        throw new Error('This enemy was killed and shoult have been destroyed!');
    }
    this.x += this.moveDir;
    if (this.x < this.radius) {
        this.x = this.radius;
        this.moveDir = 1;
    } else if (this.x >= this.ctx.canvas.width - this.radius) {
        this.x = this.ctx.canvas.width - this.radius - 1;
        this.moveDir = -1;
    }
    if(!deathScroll) {
        this.targetY = grains.drawOffset + this.ctx.canvas.height - 20 +
            Math.sin(this.age / 10 / Math.min(5, this.size + 1)) * 20;
        if (this.y < this.targetY - 1) {
            this.y += 1;
        } else if (this.y > this.targetY + 1) {
            this.y -= 1;
        }
    }
    this.age += 1;
    for (var i = 0; i < bullets.length; i++) {
        var bullet = bullets[i];
        if (!bullet.enemyBullet && !bullet.hitEnemy && this.disanceToSq(bullet.x, bullet.y) < (this.radius + 2) * (this.radius + 2)) {
            this.wasHit = true;
            bullet.hitEnemy = true;
            this.size -= 1;
            if (this.size < 0) {
                this.wasKilled = true;
                CanvasProvider.returnCanvas(this.canvas);
                this.lostGrains = this.grains;
                this.droppedPickup = 2*Math.random() + 1 < this.initialRadius / 5;
            } else {
                this.radius = Enemy.getRadiusForSize(this.size);
                var keptGrains = [];
                var lostGrains = [];
                var self = this;
                this.grains.forEach(function (grain) {
                    if (grain.x * grain.x + grain.y * grain.y > self.radius * self.radius) {
                        lostGrains.push(grain);
                        var gy = self.initialRadius - grain.y;
                        var gx = grain.x + self.initialRadius;
                        var base = (gy * self.imageData.width + gx) * 4;
                        self.imageData.data[base] = 0;
                        self.imageData.data[base + 1] = 0;
                        self.imageData.data[base + 2] = 0;
                        self.imageData.data[base + 3] = 0;
                    } else {
                        keptGrains.push(grain);
                    }
                });
                this.innerContext.putImageData(this.imageData, 0, 0);
                this.grains = keptGrains;
                this.lostGrains = lostGrains;
            }

            break;
        }
    }
};

Enemy.prototype.draw = function (drawOffset) {
    var tx = Math.round(this.x - this.initialRadius);
    var ty = Math.round(this.ctx.canvas.height - 1 - (this.y + this.initialRadius - drawOffset));
    this.ctx.drawImage(this.canvas, tx, ty);
};

Enemy.prototype.getGrains = function () {
    this.wasHit = false;
    var self = this;
    return this.lostGrains.map(function (grain) {
        return {
            x: grain.x + Math.round(self.x),
            y: grain.y + Math.round(self.y),
            r: grain.r,
            g: grain.g,
            b: grain.b,
            momentum: {
                x: grain.x,
                y: grain.y
            }
        }
    })
};

Enemy.prototype.shoot = function (player) {
    if(player.life <= 0){
        return;
    }
    if (this.cooldown <= 0 || this.age > 36000) {
        var bulletGrains = [];
        this.cooldown = 500;
        for (var i = 0; i < 9; i++) {
            bulletGrains.push({
                r: 255,
                g: 0,
                b: 0
            })
        }
        var dx = player.x - this.x;
        var dy = player.y - this.y;
        var angle = Math.atan2(-dx, dy);
        return new Bullet(this.x, this.y, angle, bulletGrains, this.ctx, true);
    } else if (this.size > 1) {
        this.cooldown -= this.size - 1;
    }
};