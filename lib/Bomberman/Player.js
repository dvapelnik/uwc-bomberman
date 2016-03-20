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

Player.prototype.placeBomb = function () {
    //@todo use timer
    return true;
};

Player.prototype.move = function (direction) {
    var
        canMoveFlag = canMove(this, direction)
        , oldLocation = _.clone(this.location)
        ;

    if (canMoveFlag) {
        doMove(this, direction);
    }

    return {
        old: oldLocation,
        current: _.clone(this.location),
    };
};

module.exports = Player;

function doMove(player, direction) {
    var newLocation = getNewLocation(player.location, direction);
    var place = player.place.place;

    var _tmp = place[newLocation.y][newLocation.x];
    place[newLocation.y][newLocation.x] = place[player.location.y][player.location.x];
    place[player.location.y][player.location.x] = _tmp;

    player.location = newLocation;
}

function canMove(player, direction) {
    try {
        var neighbour = getNeighbour(player, direction);

        return neighbour === null || neighbour instanceof Bomb;
    } catch (e) {
        console.log(e);
        return false;
    }
}

function getNeighbour(player, direction) {
    var newLocation = getNewLocation(player.location, direction);

    return player.place.getArray()[newLocation.y][newLocation.x];
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