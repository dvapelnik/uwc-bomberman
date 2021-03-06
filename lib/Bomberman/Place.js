var
    _ = require('underscore')
    , EventEmitter = require('events').EventEmitter
    , util = require('util')

    , Block = require('./Block/Block')
    , BlockFireProof = require('./Block/BlockFireProof')
    , Player = require('./Player')
    , Bomb = require('./Bomb')
    , Flame = require('./Flame')

    , directions = require('../util').directions
    , getNewLocation = require('../util').getNewLocation
    , isReserved = require('./../util').isReserved
    , buildAngles = require('./../util').buildAngles
    , isInBounds = require('./../util').isInBounds
    , isFireProofPlace = require('./../util').isFireProofPlace
    , tableMap = require('./../util').tableMap
    , makeEmptyMap = require('./../util').makeEmptyMap
    , makeChance = require('./../util').makeChance
    ;

function Place(game, options) {
    options = options || {};
    options.width = options.width || 13;
    options.height = options.height || 11;
    options.flameLifetime = options.flameLifetime || 250;
    options.chainExplosion = options.chainExplosion || false;
    options.filling = options.filling || {};
    options.filling.min = options.filling.min || 0;
    options.filling.max = options.filling.max || 10;

    this.getOptions = function () {
        return options;
    };

    this.sizes = {x: options.width, y: options.height};

    this.game = game;

    this.blocks = makeEmptyMap(this.sizes);
    this.blocksFireProof = makeEmptyMap(this.sizes);
    this.players = makeEmptyMap(this.sizes);
    this.bombs = makeEmptyMap(this.sizes);
    this.flames = makeEmptyMap(this.sizes);

    this.on('change', function (e) {
        if (this.game) {
            this.checkIsPlayerMovedToFlame();

            game.emit('change');
        }
    });
}

util.inherits(Place, EventEmitter);

Place.prototype.buildPlace = function (fillActual) {
    this.blocks = fillWithBlocks(
        this.sizes,
        this.getOptions().filling.min,
        this.getOptions().filling.max,
        fillActual
    );
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
                    color: player.getColor(),
                    bombCount: player.getBombCount(),
                    name: player.getName()
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

Place.prototype.setPlayers = function (players) {
    var angles = buildAngles(this.sizes);

    var that = this;

    players.map(function (player, idx) {
        var position = angles[idx];

        that.players[position.y][position.x] = player;

        player.place = that;
        player.location = _.clone(position);
    });
};

Place.prototype.getPlayers = function () {
    var players = [];

    var _players = this.players;

    if (_players == undefined) return players;

    tableMap(_players, function (player) {
        if (player) {
            players.push(player);
        }
    });

    return players;
};

Place.prototype.placeItem = function (item, location, options) {
    options = options || {};

    if (!isInBounds(location, this.sizes)) {
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

Place.prototype.destroy = function (item, location, options) {
    if (item) {
        options = options || {};

        if (item.terminate) {
            item.terminate();
        }

        var pool = getPool(this, item);

        if (pool) {
            pool[location.y][location.x] = null;
        }

        if (!options.silent) {
            this.emit('change', {target: this, msg: 'emit change on destroy'});
        }
    }
};

Place.prototype.destroyFromBomb = function (location, radius) {
    var
        that = this
        , shouldBeDestroyed = []
        , flamesAndBombs = []
        ;

    _.map(directions, function (direction) {
        var found = Place.findFirstOnDirection(direction, location, radius, that);

        if (found.items.length > 0) {
            _.each(found.items, function (item) {
                shouldBeDestroyed.push(item);
            });
        }

        var _loc = _.clone(location);

        var _placeFlame = function (flamePlaceLocation) {
            itemsAtFlameLocation = that.getItemsAt(flamePlaceLocation, false);

            if (!_.any(itemsAtFlameLocation, function (itemAtFlameLocation) {
                    //do not place flame on fireproof block and another flame
                    return itemAtFlameLocation instanceof BlockFireProof
                        || itemAtFlameLocation instanceof Flame
                        || itemAtFlameLocation instanceof Bomb
                        ;
                })) {
                _.each(itemsAtFlameLocation, function (itemAtFlameLocation) {
                    if (itemAtFlameLocation) {
                        that.destroy(itemAtFlameLocation, flamePlaceLocation, {silent: true});
                    }
                });

                var flame = new Flame(that, flamePlaceLocation);
                try {
                    //@todo try to remove try-catch block
                    that.placeItem(flame, flamePlaceLocation, {silent: true});
                    flamesAndBombs.push(flame);
                } catch (e) {
                }
            }
        };

        flamesAndBombs = flamesAndBombs.concat(that.getItemsAt(_loc));
        for (var i = 0; i < found.count; i++) {
            _loc = getNewLocation(_loc, direction);

            _placeFlame(_loc);
        }
    });

    _.each(shouldBeDestroyed, function (item) {
        if (item.item instanceof Flame) {
            return;
        }

        if (item.item instanceof Bomb) {
            if (that.getOptions().chainExplosion) {
                item.item.bang();
            }
        } else {
            that.destroy(item.item, item.location, {silent: true});
        }
    });

    setTimeout(function () {
        _.each(flamesAndBombs, function (flameOrBomb) {
            that.destroy(flameOrBomb, flameOrBomb.location, {silent: true});
        });

        that.emit('change', {target: that, msg: 'emit change after flame destroying'});
    }, this.getOptions().flameLifetime);

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
        ;

    if (!isInBounds(newLocation, this.sizes)) {
        throw new Error('Out of the bounds');
    }

    var blockNeighbour = player.place.blocks[newLocation.y][newLocation.x];
    var blockFireProofNeighbour = player.place.blocksFireProof[newLocation.y][newLocation.x];
    var playerNeighbour = player.place.players[newLocation.y][newLocation.x];
    var bombNeighbour = player.place.bombs[newLocation.y][newLocation.x];

    return blockNeighbour || blockFireProofNeighbour || playerNeighbour || bombNeighbour || null;
};

Place.prototype.terminate = function () {
    this.removeAllListeners();

    [
        this.bombs,
        this.players,
        this.blocks,
        this.blocksFireProof,
        this.flames
    ]
        .map(function (pool) {
            tableMap(pool, function (item) {
                if (item && item.terminate) {
                    item.terminate();
                }
            })
        });

    this.bombs = undefined;
    this.players = undefined;
    this.blocks = undefined;
    this.blocksFireProof = undefined;
    this.flames = undefined;
};

Place.findFirstOnDirection = function (direction, location, radius, place) {
    var
        result = {
            direction: direction,
            items: [],
            count: 0
        },
        _loc = _.clone(location), _items
        ;

    for (; result.count < radius - 1; result.count++) {
        _loc = getNewLocation(_loc, direction);

        if (!isInBounds(_loc, place.sizes)) {
            break;
        }

        _items = place.getItemsAt(_loc).filter(function (item) {
            // cross player explose flaming
            return !!item && !(item instanceof Player);
        });

        if (_items.length) {
            result.items = _items
                .filter(function (item) {
                    //do not remove fireproof blocks
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
};

module.exports = Place;

function fillWithBlocks(sizes, fillMin, fillMax, fillActual) {
    var place = [];

    for (var j = 0; j < sizes.y; j++) {
        _row = [];
        for (var i = 0; i < sizes.x; i++) {
            if (!isFireProofPlace({x: i, y: j})
                && !isReserved({x: i, y: j}, sizes)
                && makeChance(fillMin, fillMax, fillActual)) {
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
            if (isFireProofPlace({x: i, y: j})) {
                _row.push(new BlockFireProof);
            } else {
                _row.push(null);
            }
        }

        place.push(_row);
    }

    return place;
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