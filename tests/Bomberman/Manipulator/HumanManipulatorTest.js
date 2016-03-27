var
    chai = require('chai')
    , spies = require('chai-spies')
    ;

chai.use(spies);

var
    expect = chai.expect
    , assert = chai.assert
    , proxyquire = require('proxyquire')
    ;

var HM = require('../../../lib/Bomberman/Manipulator/HumanManipulator');

describe('HumanManipulator', function () {
    it('should save name', function () {
        var
            name = 'NAME'
            , hm = new HM({}, name)
            ;

        expect(hm.name).to.be.equal(name);
    });

    it('should generate random color', function () {
        var
            randomColorMock = chai.spy(new Function())
            , proxyquiredHM = proxyquire('../../../lib/Bomberman/Manipulator/HumanManipulator', {
                '../../util': {
                    getRandomColor: randomColorMock
                }
            })
            , hm = new proxyquiredHM()
            ;

        expect(randomColorMock).to.have.been.once.called();
    });

    it('should correctly initiate arguments on init method called', function () {
        var name = "NAME";

        var socketMock = {};
        socketMock.on = chai.spy(function () {
            return this;
        });

        var gameMock = {};
        gameMock.on = chai.spy(new Function());

        var playerMock = {};
        playerMock.setManipulator = chai.spy(new Function());

        var hm = new HM(socketMock, name);
        hm.init(gameMock, playerMock);

        expect(socketMock.on).to.have.been.called.with('bomb.place');
        expect(socketMock.on).to.have.been.called.with('move');

        expect(gameMock.on).to.have.been.called.with('change');
        expect(gameMock.on).to.have.been.called.with('end');

        expect(playerMock.setManipulator).to.have.been.called.with(hm);

        expect(hm.getPlayer() === playerMock).to.be.true;
    });

    it('should terminate correctly', function () {
        var name = "NAME";

        var socketMock = {};
        socketMock.removeListener = chai.spy(function () {
            return this;
        });

        var hm = new HM(socketMock, name);

        hm.terminate();

        expect(socketMock.removeListener).to.have.been.twice.called();
        expect(socketMock.removeListener).to.have.been.called.with('bomb.place');
        expect(socketMock.removeListener).to.have.been.called.with('move');
    });
});