var fs = require('fs');
var join = require('path').join;
var resolve = require('path').resolve;
var dirname = require('path').dirname;

var Boom = require('boom');
var Hoek = require('hoek');
var sass = require('node-sass');
var mkdirp = require('mkdirp');

var internals = {

    defaults: {
        debug: false,
        force: false,
        entryPoint: '_index',
        extension: 'scss',
        src: './lib/sass',
        dest: './public/css',
        routePath: '/css/{module*}',
        outputStyle: 'compressed',
        sourceComments: false
    },

    error: function (reply, err) {
        if (err.code == 'ENOENT') {
            return reply(Boom.notFound());
        }
        else {
            return reply(Boom.internal(err));
        }
    },

    log: function log(key, val) {
        console.error(' zool-sass:  \033[90m%s :\033[0m \033[36m%s\033[0m', key, val);
    }
};

exports.register = function (server, options, next) {

    var settings = Hoek.applyToDefaults(internals.defaults, options);
    // Force compilation
    var force = settings.force;

    // Debug option
    var debug = settings.debug;

    // Source dir required
    var src = settings.src;
    if (!src) {
        next(new Boom('zool-sass requires "src" directory'));
    }

    // Default dest dir to source
    var dest = settings.dest ? settings.dest : src;

    server.route({
        method: 'GET',
        path: settings.routePath,
        handler: function (request, reply) {

            var componentName = request.params.module.replace('.css', '');
            var componentPath = `${src}/${componentName}`;

            var cssPath  = resolve(join(dest, componentName + '.css'));
            var sassPath = resolve(`${componentPath}/${settings.entryPoint}.${settings.extension}`);
            var sassDir  = dirname(sassPath);

            if (debug) {
                internals.log('source ', sassPath);
                internals.log('dest ', cssPath);
                internals.log('sassDir ', sassDir);
            }

            var compile = function () {

                if (debug) {
                    internals.log('read', sassPath);
                }

                sass.render({
                    file: sassPath,
                    includePaths: [sassDir].concat(settings.includePaths || []),
                    imagePath: settings.imagePath,
                    outputStyle: settings.outputStyle,
                    sourceComments: settings.sourceComments
                }, function(err, result){

                    if (err) {
                        internals.log('render ', err);
                        return reply('The scss file was not found').code(404);
                        //return internals.error(reply, err);
                    }

                    if (debug) {
                        internals.log('render', 'compilation ok');
                    }

                    mkdirp(dirname(cssPath), 0x1c0, function (err) {
                        if (err) {
                            return reply(err);
                        }
                        fs.writeFile(cssPath, result.css, 'utf8', function (err) {
                            reply(result.css).type('text/css');
                        });
                    });
                });
            };

            if (force) {
                return compile();
            }


            fs.stat(sassPath, function (err, sassStats) {

                if (err) {
                    return internals.error(reply, err);
                }
                fs.stat(cssPath, function (err, cssStats) {

                    if (err) {
                        if (err.code == 'ENOENT') {
                            // css has not been compiled
                            if (debug) {
                                internals.log('not found, compiling', cssPath);
                            }
                            compile();

                        } else {
                            internals.error(reply, err);
                        }
                    }
                    else { // compiled version exists, check mtimes

                        if (sassStats.mtime > cssStats.mtime) { // the sass version is newer
                            if (debug) {
                                internals.log('minified', cssPath);
                            }
                            compile();
                        }
                        else {
                            // serve
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
