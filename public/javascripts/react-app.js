var GameActions = Reflux.createActions(['start', 'placeBomb', 'move']);
var WindowActions = Reflux.createActions(['keyDown']);

var socket = io.connect(location.origin + '/game');

var gameStore = Reflux.createStore({
    init: function () {
        this.socket = socket;
        this.place = [];

        this.listenTo(GameActions.start, this.onStart);
        this.listenTo(GameActions.move, this.onMove);
        this.listenTo(GameActions.placeBomb, this.onPlaceBomb);
        this.listenTo(WindowActions.keyDown, this.onWindowKeyDown);
    },
    onStart: function (msg) {
        this.place = JSON.parse(msg.game.place);

        this.trigger(this.place);
    },
    onWindowKeyDown: function (e) {
        var actionName;

        switch (e.keyCode) {
            // 32 - space
            case 32:
                actionName = 'place.bomb';
                break;
            // 37 - left
            case 37:
                actionName = 'move.left';
                break;
            // 38 - up
            case 38:
                actionName = 'move.up';
                break;
            // 39 - right
            case 39:
                actionName = 'move.right';
                break;
            // 40 - down
            case 40:
                actionName = 'move.down';
                break;
            default:
        }

        this.socket.emit(actionName);
    },
    onPlaceBomb: function (can) {
        console.log(can);
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
            blocks: [],
            players: [],
            bombs: []
        }
    },
    onPlaceChange: function (place) {
        this.setState({
            blocks: place.blocks,
            players: place.players,
            bombs: place.bombs
        });
    },
    render: function () {
        var items = [];

        [this.state.blocks, this.state.players, this.state.bombs].map(function (layer, ti) {
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

                            style.backgroundColor = cell.color;

                            if (cell.isActive) {
                                classNames.push('b-item-player-current');
                            }
                        }

                        if (cell.type == 'bomb') {
                            classNames.push('b-item-bomb');
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
                <div className="b-place">
                    {items.filter(function (item) {
                        return item !== null;
                    })}
                </div>
            );
        } else {
            items = <h1>Wait...</h1>;
        }

        //if (this.state.place.length) {
        //    place = this.state.place.map(function (row, ri) {
        //        return (
        //            <div key={ri} className="b-row">
        //                {row.map(function (cell, ci) {
        //                    return (
        //                        <div key={ri * 100 + ci} className="b-cell"></div>
        //                    );
        //                })}
        //            </div>
        //        );
        //    });
        //
        //    items = this.state.place.map(function (row, ri) {
        //        return row.map(function (cell, ci) {
        //            var style = {
        //                left: ci * 50 + 'px',
        //                top: ri * 50 + 'px'
        //            };
        //
        //            var classNames = ['b-item'];
        //
        //            if (cell.match(/^P/)) {
        //                classNames.push('b-player');
        //
        //                if (cell == 'PA') {
        //                    classNames.push('b-player-active');
        //                }
        //            }
        //
        //            if (cell == '0') classNames.push('b-block');
        //            if (cell == '1') classNames.push('b-block-flame-proof');
        //
        //            return (
        //                <div
        //                    key={ri * 100 + ci}
        //                    className={classNames.join(' ')}
        //                    style={style}>
        //                </div>
        //            );
        //        });
        //    });
        //
        //    place = (
        //        <div className="b-place-container">
        //            <div className="b-place">{place}</div>
        //            <div className="b-items">{items}</div>
        //        </div>
        //    );
        //} else {
        //    place = <h1>Wait...</h1>;
        //}

        return items;
    }
});

socket.on('start', GameActions.start);
socket.on('place.bomb', GameActions.placeBomb);
socket.on('move', GameActions.move);
document.addEventListener('keydown', WindowActions.keyDown);

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
