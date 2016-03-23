var
    _ = require('underscore')
    , directions = require('../../util').directions
    , getRandomColor = require('../../util').getRandomColor
    ;

function AI(name, options) {
    options = options || {};
    options.moveTimeout = options.moveTimeout || 250;
    options.bomb = options.bomb || {};
    options.bomb.detonationTimeout = options.bomb.detonationTimeout || 3000;
    options.bomb.explosionRadius = options.bomb.explosionRadius || 3;
    options.place.flameLifetime = options.place.flameLifetime || 1000;

    var delta = 100;

    this.name = name;
    this.color = getRandomColor();

    this.init = function (game, player) {
        player.setManipulator(this);

        setInterval(function () {
            player.move(_.sample(directions));
        }, options.moveTimeout + delta);
    };

    this.terminate = function () {

    };
}

module.exports = AI;