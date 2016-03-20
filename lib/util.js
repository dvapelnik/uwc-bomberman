module.exports = {
    getNewLocation: function (oldLocation, direction) {
        var newLocation;

        switch (direction) {
            case 'left':
                newLocation = {x: oldLocation.x - 1, y: oldLocation.y};
                break;
            case 'up':
                newLocation = {x: oldLocation.x, y: oldLocation.y - 1};
                break;
            case 'right':
                newLocation = {x: oldLocation.x + 1, y: oldLocation.y};
                break;
            case 'down':
                newLocation = {x: oldLocation.x, y: oldLocation.y + 1};
                break;
            default:
                throw  new Error('Unsupported direction');
        }

        return newLocation;
    }
};