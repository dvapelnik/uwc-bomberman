var Bomb = require('./Bomb');

function Player() {
    this.place = undefined;

    this.active = false;

    this.location = undefined;
}

Player.prototype.setPlace = function (place) {
    //@todo check place type
    this.place = place;
};

Player.prototype.canBomb = function () {
    //@todo use timer
    return true;
};

Player.prototype.canMove = function (direction) {
    try {
        var neighbour = getNeighbour(this, direction, this.place);

        console.log(neighbour === null);
        console.log(neighbour instanceof Bomb);

        return neighbour === null || neighbour instanceof Bomb;
    } catch (e) {
        console.log(e);
        return false;
    }
};

module.exports = Player;

function getNeighbour(player, direction, place) {
    var neighbour;

    switch (direction) {
        case 'left':
            neighbour = place.getArray()[player.location.y][player.location.x - 1];
            break;
        case 'up':
            neighbour = place.getArray()[player.location.y - 1][player.location.x];
            break;
        case 'right':
            neighbour = place.getArray()[player.location.y][player.location.x + 1];
            break;
        case 'down':
            neighbour = place.getArray()[player.location.y + 1][player.location.x];
            break;
        default:
            throw  new Error('Unsupported direction');
    }

    return neighbour;
}