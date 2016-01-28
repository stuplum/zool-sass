'use strict';

const Hapi = require('hapi');

describe('zool-sass: default settings', function () {

    const temp = new Temp('zool-sass-tests');

    let server;

    before(function () {
        temp.create({ 'compile-me/_index.scss': '$test-color: blue; body { color: $test-color; }' });
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

    it('should compile a sass file', function (done) {

        server.inject({ method: 'GET', url: '/css/compile-me.css' }, function (response) {
            expect(response.statusCode).to.be.equal(200);
            expect(response.payload).to.be.equal('body{color:blue}\n');
            done();
        });

    });

    it('should write the output to a css file', function (done) {

        server.inject({ method: 'GET', url: '/css/compile-me.css' }, function () {
            expect(cssFile('compile-me.css')).to.be.equal('body{color:blue}\n');
            done();
        });

    });

    it('should return a 404 if file not found', function (done) {

        server.inject({ method: 'GET', url: '/css/unknown.css' }, function (response) {
            expect(response.statusCode).to.be.equal(404);
            done();
        });

    });

});
