'use strict';

const dgram = require('dgram');
const EventEmitter = require('events');
const diff = require('object-diff');
const clone = require('clone');

const { EncryptionService } = require('./encryption-service');
const { PROPERTY } = require('./property');
const { PROPERTY_VALUE } = require('./property-value');
const { CLIENT_OPTIONS } = require('./client-options');
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
         * Socket connection timeout reference
         *
         * @type {number|null}
         * @private
         */
        this._socketTimeoutRef = null;

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
         * @type {EncryptionService}
         * @private
         */
        this._encryptionService = new EncryptionService();

        /**
         * Client options
         *
         * @type {CLIENT_OPTIONS}
         * @private
         */
        this._options = { ...CLIENT_OPTIONS, ...options };

        /**
         * @private
         */
        this._trace = function () {
            if (!this._options.debug) {
                return;
            }

            console.debug(
                '>>> cid:' + this._cid + ': ' + new Date().toLocaleString()
            );
            console.debug.apply(null, arguments);
        };

        this._trace('OPTIONS', this._options);

        if (this._options.autoConnect) {
            process.nextTick(() => {
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
        return new Promise((resolve, reject) => {
            this.once('connect', resolve);
            this.once('disconnect', () => {
                process.nextTick(() => reject(new ClientCancelConnectError()));
            });

            this._socket = dgram.createSocket('udp4');
            this._socket.on('message', message => {
                this._handleResponse(message).catch(error =>
                    this.emit('error', error)
                );
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
            await this._socketSend({ t: 'scan' });
            await this._reconnect();
            this.emit('error', new ClientConnectTimeoutError());
        } catch (err) {
            this._reconnect();
            throw err;
        }
    }

    /**
     * Maintain auto-reconnect
     *
     * @private
     */
    _reconnect() {
        return new Promise(resolve => {
            this._socketTimeoutRef = setTimeout(() => {
                this._trace('SOCKET', 'Reconnecting...');
                this._initialize().catch(error => this.emit('error', error));
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
        this._dispose();

        return new Promise((resolve, reject) => {
            if (this._socket) {
                this._socket.close(() => {
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
     * Set debug level
     *
     * @param enable {Boolean}
     */
    setDebug(enable) {
        this._options.debug = !!enable;
    }

    /**
     * Send binding request to device
     *
     * @private
     */
    async _sendBindRequest() {
        await this._socketSend({
            cid: 'app',
            i: 1,
            t: 'pack',
            uid: 0,
            pack: this._encryptionService.encrypt({
                mac: this._cid,
                t: 'bind',
                uid: 0,
            }),
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
            this._trace('SOCKET.SEND', request);
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
        this._trace('OUT.MSG', message, this._encryptionService.getKey());
        await this._socketSend({
            cid: 'app',
            i: 0,
            t: 'pack',
            uid: 0,
            pack: this._encryptionService.encrypt(message),
        });
    }

    /**
     * Send properties status request to device
     *
     * @private
     */
    async _requestStatus() {
        await this._sendRequest({
            cols: this._transformer.arrayToVendor(Object.keys(PROPERTY)),
            mac: this._cid,
            t: 'status',
        });

        this._statusTimeoutRef = setTimeout(() => {
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

        this._trace('IN.MSG', message);

        // Extract encrypted package from message using device key (if available)
        const pack = this._unpack(message);

        // If package type is response to handshake
        if (pack.t === 'dev') {
            return await this._handleHandshakeResponse(pack);
        }

        if (this._cid) {
            // If package type is binding confirmation
            if (pack.t === 'bindok') {
                return this._handleBindingConfirmationResponse(pack);
            }

            // If package type is device status
            if (pack.t === 'dat') {
                return this._handleStatusResponse(pack);
            }

            // If package type is response, update device properties
            if (pack.t === 'res') {
                return this._handleUpdateConfirmResponse(pack);
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
            const pack = this._encryptionService.decrypt(message);
            this._trace('IN.MSG.UNPACK', pack);
            return pack;
        } catch (error) {
            throw new ClientMessageUnpackError(error, { message });
        }
    }

    /**
     * Handle device handshake response
     *
     * @param message
     * @private
     */
    async _handleHandshakeResponse(message) {
        this._cid = message.cid || message.mac;
        await this._sendBindRequest();
    }

    /**
     * Handle device binding confirmation response
     *
     * @param pack
     * @fires Client#connect
     * @private
     */
    async _handleBindingConfirmationResponse(pack) {
        this._trace('SOCKET', 'Connected to device', this._options.host);
        clearTimeout(this._socketTimeoutRef);

        this._encryptionService.setKey(pack.key);

        await this._requestStatus();
        if (this._options.poll) {
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
