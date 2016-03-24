var
    _ = require('underscore')
    , PF = require('pathfinding')

    , directions = require('../../util').directions
    , getRandomColor = require('../../util').getRandomColor
    , tableMap = require('../../util').tableMap
    , dumpTable = require('../../util').dumpTable
    , calcDistance = require('../../util').calcDistance
    , getDirection = require('../../util').getDirection
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
            path
            , previousLocation = _.clone(slave.location)
            ;

        path = buildPath(
            slave.location,
            findNearestEnemyFrom(slave.location).location,
            buildBitMap(),
            true, true);

        if (path.length == 0) {
            path = findShortenPathToNearestBlock();
        }

        var movementTimer = setInterval(function () {
            if (path.length == 0) {
                clearInterval(movementTimer);
            } else {
                var newPathPoint = path.shift();
                var nextLocation = {x: newPathPoint[0], y: newPathPoint[1]};

                slave.move(getDirection(previousLocation, nextLocation));
                previousLocation = _.clone(nextLocation);
            }
        }.bind(this), options.moveTimeout + delta);
    };

    this.terminate = function () {

    };

    function buildBitMap() {
        var place = slave.place;

        return tableMap(place.players, function (item, ri, ci) {
            return +!this.getItemsAt({x: ci, y: ri}, false).every(function (item) {
                return item == null;
            });
        }.bind(place));
    }

    function findNearestEnemyFrom(location) {
        return slave.place.getPlayers()
            .filter(function (enemy) {
                return enemy !== slave;
            })
            .map(function (enemy) {
                return {
                    enemy: enemy,
                    distance: calcDistance(location, enemy.location)
                };
            })
            .sort(function (a, b) {
                return b.distance - a.distance;
            }).pop().enemy;
    }

    function findShortenPathToNearestBlock() {
        var blocks = [];

        tableMap(slave.place.blocks, function (cell, ri, ci) {
            return blocks.push({
                item: cell,
                location: {x: ci, y: ri}
            });
        });

        return blocks
            .filter(function (itemLocationPair) {
                return !!itemLocationPair.item;
            })
            .map(function (itemLocationPair) {
                return buildPath(slave.location, itemLocationPair.location, buildBitMap(), true, false);
            })
            .filter(function (path) {
                return path.length > 0;
            })
            .map(function (path) {
                var
                    lastPoint = path.pop()
                    , endPathLocation = {x: lastPoint[0], y: lastPoint[1]}
                    ;

                return {
                    path: path,
                    distance: calcDistance(endPathLocation, findNearestEnemyFrom(endPathLocation).location)
                }
            })
            .sort(function (a, b) {
                return b.distance - a.distance;
            })
            .pop().path
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