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

    var
        bombCount = options.initialBombCount
        , isAlive = true
        , bombCountIncreaseTimer = setInterval(function () {
            bombCount += options.addNewBomb.delta;
            this.emit('change', {target: this});
        }.bind(this), options.addNewBomb.interval)
        ;

    this.place = undefined;
    this.location = undefined;

    this.color = getRandomColor();

    var manipulator = undefined;

    this.setManipulator = function (_manipulator) {
        manipulator = _manipulator;
    };

    this.hasManipulator = function () {
        return !!manipulator;
    };

    this.deleteManipulator = function () {
        manipulator = undefined;
    };

    this.getName = function () {
        return this.hasManipulator() ? manipulator.name : undefined;
    };

    this.isAlive = function () {
        return isAlive
    };

    this.getColor = function () {
        return this.hasManipulator()
            ? manipulator.color
            : undefined
    };

    this.placeBomb = function () {
        if (isAlive &&
            bombCount > 0 &&
            this.place.canPlaceBombAt(this.location)) {
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

    this.hasABomb = function () {
        return bombCount > 0;
    };

    this.on('change', function () {
        this.place.emit('change', {target: this, msg: 'emit from player changed'});
    });

    var lastMovementAt = 0;
    this.move = function (direction) {
        var
            currentTime = new Date().getTime()
            , timeFromLastMovement = currentTime - lastMovementAt
            ;

        if (isAlive &&
            timeFromLastMovement > options.movementThrottling &&
            this.place.canMove(this, direction)) {
            this.place.move(this, direction);

            this.emit('moved', {target: this});

            lastMovementAt = currentTime;
        }
    };

    this.terminate = function () {
        this.emit('beforeTerminate');
        clearInterval(bombCountIncreaseTimer);
        this.removeAllListeners();
        isAlive = false;
    }
}

util.inherits(Player, EventEmitter);

module.exports = Player;