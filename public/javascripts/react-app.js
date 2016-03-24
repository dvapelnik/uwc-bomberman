var
    socket = io.connect(location.origin + '/game')
    , GameActions = Reflux.createActions(['start', 'end', 'makeNew', 'change', 'bombPlace', 'bombBoom', 'move'])
    , WindowActions = Reflux.createActions(['keyDown'])
    ;

socket.on('start', GameActions.start);
socket.on('change', GameActions.change);
socket.on('bomb.place', GameActions.bombPlace);
socket.on('bomb.boom', GameActions.bombBoom);
socket.on('move', GameActions.move);
socket.on('end', GameActions.end);
document.addEventListener('keydown', WindowActions.keyDown);


var gameStore = Reflux.createStore({
    init: function () {
        this.socket = socket;
        this.place = [];
        this.isNewGame = false;

        this.listenTo(GameActions.start, this.onStart);
        this.listenTo(GameActions.end, this.onEnd);
        this.listenTo(GameActions.makeNew, this.onMakeNew);
        this.listenTo(GameActions.change, this.onChange);
        this.listenTo(GameActions.move, this.onMove);
        this.listenTo(GameActions.bombPlace, this.onPlaceBomb);
        this.listenTo(GameActions.bombBoom, this.onBombBoom);
        this.listenTo(WindowActions.keyDown, this.onWindowKeyDown);
    },
    onStart: function (placeInfo) {
        this.isNewGame = true;

        this.place = JSON.parse(placeInfo.game.place);

        this.trigger(this.place);
    },
    onEnd: function (endInfo) {
        console.log(endInfo);

        if (!this.isNewGame) {
            return;
        }

        var
            message, playAgain
            , messageSuffix = 'Would you want play again?'
            ;

        if (endInfo.isCurrentPlayer) {
            message = 'You won!';
        } else if (endInfo.isDeadHeat) {
            message = 'Dead heat!';
        } else {
            message = ['Player', endInfo.winnerName, 'won!'].join(' ');
        }

        this.isNewGame = false;
        playAgain = true;
        //playAgain = confirm([message, messageSuffix].join(' '));

        if (playAgain) {
            this.socket.emit('new');
        }
    },
    onMakeNew: function () {
        this.socket.emit('new');
    },
    onChange: function (placeInfo) {
        console.log('On change handled');
        this.place = JSON.parse(placeInfo.game.place);

        this.trigger(this.place);
    },
    onWindowKeyDown: function (e) {
        var keys = {
            32: {
                action: 'bomb.place',
                args: {}
            },
            37: {
                action: 'move',
                args: {direction: 'left'}
            },
            38: {
                action: 'move',
                args: {direction: 'up'}
            },
            39: {
                action: 'move',
                args: {direction: 'right'}
            },
            40: {
                action: 'move',
                args: {direction: 'down'}
            }
        };

        var actionData = keys[e.keyCode];

        if (actionData) {
            this.socket.emit(actionData.action, actionData.args);
        }
    },
    onPlaceBomb: function (bombInfo) {
        if (bombInfo.status == 'OK') {
            this.place.bombs[bombInfo.location.y][bombInfo.location.x] = {
                type: 'bomb'
            };

            this.trigger(this.place);
        }

    },
    onBombBoom: function (placeInfo) {
        this.place = JSON.parse(placeInfo.place);

        this.trigger(this.place);
    },
    onMove: function (move) {
        var
            oldLocation = move.old
            , newLocation = move.current
            ;

        var _tmp = this.place.players[oldLocation.y][oldLocation.x];
        this.place.players[oldLocation.y][oldLocation.x] = this.place.players[newLocation.y][newLocation.x];
        this.place.players[newLocation.y][newLocation.x] = _tmp;

        this.trigger(this.place);
    }
});

var Place = React.createClass({
    mixins: [Reflux.listenTo(gameStore, "onPlaceChange")],
    getInitialState: function () {
        return {
            clients: [],
            blocks: [],
            blocksFireProof: [],
            players: [],
            bombs: [],
            flames: [],
            playerBombCount: 0
        }
    },
    onPlaceChange: function (place) {
        this.setState({
            blocks: place.blocks,
            blocksFireProof: place.blocksFireProof,
            players: place.players,
            bombs: place.bombs,
            flames: place.flames
        });

        var
            playerBombCount = 0
            , clients = []
            ;

        place.players.map(function (row) {
            row.map(function (cell) {
                if (cell) {
                    if (cell.name) {
                        clients.push({name: cell.name});
                    }

                    if (cell.isActive) {
                        playerBombCount = cell.bombCount;
                    }
                }
            })
        });

        this.setState({
            playerBombCount: playerBombCount,
            clients: clients.sort(function (a, b) {
                return a.name > b.name;
            })
        });
    },
    onNewGameHandler: function () {
        if (confirm('Start new game?')) {
            GameActions.makeNew();
        }
    },
    render: function () {
        var items = [];

        [this.state.blocks, this.state.blocksFireProof, this.state.flames, this.state.bombs, this.state.players].map(function (layer, ti) {
            layer.map(function (row, ri) {
                row
                    .map(function (cell, ci) {
                        var style = {
                            left: ci * 50 + 'px',
                            top: ri * 50 + 'px'
                        };

                        var classNames = ['b-item'];

                        if (cell.type == 'block') {
                            classNames.push('b-item-block');

                            if (cell.isFireProof) {
                                classNames.push('b-item-block-fire-proof');
                            }
                        }

                        if (cell.type == 'player') {
                            classNames.push('b-item-player');

                            //style.backgroundColor = cell.color;

                            if (cell.isActive) {
                                classNames.push('b-item-player-current');
                            }
                        }

                        if (cell.type == 'bomb') {
                            classNames.push('b-item-bomb');
                        }

                        if (cell.type == 'flame') {
                            classNames.push('b-item-flame');
                        }

                        items.push(cell.type == 'empty' ? null : (
                            <div
                                key={ti * 10000 + ri * 100 + ci}
                                style={style}
                                className={classNames.join(' ')}></div>
                        ));
                    });
            })
        });

        if (items.length) {
            items = (
                <div>
                    <div className="b-place">
                        {items.filter(function (item) {
                            return item !== null;
                        })}
                    </div>
                    <div className="b-info">
                        <h1>BombCount: {this.state.playerBombCount}</h1>
                        <div className="b-new-game-action" onClick={this.onNewGameHandler}>New game</div>
                        <ol className="b-player-list">
                            {this.state.clients.map(function (client, i) {
                                return <li key={i}>{client.name}</li>;
                            })}
                        </ol>
                    </div>
                </div>
            );
        } else {
            items = <h1>Wait...</h1>;
        }

        return items;
    }
});

ReactDOM.render(
    <Place/>,
    document.getElementById('react-app')
);

function getRandomColor() {
    var letters = '0123456789ABCDEF'.split('');
    var color = '#';
    for (var i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}
