var
    expect = require('chai').expect
    , Game = require('../../lib/Bomberman/Game')
    ;

describe('Game', function () {
    it('should has undefined place after instancing', function () {
        var game = new Game;

        expect(game.place).to.be.undefined;
    });

    it('should has nonundefined place after building place', function () {
        var game = new Game;

        var place = game.makePlace();

        expect(game.place).to.equal(place);
        expect(place).to.not.be.undefined;
    });
});