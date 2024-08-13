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
 * @property {boolean} debug=false - Trace debug information
 * @property {number} encryptionVersion=1 - The encryption method to use: 1 AES-ECB; 2: AES-GCM
 */
const CLIENT_OPTIONS = {
    host: '192.168.1.255',
    port: 7000,
    connectTimeout: 3000,
    autoConnect: true,
    poll: true,
    pollingInterval: 3000,
    pollingTimeout: 1000,
    debug: false,
    encryptionVersion: 1,
};

module.exports = {
    CLIENT_OPTIONS,
};
