var
    _ = require('underscore')
    , EventEmitter = require('events').EventEmitter
    , util = require('util')

    , Block = require('./Block/Block')
    , BlockFireProof = require('./Block/BlockFireProof')
    , Player = require('./Player')
    , Bomb = require('./Bomb')
    , Flame = require('./Flame')

    , getNewLocation = require('../util').getNewLocation
    , isReserved = require('./../util').isReserved
    , isFireProofPlace = require('./../util').isFireProofPlace
    , getRandom = require('./../util').getRandom
    , tableMap = require('./../util').tableMap
    ;

function Place(game) {
    this.sizes = {x: 13, y: 11};

    this.game = game;

    this.blocks = makeEmptyMap(this.sizes.x, this.sizes.y);
    this.blocksFireProof = makeEmptyMap(this.sizes.x, this.sizes.y);
    this.players = makeEmptyMap(this.sizes.x, this.sizes.y);
    this.bombs = makeEmptyMap(this.sizes.x, this.sizes.y);
    this.flames = makeEmptyMap(this.sizes.x, this.sizes.y);

    this.on('change', function (e) {
        if (this.game) {
            this.checkIsPlayerMovedToFlame();

            game.emit('change');
        }
    });
}

util.inherits(Place, EventEmitter);

Place.prototype.buildPlace = function (fillLevel) {
    fillLevel = fillLevel || 2;

    this.blocks = fillWithBlocks(this.sizes, fillLevel);
    this.blocksFireProof = fillWithFireProofBlocks(this.sizes);
};

Place.prototype.serialize = function (playerContext) {
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
                    isActive: playerContext === player,
                    color: player.color,
                    bombCount: player.getBombCount()
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
        }),
        flames: tableMap(this.flames, function (flame) {
            if (flame instanceof Flame) {
                return {
                    type: 'flame'
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
            player.bombCount = o.bombCount;

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

    this.flames = tableMap(obj.flames, function (o) {
        if (o.type == 'flame') {
            return new Flame();
        }

        return null;
    });
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

Place.prototype.getPlayers = function () {
    var players = [];

    tableMap(this.players, function (player) {
        if (player) {
            players.push(player);
        }
    });

    return players;
};

Place.prototype.placeItem = function (item, location, options) {
    options = options || {};

    if (location.x < 0 || location.x > this.sizes.x - 1 || location.y < 0 || location.y > this.sizes - 1) {
        throw new Error('Location out of bounds');
    }

    getPool(this, item)[location.y][location.x] = item;

    if (!options.silent) {
        this.emit('change', {target: this, msg: 'emit change on place'});
    }
};

Place.prototype.placeBomb = function (bomb) {
    this.placeItem(bomb, bomb.location);
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

Place.prototype.destroy = function (item, location, options) {
    options = options || {};

    getPool(this, item)[location.y][location.x] = null;

    if (!options.silent) {
        this.emit('change', {target: this, msg: 'emit change on destroy'});
    }
};

Place.prototype.destroyFromBomb = function (location, radius) {
    var
        that = this
        , findFirstOnDirection = function (direction) {
            var
                result = {
                    items: [],
                    count: 0
                },
                _loc = _.clone(location), _items
                ;

            for (; result.count <= radius; result.count++) {
                _loc = getNewLocation(_loc, direction);

                if (_loc.x < 0 || _loc.x > that.sizes.x - 1 ||
                    _loc.y < 0 || _loc.y > that.sizes.y - 1) {
                    break;
                }

                _items = that.getItemsAt(_loc);

                if (_items.length) {
                    result.items = _items
                        .filter(function (item) {
                            return !!item && !(item instanceof BlockFireProof);
                        })
                        .map(function (_item) {
                            return {
                                item: _item,
                                location: _.clone(_loc)
                            }
                        });
                    result.count++;
                    break;
                }
            }

            return result;
        }
        , shouldBeDestroyed = []
        , flamesAndBombs = []
        ;

    _.map(['up', 'right', 'down', 'left'], function (direction) {
        var found = findFirstOnDirection(direction, that.sizes);

        if (found.items.length > 0) {
            _.each(found.items, function (item) {
                shouldBeDestroyed.push(item);
            });
        }

        var _loc = _.clone(location);

        var _placeFire = function (_loc) {
            _itemsAtLocation = that.getItemsAt(_loc, false);

            if (!_.any(_itemsAtLocation, function (_item) {
                    return _item instanceof BlockFireProof || _item instanceof Flame;
                })) {

                _.each(_itemsAtLocation, function (_item) {
                    if (_item && !(_item instanceof Bomb)) {
                        that.destroy(_item, _loc, {silent: true});
                    }
                });

                var flame = new Flame(that, _loc);
                try {
                    //@todo try to remove try-catch block
                    that.placeItem(flame, _loc, {silent: true});
                    flamesAndBombs.push(flame);
                } catch (e) {
                }
            }
        };

        flamesAndBombs = flamesAndBombs.concat(that.getItemsAt(_loc));
        for (var i = 0; i < found.count; i++) {
            _loc = getNewLocation(_loc, direction);

            _placeFire(_loc);
        }
    });

    _.each(shouldBeDestroyed, function (item) {
        if (item.item instanceof Flame) {
            return;
        }

        if (item.item instanceof Bomb) {
            item.item.bang();
        } else {
            that.destroy(item.item, item.location, {silent: true});
        }
    });

    setTimeout(function () {
        _.each(flamesAndBombs, function (flameOrBomb) {
            that.destroy(flameOrBomb, flameOrBomb.location, {silent: true});
        });

        that.emit('change', {target: that, msg: 'emit change after flame destroying'});
    }, 1000);

    that.emit('change', {target: that, msg: 'emit change after flame placing'});
};

Place.prototype.getItemsAt = function (location, filterNulls) {
    filterNulls = filterNulls === undefined ? true : filterNulls;

    var itemsAtLocation = [this.bombs, this.players, this.blocks, this.blocksFireProof, this.flames]
        .map(function (pool) {
            try {
                return pool[location.y][location.x];
            } catch (e) {
                return undefined;
            }
        });

    if (filterNulls) {
        itemsAtLocation = itemsAtLocation.filter(function (item) {
            return item !== null;
        });
    }

    return itemsAtLocation;

};

Place.prototype.move = function (item, direction) {
    var newLocation = getNewLocation(item.location, direction);

    var pool = getPool(this, item);

    var _tmp = pool[newLocation.y][newLocation.x];
    pool[newLocation.y][newLocation.x] = pool[item.location.y][item.location.x];
    pool[item.location.y][item.location.x] = _tmp;

    item.location = newLocation;

    this.emit('change', {target: this, msg: 'emit change on moving item'});
};

Place.prototype.checkIsPlayerMovedToFlame = function () {
    _.each(this.getPlayers(), function (player) {
        _.each(this.getItemsAt(player.location), function (item) {
            if (item instanceof Flame) {
                this.destroy(player, player.location);
            }
        }, this);
    }, this);
};

Place.prototype.canMove = function (player, direction) {
    try {
        var neighbour = this.getNeighbour(player, direction);

        return neighbour === null;
    } catch (e) {
        return false;
    }
};

Place.prototype.getNeighbour = function (player, direction) {
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

function getPool(place, item) {
    var pool;

    switch (true) {
        case item instanceof Block:
            pool = place.blocks;
            break;
        case item instanceof BlockFireProof:
            pool = place.blocksFireProof;
            break;
        case item instanceof Player:
            pool = place.players;
            break;
        case item instanceof Bomb:
            pool = place.bombs;
            break;
        case item instanceof Flame:
            pool = place.flames;
            break;
        default:
            throw new Error('Unsupported item type');
    }

    return pool;
}