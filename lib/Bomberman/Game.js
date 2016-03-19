var Place = require('./Place');
var Player = require('./Player');

function Game() {
    this.place = undefined;

    this.makePlace = function () {
        this.place = new Place();
        this.place.buildPlace();

        this.place.setPlayers([0, 1, 2, 3].map(function () {
            return new Player();
        }));

        return this.place;
    };
}

module.exports = Game;