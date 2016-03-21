module.exports = {
    getNewLocation: getNewLocation
    , isReserved: isReserved
    , isFireProofPlace: isFireProofPlace
    , getRandom: getRandom
    , tableMap: tableMap
    , getRandomColor: getRandomColor
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

function isReserved(point_x, point_y, width, heigth) {
    //@todo improve indian style
    if (point_x == 0 && point_y == 0) return true;
    if (point_x == width - 1 && point_y == 0) return true;
    if (point_x == 0 && point_y == heigth - 1) return true;
    if (point_x == width - 1 && point_y == heigth - 1)return true;

    if (point_x == 1 && point_y == 0) return true;
    if (point_x == 0 && point_y == 1) return true;

    if (point_x == width - 2 && point_y == 0) return true;
    if (point_x == width - 1 && point_y == 1) return true;

    if (point_x == 0 && point_y == heigth - 2) return true;
    if (point_x == 1 && point_y == heigth - 1) return true;

    if (point_x == width - 2 && point_y == heigth - 1) return true;
    if (point_x == width - 1 && point_y == heigth - 2) return true;

    return false;
}

function isFireProofPlace(point_x, point_y) {
    return point_x % 2 == 1 && point_y % 2 == 1
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

function getRandomColor() {
    var letters = '0123456789ABCDEF'.split('');
    var color = '#';
    for (var i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}