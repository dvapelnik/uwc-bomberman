function Player() {
    this.place = undefined;
}

Player.prototype.setPlace = function (place) {
    //@todo check place type
    this.place = place;

    this.active = false;
};

module.exports = Player;
