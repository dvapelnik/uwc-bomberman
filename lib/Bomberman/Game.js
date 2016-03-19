var Place = require('./Place');

function Game() {
    var place;

    this.makePlace = function () {
        place = new Place();
        place.buildPlace();
    }
}

module.exports = Game;