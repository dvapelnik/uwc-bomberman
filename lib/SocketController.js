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

            socket.on('can.bomb', function () {
                var activePlayer = game.getActivePlayer();

                socket.emit('can.bomb', activePlayer.canBomb());
            });

            socket.on('can.move.left', function () {
                var activePlayer = game.getActivePlayer();

                socket.emit('can.move.left', activePlayer.canMove('left'));
            });

            socket.on('can.move.up', function () {
                var activePlayer = game.getActivePlayer();

                socket.emit('can.move.up', activePlayer.canMove('up'));
            });

            socket.on('can.move.right', function () {
                var activePlayer = game.getActivePlayer();

                socket.emit('can.move.right', activePlayer.canMove('right'));
            });

            socket.on('can.move.down', function () {
                var activePlayer = game.getActivePlayer();

                socket.emit('can.move.down', activePlayer.canMove('down'));
            });
        });
};