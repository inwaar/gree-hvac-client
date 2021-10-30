'use strict';

const dgram = require('dgram');
const EncryptionService = require('./encryption-service').EncryptionService;
const PROPERTY = require('./property').PROPERTY;
const PROPERTY_VALUE = require('./property-value').PROPERTY_VALUE;
const CLIENT_OPTIONS = require('./client-options').CLIENT_OPTIONS;
const EventEmitter = require('events');
const PropertyTransformer = require('./property-transformer');
const diff = require('object-diff');
const clone = require('clone');

/**
 * Control GREE HVAC device by getting and setting its properties
 */
class Client extends EventEmitter {
    /**
     * Creates a new client, connect to device and start polling by default.
     * @param {CLIENT_OPTIONS | {}} options
     *
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
         * @type {string|null}
         * @private
         */
        this._cid = null;

        /**
         * @type {null}
         * @private
         */
        this._socket = null;

        /**
         * Socket connection timeout reference
         * @type {number|null}
         * @private
         */
        this._socketTimeoutRef = null;

        /**
         * Status polling interval reference
         * @type {number|null}
         * @private
         */
        this._statusIntervalRef = null;

        /**
         * Status polling timeout reference
         * @type {number|null}
         * @private
         */
        this._statusTimeoutRef = null;

        /**
         * Device properties, are updated by polling the devices
         * @type {Object.<string, string|number>}
         * @private
         */
        this._properties = {};
        /**
         * @type {PropertyTransformer}
         * @private
         */
        this._transformer = new PropertyTransformer.Transformer();

        /**
         * @type {EncryptionService}
         * @private
         */
        this._encryptionService = new EncryptionService();

        /**
         * Client options
         * @type {CLIENT_OPTIONS}
         * @private
         */
        this._options = { ...CLIENT_OPTIONS, ...options };

        /**
         * @private
         */
        this._trace = this._options.debug ? function() {
            console.debug('>>> cid:' + this._cid + ': ' + (new Date).toLocaleString());
            console.debug.apply(null, arguments);
        } : () => {
        };

        this._trace('OPTIONS', this._options);

        if (this._options.autoConnect) {
            this.connect();
        }
    }

    /**
     * Connect to a HVAC device and start polling status changes by default
     */
    connect() {
        this._socket = dgram.createSocket('udp4');
        this._socket.on('message', message => this._handleResponse(message));

        this._socket.bind(() => {
            this._socket.setBroadcast(true);
            this._socketSend({t: 'scan'});

            this._socketTimeoutRef = setTimeout(() => {
                this._trace('SOCKET', 'Unable to connect. Retrying...');
                this.disconnect();
                this.connect();
            }, this._options.connectTimeout);
        });
    }

    /**
     * Disconnect from a HVAC device and stop status polling
     */
    disconnect() {
        if (this._statusIntervalRef) {
            clearInterval(this._statusIntervalRef);
        }
        if (this._socketTimeoutRef) {
            clearTimeout(this._socketTimeoutRef);
        }
        if (this._statusTimeoutRef) {
            clearTimeout(this._statusTimeoutRef);
        }
        this._socket.close();
        this.emit('disconnect');
    }

    /**
     * Set a list of device properties at once by one request
     * @param properties {Object.<PROPERTY, PROPERTY_VALUE>}
     * @example
     * // use library constants
     *
     * const properties = {};
     * properties[Gree.PROPERTY.lights] = Gree.VALUE.lights.off;
     * properties[Gree.PROPERTY.blow] = Gree.VALUE.blow.off;
     * properties[Gree.PROPERTY.fanSpeed] = Gree.VALUE.fanSpeed.high;
     * properties[Gree.PROPERTY.temperature] = 25;
     * client.setProperties(properties);
     *
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
        this._sendRequest({
            opt: Object.keys(vendorProperties),
            p: Object.values(vendorProperties),
            t: 'cmd'
        });
    }

    /**
     * Set device property
     * @param property {PROPERTY}
     * @param value {PROPERTY_VALUE}
     * @example
     * // use library constants
     *
     * client.setProperty(Gree.PROPERTY.swingHor, Gree.VALUE.swingHor.fixedLeft);
     * client.setProperty(Gree.PROPERTY.temperature, 25);
     *
     * @example
     * // use plain values
     *
     * client.setProperty('swingHor', 'fixedLeft');
     * client.setProperty('temperature', 25);
     */
    setProperty(property, value) {
        let properties = {};
        properties[property] = value;
        this.setProperties(properties);
    }

    /**
     * Returns devices MAC-address
     * @returns {string|null}
     */
    getDeviceId() {
        return this._cid;
    }

    /**
     * Send binding request to device
     * @private
     */
    _sendBindRequest() {
        this._socketSend({
            cid: 'app',
            i: 1,
            t: 'pack',
            uid: 0,
            pack: this._encryptionService.encrypt({
                mac: this._cid,
                t: 'bind',
                uid: 0
            })
        });
    }

    /**
     * Send a request to device thorough UPD socket
     * @param request
     * @private
     */
    _socketSend(request) {
        this._trace('SOCKET.SEND', request);
        const toSend = Buffer.from(JSON.stringify(request));
        this._socket.send(toSend, 0, toSend.length, this._options.port, this._options.host);
    }

    /**
     * Send request to device
     * @param {object} message
     * @param {string[]} message.opt
     * @param {number[]} message.p
     * @param {string} message.t
     * @private
     */
    _sendRequest(message) {
        this._trace('OUT.MSG', message, this._encryptionService.getKey());
        this._socketSend({
            cid: 'app',
            i: 0,
            t: 'pack',
            uid: 0,
            pack: this._encryptionService.encrypt(message)
        });
    };

    /**
     * Send properties status request to device
     * @private
     */
    _requestStatus() {
        this._sendRequest({
            cols: this._transformer.arrayToVendor(Object.keys(PROPERTY)),
            mac: this._cid,
            t: 'status'
        });

        this._statusTimeoutRef = setTimeout(() => {
            this._properties = {};
            this.emit('no_response', this);
        }, this._options.pollingTimeout);
    }

    /**
     * Handle UDP response from device
     * @param {Buffer} buffer Serialized JSON string with message
     * @private
     */
    _handleResponse(buffer) {
        const jsonBuffer =  buffer + '';

        let message;
        try {
            message = JSON.parse(jsonBuffer);
        } catch (e) {
            this._trace('IN.MSG.BUFFER', jsonBuffer);
            console.error('IN.MSG: Can not parse device JSON response:', {exception: e, jsonBuffer});
            return;
        }

        this._trace('IN.MSG', message);

        // Extract encrypted package from message using device key (if available)
        const pack = this._encryptionService.decrypt(message);
        this._trace('IN.MSG.UNPACK', pack);

        // If package type is response to handshake
        if (pack.t === 'dev') {
            return this._handleHandshakeResponse(pack);
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

        this._trace('IN.MSG', 'Unknown message', pack.t, message, pack)
    }

    /**
     * Handle device handshake response
     * @param message
     * @private
     */
    _handleHandshakeResponse(message) {
        this._cid = message.cid || message.mac;
        this._sendBindRequest();
    }

    /**
     * Handle device binding confirmation response
     * @param pack
     * @private
     */
    _handleBindingConfirmationResponse(pack) {
        this._trace('SOCKET', 'Connected to device', this._options.host);
        clearTimeout(this._socketTimeoutRef);

        this._encryptionService.setKey(pack.key);

        this._requestStatus();
        if (this._options.poll) {
            this._statusIntervalRef = setInterval(() => this._requestStatus(), this._options.pollingInterval);
        }

        this.emit('connect', this);
    }

    /**
     * Handle device properties status response
     * @param pack
     * @private
     */
    _handleStatusResponse(pack) {
        clearTimeout(this._statusTimeoutRef);

        let oldProperties = clone(this._properties);
        let newProperties = {};
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
     * @param pack
     * @private
     */
    _handleUpdateConfirmResponse(pack) {
        let updatedProperties = {};
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
