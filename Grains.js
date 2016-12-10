function Grains (ctx) {
    this.ctx = ctx;
    this.imageData = ctx.createImageData(ctx.canvas.width, ctx.canvas.height);
    this.activeGrains = [];
    this.nextActiveGrains = [];
    this.map = [];
    this.drawOffset = 0;
}

Grains.prototype.makeGrain = function (x, y) {
    if (y < 0 || x < 0 || x >= this.imageData.width) {
        throw new Error("Grain position out of bounds. (" + x + "," + y + ")");
    } else if (y > (1 << 20)) {
        throw new Error("Icarus flew too close to the sun! (" + x + "," + y + ")");
    }
    if (this.map[y] && this.map[y][x]) {
        return;
    }
    var grain = {
        x: x,
        y: y,
        active: true
    };
    this.activeGrains.push(grain);
    while (this.map.length < y + 1) {
        this.map.push([]);
    }
    this.map[y][x] = grain;
    this.putGrainPixel(grain.x, grain.y, 255, 255, 255, 255);
};

Grains.prototype.getDxArray = function () {
    var r = Math.random();
    if (r > 2 / 3) {
        return [0, -1, 1];
    } else if (r > 1 / 3) {
        return [0, 1, -1];
    } else if (r > 1 / 6) {
        return [-1, 0, 1];
    } else {
        return [1, 0, -1];
    }
};

// we use bottom left as 0, 0
// applies draw offset
Grains.prototype.putGrainPixel = function (x, y, r, g, b, a) {
    y = this.imageData.height - 1 - (y - this.drawOffset);
    if (x < 0 || x >= this.imageData.width || y < 0 || y >= this.imageData.height) {
        return;
    }
    var base = ((y * this.imageData.width) + x) * 4;
    this.imageData.data[base] = r;
    this.imageData.data[base + 1] = g;
    this.imageData.data[base + 2] = b;
    this.imageData.data[base + 3] = a;
};

Grains.prototype.removeGrain = function (grain) {
    this.map[grain.y][grain.x] = false;
    this.putGrainPixel(grain.x, grain.y, 0, 0, 0, 0);

    if (grain.y < this.map.length - 1) {
        var dxArray = this.getDxArray();
        for (var i = 0; i < dxArray.length; i++) {
            var dx = dxArray[i];
            var otherGrain = this.map[grain.y + 1][grain.x + dx];
            if (otherGrain && !otherGrain.active) {
                otherGrain.active = true;
                this.nextActiveGrains.push(otherGrain);
            }
        }
    }
};

Grains.prototype.moveGrain = function (grain) {
    var newCoordinates = false;
    if (grain.y > 0) {
        var dxArray = this.getDxArray();
        for (var i = 0; i < dxArray.length; i++) {
            var otherX = grain.x + dxArray[i];
            if (otherX >= 0 && otherX < this.imageData.width && !this.map[grain.y - 1][otherX]) {
                newCoordinates = {x: otherX, y: grain.y - 1};
                break;
            }
        }
    }
    if (newCoordinates) {
        this.removeGrain(grain);

        grain.x = newCoordinates.x;
        grain.y = newCoordinates.y;

        this.map[grain.y][grain.x] = grain;
        this.nextActiveGrains.push(grain);
    } else {
        grain.active = false;
    }
    if (newCoordinates) {
        this.putGrainPixel(grain.x, grain.y, 255, 255, 255, 255);
    }
};

Grains.prototype.updateGrains = function () {
    this.activeGrains.forEach(this.moveGrain.bind(this));
    this.activeGrains = this.nextActiveGrains;
    this.nextActiveGrains = [];

    this.ctx.putImageData(this.imageData, 0, 0);
};