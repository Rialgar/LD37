function Enemy(x, y, ctx){
    this.x = x;
    this.y = y;
    this.ctx = ctx;

    this.radius = 4;
    this.moveDir = Math.random() > 0.5 ? 1 : -1;

    this.grains = [];
    for (var dx = -this.radius; dx <= this.radius; dx++){
        for (var dy = -this.radius; dy <= this.radius; dy++){
            if( dx*dx + dy*dy <= this.radius*this.radius){
                this.grains.push({
                    x: dx,
                    y: dy,
                    r: 0,
                    g: 255,
                    b: 0
                })
            }
        }
    }

    this.wasKilled = false;
}

Enemy.prototype.disanceToSq = function(x, y){
    var dx = this.x - x;
    var dy = this.y - y;
    return dx*dx + dy*dy;
};

Enemy.prototype.move = function(grains, bullets){
    if(this.wasKilled){
        throw new Error('This enemy was killed and shoult have been destroyed!');
    }
    this.x += this.moveDir;
    if(this.x < this.radius){
        this.x = this.radius;
        this.moveDir = 1;
    } else if(this.x >= this.ctx.canvas.width - this.radius){
        this.x = this.ctx.canvas.width - this.radius - 1;
        this.moveDir = -1;
    }
    for(var i = 0; i < bullets.length; i++){
        var bullet = bullets[i];
        if(this.disanceToSq(bullet.x, bullet.y) < (this.radius+2) * (this.radius+2)){
            this.wasKilled = true;
            bullet.hitEnemy = true;
            break;
        }
    }
};

Enemy.prototype.draw = function(drawOffset){
    var tx = Math.round(this.x - this.radius);
    var ty = Math.round(this.ctx.canvas.height - 1 - (this.y - drawOffset));
    var imageData = this.ctx.getImageData(tx, ty, 2*this.radius+1, 2*this.radius+1);
    var self = this;
    this.grains.forEach(function(grain){
        var y = self.radius - grain.y;
        var x = grain.x + self.radius;
        var base = (y * imageData.width + x) * 4;
        imageData.data[base] = grain.r;
        imageData.data[base+1] = grain.g;
        imageData.data[base+2] = grain.b;
        imageData.data[base+3] = 255;
    });
    this.ctx.putImageData(imageData, tx, ty);
};

Enemy.prototype.getGrains = function () {
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