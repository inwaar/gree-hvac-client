'use strict';

const crypto = require('crypto');

/**
 * @private
 */
class EncryptionService {
    /**
     * @param {string} [key] AES key
     */
    constructor(key = 'a3K8Bx%2r8Y7#xDh') {
        /**
         * Device crypto-key
         *
         * @type {string}
         * @private
         */
        this._key = key;
    }

    /**
     * @param {string} key
     */
    setKey(key) {
        this._key = key;
    }

    /**
     * @returns {string}
     */
    getKey() {
        return this._key;
    }

    /**
     * Decrypt UDP message
     *
     * @param {object} input Response object
     * @param {string} input.pack Encrypted JSON string
     * @returns {object}
     */
    decrypt(input) {
        const decipher = crypto.createDecipheriv('aes-128-ecb', this._key, '');
        const str = decipher.update(input.pack, 'base64', 'utf8');
        return JSON.parse(str + decipher.final('utf8'));
    }

    /**
     * Encrypt UDP message
     *
     * @param {object} output Request object
     * @returns {string}
     */
    encrypt(output) {
        const cipher = crypto.createCipheriv('aes-128-ecb', this._key, '');
        const str = cipher.update(JSON.stringify(output), 'utf8', 'base64');
        return str + cipher.final('base64');
    }
}

module.exports = {
    EncryptionService,
};
