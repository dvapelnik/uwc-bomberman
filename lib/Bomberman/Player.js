var
    Bomb = require('./Bomb')
    , _ = require('underscore')
    ;

function Player() {
    this.place = undefined;

    this.active = false;

    this.location = undefined;

    this.color = getRandomColor();
}

Player.prototype.setPlace = function (place) {
    //@todo check place type
    this.place = place;
};

Player.prototype.move = function (direction) {
    var
        oldLocation = _.clone(this.location)
        ;

    if (canMove(this, direction)) {
        doMove(this, direction);
    }

    return {
        old: oldLocation,
        current: _.clone(this.location)
    };
};

Player.prototype.placeBomb = function (options) {
    if (this.place.canPlaceBombAt(this.location)) {
        var bomb = new Bomb();

        bomb.location = _.clone(this.location);
        this.place.placeBomb(bomb);

        if (options.onBoom) {
            bomb.onBoom = options.onBoom;
        }

        return bomb.location;
    }

    throw new Error('Cannot place bomb');
};

module.exports = Player;

function doMove(player, direction) {
    var newLocation = getNewLocation(player.location, direction);

    var _tmp = player.place.players[newLocation.y][newLocation.x];
    player.place.players[newLocation.y][newLocation.x] =
        player.place.players[player.location.y][player.location.x];
    player.place.players[player.location.y][player.location.x] = _tmp;

    player.location = newLocation;
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

function getNewLocation(oldLocation, direction) {
    var newLocation;

    switch (direction) {
        case 'left':
            newLocation = {x: oldLocation.x - 1, y: oldLocation.y};
            break;
        case 'up':
            newLocation = {x: oldLocation.x, y: oldLocation.y - 1};
            break;
        case 'right':
            newLocation = {x: oldLocation.x + 1, y: oldLocation.y};
            break;
        case 'down':
            newLocation = {x: oldLocation.x, y: oldLocation.y + 1};
            break;
        default:
            throw  new Error('Unsupported direction');
    }

    return newLocation;
}

function getRandomColor() {
    var letters = '0123456789ABCDEF'.split('');
    var color = '#';
    for (var i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}
