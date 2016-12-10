window.addEventListener('load', function () {

    var gameWidth = 160;
    var gameHeight = 120;

    var canvas = document.getElementById('canvas');
    canvas.width = gameWidth;
    canvas.height = gameHeight;
    var ctx = canvas.getContext('2d');

    var grains = new Grains(ctx, gameWidth, gameHeight);
    var player = new Player(ctx, 10, 0);
    var bullets = [];

    var scale = 1;

    function onResize () {
        var docWidth = document.documentElement.clientWidth;
        var docHeight = document.documentElement.clientHeight;

        scale = Math.max(1, Math.floor(Math.min(docWidth / gameWidth, docHeight / gameHeight)));

        var canWidth = gameWidth * scale;
        var canHeight = gameHeight * scale;

        canvas.style.width = canWidth + 'px';
        canvas.style.height = canHeight + 'px';
        canvas.style.top = Math.floor((docHeight - canHeight) / 2) + 'px';
        canvas.style.left = Math.floor((docWidth - canWidth) / 2) + 'px';
    }

    window.addEventListener('resize', onResize);
    onResize();

    var down = {};
    window.addEventListener('keydown', function (ev) {
        console.log(ev.keyCode);
        down[ev.keyCode] = true;
    });
    window.addEventListener('keyup', function (ev) {
        down[ev.keyCode] = false;
    });

    var gamepad = {leftRight: 0, leftShoulder: 0, rShoulder: 0};

    function readGamePad (pad) {
        if (Math.abs(pad.axes[0]) > 0.15) {
            gamepad.leftRight = pad.axes[0];
        } else {
            gamepad.leftRight = 0;
        }

        if (pad.buttons[6].pressed) {
            gamepad.leftShoulder = pad.buttons[6].value;
        } else {
            gamepad.leftShoulder = 0;
        }

        if (pad.buttons[7].pressed) {
            gamepad.rightShoulder = pad.buttons[7].value;
        } else {
            gamepad.rightShoulder = 0;
        }
    }

    var mouseX, mouseY;

    function mouseMove (ev) {
        var boundingBox = canvas.getBoundingClientRect();
        mouseX = (ev.clientX - boundingBox.left) / scale;
        mouseY = gameHeight - (ev.clientY - boundingBox.top) / scale;

        var dx = mouseX - player.x;
        var dy = mouseY - player.y;
        player.aim(Math.atan2(-dx, dy));
    }

    window.addEventListener('mousemove', mouseMove);

    window.addEventListener('mousedown', function (ev) {
        mouseMove(ev);
        down['mouse'] = true;
    });

    window.addEventListener('mouseup', function (ev) {
        mouseMove(ev);
        down['mouse'] = false;
    });

    function frame () {
        if (navigator.getGamepads) {
            readGamePad(navigator.getGamepads()[0]);
        }

        grains.updateGrains();

        var mx = 0;
        if (gamepad.leftRight != 0) {
            mx = gamepad.leftRight;
        } else if (gamepad.leftShoulder || gamepad.rightShoulder) {
            mx = gamepad.rightShoulder - gamepad.leftShoulder;
        } else {
            if (down[65] || down[37]) {
                mx -= 1;
            }
            if (down[68] || down[39]) {
                mx += 1;
            }
        }
        player.move(mx, grains);
        var dx = mouseX - player.x;
        var dy = mouseY - player.y;
        player.aim(Math.atan2(-dx, dy));
        player.draw(grains.drawOffset);

        if (down['mouse']) {
            var bullet = player.shoot(grains);
            if (bullet) {
                bullets.push(bullet);
            }
        }

        bullets.forEach(function (bullet) {
            bullet.move(grains);
            if (bullet.hitSomething) {
                bullet.getGrains().forEach(function (grain) {
                    grains.makeGrain(grain);
                });
            }
            bullet.draw(grains.drawOffset);
        });

        bullets = bullets.filter(function (bullet) {
            return !bullet.hitSomething
        });

        window.requestAnimationFrame(frame)
    }

    window.requestAnimationFrame(frame);

    window.debugMode = function () {
        window.grains = grains;
        window.player = player;
        window.makeGrain = function (x, y, r, g, b, many) {
            for (var i = 0; i < many; i++) {
                grains.makeGrain(x, y + i, r, g, b);
            }
        };
        window.makeRandomGrains = function (count) {
            for (var i = 0; i < count; i++) {
                var r = Math.random();
                grains.makeGrain(
                    Math.floor(Math.pow(Math.random(), 2) * gameWidth),
                    Math.floor(Math.random() * gameHeight) + gameHeight,
                    r > 0.5 ? 255 : 0,
                    r > 0.5 ? 0 : 255,
                    0
                );
            }
        }
    };
});