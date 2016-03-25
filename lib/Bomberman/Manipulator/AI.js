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
    , buildDiagonals = require('../../util').buildDiagonals
    , buildOnAxis = require('../../util').buildOnAxis
    , buildOnHorse = require('../../util').buildOnHorse
    , tableMap = require('../../util').tableMap
    , dumpTable = require('../../util').dumpTable
    , getDirection = require('../../util').getDirection
    , makeEmptyMap = require('../../util').makeEmptyMap
    , locationsIsEqual = require('../../util').locationsIsEqual
    , isInBounds = require('../../util').isInBounds
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
        ;

    this.name = name;
    this.color = getRandomColor();

    this.init = function (game, player) {
        slave = player;

        slave.setManipulator(this);

        start(slave);
    };

    this.terminate = function () {
        if (thinkTimeout) {
            clearTimeout(thinkTimeout);
        }
    };

    function start(slave) {
        var
            previousLocation = _.clone(slave.location)
            , weightMap = buildStepWeightMap(slave.place.sizes)
            , doThink = function doThink() {
                var path = getShortestPathToAnyPlayer(slave, weightMap);

                if (undefined === path) {
                    clearTimeout(thinkTimeout);
                    return;
                }

                var
                    newPathPoint = path.shift()
                    , nextLocation = {x: newPathPoint[0], y: newPathPoint[1]}
                    , makeNextThink = function () {
                        previousLocation = _.clone(nextLocation);
                        thinkTimeout = setTimeout(doThink, getMoveTimeoutWithRandomLag());
                    }
                    ;

                try {
                    switch (getItemOnNextLocation(nextLocation)) {
                        case'bomb':
                            placeBomb(makeNextThink);
                            //moveByEscapePath(findBackwardPaths(previousLocation), makeNextThink);
                            break;
                        case'player':
                            placeBomb(makeNextThink);
                            break;
                        case'block':
                            placeBomb(makeNextThink);
                            break;
                        default:
                            move(getDirection(_.clone(slave.location), nextLocation), makeNextThink);
                    }
                } catch (e) {
                    console.log(e.message);
                }
            }
            ;

        slave.once('beforeTerminate', function () {
            clearTimeout(thinkTimeout);
        });

        doThink();
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
                    thinkTimeout = setTimeout(_fn, getMoveTimeoutWithRandomLag());
                }
            } else {
                thinkTimeout = setTimeout(callback, options.bomb.detonationTimeout - 3 * getMoveTimeoutWithRandomLag());
            }
        }, getMoveTimeoutWithRandomLag());
    }

    function findBackwardPaths(from) {
        var
            bitmap = buildBitMap()
            , safePoints
            ;

        if (from.x % 2 + from.y % 2) {
            safePoints = [].concat(buildDiagonals(from, 1), buildOnAxis(from, options.bomb.explosionRadius));
        } else {
            safePoints = [].concat(buildOnAxis(from, options.bomb.explosionRadius), buildOnHorse(from));
        }

        return safePoints
            .filter(function (point) {
                return isInBounds(point, slave.place.sizes) && slave.place.getItemsAt(point, true).length == 0;
            })
            .map(function (point) {
                return buildPath(from, point, bitmap);
            })
            .filter(function (path) {
                return path.length != 0 && path.length <= options.bomb.explosionRadius;
            })
            .sort(function (a, b) {
                return b.length - a.length;
            })
            .pop()
            ;
    }

    function buildStepWeightMap(sizes) {
        var emptyMap = makeEmptyMap(sizes);

        return tableMap(emptyMap, function (cell, ri, ci) {
            var location = {x: ci, y: ri};
            return _.chain(slave.place.getItemsAt(location, false))
                .map(function (item) {
                    return {
                        item: item,
                        stepCost: calcWeight(item, location)
                    };
                })
                .max(function (itemCostPair) {
                    return itemCostPair.stepCost;
                })
                .value().stepCost;
        });
    }

    function buildBitMap() {
        var place = slave.place;

        return tableMap(place.players, function (item, ri, ci) {
            return +this.getItemsAt({x: ci, y: ri}, false).every(function (item) {
                return item == null;
            });
        }.bind(place));
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
        if (item instanceof Block) {
            if (location.x % 2 + location.y % 2 == 1) {
                return options.bomb.detonationTimeout + 4 * getMoveTimeoutWithRandomLag() + options.place.flameLifetime;
            } else {
                return options.bomb.detonationTimeout + 3 * getMoveTimeoutWithRandomLag() + options.place.flameLifetime;
            }
        } else if (item instanceof Bomb) {
            if (location.x % 2 + location.y % 2 == 1) {
                return options.bomb.detonationTimeout + 3 * getMoveTimeoutWithRandomLag() + options.place.flameLifetime;
            } else {
                return options.bomb.detonationTimeout + 5 * getMoveTimeoutWithRandomLag() + options.place.flameLifetime;
            }
        } else if (item instanceof Flame) {
            return options.place.flameLifetime;
        } else if (item instanceof BlockFireProof) {
            return Infinity;
        } else {
            // empty
            return getMoveTimeoutWithRandomLag();
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

    function getMoveTimeoutWithRandomLag() {
        return options.moveTimeout + _.random(100, options.moveTimeout);
    }
}

util.inherits(AI, EventEmitter);

module.exports = AI;