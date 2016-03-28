'use strict';

const Hapi = require('hapi');

describe('zool-sass: route', function () {

    const temp = new Temp('zool-sass-route');

    let server;

    before(function () {
        temp.create({
            'not-important/_index.scss': 'body {}'
        });
    });

    after(function () {
        temp.cleanUp();
        rimraf.sync(publicDir);
    });

    beforeEach(function (done) {

        server = new Hapi.Server();
        server.connection({ port: 8000 });

        server.register([{ register: require('../'), options: { src: temp.path } }], done);
    });

    it('should be exported', function (done) {

        server.inject({ method: 'GET', url: '/css/not-important.css' }, function (response) {
            expect(response.statusCode).to.be.equal(200);
            done();
        });

    });

});
