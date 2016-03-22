var
    Game = require('./Bomberman/Game')
    , HumanManipulator = require('./Bomberman/Manipulator/HumanManipulator')
    ;

module.exports = function (io) {
    io.on('connection', function (socket) {
        console.log('WebSocket user connected');

        socket.on('disconnect', function () {
            console.log('WebSocket user disconnected');
        });
    });

    var ioGame = io
        .of('/game')
        .on('connection', function (socket) {
            console.log('WebSocket connected to /game');
            var game = new Game();
            game.makePlace();

            var player;

            for (var i = 0; ; i++) {
                player = game.getFirstPlayerWithoutManipulator();

                if (player === undefined) {
                    break;
                }

                if (0 == i) {
                    player.setManipulator(new HumanManipulator(socket, game, player));
                } else {
                    player.setManipulator({});
                }
            }
        });
};