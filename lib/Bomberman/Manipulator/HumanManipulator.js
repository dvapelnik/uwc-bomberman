function HumanManipulator(socket, game, player, name) {
    var
        placeBombListener = makeBombPlaceListener(player)
        , moveListener = makeMoveListener(player)
        ;

    this.name = name;

    this.init = function () {
        if (socket) {
            socket
                .on('bomb.place', placeBombListener)
                .on('move', moveListener);

            game.on('change', function () {
                socket.emit('change', {game: {place: game.place.serialize(player)}});
            });
        }
    };

    this.terminate = function () {
        socket
            .removeListener('bomb.place', placeBombListener)
            .removeListener('move', moveListener);
    };

    this.getPlayer = function () {
        return player;
    };

    this.init();
}

module.exports = HumanManipulator;

function makeBombPlaceListener(player) {
    return function () {
        player.placeBomb();
    };
}

function makeMoveListener(player) {
    return function (moveData) {
        var direction = moveData.direction;

        if (direction) {
            player.move(direction);
        }
    };
}