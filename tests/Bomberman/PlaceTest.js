var
    chai = require('chai')
    , spies = require('chai-spies')
    , sinon = require('sinon')
    ;

chai.use(spies);

var
    expect = chai.expect
    , assert = chai.assert
    , clock
    , proxyquire = require('proxyquire')
    , rewire = require('rewire')
    ;

var
    Place = rewire('../../lib/Bomberman/Place')

    , Block = require('../../lib/Bomberman/Block/Block')
    , BlockFireProof = require('../../lib/Bomberman/Block/BlockFireProof')
    , Player = require('../../lib/Bomberman/Player')
    , Bomb = require('../../lib/Bomberman/Bomb')
    , Flame = require('../../lib/Bomberman/Flame')
    ;

describe('Module function \'fillWithBlocks\'', function () {
    it('should return an Array of Arrays', function () {
        var fillWithBlocks = Place.__get__('fillWithBlocks');

        var layer = fillWithBlocks({x: 13, y: 11}, 0, 10, 5);

        expect(layer).to.be.instanceof(Array);

        for (var i = 0; i < layer.length; i++) {
            expect(layer[i]).to.be.instanceof(Array);
        }
    });

    it('should return matrix \'[M x N]\'', function () {
        var
            fillWithBlocks = Place.__get__('fillWithBlocks')
            , sizes = {x: 13, y: 11}
            , layer = fillWithBlocks(sizes, 0, 10, 5)
            ;

        expect(layer.length).to.be.equal(sizes.y);

        for (var i = 0; i < layer.length; i++) {
            expect(layer[i].length).to.be.equal(sizes.x);
        }
    });

    it('should call \'isFireProofPlace\'', function () {
        var isFireProofPlaceSpy = chai.spy(Place.__get__('isFireProofPlace'));
        Place.__set__('isFireProofPlace', isFireProofPlaceSpy);

        var fillWithBlocks = Place.__get__('fillWithBlocks');

        fillWithBlocks({x: 13, y: 11}, 0, 10, 5);

        expect(isFireProofPlaceSpy).to.have.been.called();
    });

    it('should call \'isReservedSpy\'', function () {
        var isReservedSpy = chai.spy(Place.__get__('isReserved'));
        Place.__set__('isReserved', isReservedSpy);

        var fillWithBlocks = Place.__get__('fillWithBlocks');

        fillWithBlocks({x: 13, y: 11}, 0, 10, 5);

        expect(isReservedSpy).to.have.been.called();
    });

    it('should call \'makeChance\'', function () {
        var makeChanceSpy = chai.spy(Place.__get__('makeChance'));
        Place.__set__('makeChance', makeChanceSpy);

        var fillWithBlocks = Place.__get__('fillWithBlocks');

        fillWithBlocks({x: 13, y: 11}, 0, 10, 5);

        expect(makeChanceSpy).to.have.been.called();
    });

    it('should make a \'Block\'', function () {
        var Block = chai.spy(Place.__get__('Block'));
        Place.__set__('Block', Block);

        var fillWithBlocks = Place.__get__('fillWithBlocks');

        fillWithBlocks({x: 13, y: 11}, 0, 10, 5);

        expect(Block).to.have.been.called();
    });
});


describe('Module function \'fillWithFireProofBlocks\'', function () {
    it('should return an Array of Arrays', function () {
        var fillWithFireProofBlocks = Place.__get__('fillWithFireProofBlocks');

        var layer = fillWithFireProofBlocks({x: 13, y: 11});

        expect(layer).to.be.instanceof(Array);

        for (var i = 0; i < layer.length; i++) {
            expect(layer[i]).to.be.instanceof(Array);
        }
    });

    it('should return matrix \'[M x N]\'', function () {
        var
            fillWithFireProofBlocks = Place.__get__('fillWithFireProofBlocks')
            , sizes = {x: 13, y: 11}
            , layer = fillWithFireProofBlocks(sizes)
            ;

        expect(layer.length).to.be.equal(sizes.y);

        for (var i = 0; i < layer.length; i++) {
            expect(layer[i].length).to.be.equal(sizes.x);
        }
    });

    it('should call \'isFireProofPlace\'', function () {
        var isFireProofPlaceSpy = chai.spy(Place.__get__('isFireProofPlace'));
        Place.__set__('isFireProofPlace', isFireProofPlaceSpy);

        var fillWithBlocks = Place.__get__('fillWithBlocks');

        fillWithBlocks({x: 13, y: 11}, 0, 10, 5);

        expect(isFireProofPlaceSpy).to.have.been.called();
    });

    it('should make a \'BlockFireProof\'', function () {
        var Block = chai.spy(Place.__get__('BlockFireProof'));
        Place.__set__('BlockFireProof', Block);

        var fillWithFireProofBlocks = Place.__get__('fillWithFireProofBlocks');

        fillWithFireProofBlocks({x: 13, y: 11});

        expect(Block).to.have.been.called();
    });
});


describe('Module function \'getPool\'', function () {
    var getPool = Place.__get__('getPool');

    var variants = [
        {type: Block, name: 'Block', field: 'blocks'},
        {type: BlockFireProof, name: 'BlockFireProof', field: 'blocksFireProof'},
        {type: Player, name: 'Player', field: 'players'},
        {type: Bomb, name: 'Bomb', field: 'bombs'},
        {type: Flame, name: 'Flame', field: 'flames'}
    ];

    describe('should return an Array of Arrays for', function () {
        for (var _i = 0; _i < variants.length; _i++) {
            it(['\'', '\''].join(variants[_i].name), (function (_i) {
                return function () {
                    var
                        layer = getPool(new Place(), new (variants[_i].type)())
                        ;

                    expect(layer).to.be.instanceof(Array);

                    for (var i = 0; i < layer.length; i++) {
                        expect(layer[i]).to.be.instanceof(Array);
                    }
                }
            })(_i));
        }
    });

    describe('should return matrix \'[M x N]\' for', function () {
        for (var _i = 0; _i < variants.length; _i++) {
            it(['\'', '\''].join(variants[_i].name), (function (_i) {
                return function () {
                    var
                        place = new Place()
                        , layer = getPool(place, new (variants[_i].type)())
                        ;

                    expect(layer.length).to.be.equal(place.sizes.y);

                    for (var i = 0; i < layer.length; i++) {
                        expect(layer[i].length).to.be.equal(place.sizes.x);
                    }
                }
            })(_i));
        }
    });

    describe('should return place\'s field', function () {
        for (var _i = 0; _i < variants.length; _i++) {
            it('\'' + variants[_i].field + '\' for \'' + variants[_i].name + '\'', (function (_i) {
                return function () {
                    var
                        place = new Place()
                        , layer = getPool(place, new (variants[_i].type)())
                        ;

                    expect(place[variants[_i].field] === layer).to.be.true;
                }
            })(_i));
        }
    });

    it('should throw error on unsupported type', function () {
        expect(function () {
            getPool(new Place(), new Date());
        }).to.throw(Error, 'Unsupported item type');
    });
});


describe('Place', function () {
    var defaultOptions = {
        width: 13,
        height: 11,
        flameLifetime: 250,
        chainExplosion: false,
        filling: {
            min: 0,
            max: 10
        }
    };

    it('should return default options', function () {
        expect(new Place().getOptions()).to.be.deep.equal(defaultOptions);
    });

    it('should return passed in constructor options', function () {
        expect(new Place({}, defaultOptions).getOptions() === defaultOptions).to.be.true;
    });

    describe('constructor', function () {
        it('should make field \'sizes\' from options data', function () {
            expect(new Place({}, defaultOptions).sizes).to.be.deep.equal({
                x: defaultOptions.width,
                y: defaultOptions.height
            });
        });

        it('should set field \'game\' value from constructor', function () {
            var game = {};

            expect(new Place(game, defaultOptions).game === game).to.be.true;
        });

        it('should call \'makeEmptyMap\' five times', function () {
            var makeEmptyMapSpy = chai.spy(Place.__get__('makeEmptyMap'));

            Place.__set__('makeEmptyMap', makeEmptyMapSpy);

            var place = new Place();

            expect(makeEmptyMapSpy).to.have.been.called.exactly(5).with(place.sizes);
        });

        it('should subscribe to own \'change\' event and call callback when \'game\' field is defined', function () {
            var game = {};
            game.emit = chai.spy();

            var place = new Place(game);
            place.checkIsPlayerMovedToFlame = chai.spy();

            place.emit('change');

            expect(place.checkIsPlayerMovedToFlame).to.have.been.once.called();
            expect(game.emit).to.have.been.once.called.with('change');
        });
    });

    describe('method \'buildPlace\'', function () {
        it('should return \'undefined\'', function () {
            var place = new Place();

            expect(place.buildPlace(5)).to.be.undefined;
        });

        it('should call \'fillWithBlocks\' once', function () {
            var place = new Place();

            var fillWithBlocksSpy = chai.spy(Place.__get__('fillWithBlocks'));

            Place.__set__('fillWithBlocks', fillWithBlocksSpy);

            place.buildPlace(5);

            expect(fillWithBlocksSpy).to.have.been.called.once.with(place.sizes, defaultOptions.filling.min, defaultOptions.filling.max, 5);
        });

        it('should call own \'getOptions\' method twice', function () {
            var place = new Place();

            place.getOptions = chai.spy(place.getOptions);

            place.buildPlace();

            expect(place.getOptions).to.have.been.called.twice()
        });

        it('should call \'fillWithFireProofBlocks\' once', function () {
            var place = new Place();

            var fillWithFireProofBlocksSpy = chai.spy(Place.__get__('fillWithFireProofBlocks'));
            Place.__set__('fillWithFireProofBlocks', fillWithFireProofBlocksSpy);

            place.buildPlace();

            expect(fillWithFireProofBlocksSpy).to.have.been.called.once.with(place.sizes);
        });
    });

    describe('method \'serialize\'', function () {
        it('should return string', function () {
            var place = new Place();

            expect(place.serialize()).to.be.a('string');
        });

        it('should call \'tableMap\' fice times', function () {
            var tableMapSpy = chai.spy(Place.__get__('tableMap'));
            Place.__set__('tableMap', tableMapSpy);

            new Place().serialize();

            expect(tableMapSpy).to.have.been.called.exactly(5);
        });

        it('should return correct JSON-string', function () {
            expect(function () {
                JSON.parse(new Place().serialize());
            }).to.not.throw(Error);
        });

        describe('should return JSON-string which contains', function () {
            var fields = ['blocks', 'blocksFireProof', 'players', 'bombs', 'flames'];

            for (var _i = 0; _i < fields.length; _i++) {
                it('\'' + fields[_i] + '\' field', (function (_i) {
                    return function () {
                        var serialized = JSON.parse(new Place().serialize());

                        expect(serialized[fields[_i]]).to.be.an('array');
                    };
                })(_i));
            }
        });
    });

    describe('method \'setPlayers\'', function () {
        it('should call \'buildAngles\' once', function () {
            var buildAnglesSpy = chai.spy(Place.__get__('buildAngles'));

            Place.__set__('buildAngles', buildAnglesSpy);

            var place = new Place();
            place.setPlayers([]);

            expect(buildAnglesSpy).to.have.been.called.once();
        });

        it('should return \'undefined\'', function () {
            expect(new Place().setPlayers([])).to.be.undefined;
        });

        describe('should place players at angles:', function () {
            var place = new Place();

            var angles = require('../../lib/util').buildAngles(place.sizes);
            var players = require('underscore').range(0, 4).map(function (i) {
                return {name: i};
            });

            place.setPlayers(players);

            for (var _i = 0; _i < angles.length && _i < players.length; _i++) {
                it('player with name \'' + players[_i].name + '\' placed on \'' + JSON.stringify(angles[_i]) + '\'', (function (_i) {
                    return function () {
                        expect(place.players[angles[_i].y][angles[_i].x] === players[_i]).to.be.true;
                    };
                })(_i));
            }
        });
    });

    describe('method \'getPlayers\'', function () {
        it('should return an Array', function () {
            var place = new Place();

            expect(place.getPlayers()).to.be.an('array');
        });

        it('should call \'tableMap\' once', function () {
            var place = new Place();

            var tableMapSpy = chai.spy(Place.__get__('tableMap'));
            Place.__set__('tableMap', tableMapSpy);

            place.getPlayers();

            expect(tableMapSpy).to.have.been.called.once();
        });

        it('should return specified with \'setPlayers\' players', function () {
            var players = require('underscore').range(0, 4).map(function () {
                return new Player();
            });

            var place = new Place();
            place.setPlayers(players);

            var retrievedPlayers = place.getPlayers();

            for (var i = 0; i < players.length && retrievedPlayers.length; i++) {
                expect(players[i] === retrievedPlayers[i]).to.be.ok;
            }
        });
    });

    describe('method \'placeItem\'', function () {
        var location = {x: 0, y: 0};

        it('should return \'undefined\'', function () {
            expect(new Place().placeItem(new Block(), location)).to.be.undefined;
        });

        it('should call \'isInBounds\' once', function () {
            var isInBoundsSpy = chai.spy(Place.__get__('isInBounds'));
            Place.__set__('isInBounds', isInBoundsSpy);

            var place = new Place();

            place.placeItem(new Block(), location);

            expect(isInBoundsSpy).to.have.been.called.once();
        });

        it('should throw error when location out ojf bounds', function () {
            var place = new Place();

            expect(function () {
                place.placeItem(new Block(), {x: place.sizes.x + 10, y: place.sizes.y + 10});
            }).to.throw(Error, 'Location out of bounds');
        });

        it('should call \'getPool\' once', function () {
            var getPoolSpy = chai.spy(Place.__get__('getPool'));
            Place.__set__('getPool', getPoolSpy);

            var place = new Place();

            place.placeItem(new Block(), location);

            expect(getPoolSpy).to.have.been.called.once();
        });

        it('should emit \'change\' event if options have not true \'silent\' field', function () {
            var place = new Place();
            place.emit = chai.spy();

            place.placeItem(new Block(), location, {silent: false});

            expect(place.emit).to.have.been.called.once.with('change', {target: place, msg: 'emit change on place'});
        });

        it('should not emit \'change\' event if options have true \'silent\' field', function () {
            var place = new Place();
            place.emit = chai.spy();

            place.placeItem(new Block(), location, {silent: true});

            expect(place.emit).to.have.not.been.called();
        });
    });

    describe('method \'placeBomb\'', function () {
        it('should return \'undefined\'', function () {
            var bomb = new Bomb();
            bomb.location = {x: 0, y: 0};

            expect(new Place().placeBomb(bomb)).to.be.undefined;
        });

        it('should call own \'placeItem\'', function () {
            var bomb = new Bomb();
            bomb.location = {x: 0, y: 0};

            var place = new Place();
            place.placeItem = chai.spy(place.placeItem);

            place.placeBomb(bomb);

            expect(place.placeItem).to.have.been.called.once.with(bomb, bomb.location);
        });

        it('should set \'place\' on bomb', function () {
            var bomb = new Bomb();
            bomb.location = {x: 0, y: 0};

            expect(bomb.place).to.be.undefined;

            var place = new Place();

            place.placeBomb(bomb);

            expect(bomb.place === place).to.be.true;
        });
    });

    describe('method \'canPlaceBombAt\'', function () {
        it('should return boolean', function () {
            var place = new Place();

            expect(place.canPlaceBombAt({x: 0, y: 0})).to.be.a('boolean');
        });

        it('should work correctly', function () {
            var place = new Place();

            var location = {x: 0, y: 0};

            expect(place.canPlaceBombAt(location)).to.be.equal(
                place.blocks[location.y][location.x] === null && place.bombs[location.y][location.x] === null
            );
        });
    });

    describe('method \'destroy\'', function () {
        it('should call \'terminate\' item\'s method it exists', function () {
            var item = new Block();
            item.terminate = chai.spy();

            var place = new Place();
            place.destroy(item, {x: 0, y: 0});

            expect(item.terminate).to.have.been.called.once();
        });

        it('should call \'getPool\' once', function () {
            var getPoolSpy = chai.spy(Place.__get__('getPool'));
            Place.__set__('getPool', getPoolSpy);

            var place = new Place();

            place.destroy(new Block(), {x: 0, y: 0});

            expect(getPoolSpy).to.have.been.called.once();
        });

        it('should remove item from pool', function () {
            var item = new Block();
            var place = new Place();
            var location = {x: 0, y: 0};

            place.placeItem(item, location);

            expect(place.blocks[location.y][location.x]).to.be.ok;

            place.destroy(item, location);

            expect(place.blocks[location.y][location.x]).to.be.null;
        });

        it('should return \'undefined\'', function () {
            expect(new Place().destroy(new Block(), {x: 0, y: 0})).to.be.undefined;
        });

        it('should emit \'change\' event if options have not true \'silent\' field', function () {
            var place = new Place();
            place.emit = chai.spy();

            place.destroy(new Block(), {x: 0, y: 0}, {silent: false});

            expect(place.emit).to.have.been.called.once.with('change', {target: place, msg: 'emit change on destroy'});
        });

        it('should not emit \'change\' event if options have true \'silent\' field', function () {
            var place = new Place();
            place.emit = chai.spy();

            place.destroy(new Block(), {x: 0, y: 0}, {silent: true});

            expect(place.emit).to.have.not.been.called();
        });
    });

    describe('method \'getItemsAt\'', function () {
        it('should work correctly with filtering', function () {
            var place = new Place();
            var player = new Player();
            var bomb = new Bomb();

            var location = {x: 0, y: 0};

            place.placeItem(player, location);
            place.placeItem(bomb, location);

            var items = place.getItemsAt(location, true);

            expect(items.some(function (item) {
                return item === player;
            })).to.be.true;

            expect(items.some(function (item) {
                return item === bomb;
            })).to.be.true;

            expect(items.every(function (item) {
                return item !== null;
            })).to.be.true;
        });

        it('should work correctly without filtering', function () {
            var place = new Place();
            var player = new Player();
            var bomb = new Bomb();

            var location = {x: 0, y: 0};

            place.placeItem(player, location);
            place.placeItem(bomb, location);

            var items = place.getItemsAt(location, false);

            expect(items.some(function (item) {
                return item === player;
            })).to.be.true;

            expect(items.some(function (item) {
                return item === bomb;
            })).to.be.true;

            expect(items.some(function (item) {
                return item === null;
            })).to.be.true;
        });

        it('should return an array', function () {
            expect(new Place().getItemsAt()).to.be.an('array');
        });
    });

    describe('method \'move\'', function () {
        it('should return \'undefined\'', function () {
            var place = new Place();

            var player = new Player();
            player.location = {x: 0, y: 0};

            expect(place.move(player, 'down')).to.be.undefined;
        });

        it('should call \'getPool\' once', function () {
            var getPoolSpy = chai.spy(Place.__get__('getPool'));
            Place.__set__('getPool', getPoolSpy);

            var place = new Place();

            var player = new Player();
            player.location = {x: 0, y: 0};

            place.move(player, 'down');

            expect(getPoolSpy).to.have.been.called.once();
        });

        it('should emit \'change\' event', function () {
            var place = new Place();
            place.emit = chai.spy();

            var player = new Player();
            player.location = {x: 0, y: 0};

            place.move(player, 'down');

            expect(place.emit).to.have.been.called.once.with('change', {
                target: place,
                msg: 'emit change on moving item'
            });
        });

        it('should work correctly', function () {
            var location = {x: 0, y: 0};

            var player = new Player();
            player.location = location;

            var place = new Place();
            place.placeItem(player, location);
            place.move(player, 'down');

            var newLocation = {x: 0, y: 1};

            expect(player.location).to.be.deep.equal(newLocation);

            expect(place.players[location.y][location.x]).to.be.null;
            expect(place.players[newLocation.y][newLocation.x] === player).to.be.true;
        });
    });

    describe('method \'checkIsPlayerMovedToFlame\'', function () {
        it('should wok correctly', function () {
            clock = sinon.useFakeTimers();

            var flameLocation = {x: 0, y: 1};

            var place = new Place();
            var player = new Player();
            var flame = new Flame();

            clock.tick(player.getOptions().movementThrottling + 1);

            place.setPlayers([player]);
            place.placeItem(flame, flameLocation);
            player.move('down');

            place.destroy = chai.spy(place.destroy);

            place.checkIsPlayerMovedToFlame();

            expect(place.destroy).to.have.been.called.once.with(player, player.location);

            clock.reset();
        });
    });
});