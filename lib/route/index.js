'use strict';

const fs = require('fs');

const Boom = require('boom');
const Hoek = require('hoek');
const Inert = require('inert');

const compile = require('../compiler').compile;

const zoolLogger = require('zool-utils').ZoolLogger;
const logger = zoolLogger('zool-sass');

const internals = {};

internals.defaults = {
    debug: false,
    routePath: '/css/{module*}'
};

exports.register = function (server, options, next) {

    const routeConfig = Hoek.applyToDefaults(internals.defaults, options);

    server.register(Inert, () => {});

    server.ext('onPreResponse', (request, reply) => {

        if (request.response.isBoom) {

            const error = request.response.output.payload;
            const statusCode = error.statusCode;
            const replyText = statusCode === 404 ? `${error.error}: ${request.path}` : error.message;

            logger[statusCode === 404 ? 'warn' : 'error'](error.error, error.message);

            return reply(replyText).code(statusCode);
        }

        reply.continue();
    });

    server.route({
        method: 'GET',
        path: routeConfig.routePath,
        handler: function (request, reply) {

            const componentName = request.params.module.replace('.css', '');

            compile(componentName, routeConfig)

                .then(function (css) {
                    reply(css).type('text/css');
                })

                .catch(function (err) {

                    const notFoundError = err.code && err.code === 'ENOENT';
                    const error = notFoundError ? Boom.notFound(err) : Boom.internal(err);

                    reply(error);

                });

        }
    });

    next();
};

exports.register.attributes = {
    pkg: require('../../package.json')
};
