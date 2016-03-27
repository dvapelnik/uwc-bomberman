var
    _ = require('underscore')
    , EventEmitter = require('events').EventEmitter
    , util = require('util')

    , Place = require('./Place')
    , Player = require('./Player')
    ;

function Game(gameOptions) {
    gameOptions = gameOptions || {};
    gameOptions.countOfPlayers = gameOptions.countOfPlayers || 4;
    gameOptions.realPlayers = gameOptions.realPlayers || 1;
    gameOptions.place = gameOptions.place || {};

    gameOptions.place.size = gameOptions.place.size || {};
    gameOptions.place.size.width = gameOptions.place.size.width || 13;
    gameOptions.place.size.height = gameOptions.place.size.height || 11;

    gameOptions.place.filling = gameOptions.place.filling || {};
    gameOptions.place.filling.min = gameOptions.place.filling.min !== undefined
        ? gameOptions.place.filling.min : 0;
    gameOptions.place.filling.max = gameOptions.place.filling.max !== undefined
        ? gameOptions.place.filling.max : 10;
    gameOptions.place.filling.actual = gameOptions.place.filling.actual !== undefined
        ? gameOptions.place.filling.actual : 5;

    gameOptions.place.flameLifetime = gameOptions.place.flameLifetime || 250;

    gameOptions.bomb = gameOptions.place.bomb || {};
    gameOptions.bomb.detonationTimeout = gameOptions.bomb.detonationTimeout || 3000;
    gameOptions.bomb.explosionRadius = gameOptions.bomb.explosionRadius || 3;
    gameOptions.bomb.chainExplosion = gameOptions.bomb.chainExplosion || false;

    gameOptions.player = gameOptions.player || {};
    gameOptions.player.movementThrottling = gameOptions.player.movementThrottling || 250;
    gameOptions.player.initialBombCount = gameOptions.player.initialBombCount !== undefined
        ? gameOptions.player.initialBombCount : 1;

    gameOptions.player.addNewBomb = gameOptions.player.addNewBomb || {};
    gameOptions.player.addNewBomb.interval = gameOptions.player.addNewBomb.interval || 30000;
    gameOptions.player.addNewBomb.delta = gameOptions.player.addNewBomb.delta || 1;


    var options = gameOptions;


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

module.exports = Game;