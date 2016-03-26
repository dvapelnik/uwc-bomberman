var
    chai = require('chai')
    , spies = require('chai-spies')
    ;

chai.use(spies);

var
    expect = chai.expect
    , assert = chai.assert

    , util = require('../lib/util')
    ;

describe('util', function () {
    describe('directions property', function () {
        it('should be an array', function () {
            expect(util.directions).to.be.instanceof(Array);
        });

        it('should be an Array length of 4', function () {
            expect(util.directions).to.have.lengthOf(4);
        });

        it('should be equals to [up, right, down, left]', function () {
            expect(util.directions).to.deep.equal(['up', 'right', 'down', 'left']);
        });
    });

    describe('locationsIsEqual function', function () {
        it('should return true for equals location', function () {
            expect(util.locationsIsEqual({x: 0, y: 0}, {x: 0, y: 0})).to.be.true;
        });

        it('should return false for equals location', function () {
            expect(util.locationsIsEqual({x: 0, y: 0}, {x: 0, y: 1})).to.be.false;
        });
    });

    describe('getNewLocation function', function () {
        it('should return left neighbor', function () {
            expect(util.getNewLocation({x: 0, y: 0}, 'left')).to.deep.equal({x: -1, y: 0});
        });

        it('should return up neighbor', function () {
            expect(util.getNewLocation({x: 0, y: 0}, 'up')).to.deep.equal({x: 0, y: -1});
        });

        it('should return right neighbor', function () {
            expect(util.getNewLocation({x: 0, y: 0}, 'right')).to.deep.equal({x: 1, y: 0});
        });

        it('should return down neighbor', function () {
            expect(util.getNewLocation({x: 0, y: 0}, 'down')).to.deep.equal({x: 0, y: 1});
        });
    });

    describe('getDirection function', function () {
        it('should return left direction', function () {
            expect(util.getDirection({x: 0, y: 0}, {x: -1, y: 0})).to.equal('left')
        });

        it('should return up direction', function () {
            expect(util.getDirection({x: 0, y: 0}, {x: 0, y: -1})).to.equal('up')
        });

        it('should return right direction', function () {
            expect(util.getDirection({x: 0, y: 0}, {x: 1, y: 0})).to.equal('right')
        });

        it('should return down direction', function () {
            expect(util.getDirection({x: 0, y: 0}, {x: 0, y: 1})).to.equal('down')
        });
    });

    describe('calcDistance function', function () {
        it('should works on oX axis', function () {
            expect(util.calcDistance({x: 0, y: 0}, {x: 0, y: 1})).to.equal(1);
        });

        it('should works on oY axis', function () {
            expect(util.calcDistance({x: 0, y: 0}, {x: 1, y: 0})).to.equal(1);
        });

        it('should works on egyptian triangle', function () {
            expect(util.calcDistance({x: 3, y: 0}, {x: 0, y: 4})).to.equal(5);
        })
    });

    describe('buildAngles function', function () {
        it('should be an Array', function () {
            expect(util.buildAngles({x: 2, y: 2})).to.be.instanceof(Array);
        });

        it('should be an Array length of 4', function () {
            expect(util.buildAngles({x: 2, y: 2})).to.have.lengthOf(4);
        });

        it('should be an Array of objects', function () {
            var angles = util.buildAngles({x: 2, y: 2});

            for (var i = 0; i < angles.length; i++) {
                expect(angles[i]).to.be.instanceof(Object);
            }
        });

        it('should be an Array of objects and each element should have "x" and "y" integer property', function () {
            var angles = util.buildAngles({x: 2, y: 2});

            for (var i = 0; i < angles.length; i++) {
                expect(angles[i]).to.have.ownProperty('x');
                expect(angles[i]).to.have.ownProperty('y');

                assert.isNumber(angles[i].x);
                assert.isNumber(angles[i].y);

                assert(angles[i].x % 1 === 0, 'not an integer:' + angles[i].x);
                assert(angles[i].y % 1 === 0, 'not an integer:' + angles[i].y);
            }
        });

        it('should works on 2x2 square', function () {
            expect(util.buildAngles({x: 2, y: 2})).to.deep.equal([
                {x: 0, y: 0},
                {x: 1, y: 0},
                {x: 0, y: 1},
                {x: 1, y: 1}
            ]);
        });
    });

    describe('buildDiagonals function', function () {
        it('should be an Array', function () {
            expect(util.buildDiagonals({x: 0, y: 0}, 1)).to.be.instanceof(Array);
        });

        it('should be an Array length of 4', function () {
            expect(util.buildDiagonals({x: 0, y: 0}, 1)).to.have.lengthOf(4);
        });

        it('should be an Array of objects', function () {
            var diagonals = util.buildDiagonals({x: 0, y: 0}, 1);

            for (var i = 0; i < diagonals.length; i++) {
                expect(diagonals[i]).to.be.instanceof(Object);
            }
        });

        it('should be an Array of objects and each element should have "x" and "y" integer property', function () {
            var diagonals = util.buildDiagonals({x: 0, y: 0}, 1);

            for (var i = 0; i < diagonals.length; i++) {
                expect(diagonals[i]).to.have.ownProperty('x');
                expect(diagonals[i]).to.have.ownProperty('y');

                assert.isNumber(diagonals[i].x);
                assert.isNumber(diagonals[i].y);

                assert(diagonals[i].x % 1 === 0, 'not an integer:' + diagonals[i].x);
                assert(diagonals[i].y % 1 === 0, 'not an integer:' + diagonals[i].y);
            }
        });

        it('should work correctly', function () {
            expect(util.buildDiagonals({x: 0, y: 0}, 1)).to.deep.equal([
                {x: -1, y: -1},
                {x: 1, y: -1},
                {x: -1, y: 1},
                {x: 1, y: 1}
            ]);
        });
    });

    describe('buildOnAxisDirection function', function () {
        it('should return object with "x" and "y" integer props', function () {
            var directions = ['up', 'right', 'down', 'left'];

            for (var i = 0; i < directions.length; i++) {
                var result = util.buildOnAxisDirection({x: 0, y: 0}, 1, directions[i]);

                expect(result).to.be.instanceof(Object);

                expect(result).to.have.ownProperty('x');
                expect(result).to.have.ownProperty('y');

                assert.isNumber(result.x);
                assert.isNumber(result.y);

                assert(result.x % 1 === 0, 'not an integer:' + result.x);
                assert(result.y % 1 === 0, 'not an integer:' + result.y);
            }
        });

        it('should work correctly', function () {
            var data = [
                {direction: 'up', expected: {x: 0, y: -1}},
                {direction: 'right', expected: {x: 1, y: 0}},
                {direction: 'down', expected: {x: 0, y: 1}},
                {direction: 'left', expected: {x: -1, y: 0}}
            ];

            for (var i = 0; i < data.length; i++) {
                expect(util.buildOnAxisDirection({x: 0, y: 0}, 1, data[i].direction))
                    .to.deep.equal(data[i].expected);
            }
        })
    });

    describe('buildOnAxis function', function () {
        it('should be an Array', function () {
            expect(util.buildOnAxis({x: 0, y: 0}, 1)).to.be.instanceof(Array);
        });

        it('should be an Array length of 4', function () {
            expect(util.buildOnAxis({x: 0, y: 0}, 1)).to.have.lengthOf(4);
        });

        it('should be an Array of objects', function () {
            var axis = util.buildOnAxis({x: 0, y: 0}, 1);

            for (var i = 0; i < axis.length; i++) {
                expect(axis[i]).to.be.instanceof(Object);
            }
        });

        it('should be an Array of objects and each element should have "x" and "y" integer property', function () {
            var axis = util.buildOnAxis({x: 0, y: 0}, 1);

            for (var i = 0; i < axis.length; i++) {
                expect(axis[i]).to.have.ownProperty('x');
                expect(axis[i]).to.have.ownProperty('y');

                assert.isNumber(axis[i].x);
                assert.isNumber(axis[i].y);

                assert(axis[i].x % 1 === 0, 'not an integer:' + axis[i].x);
                assert(axis[i].y % 1 === 0, 'not an integer:' + axis[i].y);
            }
        });

        it('should work correctly', function () {
            expect(util.buildOnAxis({x: 0, y: 0}, 1)).to.deep.equal([
                {x: 0, y: -1},
                {x: 1, y: 0},
                {x: 0, y: 1},
                {x: -1, y: 0}
            ]);
        });
    });

    describe('buildOnHorse function', function () {
        it('should be an Array', function () {
            expect(util.buildOnHorse({x: 0, y: 0})).to.be.instanceof(Array);
        });

        it('should be an Array length of 4', function () {
            expect(util.buildOnHorse({x: 0, y: 0})).to.have.lengthOf(8);
        });

        it('should be an Array of objects', function () {
            var horseMoves = util.buildOnHorse({x: 0, y: 0});

            for (var i = 0; i < horseMoves.length; i++) {
                expect(horseMoves[i]).to.be.instanceof(Object);
            }
        });

        it('should be an Array of objects and each element should have "x" and "y" integer property', function () {
            var horseMoves = util.buildOnHorse({x: 0, y: 0});

            for (var i = 0; i < horseMoves.length; i++) {
                expect(horseMoves[i]).to.have.ownProperty('x');
                expect(horseMoves[i]).to.have.ownProperty('y');

                assert.isNumber(horseMoves[i].x);
                assert.isNumber(horseMoves[i].y);

                assert(horseMoves[i].x % 1 === 0, 'not an integer:' + horseMoves[i].x);
                assert(horseMoves[i].y % 1 === 0, 'not an integer:' + horseMoves[i].y);
            }
        });

        it('should work correctly', function () {
            expect(util.buildOnHorse({x: 0, y: 0})).to.deep.equal([
                {x: -2, y: -1},
                {x: -1, y: -2},
                {x: 1, y: -2},
                {x: 2, y: -1},
                {x: 2, y: 1},
                {x: 1, y: 2},
                {x: -1, y: 2},
                {x: -2, y: 1}
            ]);
        });
    });

    describe('isInBounds function', function () {
        it('should return boolean', function () {
            assert.isBoolean(util.isInBounds({x: 1, y: 1}, {x: 2, y: 2}));
        });

        it('should work correctly', function () {
            expect(util.isInBounds({x: 1, y: 1}, {x: 2, y: 2})).to.be.true
            expect(util.isInBounds({x: -1, y: 11}, {x: 2, y: 2})).to.be.false
        });
    });

    describe('isReserved function', function () {
        it('should return boolean', function () {
            assert.isBoolean(util.isReserved({x: 1, y: 1}, {x: 1, y: 1}));
        });

        it('should work correctly', function () {
            var bitmap = [
                [1, 1, 0, 1, 1],
                [1, 0, 0, 0, 1],
                [0, 0, 0, 0, 0],
                [1, 0, 0, 0, 1],
                [1, 1, 0, 1, 1]
            ];

            var sizes = {x: bitmap[0].length, y: bitmap.length};

            for (var j = 0; j < sizes.y; j++) {
                for (var i = 0; i < sizes.x; i++) {
                    expect(util.isReserved({x: i, y: j}, sizes)).to.be.equal(1 == bitmap[j][i]);
                }
            }
        });
    });

    describe('isFireProofPlace function', function () {
        it('should return boolean', function () {
            assert.isBoolean(util.isFireProofPlace({x: 1, y: 1}));
        });

        it('should work correctly', function () {
            var bitmap = [
                [0, 0, 0, 0, 0],
                [0, 1, 0, 1, 0],
                [0, 0, 0, 0, 0],
                [0, 1, 0, 1, 0],
                [0, 0, 0, 0, 0]
            ];

            var sizes = {x: bitmap[0].length, y: bitmap.length};

            for (var j = 0; j < sizes.y; j++) {
                for (var i = 0; i < sizes.x; i++) {
                    expect(util.isFireProofPlace({x: i, y: j})).to.be.equal(1 == bitmap[j][i]);
                }
            }
        });
    });

    describe('tableMap function', function () {
        it('calls callback-function', function () {
            var table = [[0, 1], [2, 3], [4, 5]];

            var fn = function (cell, ri, ci) {
                return cell;
            };

            var spy = chai.spy(fn);

            util.tableMap(table, spy);

            expect(spy).to.have.been.called.exactly(6);
        });

        it('shoild return table with same size', function () {
            var table = [[0, 1], [2, 3], [4, 5]];

            var fn = function (cell, ri, ci) {
                return cell + 1;
            };

            var spy = chai.spy(fn);

            var result = util.tableMap(table, spy);

            expect(result).to.be.instanceof(Array);
            expect(result.length).to.be.equal(table.length);

            for (var i = 0; i < result.length; i++) {
                expect(result[i].length).to.be.equal(table[i].length);
            }

            expect(result).to.deep.equal([[1, 2], [3, 4], [5, 6]]);
        });
    });

    describe('pointsHasPoint function', function () {
        it('should return boolean', function () {
            assert.isBoolean(util.pointsHasPoint([{x: 0, y: 0}, {x: 1, y: 1}], {x: 1, y: 1}));
        });

        it('should work correctly', function () {
            expect(util.pointsHasPoint([{x: 0, y: 0}, {x: 1, y: 1}], {x: 0, y: 1})).to.be.false
            expect(util.pointsHasPoint([{x: 0, y: 0}, {x: 1, y: 1}], {x: 1, y: 1})).to.be.true
        });
    });

    describe('getRandomColor function', function () {
        it('should return string', function () {
            assert.isString(util.getRandomColor());
        });

        it('should return string of 7 characters', function () {
            expect(util.getRandomColor()).to.have.lengthOf(7);
        });

        it('should be matched to /^#[\d0-9A-F]{6,6}$/', function () {
            expect(util.getRandomColor()).to.match(/^#[\d0-9A-F]{6,6}$/);
        });
    });

    describe('locationsIsEqual function', function () {
        it('should return boolean', function () {
            assert.isBoolean(util.locationsIsEqual({x: 0, y: 0}, {x: 1, y: 1}));
        });

        it('should work correctly', function () {
            expect(util.locationsIsEqual({x: 0, y: 0}, {x: 0, y: 0})).to.be.true

            expect(util.locationsIsEqual({x: 0, y: 0}, {x: 0, y: 1})).to.be.false

            expect(util.locationsIsEqual({x: 0, y: 0}, {x: 1, y: 0})).to.be.false
            expect(util.locationsIsEqual({x: 0, y: 0}, {x: 1, y: 1})).to.be.false
        });
    });

    describe('makeChance function', function () {
        it('should return boolean', function () {
            assert.isBoolean(util.makeChance(1, 2, 3));
        });

        it('should work correctly', function () {
            expect(util.makeChance(0, 10, 0)).to.be.equal(false);
            expect(util.makeChance(0, 10, 10)).to.be.equal(true);
        });
    });
});



