var Place = require('./Place');
var Player = require('./Player');

function Game() {
    this.place = undefined;

    this.makePlace = function () {
        this.place = new Place();
        this.place.buildPlace();

        [0, 1, 2, 3].map(function () {
            var player = new Player();

            this.place.addPlayer(player);
        }.bind(this));

        return this.place;
    };
}

module.exports = Game;