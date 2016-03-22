var
    _ = require('underscore')
    , EventEmitter = require('events').EventEmitter
    , util = require('util')

    , Place = require('./Place')
    , Player = require('./Player')
    ;

function Game(gameOptions) {
    var options = gameOptions || {};
    this.getOptions = function () {
        return options;
    };

    this.place = undefined;

    this.on('change', function (e) {
        //console.log('Game changed');
    });
}

util.inherits(Game, EventEmitter);

Game.prototype.makePlace = function () {
    this.place = new Place(this, {
        width: this.getOptions().place.size.width,
        height: this.getOptions().place.size.height,
        flameLifetime: this.getOptions().place.flameLifetime
    });
    this.place.buildPlace(this.getOptions().place.fillLevel);

    this.place.setPlayers(_.range(this.getOptions().countOfPlayers).map(function () {
        return new Player({
            movementThrottling: this.getOptions().player.movementThrottling,
            bombOptions: this.getOptions().bomb,
            initialBombCount: this.getOptions().player.initialBombCount,
            addNewBomb: this.getOptions().player.addNewBomb
        });
    }, this));

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