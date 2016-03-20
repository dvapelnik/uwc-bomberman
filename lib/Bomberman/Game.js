var Place = require('./Place');
var Player = require('./Player');
var _ = require('underscore');

function Game() {
    this.place = undefined;

    this.makePlace = function () {
        this.place = new Place();
        this.place.buildPlace(9);

        this.place.setPlayers(makePlayers(true));

        return this.place;
    };
}

module.exports = Game;

function makePlayers(activate) {
    activate = activate || false;

    var players = [0, 1, 2, 3].map(function () {
        return new Player();
    });

    if (activate) {
        var randomPlayer = players[_.random(0, players.length)];
        randomPlayer.active = true;
        console.log(randomPlayer);
    }

    return players;
}