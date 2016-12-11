function Player (ctx, x, y) {
    this.x = x;
    this.y = y;
    this.ctx = ctx;
    this.grains = [];

    this.canvas = CanvasProvider.getCanvas();
    this.canvasHit = CanvasProvider.getCanvas();
    this.canvas.width = 15;
    this.canvas.height = 8;
    var innerCtx = this.canvas.getContext('2d');
    var innerCtxHit = this.canvasHit.getContext('2d');
    var imageData = innerCtx.createImageData(this.canvas.width, this.canvas.height);
    var imageDataHit = innerCtxHit.createImageData(this.canvas.width, this.canvas.height);
    for (var pX = 0; pX < imageData.width; pX++) {
        for (var pY = 0; pY < imageData.height; pY++) {
            var distSq = (pX - 7) * (pX - 7) + (pY - 5) * (pY - 5);
            if (pY >= 4 || distSq < 30) {
                var base = (pY * imageData.width + pX) * 4;
                imageData.data[base] = 128;
                imageData.data[base + 1] = 128;
                imageData.data[base + 2] = 128;
                imageData.data[base + 3] = 255;

                imageDataHit.data[base] = 255;
                imageDataHit.data[base + 1] = 0;
                imageDataHit.data[base + 2] = 0;
                imageDataHit.data[base + 3] = 255;

                this.grains.push({
                    x: pX - 7,
                    y: 4 - pY,
                    r: 128,
                    g: 128,
                    b: 128
                })
            }
        }
    }
    innerCtx.putImageData(imageData, 0, 0);
    innerCtxHit.putImageData(imageDataHit, 0, 0);

    this.height = this.canvas.height;
    this.halfWidth = Math.floor(this.canvas.width / 2);

    this.aimAngle = 0;
    this.cooldown = 0;

    this.floatingAverage = 0;
    this.life = 10;
}

Player.prototype.disanceToSq = function (x, y) {
    var dx = this.x - x;
    var dy = this.y - y;
    return dx * dx + dy * dy;
};

Player.prototype.move = function (dx, grains, bullets) {
    this.x = Math.max(this.halfWidth, Math.min(this.ctx.canvas.width - this.halfWidth - 1, this.x + dx));
    var sum = 0;
    for (var checkX = this.x - this.halfWidth; checkX <= this.x + this.halfWidth; checkX++) {
        sum += grains.findLowestFree(Math.round(checkX), this.y - 4);
    }
    this.y = Math.round(sum / (2 * this.halfWidth + 1)) + 4;
    if(this.cooldown > 0){
        this.cooldown -= 1;
    }
    this.floatingAverage = (60*this.floatingAverage + this.y)/61;
    for (var i = 0; i < bullets.length; i++) {
        var bullet = bullets[i];
        if (bullet.enemyBullet && !bullet.hitEnemy && this.disanceToSq(bullet.x, bullet.y) < 9) {
            this.hitAnimationTime = 5;
            this.life -= 1;
            bullet.hitEnemy = true;
            break;
        }
    }
};

Player.prototype.draw = function (drawOffset) {
    var tx = Math.round(this.x - this.halfWidth);
    var ty = Math.round(this.ctx.canvas.height - this.height - (this.y - drawOffset - 4));
    if(this.hitAnimationTime > 0){
        this.ctx.drawImage(this.canvasHit, tx, ty);
        this.hitAnimationTime -= 1;
    } else {
        this.ctx.drawImage(this.canvas, tx, ty);
    }
};

Player.prototype.aim = function(angle){
    this.aimAngle = Math.min(Math.PI/2, Math.max(-Math.PI/2, angle));
};

Player.prototype.shoot = function(grains){
    var roundX = Math.round(this.x);
    var roundY = Math.round(this.y);
    if(this.cooldown <= 0) {
        var inputGrains = [];
        for(var dy = -1; dy >= -6 && inputGrains.length < 9; dy--){
            for(var dx = -this.halfWidth; dx <= this.halfWidth && inputGrains.length < 9; dx++){
                var grain = grains.getGrain(roundX+dx, roundY+dy);
                if(grain){
                    inputGrains.push(grain);
                }
            }
        }
        if(inputGrains.length === 9){
            inputGrains.forEach(grains.removeGrain.bind(grains));
            this.cooldown = 15;
            return new Bullet(this.x, this.y, this.aimAngle, inputGrains, this.ctx);
        }
    }
};

Player.prototype.getGrains = function () {
    var self = this;
    return this.grains.map(function (grain) {
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

