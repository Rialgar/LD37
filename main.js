window.addEventListener('load', function () {

    var gameWidth = 160;
    var gameHeight = 120;

    var liveDiv = document.getElementById('lives');
    var scoreDiv = document.getElementById('score');
    var helpTable = document.getElementById('help');
    var canvas = document.getElementById('canvas');
    canvas.width = gameWidth;
    canvas.height = gameHeight;
    var ctx = canvas.getContext('2d');

    var grains = new Grains(ctx, gameWidth, gameHeight);
    var player = new Player(ctx, 10, 0);
    var bullets = [];
    var enemies = [];
    var pickups = [];

    var deathScroll = false;
    var deathScrollCounter = 0;
    var maxDrawOffset = 0;
    var spawnCountdown = 300;

    function addEnemy(size){
        var y = grains.drawOffset + gameHeight + 50;
        var x = Math.round(Math.random()*gameWidth);
        enemies.push(new Enemy(x, y, size, ctx));
    }

    var scriptedWaves = [
        [0],
        [1],
        [0,0,0,0],
        [1,1,1,1],
        [2],
        [2,2,2],
        [2,2,2,2],
        [2,2,1,1,2,2],
        [3,3],
        [3,3,3,3,3,3],
        [10],
        [4,4,4],
        [4,4,4,4,3,3,3],
        [5,5],
        [5,5,5,5],
        [5,5,5,5,5,5]
    ];

    var level = 5;
    var timesSpawnedThisLevel = 0;
    function spawnWave(){
        if(scriptedWaves.length > 0){
            scriptedWaves.shift().forEach(addEnemy);
        } else {
            var newLevel = Math.floor(maxDrawOffset / 100) + 5;
            if (newLevel > level) {
                level += 1;
                timesSpawnedThisLevel = 0;
            }
            var i;
            if(timesSpawnedThisLevel%5 == 0){
                for (i = 0; i < Math.floor(timesSpawnedThisLevel/5)+1; i++) {
                    addEnemy(level + 15)
                }
            } else {
                for (i = 0; i < timesSpawnedThisLevel + Math.max(5, 10 - level); i++) {
                    addEnemy(Math.floor(Math.random() * level) + 1);
                }
            }
            timesSpawnedThisLevel += 1;
        }
    }

    function addPickup(x, y){
        pickups.push(new Pickup(x, y, ctx));
    }

    var scale = 1;
    function onResize () {
        var docWidth = document.documentElement.clientWidth;
        var docHeight = document.documentElement.clientHeight;

        scale = Math.min(4, Math.max(1, Math.floor(Math.min(docWidth / gameWidth, docHeight / gameHeight))));

        var canWidth = gameWidth * scale;
        var canHeight = gameHeight * scale;
        var canvasTop = 20*scale;
        var canvasLeft = Math.floor((docWidth - canWidth) / 2);

        canvas.style.width = canWidth + 'px';
        canvas.style.height = canHeight + 'px';
        canvas.style.top = canvasTop + 'px';
        canvas.style.left = canvasLeft + 'px';

        liveDiv.style.fontSize = 5*scale + 'px';
        liveDiv.style.height = 6*scale + 'px';
        liveDiv.style.top = (canvasTop - 7*scale) + 'px';
        liveDiv.style.left = canvasLeft + 'px';

        scoreDiv.style.fontSize = 5*scale + 'px';
        scoreDiv.style.height = 6*scale + 'px';
        scoreDiv.style.top = (canvasTop - 7*scale) + 'px';
        scoreDiv.style.right = canvasLeft + 'px';

        helpTable.style.fontSize = 5*scale + 'px';
        helpTable.style.height = 60*scale + 'px';
        helpTable.style.width = canWidth + 'px';
        helpTable.style.top = (canvasTop + canHeight + 10) + 'px';
        helpTable.style.left = canvasLeft + 'px';
    }

    window.addEventListener('resize', onResize);
    onResize();

    var autofire = false;

    var down = {};
    var newlyDown = {};
    window.addEventListener('keydown', function (ev) {
        if(!down[ev.keyCode]) {
            newlyDown[ev.keyCode] = true;
        }
        down[ev.keyCode] = true;
    });
    window.addEventListener('keyup', function (ev) {
        down[ev.keyCode] = false;
    });

    var gamepad = {leftRight: 0, leftShoulder: 0, rShoulder: 0, fire: false, aimAngle: 0, autoButtonDown: false, toggleAuto: false};

    var mouseUser = false;

    function readGamePad (pad) {
        if (!pad) {
            return;
        }
        if (Math.abs(pad.axes[0]) > 0.15) {
            gamepad.leftRight = pad.axes[0];
        } else {
            gamepad.leftRight = 0;
        }

        var lengthSq = pad.axes[2]*pad.axes[2] + pad.axes[3]*pad.axes[3];

        var aimLR = 0;
        var aimUD = 0;
        if (lengthSq > 0.16) {
            aimLR = pad.axes[2];
            aimUD = pad.axes[3];
            mouseUser = false;
            gamepad.aimAngle = Math.atan2(-aimLR, -aimUD);
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

        gamepad.fire = pad.buttons[4].pressed || pad.buttons[5].pressed;

        if(pad.buttons[0].pressed || pad.buttons[1].pressed || pad.buttons[2].pressed || pad.buttons[3].pressed){
            gamepad.toggleAuto = !pad.autoButtonDown;
            gamepad.autoButtonDown = true;
        } else {
            gamepad.toggleAuto = false;
            gamepad.autoButtonDown = false;
        }
    }

    var mouseX, mouseY;

    function mouseMove (ev) {
        mouseUser = true;

        var boundingBox = canvas.getBoundingClientRect();
        mouseX = (ev.clientX - boundingBox.left) / scale;
        mouseY = gameHeight - (ev.clientY - boundingBox.top) / scale + grains.drawOffset;

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

    var snow = 1000;
    var weatherLength = 1000;
    var weatherDir = -1;

    function frame () {
        if (navigator.getGamepads) {
            readGamePad(navigator.getGamepads()[0]);
        }

        if (newlyDown[70] || gamepad.toggleAuto) {
            autofire = !autofire;
            console.log(autofire);
        }

        if (newlyDown[72]) {
            if(helpTable.style.opacity != 0) {
                helpTable.style.opacity = 0;
            } else {
                helpTable.style.opacity = 1;
            }
        }

        if (Math.random() < snow / 1000) {
            grains.makeGrain(
                Math.floor(Math.random() * gameWidth),
                grains.drawOffset + gameHeight,
                255,
                255,
                255
            );
        }

        snow += weatherDir;

        if (Math.abs(snow) > weatherLength) {
            weatherDir = snow > 0 ? -1 : 1;
        } else if (Math.abs(snow) < 10) {
            weatherDir = Math.random() > 0.5 ? 1 : -1;
            weatherLength = Math.random() * 1800;
            snow = 10 * weatherDir;
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

        if(player.life > 0) {
            player.move(mx, grains, bullets);
            if (mouseUser) {
                var dx = mouseX - player.x;
                var dy = mouseY - player.y;
                player.aim(Math.atan2(-dx, dy));
            } else {
                player.aim(gamepad.aimAngle);
            }
            player.draw(grains.drawOffset);
            if(player.life <= 0){
                player.getGrains().forEach(function (grain) {
                    grains.makeGrain(grain);
                });
                deathScroll = -1;
            }
            for(var i = player.life; i < 10; i++){
                liveDiv.children[i].classList.add('inactive');
            }
            scoreDiv.textContent = ((player.maxHeight-4) / 10) + 'm';
        }

        if (autofire || down['mouse'] || gamepad.fire) {
            var newBullets = player.shoot(grains);
            if (newBullets) {
                bullets = bullets.concat(newBullets);
            }
        }

        var hadEnemies = false;
        enemies.forEach(function(enemy){
            hadEnemies = true;
            enemy.move(grains, bullets, deathScroll);
            if (enemy.wasHit) {
                enemy.getGrains().forEach(function (grain) {
                    grains.makeGrain(grain);
                });
            }
            var bullet = enemy.shoot(player);
            if(bullet){
                bullets.push(bullet);
            }
            enemy.draw(grains.drawOffset);
            if(enemy.droppedPickup){
                addPickup(enemy.x, enemy.y);
            }
        });

        enemies = enemies.filter(function (enemy) {
            return !enemy.wasKilled;
        });

        if(hadEnemies && enemies.length === 0){
            spawnCountdown = 120;
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

        pickups.forEach(function (pickup) {
            pickup.move(grains, player);
            pickup.draw(grains.drawOffset);
        });

        pickups = pickups.filter(function (pickup) {
            return !pickup.pickedUp;
        });

        if(deathScroll){
            if(deathScrollCounter == 0) {
                if (grains.drawOffset > 0 && deathScroll < 0) {
                    grains.decreaseDrawOffset();
                } else if (deathScroll < 0) {
                    deathScroll = 1
                } else if (grains.drawOffset < maxDrawOffset) {
                    grains.increaseDrawOffset();
                } else {
                    deathScroll = -1;
                }
                deathScrollCounter = 1;
            } else {
                deathScrollCounter -= 1;
            }
        } else if(grains.drawOffset > 0 && player.floatingAverage < grains.drawOffset + gameHeight/8){
            grains.decreaseDrawOffset();
        } else if(player.floatingAverage > grains.drawOffset + gameHeight/3){
            grains.increaseDrawOffset();
            maxDrawOffset = Math.max(maxDrawOffset, grains.drawOffset);
        } else if(enemies.length == 0){
            if(spawnCountdown <= 0){
                spawnWave();
            } else {
                spawnCountdown -= 1;
            }
        }

        for(var key in newlyDown){
            delete newlyDown[key];
        }
        window.requestAnimationFrame(frame)
    }

    window.requestAnimationFrame(frame);

    if (window.location.hostname === 'localhost') {
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
            };
            window.addEnemy = function(size, count){
                count |= 1;
                for(var i = 0; i < count; i++){
                    addEnemy(size);
                }
            };
            window.frame = frame;

            window.addPickup = addPickup;
        };
    }
});