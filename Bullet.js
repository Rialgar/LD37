function Bullet (x, y, angle, inputGrains, ctx) {
    this.x = x;
    this.y = y;
    this.angle = angle;
    this.ctx = ctx;

    this.grains = [];
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
        }
    }
    this.age = 0;
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
    } else if(this.age > 300){
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
    this.age += 1;
};

Bullet.prototype.draw = function (drawOffset) {
    var tx = Math.round(this.x - 1);
    var ty = Math.round(this.ctx.canvas.height - 1 - (this.y - drawOffset));
    var imageData = this.ctx.getImageData(tx, ty, 3, 3);
    this.grains.forEach(function(grain){
        var y = 1 - grain.y;
        var x = grain.x+1;
        var base = (y * 3 + x) * 4;
        imageData.data[base] = grain.r;
        imageData.data[base+1] = grain.g;
        imageData.data[base+2] = grain.b;
        imageData.data[base+3] = 255;
    });
    this.ctx.putImageData(imageData, tx, ty);
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
                x: 2*grain.x,
                y: 2*grain.y
            }
        }
    })
};