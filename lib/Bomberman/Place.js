var
    Block = require('./Block/Block')
    , BlockFireProof = require('./Block/BlockFireProof')
    , Player = require('./Player')
    , Bomb = require('./Bomb')
    , _ = require('underscore')
    ;

function Place() {
    this.sizes = {x: 13, y: 11};

    this.blocks = makeEmptyMap(this.sizes.x, this.sizes.y);
    this.players = makeEmptyMap(this.sizes.x, this.sizes.y);
    this.bombs = makeEmptyMap(this.sizes.x, this.sizes.y);
}

Place.prototype.buildPlace = function (fillLevel) {
    fillLevel = fillLevel || 2;

    this.blocks = fillPlace(this.sizes, fillLevel);
};

Place.prototype.serialize = function () {
    return JSON.stringify({
        blocks: tableMap(this.blocks, function (block) {
            if (block instanceof Block) {
                return {
                    type: 'block',
                    isFireProof: false
                };
            }

            if (block instanceof BlockFireProof) {
                return {
                    type: 'block',
                    isFireProof: true
                };
            }

            return {type: 'empty'};
        }),
        players: tableMap(this.players, function (player) {
            if (player instanceof Player) {
                return {
                    type: 'player',
                    isActive: player.active,
                    color: player.color
                };
            }

            return {type: 'empty'};
        }),
        bombs: tableMap(this.bombs, function (bomb) {
            if (bomb instanceof Bomb) {
                return {
                    type: 'bomb'
                };
            }

            return {type: 'empty'};
        })
    });
};

Place.prototype.parse = function (jsonString) {
    var obj = JSON.parse(jsonString);

    this.blocks = tableMap(obj.blocks, function (str) {
        if (str == 'b') {
            return new Block();
        }

        if (str == 'bfp') {
            return new BlockFireProof();
        }

        return null;
    });

    this.players = tableMap(obj.players, function (str) {
        if (str == 'P') {
            return new Player();
        }

        return null;
    });

    this.bombs = tableMap(obj.bombs, function (str) {
        if (str == 'B') {
            return new Bomb();
        }

        return null;
    });
};

Place.prototype.getArray = function () {
    return this.place;
};

Place.prototype.setPlayers = function (players) {
    if (players.length != 4) {
        throw new Error('Place needs four players');
    }

    var angles = [
        [0, 0],
        [this.sizes.x - 1, 0],
        [0, this.sizes.y - 1],
        [this.sizes.x - 1, this.sizes.y - 1]
    ];

    var that = this;

    players.map(function (player, idx) {
        var position = angles[idx];

        that.players[position[1]][position[0]] = player;

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

Place.prototype.getActivePlayer = function () {
    var activePlayers = [];

    tableMap(this.players, function (player) {
        if (player && player.active) {
            activePlayers.push(player);
        }
    });

    return activePlayers.length ? activePlayers[0] : null;
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

function makeEmptyMap(width, height) {
    var a = [];

    for (var j = 0; j < height; j++) {
        var _row = [];
        for (var i = 0; i < width; i++) {
            _row.push(null);
        }
        a.push(_row);
    }

    return a;
}

function tableMap(table, fn) {
    return table.map(function (row, ri) {
        return row.map(function (cell, ci) {
            return fn(cell, ri, ci);
        })
    })
}