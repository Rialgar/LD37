function Grains (ctx) {
    this.ctx = ctx;
    this.imageData = ctx.createImageData(ctx.canvas.width, ctx.canvas.height);
    this.activeGrains = [];
    this.nextActiveGrains = [];
    this.map = [];
    this.drawOffset = 0;
}

Grains.prototype.makeGrain = function (x, y, r, g, b, momentum) {
    var grain;
    if(typeof x === 'object'){
        grain = x;
    } else {
        grain = {
            x: x,
            y: y,
            r: r,
            g: g,
            b: b,
            momentum: momentum
        };
    }
    if (grain.y < 0 || grain.x < 0 || grain.x >= this.imageData.width) {
        throw new Error("Grain position out of bounds. (" + x + "," + y + ")");
    } else if (grain.y > (1 << 20)) {
        throw new Error("Icarus flew too close to the sun! (" + x + "," + y + ")");
    }
    if (this.map[grain.y] && this.map[grain.y][grain.x]) {
        grain.y = this.findLowestFree(grain.x, grain.y, true);
    }

    if(grain.momentum) {
        var lengthSq = grain.momentum.x * grain.momentum.x + grain.momentum.y * grain.momentum.y;
        if (lengthSq > 16){
            var factor = 4/Math.sqrt(lengthSq);
            grain.momentum.x *= factor;
            grain.momentum.y *= factor;
        }
    }

    this.putGrain(grain);
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
Grains.prototype.putGrainPixel = function (grain, alpha) {
    var y = this.imageData.height - 1 - (grain.y - this.drawOffset);
    var x = grain.x;
    if (x < 0 || x >= this.imageData.width || y < 0 || y >= this.imageData.height) {
        return;
    }
    var base = ((y * this.imageData.width) + x) * 4;
    this.imageData.data[base] = grain.r;
    this.imageData.data[base + 1] = grain.g;
    this.imageData.data[base + 2] = grain.b;
    this.imageData.data[base + 3] = alpha;
};

Grains.prototype.removeGrain = function (grain) {
    this.map[grain.y][grain.x] = false;
    this.putGrainPixel(grain, 0);

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

Grains.prototype.putGrain = function(grain){
    this.nextActiveGrains.push(grain);
    grain.active = true;
    while (this.map.length < grain.y + 1) {
        this.map.push([]);
    }
    this.map[grain.y][grain.x] = grain;
    this.putGrainPixel(grain, 255);
};

Grains.prototype.moveGrain = function (grain) {
    var newCoordinates;
    if (grain.momentum) {
        newCoordinates = {
            x: Math.round(grain.x + grain.momentum.x),
            y: Math.round(Math.max(0, grain.y + grain.momentum.y))
        };
        if(newCoordinates.x === grain.x && newCoordinates.y === grain.y){
            newCoordinates = undefined;
            grain.momentum = undefined;
        } else {
            if (!this.isFree(newCoordinates.x, newCoordinates.y, true)) {
                newCoordinates.y = this.findLowestFree(newCoordinates.x, newCoordinates.y, true);
            }
            grain.momentum.x *= 0.9;
            grain.momentum.y *= 0.9;
        }
    }
    if (grain.y > 0) {
        var dxArray = this.getDxArray();
        for (var i = 0; i < dxArray.length; i++) {
            var otherX = (newCoordinates ? newCoordinates.x : grain.x) + dxArray[i];
            var otherY = (newCoordinates ? newCoordinates.y : grain.y) - 1;
            if (this.isFree(otherX, otherY, true)) {
                newCoordinates = {x: otherX, y: otherY};
                break;
            }
        }
    }
    if (newCoordinates) {
        this.removeGrain(grain);

        grain.x = newCoordinates.x;
        grain.y = newCoordinates.y;

        this.putGrain(grain);
    } else {
        grain.active = false;
    }
};

Grains.prototype.updateGrains = function () {
    this.activeGrains.forEach(this.moveGrain.bind(this));
    this.activeGrains = this.nextActiveGrains;
    this.nextActiveGrains = [];

    this.ctx.putImageData(this.imageData, 0, 0);
};

Grains.prototype.isFree = function (x, y, activeIsBlocked) {
    if (y < 0 || x < 0 || x >= this.imageData.width) {
        return false;
    }
    return !this.map[y] || !this.map[y][x] || (!activeIsBlocked && this.map[y][x].active);
};

Grains.prototype.findLowestFree = function (x, y, activeIsBlocked) {
    var out = y;
    if(x < 0 || x >= this.imageData.width){
        return out;
    }
    while (out >= 0 && this.isFree(x, out, activeIsBlocked)) {
        out--;
    }
    while (!this.isFree(x, out, activeIsBlocked)) {
        out++;
    }
    return out;
};

Grains.prototype.getGrain = function(x, y){
    return this.map[y] && this.map[y][x];
};

Grains.prototype.increaseDrawOffset = function(){
    var x, y;
    for(x = 0; x < this.imageData.width; x++){
        for(y = this.imageData.height-1; y > 0; y--){
            var fromBase = ((y - 1) * this.imageData.width + x) * 4;
            var toBase = (y * this.imageData.width + x) * 4;
            this.imageData.data[toBase] = this.imageData.data[fromBase];
            this.imageData.data[toBase+1] = this.imageData.data[fromBase+1];
            this.imageData.data[toBase+2] = this.imageData.data[fromBase+2];
            this.imageData.data[toBase+3] = this.imageData.data[fromBase+3];
        }
    }
    this.drawOffset += 1;
    for(x = 0; x < this.imageData.width; x++){
        var grainy = this.imageData.height - 1 + this.drawOffset;
        var grain = this.getGrain(x, grainy);
        var base = x * 4;
        if(grain) {
            this.imageData.data[base] = grain.r;
            this.imageData.data[base+1] = grain.g;
            this.imageData.data[base+2] = grain.b;
            this.imageData.data[base+3] = 255;
        } else {
            this.imageData.data[base] = 0;
            this.imageData.data[base+1] = 0;
            this.imageData.data[base+2] = 0;
            this.imageData.data[base+3] = 0;
        }
    }
};

Grains.prototype.decreaseDrawOffset = function(){
    var x, y;
    for(x = 0; x < this.imageData.width; x++){
        for(y = 0; y < this.imageData.height-1; y++){
            var fromBase = ((y + 1) * this.imageData.width + x) * 4;
            var toBase = (y * this.imageData.width + x) * 4;
            this.imageData.data[toBase] = this.imageData.data[fromBase];
            this.imageData.data[toBase+1] = this.imageData.data[fromBase+1];
            this.imageData.data[toBase+2] = this.imageData.data[fromBase+2];
            this.imageData.data[toBase+3] = this.imageData.data[fromBase+3];
        }
    }
    this.drawOffset -= 1;
    for(x = 0; x < this.imageData.width; x++){
        var grainy = this.drawOffset;
        var grain = this.getGrain(x, grainy);
        var base = ((this.imageData.height-1) * this.imageData.width + x) * 4;
        if(grain) {
            this.imageData.data[base] = grain.r;
            this.imageData.data[base+1] = grain.g;
            this.imageData.data[base+2] = grain.b;
            this.imageData.data[base+3] = 255;
        } else {
            this.imageData.data[base] = 0;
            this.imageData.data[base+1] = 0;
            this.imageData.data[base+2] = 0;
            this.imageData.data[base+3] = 0;
        }
    }
};