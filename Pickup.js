function Pickup(x, y, ctx){
    this.x = x;
    this.y = y;
    this.ctx = ctx;

    this.canvas = CanvasProvider.getCanvas();
    this.canvas.width = 9;
    this.canvas.height = 9;

    this.halfWidth = 4;
    this.halfHeight = 4;

    this.innerContext = this.canvas.getContext('2d');
    this.imageData = this.innerContext.createImageData(9, 9);

    this.grains = [];

    var self = this;
    function putPixel(x, y, r, g, b){
        var base = (((self.imageData.height - 1 - y) * self.imageData.width) + x) * 4;
        self.imageData.data[base] = r;
        self.imageData.data[base+1] = g;
        self.imageData.data[base+2] = b;
        self.imageData.data[base+3] = 255;
    }

    putPixel(2, 0 , 128, 128, 128);
    putPixel(3, 0 , 128, 128, 128);
    putPixel(4, 0 , 128, 128, 128);
    putPixel(5, 0 , 128, 128, 128);
    putPixel(6, 0 , 128, 128, 128);

    putPixel(3, 1 , 128, 128, 128);
    putPixel(4, 1 , 128, 128, 128);
    putPixel(5, 1 , 128, 128, 128);

    putPixel(0, 2 , 232, 117, 19);
    putPixel(2, 2 , 232, 117, 19);
    putPixel(4, 2 , 128, 128, 128);
    putPixel(6, 2 , 232, 117, 19);
    putPixel(8, 2 , 232, 117, 19);

    putPixel(0, 3 , 232, 117, 19);
    putPixel(1, 3 , 232, 117, 19);
    putPixel(4, 3 , 128, 128, 128);
    putPixel(7, 3 , 232, 117, 19);
    putPixel(8, 3 , 232, 117, 19);

    putPixel(0, 4 , 232, 117, 19);
    putPixel(1, 4 , 232, 117, 19);
    putPixel(2, 4 , 232, 117, 19);
    putPixel(4, 4 , 128, 128, 128);
    putPixel(6, 4 , 232, 117, 19);
    putPixel(7, 4 , 232, 117, 19);
    putPixel(8, 4 , 232, 117, 19);

    putPixel(4, 5 , 128, 128, 128);

    putPixel(2, 6 , 128, 128, 128);
    putPixel(3, 6 , 128, 128, 128);
    putPixel(4, 6 , 128, 128, 128);
    putPixel(5, 6 , 128, 128, 128);
    putPixel(6, 6 , 128, 128, 128);

    putPixel(3, 7 , 128, 128, 128);
    putPixel(4, 7 , 128, 128, 128);
    putPixel(5, 7 , 128, 128, 128);

    putPixel(4, 8 , 128, 128, 128);

    this.innerContext.putImageData(this.imageData, 0, 0);

    this.age = 0;
}

Pickup.prototype.move = function(grains, player){
    var sum = 0;
    for (var checkX = this.x - this.halfWidth; checkX <= this.x + this.halfWidth; checkX++) {
        sum += grains.findLowestFree(Math.round(checkX), this.y - this.halfHeight);
    }
    sum /= this.canvas.width;
    if (sum + 4 < this.y - 1) {
        this.y -= 1;
    } else if (sum + 4 > this.y + 1) {
        this.y = Math.floor(sum + 4);
    }
    if(player.disanceToSq(this.x, this.y) < 100){
        this.pickedUp = true;
        player.pickUp(this);
        CanvasProvider.returnCanvas(this.canvas);
    }
};

Pickup.prototype.draw = function (drawOffset) {
    var tx = Math.round(this.x - this.halfWidth);
    var ty = Math.round(this.ctx.canvas.height - 1 - (this.y + this.halfHeight - drawOffset));
    this.ctx.drawImage(this.canvas, tx, ty);
};