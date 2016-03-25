var
    _ = require('underscore')
    , EventEmitter = require('events').EventEmitter
    , util = require('util')
    , console = require('better-console')
    , astar = require('javascript-astar').astar
    , Graph = require('javascript-astar').Graph

    , Place = require('../Place')
    , Block = require('../Block/Block')
    , BlockFireProof = require('../Block/BlockFireProof')
    , Player = require('../Player')
    , Bomb = require('../Bomb')
    , Flame = require('../Flame')

    , directions = require('../../util').directions
    , getRandomColor = require('../../util').getRandomColor
    , buildOnAxisDirection = require('../../util').buildOnAxisDirection
    , tableMap = require('../../util').tableMap
    , getDirection = require('../../util').getDirection
    , makeEmptyMap = require('../../util').makeEmptyMap
    , isInBounds = require('../../util').isInBounds
    , pointsHasPoint = require('../../util').pointsHasPoint
    ;

function AI(name, options) {
    options = options || {};
    options.moveTimeout = options.moveTimeout || 250;
    options.bomb = options.bomb || {};
    options.bomb.detonationTimeout = options.bomb.detonationTimeout || 3000;
    options.bomb.explosionRadius = options.bomb.explosionRadius || 3;
    options.place.flameLifetime = options.place.flameLifetime || 1000;

    var
        slave
        , thinkTimeout
        , maxLag = 100
        ;

    function getMoveTimeout() {
        return options.moveTimeout + maxLag;
    }

    this.name = name;
    this.color = getRandomColor();

    this.init = function (game, player) {
        slave = player;

        slave.setManipulator(this);

        start();
    };

    this.terminate = function () {
        if (thinkTimeout) {
            clearTimeout(thinkTimeout);
        }
    };

    function start() {


        slave.once('beforeTerminate', function () {
            clearTimeout(thinkTimeout);
        });

        doThink();
    }

    function doThink() {
        var
            path = getShortestPathToAnyPlayer(slave, buildWeightMap())
            , previousLocation = _.clone(slave.location)
            ;

        if (undefined === path || path.length == 0) {
            if (countOfAliveEnemies()) {
                setTimeout(doThink, getMoveTimeout());
            } else {
                clearTimeout(thinkTimeout);
            }

            return;
        }

        var
            newPathPoint = path.shift()
            , nextLocation = {x: newPathPoint[0], y: newPathPoint[1]}
            , makeNextThink = function () {
                previousLocation = _.clone(nextLocation);
                thinkTimeout = setTimeout(doThink, getMoveTimeout());
            }
            ;

        //try {
        var itWillBeBurnedFlag = itWillBeBurned(nextLocation, function (bombInfo) {
            var now = new Date().getTime();

            var timeToExplosion = now - (bombInfo.placedAt + options.bomb.detonationTimeout + options.place.flameLifetime);

            return timeToExplosion > 0 && timeToExplosion < options.moveTimeout;
        });

        switch (itWillBeBurnedFlag || getItemOnNextLocation(nextLocation)) {
            case true:
            case 'flame':
                setTimeout(makeNextThink, getMoveTimeout());
                break;
            case 'bomb':
                if (_.random(0, 1)) {
                    placeBomb(makeNextThink);
                } else {
                    moveByEscapePath(findBackwardPaths(previousLocation), makeNextThink);
                }
                break;
            case 'player':
                placeBomb(makeNextThink);
                break;
            case 'block':
                placeBomb(makeNextThink);
                break;
            default:
                move(getDirection(_.clone(slave.location), nextLocation), makeNextThink);
        }
        //} catch (e) {
        //    console.log(e.message);
        //
        //    throw e;
        //}
    }

    function placeBomb(callback) {
        slave.placeBomb();

        moveByEscapePath(findBackwardPaths(slave.location), callback);
    }

    function move(direction, callback) {
        slave.move(direction);

        callback();
    }

    function moveByEscapePath(path, callback) {
        thinkTimeout = setTimeout(function _fn() {
            var newPathPoint, nextLocation;

            if (path && (newPathPoint = path.shift())) {
                nextLocation = {x: newPathPoint[0], y: newPathPoint[1]};

                try {
                    slave.move(getDirection(slave.location, nextLocation));
                } catch (e) {
                } finally {
                    thinkTimeout = setTimeout(_fn, getMoveTimeout());
                }
            } else {
                if (slave.hasABomb()/* && _.random(0, 2) == 0*/) {
                    thinkTimeout = setTimeout(doThink, 0);
                } else {
                    thinkTimeout = setTimeout(callback, options.bomb.detonationTimeout - 3 * options.moveTimeout);
                }
            }
        }, getMoveTimeout());
    }

    function findBackwardPaths(from) {
        var
            bitmap = buildWeightMap()
        //bitmap = buildBitMap()
            ;

        var pathDestinationPair = [];
        tableMap(makeEmptyMap(slave.place.sizes), function (cell, ri, ci) {
            var location = {x: ci, y: ri};
            var path = buildPath(from, location, bitmap);

            pathDestinationPair.push({
                path: path,
                location: location
            });
        });

        var shortenPath = pathDestinationPair
            .filter(function (pathDestinationPair) {
                // Check tail of path will not be burned
                return !itWillBeBurned(pathDestinationPair.location)
                        // Filter zero-length paths
                    && pathDestinationPair.path.length > 0
                        // Filter paths which contain Blocks and Players - they ara not walkable
                    && slave.place.getItemsAt(pathDestinationPair.location).length == 0
                    && pathDestinationPair.path.every(function (point) {
                        return slave.place.getItemsAt({x: point[0], y: point[1]}, false).every(function (item) {
                            return item == null || item instanceof Player;
                        });
                    });
            })
            .sort(function (a, b) {
                return b.path.length - a.path.length;
            })
            .pop();

        //console.table(bitmap);
        //console.log(shortenPath);

        return shortenPath ? shortenPath.path : [];
    }

    function buildWeightMap() {
        var emptyMap = makeEmptyMap(slave.place.sizes);

        return tableMap(emptyMap, function (cell, ri, ci) {
            var location = {x: ci, y: ri};

            return _.chain(slave.place.getItemsAt(location, false))
                .map(function (item) {
                    return {
                        item: item,
                        weight: calcWeight(item, location)
                    };
                })
                .max(function (itemCostPair) {
                    return itemCostPair.weight;
                })
                .value().weight;
        });
    }

    function calcWeight(item, location) {
        /**
         * Here is location.x % 2 + location.y % 2 == 1
         * x-x-x
         * o----
         * x-x-x
         *
         * Here is location.x % 2 + location.y % 2 == 0
         * x-x-x
         * -o---
         * x-x-x
         */

        switch (true) {
            case item instanceof Block:
                if (location.x % 2 + location.y % 2 == 1) {
                    return options.bomb.detonationTimeout + 2 * getMoveTimeout() + options.place.flameLifetime;
                } else {
                    return options.bomb.detonationTimeout + 3 * getMoveTimeout() + options.place.flameLifetime;
                }
            case item instanceof Bomb:
                return Infinity;

                //@todo keep in mind - it place is unreachable
                if (location.x % 2 + location.y % 2 == 1) {
                    return options.bomb.detonationTimeout + 3 * getMoveTimeout() + options.place.flameLifetime;
                } else {
                    return options.bomb.detonationTimeout + 5 * getMoveTimeout() + options.place.flameLifetime;
                }
            case item instanceof Flame:
                return options.place.flameLifetime + getMoveTimeout();
            case itWillBeBurned(location, function (bombInfo) {
                //    @todo keep in mind timeout
                var now = new Date().getTime();

                var timeToExplosion = now - (bombInfo.placedAt + options.bomb.detonationTimeout);

                return timeToExplosion > 0 && timeToExplosion < getMoveTimeout() + options.place.flameLifetime;
            }):
                return options.place.flameLifetime + getMoveTimeout();
            case item instanceof Player:
                return Infinity;
            case item instanceof BlockFireProof:
                return Infinity;
            default:
                return getMoveTimeout();
        }
    }

    function getShortestPathToAnyPlayer(slave, weightMap) {
        return slave.place.getPlayers()
            .map(function (player) {
                return buildPath(slave.location, player.location, weightMap);
            })
            .filter(function (path) {
                return path.length > 0;
            })
            .sort(function (a, b) {
                return b.length - a.length;
            })
            .pop();
    }

    function buildPath(from, to, matrix) {
        var graphWithWeight = new Graph(matrix);

        return astar
            .search(
                graphWithWeight,
                graphWithWeight.grid[from.y][from.x],
                graphWithWeight.grid[to.y][to.x])
            .map(function (node) {
                return [node.y, node.x];
            });
    }

    function getItemOnNextLocation(location) {
        var items = slave.place.getItemsAt(location, true);

        if (items.length == 0) return undefined;

        var typeNamePairs = [
            {type: Bomb, name: 'bomb'},
            {type: Player, name: 'player'},
            {type: Block, name: 'block'},
            {type: Flame, name: 'flame'}
        ];

        for (var i = 0; i < typeNamePairs.length; i++) {
            if ((function (i) {
                    return items.some(function (item) {
                        return item instanceof typeNamePairs[i].type;
                    })
                })(i)) {
                return typeNamePairs[i].name;
            }
        }
    }

    /**
     * @param location
     * @param timeFilter Finction with argument as bombInfo which sas two fields: location {x,y} and placedAd microtime
     * @returns {*}
     */
    function itWillBeBurned(location, timeFilter) {
        var
            willBeBurned = []
            , bombsInfo = []
            ;

        if (!slave.place.bombs) {
            return false;
        }

        tableMap(slave.place.bombs, function (cell, ri, ci) {
            if (cell instanceof Bomb) {
                var bombLocation = {x: ci, y: ri};

                bombsInfo.push({
                    location: bombLocation,
                    placedAt: cell.getPlacedAt()
                });
            }
        });

        bombsInfo
            .filter((function () {
                return timeFilter ? timeFilter : function () {
                    return true;
                }
            })())
            .map(function (bombInfo) {
                for (var dc = 0; dc < directions.length; dc++) {
                    var direction = directions[dc];

                    for (var i = 1; i < options.bomb.explosionRadius; i++) {

                        var p = buildOnAxisDirection(bombInfo.location, i, direction);

                        if (!isInBounds(p, slave.place.sizes)) {
                            continue;
                        }

                        var itemsAtPlace = slave.place.getItemsAt(p, true);

                        willBeBurned.push(_.clone(p));

                        if (itemsAtPlace.some(function (item) {
                                return item instanceof Block
                                    || item instanceof BlockFireProof
                                    || item instanceof Bomb;
                            })) {
                            break;
                        }
                    }
                }
            });

        return pointsHasPoint(willBeBurned, location);
    }

    function countOfAliveEnemies() {
        return slave.place.getPlayers().filter(function (enemy) {
            return enemy !== slave && enemy.isAlive();
        }).length;
    }
}

util.inherits(AI, EventEmitter);

module.exports = AI;