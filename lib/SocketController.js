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

            socket.emit('start', {game: {place: game.place.serialize()}});

            socket.on('received', function (data) {
                console.log(data);
            });

            socket.on('place.bomb', function () {
                var activePlayer = game.place.getActivePlayer();

                var msg = {
                    status: 'ERROR'
                };

                try {
                    var bombLocation = activePlayer.placeBomb();

                    msg = {
                        status: 'OK',
                        bombLocation: bombLocation
                    };
                } catch (e) {
                }

                socket.emit('place.bomb', msg);
            });

            socket.on('move.left', function () {
                var activePlayer = game.place.getActivePlayer();

                socket.emit('move', activePlayer.move('left'));
            });

            socket.on('move.up', function () {
                var activePlayer = game.place.getActivePlayer();

                socket.emit('move', activePlayer.move('up'));
            });

            socket.on('move.right', function () {
                var activePlayer = game.place.getActivePlayer();

                socket.emit('move', activePlayer.move('right'));
            });

            socket.on('move.down', function () {
                var activePlayer = game.place.getActivePlayer();

                socket.emit('move', activePlayer.move('down'));
            });
        });
};