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
        setTimeout(this.checkGameEnded.bind(this), 500);
    });

    this.terminate = function () {
        this.removeAllListeners();
    }
}

util.inherits(Game, EventEmitter);

Game.prototype.start = function () {
    this.place = new Place(this, {
        width: this.getOptions().place.size.width,
        height: this.getOptions().place.size.height,
        flameLifetime: this.getOptions().place.flameLifetime,
        chainExplosion: this.getOptions().bomb.chainExplosion,
        filling: {
            min: this.getOptions().place.filling.min,
            max: this.getOptions().place.filling.max
        }
    });
    this.place.buildPlace(this.getOptions().place.filling.actual);

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

Game.prototype.checkGameEnded = function () {
    var players = this.place.getPlayers();

    //@todo dead heat implementation
    if (players.length <= 1) {
        this.emit('end', {
            winner: players[0],
            isDeadHeat: players.length == 0
        });
    }
};

Game.prototype.end = function () {
    this.place.terminate();

    this.emit('end', {silent: true});

    this.terminate();
};

Game.prototype.getFirstPlayerWithoutManipulator = function () {
    return this.place.getPlayers()
        .filter(function (player) {
            return !player.hasManipulator();
        })
        .shift();
};

module.exports = Game;