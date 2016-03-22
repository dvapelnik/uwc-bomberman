module.exports = require('nconf')
    .argv()
    .env()
    .file({
        file: [process.cwd(), 'config.json'].join('/')
    });