'use strict';

const Boom = require('boom');
const Hoek = require('hoek');

const join = require('path').join;
const resolve = require('path').resolve;
const dirname = require('path').dirname;

const fs = require('fs');
const Promise = require('bluebird');
const stat = Promise.promisify(fs.stat);
const readFile = Promise.promisify(fs.readFile);

const compileSass = require('./sassCompiler').compileSass;

const zoolLogger = require('zool-utils').ZoolLogger;
const logger = zoolLogger('zool-sass');

const defaults = {
    force: false,
    entryPoint: '_index',
    extension: 'scss',
    src: './lib/sass',
    dest: './public/css'
};

module.exports = {

    compile: function (componentName, compileConfig) {

        compileConfig = Hoek.applyToDefaults(defaults, compileConfig || {});

        const componentPath = `${compileConfig.src}/${componentName}`;

        const cssPath = resolve(join(compileConfig.dest, componentName + '.css'));
        const sassPath = resolve(`${componentPath}/${compileConfig.entryPoint}.${compileConfig.extension}`);
        const sassDir = dirname(sassPath);

        compileConfig.file = sassPath;
        compileConfig.pathToCss = cssPath;
        compileConfig.imagePath = compileConfig.imagePath;
        compileConfig.includePaths = [sassDir].concat(compileConfig.includePaths || []);

        return stat(sassPath)

            .then(function (sassStats) {

                return stat(cssPath)

                    .then(function (cssStats) {

                        const sassIsNewer = sassStats.mtime > cssStats.mtime;

                        if (sassIsNewer || compileConfig.force) {

                            if (compileConfig.debug) {
                                logger.debug(compileConfig.force ? 'Forcing compilation' : 'Compiled css out of date:', cssPath);
                            }

                            return compileSass(compileConfig);

                        } else {
                            return readFile(cssPath, 'utf-8');
                        }

                    })

                    .catch(function (err) {

                        if (err.code === 'ENOENT') {

                            if (compileConfig.debug) {
                                logger.debug('Compiled css not found:', err);
                            }

                            return compileSass(compileConfig);

                        } else {
                            return Promise.resolve(Boom.internal(err));
                        }
                    });

            });
    }
};