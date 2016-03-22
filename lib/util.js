var
    _ = require('underscore')
    ;

module.exports = {
    getNewLocation: getNewLocation
    , isReserved: isReserved
    , isFireProofPlace: isFireProofPlace
    , getRandom: getRandom
    , tableMap: tableMap
    , getRandomColor: getRandomColor
    , buildAngles: buildAngles
    , isInBounds: isInBounds
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

function buildAngles(sizes) {
    return [
        {x: 0, y: 0},
        {x: sizes.x - 1, y: 0},
        {x: 0, y: sizes.y - 1},
        {x: sizes.x - 1, y: sizes.y - 1}
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

function getRandom(min, max) {
    return Math.floor(Math.random() * max) + min
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
        return _point.x == point.x && _point.y == point.y;
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