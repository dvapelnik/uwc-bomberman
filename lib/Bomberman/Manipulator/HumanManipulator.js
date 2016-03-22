function HumanManipulator(socket, game, player) {
    if (socket) {
        socket
            .on('bomb.place', function () {
                player.placeBomb();
            })
            .on('move', function (moveData) {
                var direction = moveData.direction;

                if (direction) {
                    player.move(direction);
                }
            });

        game.on('change', function () {
            socket.emit('change', {game: {place: game.place.serialize(player)}});
        });

        socket.emit('start', {game: {place: game.place.serialize(player)}});
    }
}

module.exports = HumanManipulator;