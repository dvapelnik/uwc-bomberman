var Place = require('./Place');

function Game() {
    var place;

    this.makePlace = function () {
        place = new Place();

        place.getSimpleArray().map(function (row) {
            console.log(row);
        });
    }
}

module.exports = Game;