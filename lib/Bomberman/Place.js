var
    Block = require('./Block')
    , BlockFireProof = require('./BlockFireProof')
    ;

function Place() {
    var
        sizes = {x: 13, y: 11}
        , place = []
        , _row
        ;

    for (var y = 0; y < sizes.y; y++) {
        _row = [];
        for (var x = 0; x < sizes.x; x++) {
            if (x % 2 == 1 && y % 2 == 1) {
                _row.push(new BlockFireProof);
            } else if (!isReserved(x, y, sizes.x, sizes.y) && getRandom(1, 10) > 2) {
                _row.push(new Block);
            } else {
                _row.push(null);
            }
        }

        place.push(_row);
    }

    this.serilize = function () {
        return JSON.stringify(
            place.map(function (row) {
                return row.map(function (cell) {
                    result = ' ';

                    if (cell instanceof Block) {
                        result = '0';
                    }

                    if (cell instanceof BlockFireProof) {
                        result = '1';
                    }

                    return result;
                });
            })
        );
    };
}

function isReserved(point_x, point_y, width, heigth) {
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

function getRandom(min, max) {
    return Math.floor(Math.random() * max) + min
}

module.exports = Place;