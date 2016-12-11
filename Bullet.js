function Bullet (x, y, angle, inputGrains, ctx, enemyBullet) {
    this.x = x;
    this.y = y;
    this.angle = angle;
    this.ctx = ctx;

    this.canvas = CanvasProvider.getCanvas();
    this.canvas.width = 3;
    this.canvas.height = 3;
    this.innerContext = this.canvas.getContext('2d');
    this.imageData = this.innerContext.createImageData(3, 3);

    this.grains = [];
    inputGrains = inputGrains.slice();
    for (var dx = -1; dx <= 1; dx++) {
        for (var dy = -1; dy <= 1; dy++) {
            var input = inputGrains.pop();
            this.grains.push({
                x: dx,
                y: dy,
                r: input.r,
                g: input.g,
                b: input.b
            });
            var base = (((1 - dy) * this.imageData.width) + dx + 1) * 4;
            this.imageData.data[base] = input.r;
            this.imageData.data[base+1] = input.g;
            this.imageData.data[base+2] = input.b;
            this.imageData.data[base+3] = 255;
        }
    }

    this.innerContext.putImageData(this.imageData, 0, 0);

    this.age = 0;

    this.enemyBullet = !!enemyBullet;
}

Bullet.prototype.move = function (grains) {
    if (this.hitSomething) {
        throw new Error('This bullet hit something, it should have been destroyed');
    } else if (this.hitEnemy){
        this.hitSomething = true;
        return;
    }
    this.x -= 2 * Math.sin(this.angle);
    this.y += 2 * Math.cos(this.angle);

    if(this.y < 1){
        this.y = 1;
        this.hitSomething = true;
    }
    if (this.x < 1) {
        this.x = 1;
        this.hitSomething = true;
    } else if (this.x > this.ctx.canvas.width - 2) {
        this.x = this.ctx.canvas.width - 2;
        this.hitSomething = true;
    } else if(this.age > 90){
        this.hitSomething = true;
    } else {
        for (var dx = -1; dx <= 1 && !this.hitSomething; dx++) {
            for (var dy = -1; dy <= 1 && !this.hitSomething; dy++) {
                if (!grains.isFree(Math.round(this.x) + dx, Math.round(this.y) + dy)) {
                    this.hitSomething = true;
                }
            }
        }
    }
    if(this.hitSomething){
        CanvasProvider.returnCanvas(this.canvas);
    }
    this.age += 1;
};

Bullet.prototype.draw = function (drawOffset) {
    var tx = Math.round(this.x - 1);
    var ty = Math.round(this.ctx.canvas.height - 1 - (this.y - drawOffset));
    this.ctx.drawImage(this.canvas, tx, ty);
};

Bullet.prototype.getGrains = function () {
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