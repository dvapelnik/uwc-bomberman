var
    _ = require('underscore')
    , EventEmitter = require('events').EventEmitter
    , util = require('util')
    ;

function Bomb(options) {
    options = options || {};
    options.detonationTimeout = options.detonationTimeout || 3000;
    options.explosionRadius = options.explosionRadius || 3;

    this.getOptions = function () {
        return options;
    };

    var
        bangTimer = setTimeout(this.bang.bind(this), options.detonationTimeout)
        , placedAt = new Date().getTime()
        ;

    this.location = undefined;
    this.place = undefined;

    this.isDetonated = false;

    this.getPlacedAt = function () {
        return placedAt;
    };

    this.terminate = function () {
        clearTimeout(bangTimer);
        this.removeAllListeners();
    };
}

util.inherits(Bomb, EventEmitter);

Bomb.prototype.bang = function () {
    if (this.isDetonated == false) {
        this.isDetonated = true;
        this.place.destroyFromBomb(this.location, this.getOptions().explosionRadius);

        this.emit('bomb.boomed', {target: this});
    }
};

module.exports = Bomb;