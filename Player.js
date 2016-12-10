function Player (ctx, x, y) {
    this.x = x;
    this.y = y;
    this.ctx = ctx;

    this.canvas = document.createElement('canvas');
    this.canvas.width = 15;
    this.canvas.height = 8;
    var innerCtx = this.canvas.getContext('2d');
    var imageData = innerCtx.createImageData(this.canvas.width, this.canvas.height);
    for (var pX = 0; pX < imageData.width; pX++) {
        for (var pY = 0; pY < imageData.height; pY++) {
            var distSq = (pX - 7) * (pX - 7) + (pY - 5) * (pY - 5);
            if (pY >= 4 || distSq < 30) {
                var base = (pY * imageData.width + pX) * 4;
                imageData.data[base] = 128;
                imageData.data[base + 1] = 128;
                imageData.data[base + 2] = 128;
                imageData.data[base + 3] = 255;
            }
        }
    }
    innerCtx.putImageData(imageData, 0, 0);

    this.height = this.canvas.height;
    this.halfWidth = Math.floor(this.canvas.width / 2);

    this.aimAngle = 0;
    this.cooldown = 0;
}

Player.prototype.move = function (dx, grains) {
    this.x = Math.max(this.halfWidth, Math.min(this.ctx.canvas.width - this.halfWidth - 1, this.x + dx));
    var sum = 0;
    for (var checkX = this.x - this.halfWidth; checkX <= this.x + this.halfWidth; checkX++) {
        sum += grains.findLowestFree(checkX, this.y - 4);
    }
    this.y = Math.round(sum / (2 * this.halfWidth + 1)) + 4;
    if(this.cooldown > 0){
        this.cooldown -= 1;
    }
};

Player.prototype.draw = function (drawOffset) {
    var tx = Math.round(this.x - this.halfWidth);
    var ty = Math.round(this.ctx.canvas.height - this.height - (this.y - drawOffset - 4));
    this.ctx.drawImage(this.canvas, tx, ty);
};

Player.prototype.aim = function(angle){
    this.aimAngle = Math.min(Math.PI/2, Math.max(-Math.PI/2, angle));
};

Player.prototype.shoot = function(grains){
    if(this.cooldown <= 0) {
        var inputGrains = [];
        for(var dy = -1; dy >= -6 && inputGrains.length < 9; dy--){
            for(var dx = -this.halfWidth; dx <= this.halfWidth && inputGrains.length < 9; dx++){
                var grain = grains.getGrain(this.x+dx, this.y+dy);
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
