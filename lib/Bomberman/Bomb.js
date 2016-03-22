var
    _ = require('underscore')
    , EventEmitter = require('events').EventEmitter
    , util = require('util');

function Bomb(options) {
    options = options || {};
    options.detonationTimeout = options.detonationTimeout || 3000;
    options.explosionRadius = options.explosionRadius || 3;

    this.getOptions = function () {
        return options;
    };

    this.location = undefined;
    this.place = undefined;
    this.bangTimer = setTimeout(this.bang.bind(this), options.detonationTimeout);
    this.isDetonated = false;
}

util.inherits(Bomb, EventEmitter);

Bomb.prototype.bang = function () {
    if (this.isDetonated == false) {
        this.isDetonated = true;
        clearTimeout(this.bangTimer);
        this.place.destroyFromBomb(this.location, this.getOptions().explosionRadius);

        this.emit('bomb.boomed', {target: this});
    }
};

module.exports = Bomb;