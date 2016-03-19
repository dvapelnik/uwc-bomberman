var expect = require("chai").expect;
var Place = require('../../lib/Bomberman/Place');

describe("Serialize with parse", function () {
    it("should be correct", function () {
        var place = new Place();

        place.buildPlace();

        var stringified = place.serialize();
        var parsed = place.parse(stringified);
        var stringifiedAgain = place.serialize();

        expect(stringified).to.equal(stringifiedAgain);
    });
});
