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
        });
};