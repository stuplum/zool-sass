'use strict';

console.log('>>>>>>>', __dirname);

const Hapi = require('hapi');
const expect = require('chai').expect;

describe('Zool-Sass', function () {


    it('dave', done => {
        expect(__dirname).to.equal('dave');
        done();
    });

    //const ZoolSass = require('../index');


    describe('register', function () {

        it('creates a route for the plugin', function (done) {

            var server = new Hapi.Server();

            server.connection();

            server.register({ register: ZoolSass, options: {}}, function (err) {
                    expect(err).to.not.exist;
                    var tables = server.table();
                    expect(tables.length).to.be.greaterThan(0);
                    var routes = tables[0].table;
                    expect(routes.length).to.be.greaterThan(0);
                    expect(routes[0].path).to.equal('/css/{file}.css');
                    done();
                }
            );
        });
    });

});