var GameActions = Reflux.createActions(['start', 'placeBomb', 'moveLeft', 'moveUp', 'moveRight', 'moveDown']);
var WindowActions = Reflux.createActions(['keyDown']);

var socket = io.connect('http://localhost:3000/game');

var gameStore = Reflux.createStore({
    init: function () {
        this.socket = socket;
        this.place = [];

        this.listenTo(GameActions.start, this.onStart);
        this.listenTo(GameActions.moveLeft, this.onCanMoveLeft);
        this.listenTo(GameActions.moveUp, this.onCanMoveUp);
        this.listenTo(GameActions.moveRight, this.onCanMoveRight);
        this.listenTo(GameActions.moveDown, this.onCanMoveDown);
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
                actionName = 'can.bomb';
                break;
            // 37 - left
            case 37:
                actionName = 'can.move.left';
                break;
            // 38 - up
            case 38:
                actionName = 'can.move.up';
                break;
            // 39 - right
            case 39:
                actionName = 'can.move.right';
                break;
            // 40 - down
            case 40:
                actionName = 'can.move.down';
                break;
            default:
        }

        this.socket.emit(actionName);
    },
    onCanPlaceBomb: function (can) {
        console.log(can);
    },
    onCanMoveLeft: function (can) {
        console.log(can);
    },
    onCanMoveUp: function (can) {
        console.log(can);
    },
    onCanMoveRight: function (can) {
        console.log(can);
    },
    onCanMoveDown: function (can) {
        console.log(can);
    }
});

var Place = React.createClass({
    mixins: [Reflux.listenTo(gameStore, "onPlaceChange")],
    getInitialState: function () {
        return {
            place: []
        }
    },
    onPlaceChange: function (place) {
        this.setState({
            place: place
        });
    },
    render: function () {
        var place, items;

        if (this.state.place.length) {
            place = this.state.place.map(function (row, ri) {
                return (
                    <div key={ri} className="b-row">
                        {row.map(function (cell, ci) {
                            return (
                                <div key={ri * 100 + ci} className="b-cell"></div>
                            );
                        })}
                    </div>
                );
            });

            items = this.state.place.map(function (row, ri) {
                return row.map(function (cell, ci) {
                    var style = {
                        left: ci * 50 + 'px',
                        top: ri * 50 + 'px'
                    };

                    var classNames = ['b-item'];

                    if (cell.match(/^P/)) {
                        classNames.push('b-player');
                        style.backgroundColor = getRandomColor();

                        if (cell == 'PA') {
                            classNames.push('b-player-active');
                        }
                    }

                    if (cell == '0') classNames.push('b-block');
                    if (cell == '1') classNames.push('b-block-flame-proof');

                    return (
                        <div
                            key={ri * 100 + ci}
                            className={classNames.join(' ')}
                            style={style}>
                        </div>
                    );
                });
            });

            place = (
                <div className="b-place-container">
                    <div className="b-place">{place}</div>
                    <div className="b-items">{items}</div>
                </div>
            );
        } else {
            place = <h1>Wait...</h1>;
        }

        return place;
    }
});

socket.on('start', GameActions.start);
socket.on('can.move.left', GameActions.moveLeft);
socket.on('can.move.up', GameActions.moveUp);
socket.on('can.move.right', GameActions.moveRight);
socket.on('can.move.down', GameActions.moveDown);
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
