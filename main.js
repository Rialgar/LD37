window.addEventListener('load', function () {

    var gameWidth = 160;
    var gameHeight = 120;

    var canvas = document.getElementById('canvas');
    canvas.width = gameWidth;
    canvas.height = gameHeight;
    var ctx = canvas.getContext('2d');

    var grains = new Grains(ctx, gameWidth, gameHeight);

    function onResize () {
        var docWidth = document.documentElement.clientWidth;
        var docHeight = document.documentElement.clientHeight;

        var scale = Math.max(1, Math.floor(Math.min(docWidth / gameWidth, docHeight / gameHeight)));

        var canWidth = gameWidth * scale;
        var canHeight = gameHeight * scale;

        canvas.style.width = canWidth + 'px';
        canvas.style.height = canHeight + 'px';
        canvas.style.top = Math.floor((docHeight - canHeight) / 2) + 'px';
        canvas.style.left = Math.floor((docWidth - canWidth) / 2) + 'px';
    }

    window.addEventListener('resize', onResize);
    onResize();

    function frame () {
        grains.updateGrains();

        window.requestAnimationFrame(frame)
    }

    window.requestAnimationFrame(frame);

    window.debugMode = function () {
        window.grains = grains;
        window.player = player;
        window.makeGrain = function(x, y, many){
            for(var i = 0; i < many; i++){
                grains.makeGrain(x, y+i);
            }
        };
        window.makeRandomGrains = function (count) {
            for (var i = 0; i < count; i++) {
                grains.makeGrain(Math.floor(Math.pow(Math.random(), 2) * gameWidth), Math.floor(Math.random() * gameHeight) + gameHeight);
            }
        }
    };
});