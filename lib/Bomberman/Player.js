var
    _ = require('underscore')
    , EventEmitter = require('events').EventEmitter
    , util = require('util')

    , Bomb = require('./Bomb')

    , getRandomColor = require('./../util').getRandomColor
    ;

function Player() {
    var bombCount = 1;

    this.place = undefined;

    this.active = false;

    this.location = undefined;

    this.color = getRandomColor();

    this.bombCountIncreaseTimer = setInterval(function () {
        bombCount++;
        this.emit('change', {target: this});
    }.bind(this), 30 * 1000);

    this.on('change', function () {
        this.place.emit('change');
    });

    this.placeBomb = function () {
        if (bombCount > 0) {
            if (this.place.canPlaceBombAt(this.location)) {
                var bomb = new Bomb();

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
        }
    };

    this.getBombCount = function () {
        return bombCount;
    };
}

util.inherits(Player, EventEmitter);

Player.prototype.move = function (direction) {
    if (this.place.canMove(this, direction)) {
        this.place.move(this, direction);
    }
};

module.exports = Player;