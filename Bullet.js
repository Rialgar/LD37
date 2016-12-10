function Bullet (x, y, angle, ctx) {
    this.x = x;
    this.y = y;
    this.angle = angle;
    this.ctx = ctx;
    //TODO be built from grains passed in, not 9 new ones
    this.grains = [];
    for (var dx = -1; dx <= 1; dx++) {
        for (var dy = -1; dy <= 1; dy++) {
            this.grains.push({
                x: dx,
                y: dy,
                r: Math.floor(100 + Math.random() * 155),
                g: Math.floor(100 + Math.random() * 155),
                b: Math.floor(100 + Math.random() * 155)
            });
        }
    }

    this.canvas = document.createElement('canvas');
    this.canvas.height = 3;
    this.canvas.width = 3;
    var innerCtx = this.canvas.getContext('2d');
    var imageData = innerCtx.createImageData(3, 3);
    for (var gx = 0; gx < 3; gx++) {
        for (var gy = 0; gy < 3; gy++) {
            var base = gx * 3 + gy;
            imageData.data[base * 4] = this.grains[base].r;
            imageData.data[base * 4 + 1] = this.grains[base].g;
            imageData.data[base * 4 + 2] = this.grains[base].b;
            imageData.data[base * 4 + 3] = 255
        }
    }
    innerCtx.putImageData(imageData, 0, 0);
}

Bullet.prototype.move = function (grains) {
    if (this.hitSomething) {
        throw new Error('This bullet hit something, it should have been destroyed');
    }
    this.x -= 2 * Math.sin(this.angle);
    this.y += 2 * Math.cos(this.angle);

    if (this.x < 1) {
        this.x = 1;
        this.hitSomething = true;
    } else if (this.x > this.ctx.canvas.width - 2) {
        this.x = this.ctx.canvas.width - 2;
        this.hitSomething = true;
    }
    //TODO hitting a non-active grain should destroy it
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
            b: grain.b
        }
    })
};