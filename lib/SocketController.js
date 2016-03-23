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

            var game = makeNewGame(config.get('game'));

            socket.on('disconnect', function () {
                game.end();
            });

            var
                players = game.place.getPlayers()
                , manipulators = []
                ;

            initManipulators(
                manipulators,
                players,
                socket,
                {
                    moveTimeout: config.get('game:player:movementThrottling'),
                    bomb: {
                        detonationTimeout: config.get('game:bomb:detonationTimeout'),
                        explosionRadius: config.get('game:bomb:explosionRadius')
                    },
                    place: {
                        flameLifetime: config.get('game:place:flameLifetime')
                    }
                }
            );

            socket.on('new', function () {
                game.terminate();

                game = makeNewGame(config.get('game'));

                var
                    players = game.place.getPlayers()
                    , manipulators = []
                    ;

                initManipulators(
                    manipulators,
                    players,
                    socket,
                    {
                        moveTimeout: config.get('game:player:movementThrottling'),
                        bomb: {
                            detonationTimeout: config.get('game:bomb:detonationTimeout'),
                            explosionRadius: config.get('game:bomb:explosionRadius')
                        },
                        place: {
                            flameLifetime: config.get('game:place:flameLifetime')
                        }
                    }
                );

                socket.emit('start', {game: {place: game.place.serialize(manipulators[0].getPlayer())}});
            });


            socket.emit('start', {game: {place: game.place.serialize(manipulators[0].getPlayer())}});
        });
};

function makeNewGame(gameOptions) {
    var game = new Game(gameOptions);

    game.start();

    return game;
}

function initManipulators(manipulators, players, socket, aiOptions) {
    players.map(function (player, idx) {
        var manipulator = manipulators[idx];

        if (undefined === manipulator) {
            if (0 === idx) {
                manipulator = new HumanManipulator(socket, ['Player', idx + 1].join(' '));
            } else {
                manipulator = new AI(chance.first(), aiOptions);
            }

            manipulators.push(manipulator);
        }

        manipulator.init(player.place.game, player);
    });
}