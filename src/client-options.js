/* eslint-disable jsdoc/valid-types */
'use strict';

/**
 * Client options
 *
 * @type {object}
 * @readonly
 * @property {string} host=192.168.1.255 - GREE device ip-address
 * @property {number} port=7000 - GREE device UDP port
 * @property {number} connectTimeout=3000 - Reconnect to device if no success timeout
 * @property {boolean} autoConnect=true - Automatically connect to device when client is created. Alternatively method `connect()` can be used.
 * @property {boolean} poll=true - Poll device properties
 * @property {number} pollingInterval=3000 - Device properties polling interval
 * @property {number} pollingTimeout=1000 - Device properties polling timeout, emits `no_response` events in case of no response from HVAC device for a status request
 * @property {string} logLevel=error - Logging level (debug, info, warn, error)
 * @property {boolean} debug=false - Override logLevel to debug, deprecated, use logLevel option
 */
const CLIENT_OPTIONS = {
    host: '192.168.1.255',
    port: 7000,
    connectTimeout: 3000,
    autoConnect: true,
    poll: true,
    pollingInterval: 3000,
    pollingTimeout: 1000,
    logLevel: 'error',
    debug: false,
};

/**
 * Build effective options
 *
 * @param {CLIENT_OPTIONS} options
 * @returns {CLIENT_OPTIONS}
 * @private
 */
const createOptions = options => {
    const envOptions = filterOutUndefined({
        host: process.env.GREE_HVAC_HOST,
        port: process.env.GREE_HVAC_PORT,
        connectTimeout: process.env.GREE_HVAC_CONNECT_TIMEOUT,
        autoConnect: process.env.GREE_HVAC_AUTO_CONNECT,
        poll: process.env.GREE_HVAC_POLL,
        pollingInterval: process.env.GREE_HVAC_POLLING_INTERVAL,
        pollingTimeout: process.env.GREE_HVAC_POLLLING_TIMEOUT,
        logLevel: process.env.GREE_HVAC_LOG_LEVEL,
        debug: process.env.GREE_HVAC_DEBUG,
    });

    return {
        ...CLIENT_OPTIONS,
        ...envOptions,
        ...options,
    };
};

const filterOutUndefined = obj =>
    Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined));

module.exports = {
    CLIENT_OPTIONS,
    createOptions,
};
