'use strict';

const colors = require('colors');

const fs = require('fs');
const join = require('path').join;
const resolve = require('path').resolve;
const dirname = require('path').dirname;

const Boom = require('boom');
const Hoek = require('hoek');
const sass = require('node-sass');
const Inert = require('inert');
const mkdirp = require('mkdirp');

colors.setTheme({
    info: 'green',
    help: 'cyan',
    warn: 'yellow',
    debug: 'blue',
    error: 'red'
});

const internals = {};

internals.defaults = {
    debug: false,
    force: false,
    entryPoint: '_index',
    extension: 'scss',
    src: './lib/sass',
    dest: './public/css',
    routePath: '/css/{module*}',
    outputStyle: 'compressed',
    sourceComments: false
};

internals.log = function log(key, val) {
    console.log(' zool-sass: ', `${key}: `.gray, val.cyan);
};

internals.debug = function log(key, val) {
    console.log(' zool-sass: '.debug, `${key}: `.gray, val.cyan);
};

internals.error = function log(key, val) {
    console.error(' zool-sass: '.error, `${key}: `.gray, val.cyan);
};

internals.warn = function log(key, val) {
    console.error(' zool-sass: '.warn, `${key}: `.gray, val.cyan);
};

internals.handleError = function (err, reply) {
    if (err.code == 'ENOENT') {
        internals.warn('compile', 'not found');
        return reply(Boom.notFound());
    } else {
        internals.error('compile', 'internal error');
        return reply(Boom.internal(err));
    }
};

exports.register = function (server, options, next) {

    const config = Hoek.applyToDefaults(internals.defaults, options);

    if (!config.src) {
        next(new Boom('zool-sass requires "src" directory'));
    }

    config.dest = config.dest || config.src;

    server.register(Inert, () => {});

    server.route({
        method: 'GET',
        path: config.routePath,
        handler: function (request, reply) {

            const componentName = request.params.module.replace('.css', '');
            const componentPath = `${config.src}/${componentName}`;

            const cssPath = resolve(join(config.dest, componentName + '.css'));
            const sassPath = resolve(`${componentPath}/${config.entryPoint}.${config.extension}`);
            const sassDir = dirname(sassPath);

            if (config.debug) {
                internals.log('source (sassPath)', sassPath);
                internals.log('dest (cssPath)', cssPath);
                internals.log('sassDir ', sassDir);
            }

            function compile() {

                if (config.debug) {
                    internals.log('read', sassPath);
                }

                function success(err, result) {

                    if (err) {
                        return internals.handleError(err, reply);
                    }

                    if (config.debug) {
                        internals.log('render', 'compilation ok');
                    }

                    mkdirp(dirname(cssPath), 0x1c0, function (err) {

                        if (err) {
                            return reply(err);
                        }

                        fs.writeFile(cssPath, result.css, 'utf8', function () {
                            reply(result.css).type('text/css');
                        });
                    });
                }

                sass.render({
                    file: sassPath,
                    includePaths: [sassDir].concat(config.includePaths || []),
                    imagePath: config.imagePath,
                    outputStyle: config.outputStyle,
                    sourceComments: config.sourceComments
                }, success);
            }

            if (config.force) {
                return compile();
            }

            fs.stat(sassPath, function (err, sassStats) {

                if (err) {
                    return internals.handleError(err, reply);
                }

                fs.stat(cssPath, function (err, cssStats) {

                    if (err) {
                        if (err.code == 'ENOENT') {

                            if (config.debug) {
                                internals.error('not found, compiling', cssPath);
                            }

                            compile();

                        } else {
                            internals.handleError(err, reply);
                        }
                    } else {

                        const sassIsNewer = sassStats.mtime > cssStats.mtime;

                        if (sassIsNewer) {

                            if (config.debug) {
                                internals.log('minified', cssPath);
                            }

                            compile();

                        } else {
                            reply.file(cssPath);
                        }

                    }
                });
            });

        }
    });

    next();
};

exports.register.attributes = {
    pkg: require('./package.json')
};
