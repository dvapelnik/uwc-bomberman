var
    Bomb = require('./Bomb')
    , _ = require('underscore')
    , EventEmitter = require('events').EventEmitter
    , util = require('util')
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

Player.prototype.setPlace = function (place) {
    //@todo check place type
    this.place = place;
};

Player.prototype.move = function (direction) {
    var
        oldLocation = _.clone(this.location)
        ;

    if (canMove(this, direction)) {
        this.place.move(this, direction);
    }
};

Player.prototype.placeBomb = function (options) {
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

function canMove(player, direction) {
    try {
        var neighbour = getNeighbour(player, direction);

        return neighbour === null;
    } catch (e) {
        return false;
    }
}

function getNeighbour(player, direction) {
    var
        newLocation = getNewLocation(player.location, direction)
        , size = player.place.sizes
        ;

    if (newLocation.x < 0 || newLocation.x > size.x - 1 ||
        newLocation.y < 0 || newLocation.y > size.y - 1) {
        throw new Error('Out of the bounds');
    }

    var blockNeighbour = player.place.blocks[newLocation.y][newLocation.x];
    var blockFireProofNeighbour = player.place.blocksFireProof[newLocation.y][newLocation.x];
    var playerNeighbour = player.place.players[newLocation.y][newLocation.x];
    var bombNeighbour = player.place.bombs[newLocation.y][newLocation.x];

    return blockNeighbour || blockFireProofNeighbour || playerNeighbour || bombNeighbour || null;
}
