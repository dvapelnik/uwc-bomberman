var
    _ = require('underscore')
    , PF = require('pathfinding')
    , console = require('better-console')

    , Block = require('../Block/Block')
    , BlockFireProof = require('../Block/BlockFireProof')
    , Player = require('../Player')
    , Bomb = require('../Bomb')
    , Flame = require('../Flame')

    , directions = require('../../util').directions
    , getRandomColor = require('../../util').getRandomColor
    , tableMap = require('../../util').tableMap
    , dumpTable = require('../../util').dumpTable
    , calcDistance = require('../../util').calcDistance
    , getDirection = require('../../util').getDirection
    , makeEmptyMap = require('../../util').makeEmptyMap
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

        var movementTimer = setInterval(function () {
            var costMap = buildStepConstMap(slave.place.sizes);
            var zeroTable = buildZeroTable(slave.place.sizes);

            //console.table(costMap);
            //console.table(zeroTable);

            player.move(_.sample(directions));
        }.bind(this), options.moveTimeout + delta);
    };

    this.terminate = function () {

    };

    function buildStepConstMap(sizes) {
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
                return options.bomb.detonationTimeout + 4 * options.moveTimeout + options.place.flameLifetime;
            } else {
                return options.bomb.detonationTimeout + 3 * options.moveTimeout + options.place.flameLifetime;
            }
        } else if (item instanceof Bomb) {
            if (location.x % 2 + location.y % 2 == 1) {
                return options.bomb.detonationTimeout + 3 * options.moveTimeout + options.place.flameLifetime;
            } else {
                return options.bomb.detonationTimeout + 5 * options.moveTimeout + options.place.flameLifetime;
            }
        } else if (item instanceof Flame) {
            return options.place.flameLifetime;
        } else if (item instanceof BlockFireProof) {
            return Infinity;
        } else {
            // empty
            return options.moveTimeout;
        }
    }

    function buildZeroTable(sizes) {
        return tableMap(makeEmptyMap(sizes), function () {
            return 0;
        })
    }

    function buildPath(from, to, matrix, sliceFirst, sliceLast) {
        //dumpTable(matrix, new Array(30).join('='), new Array(30).join('-'));
        matrix[from.y][from.x] = 0;
        matrix[to.y][to.x] = 0;
        //dumpTable(matrix, new Array(30).join('-'), new Array(30).join('='));

        var
            grid = new PF.Grid(matrix)
            , finder = new PF.AStarFinder()
            ;

        var path = finder.findPath(from.x, from.y, to.x, to.y, grid);

        return path.length > 2 ? path.slice(+sliceFirst, path.length - +sliceLast) : [];
    }
}

module.exports = AI;