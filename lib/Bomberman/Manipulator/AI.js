var
    _ = require('underscore')
    , console = require('better-console')
    , astar = require('javascript-astar').astar
    , Graph = require('javascript-astar').Graph

    , Block = require('../Block/Block')
    , BlockFireProof = require('../Block/BlockFireProof')
    , Player = require('../Player')
    , Bomb = require('../Bomb')
    , Flame = require('../Flame')

    , directions = require('../../util').directions
    , getRandomColor = require('../../util').getRandomColor
    , tableMap = require('../../util').tableMap
    , dumpTable = require('../../util').dumpTable
    , getDirection = require('../../util').getDirection
    , makeEmptyMap = require('../../util').makeEmptyMap
    , locationsIsEqual = require('../../util').locationsIsEqual
    ;

function AI(name, options) {
    options = options || {};
    options.moveTimeout = options.moveTimeout || 250;
    options.bomb = options.bomb || {};
    options.bomb.detonationTimeout = options.bomb.detonationTimeout || 3000;
    options.bomb.explosionRadius = options.bomb.explosionRadius || 3;
    options.place.flameLifetime = options.place.flameLifetime || 1000;

    var
        delta = 100
        , slave
        ;

    this.name = name;
    this.color = getRandomColor();

    this.init = function (game, player) {
        slave = player;

        slave.setManipulator(this);

        var
            previousLocation = _.clone(slave.location)
            , weightMap = buildStepWeightMap(slave.place.sizes)
            , movementTimer = setInterval(function () {
                var path = getShortestPathToAnyPlayer(slave, weightMap);

                if (undefined === path) {
                    clearInterval(movementTimer);
                    return;
                }

                var
                    newPathPoint = path.shift()
                    , nextLocation = {x: newPathPoint[0], y: newPathPoint[1]}
                    ;

                try {
                    slave.move(getDirection(_.clone(slave.location), nextLocation));
                    previousLocation = _.clone(nextLocation);
                } catch (e) {
                }
            }.bind(this), options.moveTimeout + delta);
    };

    this.terminate = function () {

    };

    function buildStepWeightMap(sizes) {
        var emptyMap = makeEmptyMap(sizes);

        return tableMap(emptyMap, function (cell, ri, ci) {
            var location = {x: ci, y: ri};
            return _.chain(slave.place.getItemsAt(location, false))
                .map(function (item) {
                    return {
                        item: item,
                        stepCost: getCost(item, location)
                    };
                })
                .max(function (itemCostPair) {
                    return itemCostPair.stepCost;
                })
                .value().stepCost;
        });
    }

    function getCost(item, location) {
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
                return options.bomb.detonationTimeout + 4 * (options.moveTimeout + delta) + options.place.flameLifetime;
            } else {
                return options.bomb.detonationTimeout + 3 * (options.moveTimeout + delta) + options.place.flameLifetime;
            }
        } else if (item instanceof Bomb) {
            if (location.x % 2 + location.y % 2 == 1) {
                return options.bomb.detonationTimeout + 3 * (options.moveTimeout + delta) + options.place.flameLifetime;
            } else {
                return options.bomb.detonationTimeout + 5 * (options.moveTimeout + delta) + options.place.flameLifetime;
            }
        } else if (item instanceof Flame) {
            return options.place.flameLifetime;
        } else if (item instanceof BlockFireProof) {
            return Infinity;
        } else {
            // empty
            return (options.moveTimeout + delta);
        }
    }

    function getShortestPathToAnyPlayer(slave, costMatrix) {
        return slave.place.getPlayers()
            .map(function (player) {
                return buildPath(slave.location, player.location, costMatrix);
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
}

module.exports = AI;