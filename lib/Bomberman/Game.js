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

    this.place.setPlayers(makePlayers());

    return this.place;
};

Game.prototype.getFirstPlayerWithoutManipulator = function () {
    return this.place.getPlayers()
        .filter(function (player) {
            return player.getManipulator() === undefined;
        })
        .shift();
};

module.exports = Game;

function makePlayers() {
    return [0, 1, 2, 3].map(function () {
        return new Player();
    });
}