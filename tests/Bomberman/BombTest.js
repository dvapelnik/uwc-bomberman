var
    chai = require('chai')
    , spies = require('chai-spies')
    ;

chai.use(spies);

var
    expect = chai.expect
    , assert = chai.assert
    ;

var Bomb = require('../../lib/Bomberman/Bomb');

describe('Bomb', function () {
    it('should be created with default options', function () {
        expect(new Bomb().getOptions()).to.be.deep.equal({
            detonationTimeout: 3000,
            explosionRadius: 3
        });
    });

    it('should use passed options', function () {
        var options = {
            detonationTimeout: 4000,
            explosionRadius: 4
        };

        expect(new Bomb(options).getOptions()).to.be.deep.equal(options);
    });

    it('should save places at microtime', function () {
        var now = new Date().getTime();

        expect(new Bomb().getPlacedAt()).to.be.within(now, now + 100);
    });

    it('should be non-detonated after instancing', function () {
        expect(new Bomb().isDetonated).to.be.a.false;
    });

    it('should have \'place\' properties as undefined', function () {
        expect(new Bomb().place).to.be.a.undefined;
    });

    it('should have \'location\' properties as undefined', function () {
        expect(new Bomb().location).to.be.a.undefined;
    });

    it('should call own \'removeAllListeners\' method', function () {
        var bomb = new Bomb();
        bomb.removeAllListeners = chai.spy(function () {

        });

        bomb.terminate();

        expect(bomb.removeAllListeners).to.have.been.once.called();
    });

    it('should bang when is non-detonated', function () {
        var bomb = new Bomb();

        bomb.isDetonated = false;
        bomb.location = {x: 0, y: 0};
        bomb.place = {};
        bomb.place.destroyFromBomb = chai.spy(function (location, radius) {

        });
        bomb.emit = chai.spy(function (eventName, eventArgs) {

        });

        bomb.bang();

        expect(bomb.isDetonated).to.be.a.true;
        expect(bomb.place.destroyFromBomb).to.have.been.once.called.with(bomb.location, bomb.getOptions().explosionRadius);
        expect(bomb.emit).to.have.been.once.called.with('bomb.boomed', {target: bomb});
    });

    it('should not bang when is non-detonated', function () {
        var bomb = new Bomb();

        bomb.isDetonated = true;
        bomb.location = {x: 0, y: 0};
        bomb.place = {};
        bomb.place.destroyFromBomb = chai.spy(function (location, radius) {

        });
        bomb.emit = chai.spy(function (eventName, eventArgs) {

        });

        bomb.bang();

        expect(bomb.isDetonated).to.be.a.true;
        expect(bomb.place.destroyFromBomb).to.not.have.been.once.called();
        expect(bomb.emit).to.not.have.been.once.called();
    });

    it('should make explosion after some time after placing', function () {
        /**
         * Test not works. Need to use SinonJS with fake timers
         * But it works not correctly in this situation
         * http://sinonjs.org/
         * https://gist.github.com/jondlm/8d9d42a426f2a605a50f
         *
         * @todo make test
         **/
    });
});