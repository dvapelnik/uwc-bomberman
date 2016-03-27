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

var Player = require('../../lib/Bomberman/Player');

var
    defaultPlayerOptions = {
        movementThrottling: 250,
        initialBombCount: 1,
        addNewBomb: {
            interval: 30000,
            delta: 1
        },
        bombOptions: {
            "detonationTimeout": 3000,
            "explosionRadius": 3,
            "chainExplosion": false
        }
    },
    specialOptions = {
        movementThrottling: 250 + 1,
        initialBombCount: 1 + 1,
        addNewBomb: {
            interval: 30000 + 1,
            delta: 1 + 1
        },
        bombOptions: {
            "detonationTimeout": 3000 + 1,
            "explosionRadius": 3 + 1,
            "chainExplosion": false
        }
    };

var bombOnceSpyingMock = chai.spy(new Function());
function BombMock() {
    this.once = bombOnceSpyingMock;
}

describe('Player', function () {
    it('should use default options', function () {
        var player = new Player();

        expect(player.getOptions()).to.be.deep.equal(defaultPlayerOptions);
    });

    it('should use options passed into constructor', function () {
        var player = new Player(specialOptions);

        expect(player.getOptions() === specialOptions).to.be.true;
    });

    it('should have bomb count from options', function () {
        var player = new Player(specialOptions);

        expect(player.getBombCount()).to.be.equal(specialOptions.initialBombCount);
    });

    it('should return true after instancing', function () {
        expect(new Player().hasABomb()).to.be.true;
    });

    it('should be alive after instancing', function () {
        var player = new Player();

        expect(player.isAlive()).to.be.true;
    });

    it('should take some bombs each some time (interval) and emit \'change\' event', function () {
        clock = sinon.useFakeTimers();

        var player = new Player(specialOptions);
        player.emit = chai.spy(new Function());

        expect(player.getBombCount()).to.be.equal(specialOptions.initialBombCount);
        expect(player.emit).to.have.not.been.called();

        // First interval
        clock.tick(specialOptions.addNewBomb.interval - 1);
        expect(player.getBombCount()).to.be.equal(specialOptions.initialBombCount);
        expect(player.emit).to.have.not.been.called.with('change', {target: player});

        clock.tick(1);
        expect(player.getBombCount()).to.be.equal(specialOptions.initialBombCount + specialOptions.addNewBomb.delta);
        expect(player.emit).to.have.been.once.called.with('change', {target: player});

        // Second interval
        clock.tick(specialOptions.addNewBomb.interval - 1);
        expect(player.getBombCount()).to.be.equal(specialOptions.initialBombCount + specialOptions.addNewBomb.delta);
        expect(player.emit).to.have.been.once.called.with('change', {target: player});

        clock.tick(1);
        expect(player.getBombCount()).to.be.equal(specialOptions.initialBombCount + 2 * specialOptions.addNewBomb.delta);
        expect(player.emit).to.have.been.twice.called.with('change', {target: player});

        clock.reset();
    });

    it('should have undefined place after instancing', function () {
        var player = new Player();

        expect(player.place).to.be.undefined;
    });

    it('should have undefined location after instancing', function () {
        var player = new Player();

        expect(player.location).to.be.undefined;
    });

    it('should call getRandomColor method after instancing', function () {
        var utilMock = {};
        utilMock.getRandomColor = chai.spy(new Function());

        var proxyquiredPlayer = proxyquire('../../lib/Bomberman/Player', {
            './../util': utilMock
        });

        var player = new proxyquiredPlayer();

        expect(utilMock.getRandomColor).to.have.been.once.called();
    });

    it('should have not manipulator after instancing', function () {
        var player = new Player();

        expect(player.hasManipulator()).to.be.false;
    });

    it('should have manipulator after instancing and calling \'setManipulator\' method with some object', function () {
        var player = new Player();

        player.setManipulator({});

        expect(player.hasManipulator()).to.be.true;
    });

    it('should return name of specified manipulator', function () {
        var manipulator = {name: 'some name'};
        var player = new Player();

        player.setManipulator(manipulator);

        expect(player.getName()).to.be.equal(manipulator.name);
    });

    it('should return undefined when manipulator is not specified', function () {
        expect(new Player().getColor()).to.be.undefined;
    });

    it('should return color of specified manipulator', function () {
        var manipulator = {color: 'some color'};
        var player = new Player();

        player.setManipulator(manipulator);

        expect(player.getColor()).to.be.equal(manipulator.color);
    });

    it('should emit \'change\' place event on own changing with specified arguments', function () {
        var player = new Player();
        player.place = {};
        player.place.emit = chai.spy(new Function());

        player.emit('change');

        expect(player.place.emit).to.have.been.once.called.with('change', {
            target: player,
            msg: 'emit from player changed'
        });
    });

    it('should emit \'beforeTerminate\', call \'removeAllListeners\' method and set \'isAlive\' to false on terminate', function () {
        var player = new Player();
        player.emit = chai.spy(new Function());
        player.removeAllListeners = chai.spy(new Function());

        player.terminate();

        expect(player.emit).to.have.been.once.called.with('beforeTerminate');
        expect(player.emit).to.have.been.once.called();

        expect(player.isAlive()).to.be.false;
    });

    describe('method \'move\'', function () {
        beforeEach(function () {
            clock = sinon.useFakeTimers();
        });

        afterEach(function () {
            clock.reset();
        });

        it('should not move player when it is not alive', function () {
            var initialLocation = {x: 0, y: 0};

            var player = new Player();
            player.location = initialLocation;
            player.terminate();

            player.move('down');

            expect(player.location).to.be.deep.equal(initialLocation);
        });

        it('should call \'place.canMove\' method', function () {
            var moveDirection = 'down';

            var player = new Player();
            player.place = {};
            player.place.canMove = chai.spy(new Function());

            clock.tick(defaultPlayerOptions.movementThrottling + 1);
            player.move(moveDirection);

            expect(player.place.canMove).to.have.been.once.called.with(player, moveDirection);
        });

        it('should call \'place.move\' method', function () {
            var moveDirection = 'down';

            var player = new Player();
            player.place = {};
            player.place.move = chai.spy(new Function());
            player.place.canMove = chai.spy(function () {
                return true;
            });

            clock.tick(defaultPlayerOptions.movementThrottling + 1);
            player.move(moveDirection);

            expect(player.place.move).to.have.been.once.called.with(player, moveDirection);
        });

        it('should call \'place.move\' with throttling', function () {
            var moveDirection = 'down';

            var player = new Player();
            player.emit = chai.spy(new Function());
            player.place = {};
            player.place.move = chai.spy(new Function());
            player.place.canMove = chai.spy(function () {
                return true;
            });

            clock.tick(defaultPlayerOptions.movementThrottling + 1);
            player.move(moveDirection);
            expect(player.emit).to.have.been.once.called.with('moved', {target: player});

            clock.tick(defaultPlayerOptions.movementThrottling);
            player.move();
            expect(player.emit).to.have.been.once.called.with('moved', {target: player});

            clock.tick()
        });

        it('should emit \'moved\' event with correct event argument', function () {
            var moveDirection = 'down';

            var player = new Player();
            player.emit = chai.spy(new Function());
            player.place = {};
            player.place.move = chai.spy(new Function());
            player.place.canMove = chai.spy(function () {
                return true;
            });

            clock.tick(defaultPlayerOptions.movementThrottling + 1);
            player.move(moveDirection);

            expect(player.emit).to.have.been.once.called.with('moved', {target: player});
        });
    });

    describe('method \'placeBomb\'', function () {
        it('should call \'place.canPlaceBombAt\' when player is alive and has a bomb', function () {
            var player = new Player();

            player.place = {};
            player.place.canPlaceBombAt = chai.spy(new Function());

            player.placeBomb();

            expect(player.place.canPlaceBombAt).to.have.been.once.called.with(player.location);
        });

        it('should make new bomb with correct options and location same as players\' location and should call \'place.placeBomb\'', function () {
            var SpyingBombMock = chai.spy(BombMock);

            var proxyquiredPlayer = proxyquire('../../lib/Bomberman/Player', {
                './Bomb': SpyingBombMock
            });

            var player = new proxyquiredPlayer();

            var playerInitialLocation = {x: 0, y: 0};
            player.location = playerInitialLocation;
            player.place = {};
            player.place.placeBomb = chai.spy(function (bomb) {
                expect(bomb).to.be.instanceof(BombMock);
                expect(bomb.location).to.be.deep.equal(playerInitialLocation);
            });
            player.place.emit = new Function();
            player.place.canPlaceBombAt = chai.spy(function () {
                return true;
            });

            player.placeBomb();

            expect(SpyingBombMock).to.have.been.once.called.with({
                detonationTimeout: defaultPlayerOptions.bombOptions.detonationTimeout,
                explosionRadius: defaultPlayerOptions.bombOptions.explosionRadius
            });

            expect(player.place.placeBomb).to.have.been.once.called();
        });

        it('should make change count of bomb on placing and bomb banging', function () {
            var player = new Player();

            var createdBomb;

            player.place = {};
            player.place.placeBomb = function (bomb) {
                bomb.place = player.place;
                createdBomb = bomb;
            };
            player.place.destroyFromBomb = new Function();
            player.place.emit = new Function();
            player.place.canPlaceBombAt = function () {
                return true;
            };

            var bombCountBefore = player.getBombCount();

            player.placeBomb();

            expect(player.getBombCount()).to.be.equal(bombCountBefore - 1);
            createdBomb.emit('bomb.boomed');
            expect(player.getBombCount()).to.be.equal(bombCountBefore);
        });

        it('should once emit \'change\' event after bomb placing', function () {
            var player = new Player();
            player.emit = chai.spy(new Function());

            player.place = {};
            player.place.placeBomb = new Function();
            player.place.destroyFromBomb = new Function();
            player.place.emit = new Function();
            player.place.canPlaceBombAt = function () {
                return true;
            };

            player.placeBomb();

            expect(player.emit).to.have.been.once.called.with('change', {target: player});
        });

        it('should twice emit \'change\' event after bomb placing', function () {
            var player = new Player();
            player.emit = chai.spy(new Function());

            var createdBomb;

            player.place = {};
            player.place.placeBomb = function (bomb) {
                bomb.place = player.place;
                createdBomb = bomb;
            };
            player.place.destroyFromBomb = new Function();
            player.place.emit = new Function();
            player.place.canPlaceBombAt = function () {
                return true;
            };

            player.placeBomb();

            createdBomb.emit('bomb.boomed');
            expect(player.emit).to.have.been.twice.called.with('change', {target: player});
        });
    });
});