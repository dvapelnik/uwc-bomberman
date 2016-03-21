function Bomb() {
    this.timer = undefined;
    this.location = undefined;
    this.place = undefined;
    this.bangTimer = setTimeout(this.bang.bind(this), 3000);
}

Bomb.prototype.bang = function () {
    clearTimeout(this.bangTimer);
    this.place.destroyFromBomb(this.location, 2);

    this.onBoom(this);
};

module.exports = Bomb;