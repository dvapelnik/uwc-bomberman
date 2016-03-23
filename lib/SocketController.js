var
    Game = require('./Bomberman/Game')
    , HumanManipulator = require('./Bomberman/Manipulator/HumanManipulator')
    , AI = require('./Bomberman/Manipulator/AI')
    , config = require('./config')
    , chance = new require('chance').Chance()
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

            var
                game = new Game(config.get('game'))
                , manipulators = []
                ;
            game.start();

            var player, counter = 0;

            while ((player = game.getFirstPlayerWithoutManipulator()) !== undefined) {
                var manipulator = 0 == counter
                    ? new HumanManipulator(socket, game, player, ['Player', counter + 1].join(' '))
                    : new AI(player, chance.name(), {
                    moveTimeout: config.get('game:player:movementThrottling'),
                    bomb: {
                        detonationTimeout: config.get('game:bomb:detonationTimeout'),
                        explosionRadius: config.get('game:bomb:explosionRadius')
                    },
                    place: {
                        flameLifetime: config.get('game:place:flameLifetime')
                    }
                });

                manipulators.push(manipulator);

                player.setManipulator(manipulator);

                counter++
            }

            socket.on('disconnect', function () {
                game.end();
            });

            socket.emit('start', {game: {place: game.place.serialize(manipulators[0].getPlayer())}});
        });
};