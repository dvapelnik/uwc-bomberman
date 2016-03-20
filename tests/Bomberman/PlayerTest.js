var
    expect = require('chai').expect
    , _ = require('underscore')
    , Place = require('../../lib/Bomberman/Place')
    , Player = require('../../lib/Bomberman/Player')
    ;

describe('Player', function () {
    [
        {direction: 'right', prev: [0, 0], next: [1, 0], active: 0, shouldMove: true},
        {direction: 'down', prev: [0, 0], next: [0, 1], active: 0, shouldMove: true},
        {direction: 'down', prev: [12, 0], next: [12, 1], active: 1, shouldMove: true},
        {direction: 'left', prev: [12, 0], next: [11, 0], active: 1, shouldMove: true},
        {direction: 'right', prev: [0, 10], next: [1, 10], active: 2, shouldMove: true},
        {direction: 'up', prev: [0, 10], next: [0, 9], active: 2, shouldMove: true},
        {direction: 'up', prev: [12, 10], next: [12, 9], active: 3, shouldMove: true},
        {direction: 'left', prev: [12, 10], next: [11, 10], active: 3, shouldMove: true}
    ].map(function (option) {
        var
            direction = option.direction
            , prev = option.prev
            , next = option.next
            , active = option.active
            ;

        var
            place = new Place()
            , players = makePlayersWithActiveAt(active)
            ;

        expect(players.all).to.be.not.undefined;
        expect(players.active).to.be.not.undefined;

        place.buildPlace(10);
        place.setPlayers(players.all);

        it('should ' + (option.shouldMove ? '' : 'not ') + 'move to ' + option.direction, function () {
            expect(place.place[prev[1]][prev[0]]).to.be.an.instanceof(Player);
            expect(place.place[next[1]][next[0]]).to.be.null;

            var
                oldLocation = _.clone(players.active.location)
                , locations = players.active.move(direction)
                , newLocation = _.clone(players.active.location);

            expect(locations.old).to.be.not.undefined;
            expect(locations.current).to.be.not.undefined;
            expect(locations.old.x).to.be.equal(oldLocation.x);
            expect(locations.old.y).to.be.equal(oldLocation.y);
            expect(locations.current.x).to.be.equal(newLocation.x);
            expect(locations.current.y).to.be.equal(newLocation.y);
            expect(locations.current.x).to.be.equal(next[0]);
            expect(locations.current.y).to.be.equal(next[1]);

            expect(place.place[prev[1]][prev[0]]).to.be.null;
            expect(place.place[next[1]][next[0]]).to.be.instanceof(Player);
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