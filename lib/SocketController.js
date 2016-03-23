var
    Game = require('./Bomberman/Game')
    , HumanManipulator = require('./Bomberman/Manipulator/HumanManipulator')
    , AI = require('./Bomberman/Manipulator/AI')
    , config = require('./config')
    , chance = new require('chance').Chance()
    ;

module.exports = function (io) {
    var ioGame = io
        .of('/game')
        .on('connection', function (socket) {
            console.log('WebSocket connected to /game');

            var
                aiOptions = {
                    moveTimeout: config.get('game:player:movementThrottling'),
                    bomb: {
                        detonationTimeout: config.get('game:bomb:detonationTimeout'),
                        explosionRadius: config.get('game:bomb:explosionRadius')
                    },
                    place: {
                        flameLifetime: config.get('game:place:flameLifetime')
                    }
                }
                , gameOptions = config.get('game')

                , manipulators = []
                , game
                ;

            socket.on('disconnect', function () {
                console.log('WebSocket disconnected from /game');
                game.end();
            });

            game = makeNewGame(manipulators, game, socket, gameOptions, aiOptions);

            socket.on('new', function () {
                game.end();

                game = makeNewGame(manipulators, game, socket, gameOptions, aiOptions);
            });
        });
};

function makeNewGame(manipulators, game, socket, gameOptions, aiOptions) {
    game = new Game(gameOptions);

    game.start();

    game.place.getPlayers().map(function (player, idx) {
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

    socket.emit('start', {game: {place: game.place.serialize(manipulators[0].getPlayer())}});

    return game;
}