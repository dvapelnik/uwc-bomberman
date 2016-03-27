var
    chai = require('chai')
    , spies = require('chai-spies')
    , sinon = require('sinon')
    ;

chai.use(spies);

var
    expect = chai.expect
    , assert = chai.assert
    , clock
    , proxyquire = require('proxyquire')
    ;

var Game = require('../../lib/Bomberman/Game');

var defaultGameOptions = {
    "countOfPlayers": 4,
    "realPlayers": 1,
    "place": {
        "size": {
            "width": 13,
            "height": 11
        },
        "filling": {
            "min": 0,
            "max": 10,
            "actual": 5
        },
        "flameLifetime": 250
    },
    "bomb": {
        "detonationTimeout": 3000,
        "explosionRadius": 3,
        "chainExplosion": false
    },
    "player": {
        "movementThrottling": 250,
        "initialBombCount": 1,
        "addNewBomb": {
            "interval": 30000,
            "delta": 1
        }
    }
};

function PlaceMock() {

}
var placeBuildPlaceMock = chai.spy(new Function());
PlaceMock.prototype.buildPlace = placeBuildPlaceMock;
var placeSetPlayersMock = chai.spy(new Function());
PlaceMock.prototype.setPlayers = placeSetPlayersMock;

function PlayerMock() {

}

beforeEach(function () {
    clock = sinon.useFakeTimers();
});
afterEach(function () {
    clock.restore();
});

describe('Game', function () {
    it('should have default options', function () {
        expect(new Game().getOptions()).to.be.deep.equal(defaultGameOptions);
    });

    it('method getOptions() should return options passed to constructor', function () {
        var options = {};
        var game = new Game(options);

        expect(game.getOptions() === options).to.be.true;
    });

    it('should have undefined place after instancing', function () {
        expect(new Game().place).to.be.undefined;
    });

    it('should call \'on\' method on instancing', function () {
        var game = new Game();
        game.checkGameEnded = chai.spy(new Function());

        game.emit('change');
        clock.tick(500 - 1);
        expect(game.checkGameEnded).to.have.not.been.called();

        clock.tick(1);
        expect(game.checkGameEnded).to.have.been.called();
    });

    describe('method \'start\'', function () {
        it('should call \'buildPlace\' and \'setPlayers\' on call \'start\' method', function () {
            var PlaceMockSpy = chai.spy(PlaceMock);
            var PlayerMockSpy = chai.spy(PlayerMock);

            var proxyquiredGame = proxyquire('../../lib/Bomberman/Game', {
                './Place': PlaceMockSpy,
                './Player': PlayerMockSpy
            });

            var game = new proxyquiredGame();
            var getOptionsMock = chai.spy(function () {
                return defaultGameOptions;
            });
            game.getOptions = getOptionsMock;

            var place = game.start();

            expect(PlaceMockSpy).to.have.been.once.called();
            expect(PlayerMockSpy).to.have.been.called.exactly(4);

            expect(placeBuildPlaceMock).to.have.been.called();
            expect(placeSetPlayersMock).to.have.been.called();

            expect(getOptionsMock).to.have.been.called.exactly(8 + defaultGameOptions.countOfPlayers * 4);

            expect(place).to.be.instanceof(PlaceMock);
        });
    });

    describe('method \'checkGameEnded\'', function () {
        it('should call \'this.place.getPlayers\' method', function () {
            var game = new Game();
            game.place = {};
            game.place.getPlayers = chai.spy(function () {
                return [0, 1];
            });

            game.checkGameEnded();

            expect(game.place.getPlayers).to.have.been.once.called();
        });

        it('should emit \'end\' event on empty players', function () {
            var game = new Game();
            game.place = {};
            game.place.getPlayers = function () {
                return [{name: 'name1'}];
            };
            game.emit = chai.spy(new Function());

            game.checkGameEnded();

            expect(game.emit).to.have.been.once.called();
        });

        it('should emit \'end\' event with winner', function () {
            var players = [{name: 'name1'}];

            var game = new Game();
            game.place = {};
            game.place.getPlayers = function () {
                return players;
            };
            game.emit = chai.spy(function (eventName, eventArgs) {

            });

            game.checkGameEnded();

            expect(game.emit).to.have.been.once.called.with('end', {
                winner: players[0],
                isDeadHeat: false
            });
        });

        it('should emit \'end\' event on dead heat', function () {
            var players = [];

            var game = new Game();
            game.place = {};
            game.place.getPlayers = function () {
                return players;
            };
            game.emit = chai.spy(new Function());

            game.checkGameEnded();

            expect(game.emit).to.have.been.once.called.with('end', {
                winner: undefined,
                isDeadHeat: true
            });
        });
    });

    describe('method \'end\'', function () {
        it('should terminate own place', function () {
            var game = new Game();
            game.place = {};
            game.place.terminate = chai.spy(new Function());

            game.end();

            expect(game.place.terminate).to.have.been.once.called();
        });

        it('should emit \'end\' event', function () {
            var game = new Game();
            game.place = {};
            game.place.terminate = new Function();
            game.emit = chai.spy(new Function());

            game.end();

            expect(game.emit).to.have.been.once.called.with('end', {silent: true});
        });

        it('should terminate itself', function () {
            var game = new Game();
            game.place = {};
            game.place.terminate = new Function();
            game.terminate = chai.spy(new Function());

            game.end();

            expect(game.terminate).to.have.been.once.called();
        });
    });

    describe('method \'terminate\'', function () {
        it('should call \'removeAllListeners\' own method', function () {
            var game = new Game();
            game.removeAllListeners = chai.spy(new Function());

            game.terminate();

            expect(game.removeAllListeners).to.have.been.once.called();
        });
    })
});