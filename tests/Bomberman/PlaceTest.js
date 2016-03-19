var expect = require('chai').expect;
var Place = require('../../lib/Bomberman/Place');
var Block = require('../../lib/Bomberman/Block/Block');
var BlockFireProof = require('../../lib/Bomberman/Block/BlockFireProof');

describe('Serialize with parse', function () {
    it('should be correct', function () {
        var place = new Place();

        place.buildPlace();

        var stringified = place.serialize();
        var parsed = place.parse(stringified);
        var stringifiedAgain = place.serialize();

        expect(stringified).to.equal(stringifiedAgain);
    });
});

describe('Place', function () {
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
    })
});
