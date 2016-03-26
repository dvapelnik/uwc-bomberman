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
    , makeChance = require('../../util').makeChance
    ;

function AI(name, options) {
    options = options || {};

    options.moveTimeout = options.moveTimeout || 250;
    options.movementLag = options.movementLag !== undefined ? options.movementLag : options.moveTimeout;
    options.bomb = options.bomb || {};
    options.bomb.detonationTimeout = options.bomb.detonationTimeout || 3000;
    options.bomb.explosionRadius = options.bomb.explosionRadius || 3;

    options.bomb.placementChance = options.bomb.placementChance || {};

    options.bomb.placementChance.underEnemy = options.bomb.placementChance.underEnemy || {};
    options.bomb.placementChance.underEnemy.min =
        options.bomb.placementChance.underEnemy.min !== undefined ? options.bomb.placementChance.underEnemy.min : 0;
    options.bomb.placementChance.underEnemy.max =
        options.bomb.placementChance.underEnemy.max !== undefined ? options.bomb.placementChance.underEnemy.max : 10;
    options.bomb.placementChance.underEnemy.actual =
        options.bomb.placementChance.underEnemy.actual !== undefined ? options.bomb.placementChance.underEnemy.actual : 10;

    options.bomb.placementChance.underBomb = options.bomb.placementChance.underBomb || {};
    options.bomb.placementChance.underBomb.min =
        options.bomb.placementChance.underBomb.min !== undefined ? options.bomb.placementChance.underBomb.min : 0;
    options.bomb.placementChance.underBomb.max =
        options.bomb.placementChance.underBomb.max !== undefined ? options.bomb.placementChance.underBomb.max : 10;
    options.bomb.placementChance.underBomb.actual =
        options.bomb.placementChance.underBomb.actual !== undefined ? options.bomb.placementChance.underBomb.actual : 10;

    options.place.flameLifetime = options.place.flameLifetime || 1000;


    var
        slave
        , thinkTimeout
        ;

    function getMoveTimeout() {
        return options.moveTimeout + options.movementLag;
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

        try {
            var itWillBeBurnedFlag = isItWillBeBurned(nextLocation, function (bombInfo) {
                var
                    now = new Date().getTime()
                    , timeToExplosion = now - (bombInfo.placedAt + options.bomb.detonationTimeout + options.place.flameLifetime)
                    ;

                return timeToExplosion > 0 && timeToExplosion < getMoveTimeout();
            });

            switch (itWillBeBurnedFlag || getItemOnNextLocation(nextLocation)) {
                case true:
                case 'flame':
                    setTimeout(makeNextThink, getMoveTimeout());
                    break;
                case 'bomb':
                    placeBomb(makeNextThink, options.bomb.placementChance.underBomb);
                    break;
                case 'player':
                    placeBomb(makeNextThink, options.bomb.placementChance.underEnemy);
                    break;
                case 'block':
                    placeBomb(makeNextThink);
                    break;
                default:
                    move(getDirection(_.clone(slave.location), nextLocation), makeNextThink);
            }
        } catch (e) {
            console.log(e.message);
        }
    }

    function placeBomb(callback, chanceOptions) {
        if (!chanceOptions || makeChance(chanceOptions.min, chanceOptions.max, chanceOptions.actual)) {
            slave.placeBomb();
        }

        escape(findEscapePath(slave.location), callback);
    }

    function move(direction, callback) {
        slave.move(direction);

        callback();
    }

    function escape(path, callback) {
        walkByPath(path, function () {
            if (slave.hasABomb()) {
                thinkTimeout = setTimeout(doThink, 0);
            } else {
                thinkTimeout = setTimeout(callback, options.bomb.detonationTimeout - 3 * options.moveTimeout);
            }
        });
    }

    function walkByPath(path, callback) {
        thinkTimeout = setTimeout(function makeStep() {
            var
                newPathPoint
                , nextLocation;

            if (path && (newPathPoint = path.shift())) {
                nextLocation = {x: newPathPoint[0], y: newPathPoint[1]};

                try {
                    slave.move(getDirection(slave.location, nextLocation));
                } catch (e) {
                } finally {
                    thinkTimeout = setTimeout(makeStep, getMoveTimeout());
                }
            } else {
                callback();
            }
        }, getMoveTimeout());
    }

    function findEscapePath(from) {
        var
            bitmap = buildWeightMap()
            , delta = 4
            , pathDestinationPair = []
            ;

        tableMap(makeEmptyMap(slave.place.sizes), function (cell, ri, ci) {
            var location = {x: ci, y: ri};

            //filter points on delta-environment from location
            if (ci >= from.x - delta &&
                ci <= from.x + delta &&
                ri >= from.y - delta &&
                ri <= from.y + delta &&
                    // Check tail of path will not be burned
                !isItWillBeBurned(location)
            ) {
                var path = buildPath(from, location, bitmap);

                if (path.length > 0 &&
                        // Filter paths which contain Blocks and Players - they are not walkable
                    slave.place.getItemsAt(location).length == 0 &&
                    path.every(function (point, stepNumber) {
                        var _location = {x: point[0], y: point[1]};

                        // check is each cell not be burned on current step
                        return !isItWillBeBurned(_location, function (bombInfo) {
                                var
                                    now = new Date().getTime()
                                    , timeToExplosion = now - (bombInfo.placedAt + options.bomb.detonationTimeout)
                                    ;

                                return timeToExplosion > 0 && timeToExplosion < stepNumber * getMoveTimeout() + options.place.flameLifetime;
                            }) &&
                                // check is each cell not blocked by items except Players
                            slave.place.getItemsAt(_location, false).every(function (item) {
                                return item == null || item instanceof Player;
                            });
                    })
                ) {
                    pathDestinationPair.push({
                        path: path,
                        location: location
                    });
                }
            }
        });

        var shortenPath = pathDestinationPair
            .sort(function (a, b) {
                return b.path.length - a.path.length;
            })
            .pop();

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
            case isItWillBeBurned(location, function (bombInfo) {
                //    @todo keep in mind timeout
                var
                    now = new Date().getTime()
                    , timeToExplosion = now - (bombInfo.placedAt + options.bomb.detonationTimeout)
                    ;

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
        var
            items = slave.place.getItemsAt(location, true)
            , typeNamePairs = [
                {type: Bomb, name: 'bomb'},
                {type: Player, name: 'player'},
                {type: Block, name: 'block'},
                {type: Flame, name: 'flame'}
            ];

        if (items.length == 0) return undefined;

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
    function isItWillBeBurned(location, timeFilter) {
        var
            willBeBurned = []
            , bombsInfo = []
            ;

        if (!slave.place.bombs) {
            return false;
        }

        tableMap(slave.place.bombs, function (cell, ri, ci) {
            if (cell instanceof Bomb) {
                bombsInfo.push({
                    location: {x: ci, y: ri},
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
                        var
                            p = buildOnAxisDirection(bombInfo.location, i, direction)
                            , itemsAtPlace
                            ;

                        if (!isInBounds(p, slave.place.sizes)) {
                            continue;
                        }

                        itemsAtPlace = slave.place.getItemsAt(p, true);

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