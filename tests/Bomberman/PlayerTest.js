var
    expect = require('chai').expect
    , _ = require('underscore')
    , Place = require('../../lib/Bomberman/Place')
    , Player = require('../../lib/Bomberman/Player')
    ;

describe('Player', function () {
    [
        {direction: 'right', prev: [0, 0], next: [1, 0], shouldMove: true},
        {direction: 'down', prev: [0, 0], next: [0, 1], shouldMove: true},
        {direction: 'left', prev: [0, 0], next: [-1, 0], shouldMove: false},
        {direction: 'up', prev: [0, 0], next: [0, -11], shouldMove: false},

        {direction: 'down', prev: [12, 0], next: [12, 1], shouldMove: true},
        {direction: 'left', prev: [12, 0], next: [11, 0], shouldMove: true},
        {direction: 'up', prev: [12, 0], next: [12, -1], shouldMove: false},
        {direction: 'right', prev: [12, 0], next: [13, 0], shouldMove: false},

        {direction: 'right', prev: [0, 10], next: [1, 10], shouldMove: true},
        {direction: 'up', prev: [0, 10], next: [0, 9], shouldMove: true},
        {direction: 'left', prev: [0, 10], next: [-1, 10], shouldMove: false},
        {direction: 'down', prev: [0, 10], next: [0, 11], shouldMove: false},

        {direction: 'up', prev: [12, 10], next: [12, 9], shouldMove: true},
        {direction: 'left', prev: [12, 10], next: [11, 10], shouldMove: true},
        {direction: 'down', prev: [12, 10], next: [12, 11], shouldMove: false},
        {direction: 'right', prev: [12, 10], next: [13, 10], shouldMove: false}
    ].map(function (option) {
        var
            direction = option.direction
            , prev = option.prev
            , next = option.next
            ;

        var placeAndPlayer = getPlaceWithPlayerAt(prev[0], prev[1])
            , place = placeAndPlayer.place
            , player = placeAndPlayer.player;

        it('should ' + (option.shouldMove ? '' : 'not ') + 'move to ' + option.direction, function () {
            expect(place.place[prev[1]][prev[0]]).to.be.an.instanceof(Player);

            var
                oldLocation = _.clone(player.location)
                , locations = player.move(direction)
                , newLocation = _.clone(player.location);

            expect(locations.old).to.be.not.undefined;
            expect(locations.current).to.be.not.undefined;

            if (option.shouldMove) {
                expect(locations.old.x).to.be.equal(oldLocation.x);
                expect(locations.old.y).to.be.equal(oldLocation.y);
                expect(locations.current.x).to.be.equal(newLocation.x);
                expect(locations.current.y).to.be.equal(newLocation.y);
                expect(locations.current.x).to.be.equal(next[0]);
                expect(locations.current.y).to.be.equal(next[1]);

                expect(place.place[prev[1]][prev[0]]).to.be.null;
                expect(place.place[next[1]][next[0]]).to.be.instanceof(Player);
            } else {
                expect(oldLocation.x).to.be.equal(locations.old.x);
                expect(oldLocation.y).to.be.equal(locations.old.y);

                expect(oldLocation.x).to.be.equal(locations.current.x);
                expect(oldLocation.y).to.be.equal(locations.current.y);
            }


        });
    });
});

function makePlayersWithActiveAt(activeIndex) {
    var playersResult = {all: undefined, active: undefined};

    playersResult.all = [0, 1, 2, 3].map(function () {
        return new Player();
    });

    if (activeIndex !== undefined) {
        playersResult.all[activeIndex].active = true;
        playersResult.active = playersResult.all[activeIndex];
    }

    return playersResult;
}

function getPlaceWithPlayerAt(x, y) {
    var
        place = new Place()
        , player = new Player()
        ;

    place.buildPlace(10);
    place.place[y][x] = player;
    player.location = {x: x, y: y};
    player.place = place;
    player.active = true;

    return {
        place: place,
        player: player
    }
}