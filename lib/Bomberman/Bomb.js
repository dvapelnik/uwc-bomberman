function Bomb() {
    this.timer = undefined;

    this.location = undefined;

    this.place = undefined;

    this.bangTimer = setTimeout(this.bang.bind(this), 3000);
}

Bomb.prototype.bang = function () {
    this.onBoom(this);
};

module.exports = Bomb;