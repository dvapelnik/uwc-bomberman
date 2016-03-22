var
    _ = require('underscore')
    , EventEmitter = require('events').EventEmitter
    , util = require('util')

    , Place = require('./Place')
    , Player = require('./Player')
    ;

function Game() {
    this.place = undefined;

    this.on('change', function (e) {
        //console.log('Game changed');
    });
}

util.inherits(Game, EventEmitter);

Game.prototype.makePlace = function () {
    this.place = new Place(this);
    this.place.buildPlace(1);

    this.place.setPlayers(makePlayers(true));

    return this.place;
};

module.exports = Game;

function makePlayers(activate) {
    activate = activate || false;

    var players = [0, 1, 2, 3].map(function () {
        return new Player();
    });

    if (activate) {
        var randomPlayer = players[_.random(0, players.length - 1)];
        randomPlayer.active = true;
    }

    return players;
}