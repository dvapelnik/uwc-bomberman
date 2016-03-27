var
    chai = require('chai')
    , spies = require('chai-spies')
    ;

chai.use(spies);

var
    expect = chai.expect
    ;

var Flame = require('../../lib/Bomberman/Flame');

describe('Flame', function () {
    it('should have undefined \'location\' property after instancing with empty constructor arguments', function () {
        expect(new Flame().location).to.be.undefined;
    });

    it('should have undefined \'place\' property after instancing with empty constructor arguments', function () {
        expect(new Flame().location).to.be.undefined;
    });

    it('should have location and place values from constructor after instancing', function () {
        var
            location = {x: 0, y: 0}
            , place = {}
            ;

        var flame = new Flame(place, location);

        expect(flame.location === location).to.be.true;
        expect(flame.place === place).to.be.true;
    });
});