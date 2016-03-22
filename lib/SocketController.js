var
    Game = require('./Bomberman/Game')
    , HumanManipulator = require('./Bomberman/Manipulator/HumanManipulator')
    ;

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
            console.log('Connected to /game');
            var game = new Game();
            game.makePlace();

            var player;

            for (var i = 0; ; i++) {
                player = game.getFirstPlayerWithoutManipulator();

                if (player === undefined) {
                    break;
                }

                if (0 == i) {
                    player.setManipulator(new HumanManipulator(player, socket));
                } else {
                    player.setManipulator({});
                }
            }

            game.on('change', function () {
                socket.emit('change', {game: {place: game.place.serialize()}});
            });

            socket.emit('start', {game: {place: game.place.serialize()}});
        });
};