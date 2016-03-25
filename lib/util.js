var
    _ = require('underscore')
    , directions = ['up', 'right', 'down', 'left']
    ;

module.exports = {
    directions: directions
    , getNewLocation: getNewLocation
    , getDirection: getDirection
    , calcDistance: calcDistance
    , isReserved: isReserved
    , isFireProofPlace: isFireProofPlace
    , tableMap: tableMap
    , getRandomColor: getRandomColor
    , buildAngles: buildAngles
    , buildDiagonals: buildDiagonals
    , buildOnAxis: buildOnAxis
    , buildOnHorse: buildOnHorse
    , isInBounds: isInBounds
    , dumpTable: dumpTable
    , locationsIsEqual: locationsIsEqual
    , makeEmptyMap: makeEmptyMap
    , pointsHasPoint: pointsHasPoint
};

function getNewLocation(oldLocation, direction) {
    var newLocation;

    switch (direction) {
        case 'left':
            newLocation = {x: oldLocation.x - 1, y: oldLocation.y};
            break;
        case 'up':
            newLocation = {x: oldLocation.x, y: oldLocation.y - 1};
            break;
        case 'right':
            newLocation = {x: oldLocation.x + 1, y: oldLocation.y};
            break;
        case 'down':
            newLocation = {x: oldLocation.x, y: oldLocation.y + 1};
            break;
        default:
            throw  new Error('Unsupported direction');
    }

    return newLocation;
}

function getDirection(from, to) {
    var direction;

    switch (true) {
        case from.x - to.x == 1:
            direction = 'left';
            break;
        case from.x - to.x == -1:
            direction = 'right';
            break;
        case from.y - to.y == 1:
            direction = 'up';
            break;
        case from.y - to.y == -1:
            direction = 'down';
            break;
        default:
            throw new Error('Direction not supported')
    }

    return direction;
}

function calcDistance(a, b) {
    return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y + b.y, 2));
}

function buildAngles(sizes) {
    return [
        {x: 0, y: 0},
        {x: sizes.x - 1, y: 0},
        {x: 0, y: sizes.y - 1},
        {x: sizes.x - 1, y: sizes.y - 1}
    ];
}

function buildDiagonals(from, distance) {
    return [
        {x: from.x - distance, y: from.y - distance},
        {x: from.x + distance, y: from.y - distance},
        {x: from.x - distance, y: from.y + distance},
        {x: from.x + distance, y: from.y + distance}
    ];
}

function buildOnAxisDirection(from, distance, direction) {
    switch (direction) {
        case 'up':
            return {x: from.x, y: from.y - distance};
            break;
        case 'right':
            return {x: from.x + distance, y: from.y};
            break;
        case 'down':
            return {x: from.x, y: from.y + distance};
            break;
        case 'left':
            return {x: from.x - distance, y: from.y};
            break;
        default:
            throw new Error('Wrong direction: ' + direction);
    }
}

function buildOnAxis(from, distance) {
    return [
        buildOnAxisDirection(from, distance, 'up'),
        buildOnAxisDirection(from, distance, 'right'),
        buildOnAxisDirection(from, distance, 'down'),
        buildOnAxisDirection(from, distance, 'left')
    ];
}

function buildOnHorse(from) {
    return [
        {x: from.x - 2, y: from.y - 1},
        {x: from.x - 1, y: from.y - 2},
        {x: from.x + 1, y: from.y - 2},
        {x: from.x + 2, y: from.y - 1},
        {x: from.x + 2, y: from.y + 1},
        {x: from.x + 1, y: from.y + 2},
        {x: from.x - 1, y: from.y + 2},
        {x: from.x - 2, y: from.y + 1}
    ];
}

function isInBounds(point, sizes) {
    return point.x >= 0 && point.x <= sizes.x - 1 && point.y >= 0 && point.y <= sizes.y - 1;
}

function isReserved(point, sizes) {
    var
        reservedNeighbours = []
        , reservedNeighbourDirections = [['right', 'down'], ['left', 'down'], ['right', 'up'], ['left', 'up']]
        , angles = buildAngles(sizes)
        ;

    if (pointsHasPoint(angles, point)) {
        return true;
    }

    _.zip(angles, reservedNeighbourDirections)
        .map(function (angleDirectionsPair) {
            var
                angle = angleDirectionsPair[0]
                , directions = angleDirectionsPair[1]
                ;

            directions.map(function (direction) {
                reservedNeighbours.push(getNewLocation(angle, direction));
            });
        });

    return pointsHasPoint(reservedNeighbours, point);
}

function isFireProofPlace(point) {
    return point.x % 2 == 1 && point.y % 2 == 1
}

function tableMap(table, fn) {
    return table.map(function (row, ri) {
        return row.map(function (cell, ci) {
            return fn(cell, ri, ci);
        })
    })
}

function pointsHasPoint(points, point) {
    return points.some(function (_point) {
        return locationsIsEqual(point, _point);
    })
}

function getRandomColor() {
    var letters = '0123456789ABCDEF'.split('');
    var color = '#';
    for (var i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

function dumpTable(arrayOfArrays, topBorder, bottomBorder) {
    if (topBorder) console.log(topBorder);

    arrayOfArrays.map(function (array) {
        console.log(array.join(''));
    });

    if (bottomBorder) console.log(bottomBorder);
}

function locationsIsEqual(a, b) {
    return a.x == b.x && a.y == b.y;
}

function makeEmptyMap(sizes) {
    var a = [];

    for (var j = 0; j < sizes.y; j++) {
        var _row = [];
        for (var i = 0; i < sizes.x; i++) {
            _row.push(null);
        }
        a.push(_row);
    }

    return a;
}
