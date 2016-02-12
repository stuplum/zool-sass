'use strict';

const mkdirp = require('mkdirp').sync;
const writeFile = require('fs').writeFileSync;

describe('zool-sass: compiler', function () {

    const temp = new Temp('zool-sass-compiler');
    const compiler = require('../lib/compiler');

    after(function () {
        temp.cleanUp();
        rimraf.sync(publicDir);
    });

    describe('with existing css', function () {

        before(function (done) {

            mkdirp(`${publicDir}/old`, 0x1c0);
            writeFile(`${publicDir}/old/css.css`, 'body { color: brown; }', 'utf8');

            setTimeout(function () {

                temp.create({
                    'new/css/_index.scss': 'body { color: yellow; }',
                    'old/css/_index.scss': 'body { color: green; }'
                });

                done();

            }, 1000);

        });

        it('should read css from existing css file when css file is newer than sass file', function (done) {

            // Given:
                mkdirp(`${publicDir}/new`, 0x1c0);
                writeFile(`${publicDir}/new/css.css`, 'body { color: pink; }', 'utf8');

            // Then:
                compiler

                    .compile('new/css', { src: temp.path })

                    .then(function (css) {
                        expect(css).to.be.equal('body { color: pink; }');
                        done();
                    })

                    .catch(done);

        });

        it('should compile from sass when css file is newer but force option is set to true', function (done) {

            // Given:
                mkdirp(`${publicDir}/new`, 0x1c0);
                writeFile(`${publicDir}/new/css.css`, 'body { color: purple; }', 'utf8');

            // Then:
                compiler

                    .compile('new/css', { src: temp.path, force: true })

                    .then(function (css) {
                        expect(css).to.be.equal('body{color:yellow}\n');
                        done();
                    })

                    .catch(done);

        });

        it('should compile sass when css file is older than sass file', function (done) {

            compiler

                .compile('old/css', { src: temp.path })

                .then(function (css) {
                    expect(css).to.be.equal('body{color:green}\n');
                    done();
                })

                .catch(done);

        });

    });

    describe('with no existing css', function () {

        before(function () {
            temp.create({
                'compile-me/_index.scss': '$test-color: blue; body { color: $test-color; }',
                'compile-me-too/_index.scss': '$test-color: red; body { color: $test-color; }',
                'compile-me-also/_index.scss': '$test-color: green; body { color: $test-color; }',
                'no-compile/_index.scss': 'body { color: $test-color; }'
            });
        });

        it('should compile a sass file and return css', function (done) {

            compiler

                .compile('compile-me', { src: temp.path })

                .then(function (css) {
                    expect(css).to.be.equal('body{color:blue}\n');
                    done();
                })

                .catch(done);

        });

        it('should compile a sass file and save to css file in default location', function (done) {

            compiler

                .compile('compile-me-too', { src: temp.path })

                .then(function (css) {
                    expect(cssFile('compile-me-too.css')).to.be.equal('body{color:red}\n');
                    done();
                })

                .catch(done);

        });

        it('should return same value as saved to compiled css file', function (done) {

            compiler

                .compile('compile-me-also', { src: temp.path })

                .then(function (css) {
                    expect(cssFile('compile-me-also.css')).to.be.equal(css);
                    done();
                })

                .catch(done);

        });

        it('should throw error if sass file is not found', function (done) {

            compiler

                .compile('unknown')

                .then(function () {
                    done(new Error('Should not have found a sass file'));
                })

                .catch(function (err) {
                    expect(err.code).to.be.equal('ENOENT');
                    done();
                });

        });

        it('should throw an error if sass file won\'t compile', function (done) {

            compiler

                .compile('no-compile', { src: temp.path })

                .then(function () {
                    done(new Error('Should not have compiled the sass file'));
                })

                .catch(function (err) {
                    expect(err.code).to.be.undefined;
                    expect(err.message).to.be.equal('Undefined variable: "$test-color".');
                    done();
                });

        });

    });

});
