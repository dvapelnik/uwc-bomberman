function Bomb() {
    this.timer = undefined;

    this.location = undefined;

    this.place = undefined;

    this.bangTimer = setTimeout(this.bang.bind(this), 3000);
}

Bomb.prototype.bang = function () {
    console.log('Boom at', this.location);
};


module.exports = Bomb;