var CanvasProvider = {
    canvases: [],
    getCanvas: function(){
        if(this.canvases.length > 0){
            return this.canvases.shift();
        } else {
            return document.createElement('canvas');
        }
    },
    returnCanvas: function(canvas){
        this.canvases.push(canvas);
    }
};