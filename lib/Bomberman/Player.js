var
    Bomb = require('./Bomb')
    , _ = require('underscore')
    ;

function Player() {
    this.place = undefined;

    this.active = false;

    this.location = undefined;
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

Player.prototype.placeBomb = function () {
    if (this.place.canPlaceBombAt(this.location)) {
        var bomb = new Bomb();

        bomb.location = _.clone(this.location);
        this.place.placeBomb(bomb);

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
    var newLocation = getNewLocation(player.location, direction);

    var blockNeighbour = player.place.blocks[newLocation.y][newLocation.x];
    var playerNeighbour = player.place.players[newLocation.y][newLocation.x];
    var bombNeighbour = player.place.bombs[newLocation.y][newLocation.x];

    if (blockNeighbour !== undefined) return blockNeighbour;
    if (playerNeighbour !== undefined) return playerNeighbour;
    if (bombNeighbour !== undefinedError) return bombNeighbour;

    return null;
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