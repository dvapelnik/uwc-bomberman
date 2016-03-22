function HumanManipulator(player, socket) {
    var that = this;

    this.player = player;
    this.socket = socket;

    if (this.socket) {
        this.socket
            .on('bomb.place', function () {
                that.player.placeBomb();
            })
            .on('move', function (moveData) {
                var direction = moveData.direction;

                if (direction) {
                    that.player.move(direction);
                }
            });
    }
}

module.exports = HumanManipulator;