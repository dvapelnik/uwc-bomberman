var Place = require('./Place');

function Game() {
    var place;

    this.makePlace = function () {
        place = new Place();
    }
}

module.exports = Game;