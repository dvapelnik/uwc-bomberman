var GameActions = Reflux.createActions([
    'start'
]);

var gameStore = Reflux.createStore({
    init: function () {
        this.listenTo(GameActions.start, this.onStart)
    },
    onStart: function (msg) {
        console.log(msg);

        this.trigger(JSON.parse(msg.game.place));
    }
});

var socket = io.connect('http://localhost:3000/game');

socket.on('start', GameActions.start);


//#################

var Cell = React.createClass({
    render: function () {
        return (
            <div className="b-cell">x</div>
        );
    }
});

var Row = React.createClass({
    render: function () {
        return (
            <div className="b-row"></div>
        );
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

                    if (cell == 'P') {
                        classNames.push('b-player');
                        style['background-color'] = getRandomColor();
                    }

                    if (cell == '0') classNames.push('b-block');
                    if (cell == '1') classNames.push('b-block-flame-proof');

                    return (
                        <div key={ri * 100 + ci} className={classNames.join(' ')} style={style}></div>
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
