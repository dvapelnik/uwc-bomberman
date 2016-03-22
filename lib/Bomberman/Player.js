var
    _ = require('underscore')
    , EventEmitter = require('events').EventEmitter
    , util = require('util')

    , Bomb = require('./Bomb')

    , getRandomColor = require('./../util').getRandomColor
    ;

function Player(options) {
    options = options || {};
    options.movementThrottling = options.movementThrottling || 250;
    options.initialBombCount = options.initialBombCount || 1;
    options.addNewBomb = options.addNewBomb || {};
    options.addNewBomb.interval = options.addNewBomb.interval || 30 * 1000;
    options.addNewBomb.delta = options.addNewBomb.delta || 1;

    this.getOptions = function () {
        return options;
    };

    var bombCount = options.initialBombCount;

    this.place = undefined;
    this.location = undefined;

    this.active = false;
    this.color = getRandomColor();

    this.bombCountIncreaseTimer = setInterval(function () {
        bombCount += options.addNewBomb.delta;
        this.emit('change', {target: this});
    }.bind(this), options.addNewBomb.interval);

    var manipulator = undefined;

    this.getManipulator = function () {
        return manipulator;
    };

    this.setManipulator = function (_manipulator) {
        manipulator = _manipulator;
    };

    this.placeBomb = function () {
        if (bombCount > 0 && this.place.canPlaceBombAt(this.location)) {
            var bomb = new Bomb({
                detonationTimeout: this.getOptions().bombOptions.detonationTimeout,
                explosionRadius: this.getOptions().bombOptions.explosionRadius
            });

            bomb.location = _.clone(this.location);
            this.place.placeBomb(bomb);

            bombCount--;

            bomb.once('bomb.boomed', function (e) {
                bombCount++;
                this.emit('change', {target: this});
            }.bind(this));

            this.emit('change', {target: this});

            return bomb.location;
        }
    };

    this.getBombCount = function () {
        return bombCount;
    };

    this.on('change', function () {
        this.place.emit('change', {target: this, msg: 'emit from player changed'});
    });


    var lastMovementAt = 0;
    this.move = function (direction) {
        var currentTime = new Date().getTime();

        if ((currentTime - lastMovementAt > options.movementThrottling) && this.place.canMove(this, direction)) {
            this.place.move(this, direction);

            this.emit('moved', {target: this});

            lastMovementAt = currentTime;
        }
    };
}

util.inherits(Player, EventEmitter);

module.exports = Player;