var
    _ = require('underscore')
    , EventEmitter = require('events').EventEmitter
    , util = require('util');

function Bomb() {
    this.location = undefined;
    this.place = undefined;
    this.bangTimer = setTimeout(this.bang.bind(this), 3 * 1000);
}

util.inherits(Bomb, EventEmitter);

Bomb.prototype.bang = function () {
    clearTimeout(this.bangTimer);
    this.place.destroyFromBomb(this.location, 2);

    this.emit('bomb.boomed', {target: this});
};

module.exports = Bomb;