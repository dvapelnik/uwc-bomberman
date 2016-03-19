var expect = require('chai').expect
    , Place = require('../../lib/Bomberman/Place')
    , Player = require('../../lib/Bomberman/Player')
    , Block = require('../../lib/Bomberman/Block/Block')
    , BlockFireProof = require('../../lib/Bomberman/Block/BlockFireProof')
    ;

describe('Place', function () {
    it('should serialize and deserialize in pair works correct', function () {
        var place = new Place();

        place.buildPlace();
        place.setPlayers(makePlayers(4));

        var stringified = place.serialize();
        place.parse(stringified);
        var stringifiedAgain = place.serialize();

        expect(stringified).to.equal(stringifiedAgain);
    });

    it('should have 12 free cells', function () {
        var place = new Place();
        place.buildPlace(10);

        var freeSpacesCounter = 0;

        place.getArray().map(function (row) {
            row.map(function (cell) {
                if (cell === null) {
                    freeSpacesCounter++;
                }
            });
        });

        expect(freeSpacesCounter).to.equal(12);
    });

    it('should be filled on even-places with fire proof block', function () {
        var place = new Place();
        place.buildPlace();

        var isFireProof = true;
        var isNotFireProof = true;

        place.getArray().map(function (row, rowIdx) {
            row.map(function (cell, cellIdx) {
                if (rowIdx % 2 == 1 && cellIdx % 2 == 1) {
                    isFireProof = isFireProof && cell instanceof BlockFireProof;
                } else {
                    isNotFireProof = isNotFireProof &&
                        (cell instanceof Block || cell instanceof Player || cell === null);
                }
            })
        });

        expect(isFireProof).to.be.true;
        expect(isNotFireProof).to.be.true;
    });

    it('should fail to set players into unfilled place', function () {
        var
            place = new Place()
            , players = makePlayers(4)
            ;

        expect(function () {
            place.setPlayers(players);
        }).to.throw('Build places first');
    });

    it('should fail on set players when it\'s count is not four', function () {
        var
            place = new Place()
            , players = makePlayers(3)
            ;

        place.buildPlace();

        expect(function () {
            place.setPlayers(players);
        }).to.throw('Place needs four players');
    });

    it('sets Players at angles', function () {
        var
            place = new Place()
            , players = makePlayers(4)
            ;

        place.buildPlace();
        place.setPlayers(players);

        var
            countOfRows = place.place.length
            , countOfCells = place.place[0].length
            ;

        expect(place.place[0][0] instanceof Player).to.be.true;
        expect(place.place[0][countOfCells - 1] instanceof Player).to.be.true;
        expect(place.place[countOfRows - 1][0] instanceof Player).to.be.true;
        expect(place.place[countOfRows - 1][countOfCells - 1] instanceof Player).to.be.true;
    });
});

function makePlayers(count) {
    var players = [];

    for (var i = 0; i < count; i++) {
        players.push(new Player());
    }

    return players;
}