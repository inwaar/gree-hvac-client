'use strict';

const dgram = require('dgram');
const EventEmitter = require('events');
const diff = require('object-diff');
const clone = require('clone');

const { EncryptionService } = require('./encryption-service');
const { PROPERTY } = require('./property');
const { PROPERTY_VALUE } = require('./property-value');
const { CLIENT_OPTIONS, createOptions } = require('./client-options');
const { PropertyTransformer } = require('./property-transformer');
const {
    ClientError,
    ClientMessageParseError,
    ClientMessageUnpackError,
    ClientSocketSendError,
    ClientUnknownMessageError,
    ClientNotConnectedError,
    ClientConnectTimeoutError,
    ClientCancelConnectError,
} = require('./errors');
const { createLogger } = require('./logger');
const { randomUUID } = require('crypto');

/**
 * Control GREE HVAC device by getting and setting its properties
 *
 * @augments EventEmitter
 */
class Client extends EventEmitter {
    /**
     * @typedef {Object<PROPERTY, PROPERTY_VALUE | number>} PropertyMap
     */

    /**
     * Emitted when successfully connected to the HVAC
     *
     * @event Client#connect
     */

    /**
     * Emitted when properties successfully updated after calling setProperties or setProperty
     *
     * @param {PropertyMap} updated The properties and their values that were updated
     * @param {PropertyMap} properties All the properties and their values managed by the Client
     * @event Client#success
     */

    /**
     * Emitted when properties successfully updated from HVAC (e.g. by a remote control)
     *
     * @param {PropertyMap} updated The properties and their values that were updated
     * @param {PropertyMap} properties All the properties and their values managed by the Client
     * @event Client#update
     */

    /**
     * Emitted when an error happens
     *
     * It is important to subscribe to the `error` event, otherwise the process will be terminated
     *
     * @param {ClientError} error
     * @event Client#error
     */

    /**
     * Emitted when disconnected from the HVAC
     *
     * @event Client#disconnect
     */

    /**
     * Creates a new client, connect to device and start polling by default.
     *
     * @param {CLIENT_OPTIONS | {}} options
     * @fires Client#connect
     * @fires Client#update
     * @fires Client#error
     * @fires Client#disconnect
     * @example
     * const Gree = require('gree-hvac-client');
     *
     * const client = new Gree.Client({host: '192.168.1.69'});
     * client.on('connect', () => {
     *     client.setProperty(Gree.PROPERTY.lights, Gree.VALUE.lights.off);
     *     client.setProperty(Gree.PROPERTY.temperature, 25);
     * });
     */
    constructor(options = {}) {
        super();

        /**
         * Device MAC-address
         *
         * @type {string|null}
         * @private
         */
        this._cid = null;

        /**
         * @type {dgram.Socket|null}
         * @private
         */
        this._socket = null;

        /**
         * @type {number}
         * @private
         */
        this._reconnectAttempt = 1;

        /**
         * Socket connection timeout reference
         *
         * @type {number|null}
         * @private
         */
        this._socketTimeoutRef = null;

        /**
         * Bind response timeout reference
         *
         * @type {number|null}
         * @private
         */
        this._bindTimeoutRef = null;

        /**
         * Status polling interval reference
         *
         * @type {number|null}
         * @private
         */
        this._statusIntervalRef = null;

        /**
         * Status polling timeout reference
         *
         * @type {number|null}
         * @private
         */
        this._statusTimeoutRef = null;

        /**
         * Device properties, are updated by polling the devices
         *
         * @type {PropertyMap}
         * @private
         */
        this._properties = {};
        /**
         * @type {PropertyTransformer}
         * @private
         */
        this._transformer = new PropertyTransformer();

        /**
         * Client options
         *
         * @type {CLIENT_OPTIONS}
         * @private
         */
        this._options = createOptions(options);

        /**
         * @private
         */
        this._logger;
        this.setDebug(this._options.debug);

        /**
         * @type {EncryptionService}
         * @private
         */
        this._encryptionService = new EncryptionService(this._logger);

        this._logger.info('Init', { options: this._options });

        if (this._options.autoConnect) {
            process.nextTick(() => {
                this._logger.info('Auto-connect');
                this.connect().catch(error => this.emit('error', error));
            });
        }
    }

    /**
     * Connect to a HVAC device and start polling status changes by default
     *
     * @returns {Promise}
     * @fires Client#connect
     * @fires Client#error
     */
    connect() {
        this._logger.info('Connecting');

        return new Promise((resolve, reject) => {
            this.once('connect', resolve);
            this.once('disconnect', () => {
                process.nextTick(() => reject(new ClientCancelConnectError()));
            });

            this._socket = dgram.createSocket('udp4');
            this._socket.on('message', message => {
                this._handleResponse(message).catch(error => {
                    this._logger.error('Response handle error', error);
                    this.emit('error', error);
                });
            });

            this._socket.bind(() => {
                this._socket.setBroadcast(true);
                this._initialize().catch(reject);
            });
        });
    }

    /**
     * Initialize connection
     *
     * @private
     */
    async _initialize() {
        this._dispose();

        try {
            this._encryptionService = new EncryptionService(this._logger);

            this._logger.info('Scan start', {
                attempt: this._reconnectAttempt,
            });
            await this._socketSend({ t: 'scan' });

            await this._scheduleReconnect();
            this.emit('error', new ClientConnectTimeoutError());
        } catch (err) {
            this._scheduleReconnect();
            throw err;
        }
    }

    /**
     * Maintain auto-reconnect
     *
     * @private
     */
    _scheduleReconnect() {
        return new Promise(resolve => {
            this._socketTimeoutRef = setTimeout(() => {
                this._logger.warn('Connect timeout, reconnect', {
                    timeout: this._options.connectTimeout,
                });
                this._reconnectAttempt++;

                this._initialize().catch(error => {
                    this.emit('error', error);
                    this._logger.error('Initialize error', error);
                });
                resolve();
            }, this._options.connectTimeout);
        });
    }

    /**
     * Disconnect from a HVAC device and stop status polling
     *
     * @returns {Promise}
     * @fires Client#disconnect
     */
    disconnect() {
        this._logger.info('Disconnecting');

        this._dispose();

        return new Promise((resolve, reject) => {
            if (this._socket) {
                this._socket.close(() => {
                    this._logger.info('Disconnected');
                    this.emit('disconnect');
                    resolve();
                });
                this._socket = null;
            } else {
                reject(new ClientNotConnectedError());
            }
        });
    }

    /**
     * Cancel interval and timeout resources
     *
     * @private
     */
    _dispose() {
        if (this._statusIntervalRef) {
            clearInterval(this._statusIntervalRef);
        }
        if (this._socketTimeoutRef) {
            clearTimeout(this._socketTimeoutRef);
        }
        if (this._statusTimeoutRef) {
            clearTimeout(this._statusTimeoutRef);
        }
    }

    /**
     * Set a list of device properties at once by one request
     *
     * @param {PropertyMap} properties
     * @returns {Promise}
     * @fires Client#success
     * @fires Client#error
     * @example
     * // use library constants
     *
     * const properties = {};
     * properties[Gree.PROPERTY.lights] = Gree.VALUE.lights.off;
     * properties[Gree.PROPERTY.blow] = Gree.VALUE.blow.off;
     * properties[Gree.PROPERTY.fanSpeed] = Gree.VALUE.fanSpeed.high;
     * properties[Gree.PROPERTY.temperature] = 25;
     * client.setProperties(properties);
     * @example
     * // use plain objects
     *
     * client.setProperties({
     *  lights: 'off',
     *  blow: 'off',
     *  fanSpeed: 'high',
     *  temperature: 25
     * });
     */
    setProperties(properties) {
        const vendorProperties = this._transformer.toVendor(properties);

        this._logger.info('Update request');
        return this._sendRequest({
            opt: Object.keys(vendorProperties),
            p: Object.values(vendorProperties),
            t: 'cmd',
        });
    }

    /**
     * Set device property
     *
     * @param {PROPERTY} property
     * @param {PROPERTY_VALUE} value
     * @returns {Promise}
     * @fires Client#success
     * @fires Client#error
     * @example
     * // use library constants
     *
     * client.setProperty(Gree.PROPERTY.swingHor, Gree.VALUE.swingHor.fixedLeft);
     * client.setProperty(Gree.PROPERTY.temperature, 25);
     * @example
     * // use plain values
     *
     * client.setProperty('swingHor', 'fixedLeft');
     * client.setProperty('temperature', 25);
     */
    async setProperty(property, value) {
        const properties = {};
        properties[property] = value;
        return this.setProperties(properties);
    }

    /**
     * Returns devices MAC-address
     *
     * @returns {string|null}
     */
    getDeviceId() {
        return this._cid;
    }

    /**
     * Override log level to `debug`
     *
     * @param enable {Boolean}
     * @deprecated Use the client `logLevel` option instead
     */
    setDebug(enable) {
        this._createLogger(enable ? 'debug' : this._options.logLevel);
    }

    /**
     * Create logger
     *
     * @param level {string}
     * @private
     */
    _createLogger(level) {
        this._logger = createLogger(level).child({
            service: 'client',
            sid: randomUUID(),
        });
        this._encryptionService = new EncryptionService(this._logger);
    }

    /**
     * Send binding request to device
     *
     * @param {number} attempt
     * @private
     */
    async _sendBindRequest(attempt) {
        this._logger.info('Binding start', { attempt });

        const encrypted = this._encryptionService.encrypt({
            mac: this._cid,
            t: 'bind',
            uid: 0,
        });

        await this._socketSend({
            cid: 'app',
            i: 1,
            t: 'pack',
            uid: 0,
            pack: encrypted.payload,
            tag: encrypted.tag,
        });
    }

    /**
     * Send a request to device thorough UPD socket
     *
     * @param request
     * @private
     */
    _socketSend(request) {
        return new Promise((resolve, reject) => {
            this._logger.debug('Socket send', { request });
            const toSend = Buffer.from(JSON.stringify(request));

            if (this._socket) {
                this._socket.send(
                    toSend,
                    0,
                    toSend.length,
                    this._options.port,
                    this._options.host,
                    error => {
                        if (!error) {
                            resolve();
                        } else {
                            reject(new ClientSocketSendError(error));
                        }
                    }
                );
            } else {
                reject(new ClientNotConnectedError());
            }
        });
    }

    /**
     * Send request to device
     *
     * @param {object} message
     * @param {string[]} message.opt
     * @param {number[]} message.p
     * @param {string} message.t
     * @private
     */
    async _sendRequest(message) {
        this._logger.debug('Send request', { request: message });

        const encrypted = this._encryptionService.encrypt(message);
        await this._socketSend({
            cid: 'app',
            i: 0,
            t: 'pack',
            uid: 0,
            pack: encrypted.payload,
            tag: encrypted.tag,
        });
    }

    /**
     * Send properties status request to device
     *
     * @private
     */
    async _requestStatus() {
        this._logger.info('Status request');

        await this._sendRequest({
            cols: this._transformer.arrayToVendor(Object.keys(PROPERTY)),
            mac: this._cid,
            t: 'status',
        });

        this._statusTimeoutRef = setTimeout(() => {
            this._logger.warn('Status request timeout', {
                timeout: this._options.pollingTimeout,
            });

            this._properties = {};
            this.emit('no_response', this);
        }, this._options.pollingTimeout);
    }

    /**
     * Handle UDP response from device
     *
     * @param {Buffer} buffer Serialized JSON string with message
     * @fires Client#error
     * @private
     */
    async _handleResponse(buffer) {
        const message = this._parse(buffer);

        this._logger.debug('Handle response', { request: message });

        // Extract encrypted package from message using device key (if available)
        const pack = this._unpack(message);

        // If package type is response to handshake
        if (pack.t === 'dev') {
            await this._handleHandshakeResponse(pack);
            return;
        }

        if (this._cid) {
            // If package type is binding confirmation
            if (pack.t === 'bindok') {
                this._handleBindingConfirmationResponse();
                return;
            }

            // If package type is device status
            if (pack.t === 'dat') {
                this._handleStatusResponse(pack);
                return;
            }

            // If package type is response, update device properties
            if (pack.t === 'res') {
                this._handleUpdateConfirmResponse(pack);
                return;
            }
        }

        throw new ClientUnknownMessageError({ message, pack });
    }

    /**
     * @param {Buffer} buffer Serialized JSON string with message
     * @returns {object}
     * @private
     */
    _parse(buffer) {
        const jsonBuffer = buffer + '';

        try {
            return JSON.parse(jsonBuffer);
        } catch (error) {
            throw new ClientMessageParseError(error, { jsonBuffer });
        }
    }

    /**
     * Extract encrypted package from message using device key (if available)
     *
     * @param {string} message
     * @returns {object}
     * @private
     */
    _unpack(message) {
        try {
            return this._encryptionService.decrypt(message);
        } catch (error) {
            throw new ClientMessageUnpackError(error, { message });
        }
    }

    /**
     * Handle device handshake response
     *
     * @param message
     * @param {number} timeout
     * @private
     */
    async _handleHandshakeResponse(message, timeout = 500) {
        this._cid = message.cid || message.mac;

        this._logger = this._logger.child({ cid: this._cid });
        this._logger.info('Scan success');

        await this._sendBindRequest(1);
        this._bindTimeoutRef = setTimeout(async () => {
            this._logger.warn('Binding attempt timed out', { timeout });
            await this._sendBindRequest(2);
        }, timeout);
    }

    /**
     * Handle device binding confirmation response
     *
     * @fires Client#connect
     * @private
     */
    async _handleBindingConfirmationResponse() {
        this._logger.info('Binding success (connected)', {
            host: this._options.host,
        });

        clearTimeout(this._socketTimeoutRef);
        clearTimeout(this._bindTimeoutRef);

        await this._requestStatus();
        if (this._options.poll) {
            this._logger.info('Schedule status polling');

            this._statusIntervalRef = setInterval(
                () =>
                    this._requestStatus().catch(error =>
                        this.emit('error', error)
                    ),
                this._options.pollingInterval
            );
        }

        this.emit('connect', this);
    }

    /**
     * Handle device properties status response
     *
     * @param pack
     * @fires Client#update
     * @private
     */
    _handleStatusResponse(pack) {
        this._logger.info('Status response');

        clearTimeout(this._statusTimeoutRef);

        const oldProperties = clone(this._properties);
        const newProperties = {};
        pack.cols.forEach((col, i) => {
            newProperties[col] = pack.dat[i];
            this._properties[col] = pack.dat[i];
        });

        const updatedProperties = diff(oldProperties, newProperties);

        if (Object.keys(updatedProperties).length > 0) {
            this.emit(
                'update',
                this._transformer.fromVendor(updatedProperties),
                this._transformer.fromVendor(this._properties),
                this
            );
        }
    }

    /**
     * Handle device properties update confirmation response
     *
     * @param pack
     * @fires Client#success
     * @private
     */
    _handleUpdateConfirmResponse(pack) {
        this._logger.info('Update response');

        const updatedProperties = {};
        pack.opt.forEach((opt, i) => {
            const value = 'val' in pack ? pack.val : pack.p;
            this._properties[opt] = updatedProperties[opt] = value[i];
        });

        this.emit(
            'success',
            this._transformer.fromVendor(updatedProperties),
            this._transformer.fromVendor(this._properties),
            this
        );
    }
}

module.exports = {
    Client,
    PROPERTY,
    VALUE: PROPERTY_VALUE,
};
