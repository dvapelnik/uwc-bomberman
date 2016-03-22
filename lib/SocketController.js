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

            var player, counter = 0;

            while ((player = game.getFirstPlayerWithoutManipulator()) !== undefined) {
                if (0 == counter) {
                    player.setManipulator(new HumanManipulator(socket, game, player));
                } else {
                    player.setManipulator({});
                }

                counter++
            }
        });
};