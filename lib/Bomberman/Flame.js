function Flame(place, location) {
    //this.flameOutTimer = setTimeout(this.flameOut.bind(this), 1000);
    this.place = place;
    this.location = location;
}

//Flame.prototype.flameOut = function () {
//    this.terminate();
//    this.place.destroy(this, this.location);
//};

//Flame.prototype.terminate = function () {
//    clearTimeout(this.flameOutTimer);
//};

module.exports = Flame;