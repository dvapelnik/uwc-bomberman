var Game = require('./Bomberman/Game');

module.exports = function (io) {
    io.on('connection', function (socket) {
        console.log('Connected');

        socket.on('disconnect', function () {
            console.log('Disconnected');
        });
    });

    var ioGame = io
        .of('/game')
        .on('connection', function (socket) {
            var game = new Game();
            game.makePlace();

            game.on('change', function () {
                socket.emit('change', {game: {place: game.place.serialize()}});
            });

            socket.emit('start', {game: {place: game.place.serialize()}});

            socket.on('bomb.place', function () {
                var activePlayer = game.place.getActivePlayer();

                if (!activePlayer) return;

                var msg = {
                    status: 'ERROR'
                };

                try {
                    var bombLocation = activePlayer.placeBomb({
                        onBoom: function (bomb) {
                            socket.emit('bomb.boom', {place: game.place.serialize()});
                        }
                    });

                    msg = {
                        status: 'OK',
                        location: bombLocation
                    };
                } catch (e) {
                }

                socket.emit('bomb.place', msg);
            });

            socket.on('move', function (moveData) {
                var direction = moveData.direction;

                if (direction) {
                    var activePlayer = game.place.getActivePlayer();

                    if (!activePlayer) return;

                    activePlayer.move(direction);
                }
            });
        });
};