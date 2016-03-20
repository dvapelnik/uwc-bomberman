var
    Block = require('./Block/Block')
    , BlockFireProof = require('./Block/BlockFireProof')
    , Player = require('./Player')
    ;

function Place() {
    this.sizes = {x: 13, y: 11};
    this.place = undefined;
    this.players = [];
    this.bombs = [];
}

Place.prototype.buildPlace = function (fillLevel) {
    fillLevel = fillLevel || 2;

    this.place = fillPlace(this.sizes, fillLevel);
};

Place.prototype.serialize = function () {
    return JSON.stringify(
        this.place.map(function (row) {
            return row.map(function (cell) {
                result = ' ';

                if (cell instanceof Player) {
                    result = 'P' + (cell.active ? 'A' : '');
                }

                if (cell instanceof Block) {
                    result = '0';
                }

                if (cell instanceof BlockFireProof) {
                    result = '1';
                }

                return result;
            });
        })
    );
};

Place.prototype.parse = function (jsonString) {
    //@todo catch parse error
    this.place = JSON.parse(jsonString).map(function (row) {
        return row.map(function (cell) {
            if (cell.match(/^P/)) {
                var player = new Player();

                player.active = cell == 'PA';

                return player;
            }

            if (cell == '0') return new Block();
            if (cell == '1') return new BlockFireProof();

            return null;
        });
    });
};

Place.prototype.getArray = function () {
    return this.place;
};

Place.prototype.setPlayers = function (players) {
    if (undefined === this.place) {
        throw new Error('Build places first');
    }

    if (players.length != 4) {
        throw new Error('Place needs four players');
    }

    var angles = [[0, 0], [this.sizes.x - 1, 0], [0, this.sizes.y - 1], [this.sizes.x - 1, this.sizes.y - 1]];

    var that = this;

    players.map(function (player, idx) {
        var position = angles[idx];

        that.place[position[1]][position[0]] = player;
        that.players.push(player);

        player.place = that;
        player.location = {x: position[0], y: position[1]};
    });
};

Place.prototype.placeBomb = function (bomb) {
    this.bombs.push(bomb);
    bomb.place = this;
};

Place.prototype.canPlaceBombAt = function (location) {
    return this.place[location.y][location.x] === null ||
        this.place[location.y][location.x] instanceof Player;
};

module.exports = Place;

function fillPlace(sizes, fillLevel) {
    var place = [];

    for (var y = 0; y < sizes.y; y++) {
        _row = [];
        for (var x = 0; x < sizes.x; x++) {
            if (x % 2 == 1 && y % 2 == 1) {
                _row.push(new BlockFireProof);
            } else if (!isReserved(x, y, sizes.x, sizes.y) && getRandom(1, 10) > 10 - fillLevel) {
                _row.push(new Block);
            } else {
                _row.push(null);
            }
        }

        place.push(_row);
    }

    return place;
}

function isReserved(point_x, point_y, width, heigth) {
    //@todo improve indian style
    if (point_x == 0 && point_y == 0) return true;
    if (point_x == width - 1 && point_y == 0) return true;
    if (point_x == 0 && point_y == heigth - 1) return true;
    if (point_x == width - 1 && point_y == heigth - 1)return true;

    if (point_x == 1 && point_y == 0) return true;
    if (point_x == 0 && point_y == 1) return true;

    if (point_x == width - 2 && point_y == 0) return true;
    if (point_x == width - 1 && point_y == 1) return true;

    if (point_x == 0 && point_y == heigth - 2) return true;
    if (point_x == 1 && point_y == heigth - 1) return true;

    if (point_x == width - 2 && point_y == heigth - 1) return true;
    if (point_x == width - 1 && point_y == heigth - 2) return true;

    return false;
}

function getRandom(min, max) {
    return Math.floor(Math.random() * max) + min
}