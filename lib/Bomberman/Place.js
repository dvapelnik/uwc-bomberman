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
    this.blocksFireProof = makeEmptyMap(this.sizes.x, this.sizes.y);
    this.players = makeEmptyMap(this.sizes.x, this.sizes.y);
    this.bombs = makeEmptyMap(this.sizes.x, this.sizes.y);
}

Place.prototype.buildPlace = function (fillLevel) {
    fillLevel = fillLevel || 2;

    this.blocks = fillWithBlocks(this.sizes, fillLevel);
    this.blocksFireProof = fillWithFireProofBlocks(this.sizes);
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

            return {type: 'empty'};
        }),
        blocksFireProof: tableMap(this.blocksFireProof, function (block) {
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

    this.blocks = tableMap(obj.blocks, function (o) {
        if (o.type == 'block') {
            if (false == o.isFireProof) return new Block();
        }

        return null;
    });

    this.blocksFireProof = tableMap(obj.blocksFireProof, function (o) {
        if (o.type == 'block') {
            if (true === o.isFireProof) return new BlockFireProof();
        }

        return null;
    });

    this.players = tableMap(obj.players, function (o) {
        if (o.type == 'player') {
            var player = new Player();

            player.active = o.isActive;
            player.color = o.color;

            return player;
        }

        return null;
    });

    this.bombs = tableMap(obj.bombs, function (o) {
        if (o.type == 'bomb') {
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
    this.bombs[bomb.location.y][bomb.location.x] = bomb;
    bomb.place = this;
};

Place.prototype.canPlaceBombAt = function (location) {
    return this.blocks[location.y][location.x] === null &&
        this.bombs[location.y][location.x] === null;
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

Place.prototype.destroy = function (item, location) {
    var pool;

    switch (true) {
        case item instanceof Block:
            pool = this.blocks;
            break;
        case item instanceof BlockFireProof:
            pool = this.blocksFireProof;
            break;
        case item instanceof Player:
            pool = this.players;
            break;
        case item instanceof Bomb:
            pool = this.bombs;
            break;
        default:
            throw new Error('Unsupported item type');
    }

    pool[location.y][location.x] = null;
};

module.exports = Place;

function fillWithBlocks(sizes, fillLevel) {
    var place = [];

    for (var j = 0; j < sizes.y; j++) {
        _row = [];
        for (var i = 0; i < sizes.x; i++) {
            if (!isFireProofPlace(i, j) && !isReserved(i, j, sizes.x, sizes.y) && getRandom(1, 10) > 10 - fillLevel) {
                _row.push(new Block);
            } else {
                _row.push(null);
            }
        }

        place.push(_row);
    }

    return place;
}

function fillWithFireProofBlocks(sizes) {
    var place = [];

    for (var j = 0; j < sizes.y; j++) {
        _row = [];
        for (var i = 0; i < sizes.x; i++) {
            if (isFireProofPlace(i, j)) {
                _row.push(new BlockFireProof);
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

function isFireProofPlace(point_x, point_y) {
    return point_x % 2 == 1 && point_y % 2 == 1
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