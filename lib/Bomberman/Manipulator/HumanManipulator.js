var
    getRandomColor = require('../../util').getRandomColor
    ;

function HumanManipulator(socket, name) {
    var
        placeBombListener
        , moveListener
        , _socket = socket
        , _game
        , _player
        ;

    this.name = name;
    this.color = getRandomColor();

    this.init = function (game, player) {
        _game = game;
        _player = player;

        _player.setManipulator(this);

        placeBombListener = makeBombPlaceListener(player);
        moveListener = makeMoveListener(player);

        if (_socket && _game && _player) {
            _socket
                .on('bomb.place', placeBombListener)
                .on('move', moveListener);

            _game.on('change', function () {
                _socket.emit('change', {game: {place: _game.place.serialize(player)}});
            });

            _game.on('end', function (e) {
                _socket.emit('end', {
                    isCurrentPlayer: _player === e.winner,
                    winnerName: e.winner && e.winner.getName(),
                    isDeadHeat: e.isDeadHeat
                });
            })
        } else {
            throw new Error('Cannot initiate manipulator: check arguments (game, player)');
        }
    };

    this.terminate = function () {
        _socket
            .removeListener('bomb.place', placeBombListener)
            .removeListener('move', moveListener);
    };

    this.getPlayer = function () {
        return _player;
    };
}

module.exports = HumanManipulator;

function makeBombPlaceListener(player) {
    return function () {
        player.placeBomb();
    };
}

function makeMoveListener(player) {
    return function (moveData) {
        var direction = moveData.direction;

        if (direction) {
            player.move(direction);
        }
    };
}