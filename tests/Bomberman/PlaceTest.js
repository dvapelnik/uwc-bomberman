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

        var stringified = place.serialize();
        var parsed = place.parse(stringified);
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
                    isNotFireProof = isNotFireProof && (cell instanceof Block || cell === null);
                }
            })
        });

        expect(isFireProof).to.be.true;
        expect(isNotFireProof).to.be.true;
    });

    it('should sets into player object after adding it', function () {
        var
            place = new Place()
            , player = new Player()
            ;

        expect(player.place).to.be.undefined;
        expect(place.players).to.be.empty;

        place.addPlayer(player);

        expect(place.players.length).to.equal(1);
        expect(player.place).to.equal(place);
    });
});
