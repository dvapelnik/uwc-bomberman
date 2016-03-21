var
    _ = require('underscore')
    , EventEmitter = require('events').EventEmitter
    , util = require('util')

    , Bomb = require('./Bomb')

    , getNewLocation = require('./../util').getNewLocation
    , getRandomColor = require('./../util').getRandomColor
    ;

function Player() {
    this.place = undefined;

    this.bombCount = 1;

    this.active = false;

    this.location = undefined;

    this.color = getRandomColor();

    this.bombCountIncreaseTimee = setInterval(addBomb.bind(this), 30 * 1000);

    this.on('change', function () {
        this.place.emit('change');
    });
}

util.inherits(Player, EventEmitter);

Player.prototype.move = function (direction) {
    if (this.place.canMove(this, direction)) {
        this.place.move(this, direction);
    }
};

Player.prototype.placeBomb = function () {
    if (this.bombCount > 0) {
        if (this.place.canPlaceBombAt(this.location)) {
            var bomb = new Bomb();

            bomb.location = _.clone(this.location);
            this.place.placeBomb(bomb);

            removeBomb.bind(this)();

            bomb.onBoom = addBomb.bind(this);

            this.emit('change');

            return bomb.location;
        }
    }
};

module.exports = Player;

function addBomb() {
    this.bombCount++;
    this.emit('change');
}

function removeBomb() {
    this.bombCount--;
    this.emit('change');
}
