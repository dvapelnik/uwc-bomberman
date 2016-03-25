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
        , maxLag = 1 * options.moveTimeout
        ;

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
        var
            previousLocation = _.clone(slave.location)
            ;

        slave.once('beforeTerminate', function () {
            clearTimeout(thinkTimeout);
        });

        doThink();
    }

    function doThink() {
        var path = getShortestPathToAnyPlayer(slave, buildWeightMap());

        if (undefined === path || path.length == 0) {
            if (countOfAliveEnemies()) {
                setTimeout(doThink, getMoveTimeoutWithRandomLag());
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
                if (slave.hasABomb() && _.random(0, 2) == 0) {
                    thinkTimeout = setTimeout(doThink, 0);
                } else {
                    thinkTimeout = setTimeout(callback, options.bomb.detonationTimeout - 3 * getMoveTimeoutWithRandomLag());
                }
            }
        }, getMoveTimeoutWithRandomLag());
    }

    function findBackwardPaths(from) {
        var
        //bitmap = buildWeightMap()
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
                //return _.random(-1, 1);
                return b.length - a.length;
            })
            .pop()
            ;
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

    function buildBitMap() {
        return tableMap(slave.place.players, function (item, ri, ci) {
            return +this.getItemsAt({x: ci, y: ri}, false).every(function (item) {
                return item == null;
            });
        }.bind(slave.place));
    }

    function calcWeight(item, location, bombLocation) {
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
        var maxLaggedMoveTimeout = options.moveTimeout + maxLag;

        switch (true) {
            case item instanceof Block:
                if (location.x % 2 + location.y % 2 == 1) {
                    return options.bomb.detonationTimeout + 4 * maxLaggedMoveTimeout + options.place.flameLifetime;
                } else {
                    return options.bomb.detonationTimeout + 3 * maxLaggedMoveTimeout + options.place.flameLifetime;
                }
            case item instanceof Bomb:
                return Infinity;

                if (location.x % 2 + location.y % 2 == 1) {
                    return options.bomb.detonationTimeout + 3 * maxLaggedMoveTimeout + options.place.flameLifetime;
                } else {
                    return options.bomb.detonationTimeout + 5 * maxLaggedMoveTimeout + options.place.flameLifetime;
                }
            case item instanceof Flame:
                return options.place.flameLifetime + maxLaggedMoveTimeout;
            case isFlammable(location):
                return options.bomb.detonationTimeout + options.place.flameLifetime + maxLaggedMoveTimeout;
            case item instanceof BlockFireProof:
                return Infinity;
            default:
                return maxLaggedMoveTimeout;
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
        return options.moveTimeout + _.random(100, maxLag);
    }

    function isFlammable(location, epicenterLocation) {
        var
            mayBeFlamed = []
            , bombsLocations = []
            ;

        if (!slave.place.bombs) {
            return false;
        }

        tableMap(slave.place.bombs, function (cell, ri, ci) {
            if (cell instanceof Bomb) {
                var bombLocation = {x: ci, y: ri};

                bombsLocations.push(bombLocation);
            }
        });

        bombsLocations.map(function (bombsLocation) {
            for (var i = 1; i < options.bomb.explosionRadius; i++) {
                directions.map(function () {
                    mayBeFlamed = mayBeFlamed.concat(buildOnAxis(bombsLocation, i));
                });
            }
        });

        mayBeFlamed.filter(function (point) {
            return isInBounds({x: point[0], y: point[1]}, slave.place.sizes);
        });

        return pointsHasPoint(mayBeFlamed, location);
    }

    function countOfAliveEnemies() {
        return slave.place.getPlayers().filter(function (enemy) {
            return enemy !== slave && enemy.isAlive();
        }).length;
    }
}

util.inherits(AI, EventEmitter);

module.exports = AI;