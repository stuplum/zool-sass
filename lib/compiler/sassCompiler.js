'use strict';

const Hoek = require('hoek');

const Promise = require('bluebird');
const dirname = require('path').dirname;

const render = Promise.promisify(require('node-sass').render);
const mkdirp = Promise.promisifyAll(require('mkdirp')).mkdirpAsync;
const writeFile = Promise.promisify(require('fs').writeFile);

const zoolLogger = require('zool-utils').ZoolLogger;
const logger = zoolLogger('zool-sass');

const defaults = {
    outputStyle: 'compressed',
    sourceComments: false
};

module.exports = {

    compileSass: function (_config) {

        const config = Hoek.applyToDefaults(defaults, _config);

        if (config.debug) {
            logger.debug('Compile config', config);
        }

        return render(config)

            .then(function (result) {

                if (config.debug) {
                    logger.debug('render', 'compilation ok');
                }

                return mkdirp(dirname(config.pathToCss), 0x1c0)

                    .then(function (generatedPath) {

                        if (config.debug) {
                            logger.debug('mkdirp', generatedPath);
                        }

                        return writeFile(config.pathToCss, result.css, 'utf8')

                            .then(function () {

                                if (config.debug) {
                                    logger.debug('CSS file written to:', config.pathToCss);
                                }

                                return result.css.toString();
                            });
                    });
            });

    }

};