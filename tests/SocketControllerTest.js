var
    chai = require('chai')
    , spies = require('chai-spies')
    ;

chai.use(spies);

var
    expect = chai.expect
    , SocketController = require('../lib/SocketController')
    ;

describe('SocketController', function () {
    it('should call \'of\' and \'on\' method', function () {
        var ioMock = {};
        ioMock.of = chai.spy(function () {
            return ioMock;
        });
        ioMock.on = chai.spy(function () {
            return ioMock;
        });

        SocketController(ioMock);

        expect(ioMock.of).to.have.been.called.once.with('/game');
        expect(ioMock.on).to.have.been.called.once.with('connection');
    });
});