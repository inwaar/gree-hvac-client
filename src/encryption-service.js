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
    
    /**
     * Required for GCM, return nothing here.
     */
    getTag() {
        return undefined;
    }
}

/**
 * Nonce and AAD values for GCM encryption
 */
const GCM_NONCE = Buffer.from('5440784449675a516c5e6313',"hex"); //'\x54\x40\x78\x44\x49\x67\x5a\x51\x6c\x5e\x63\x13';
const GCM_AEAD = Buffer.from('qualcomm-test');

class EncryptionServiceGCM {
    
    /**
     * @param {string} [key] AES key
     */
    constructor(key = '{yxAHAY_Lm6pbC/<') {
        /**
         * Device crypto-key
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
     * @param {object} input Response object
     * @param {string} input.pack Encrypted JSON string
     * @param {string} input.tag Auth Tag for GCM decryption
     */
    decrypt(input) {
        const decipher = crypto.createDecipheriv('aes-128-gcm', this._key, GCM_NONCE);
        decipher.setAAD(GCM_AEAD);
        if (input.tag) {
            const decTag = Buffer.from(input.tag, 'base64');
            decipher.setAuthTag(decTag);
        }
        const str = decipher.update(input.pack, 'base64', 'utf8');
        return JSON.parse(str + decipher.final('utf8'));
    }

    /**
     * Encrypt UDP message. Sets _encTag to be received before sending with getTag() and added to message.
     * @param {object} output Request object
     */
    encrypt(output) {
        const cipher = crypto.createCipheriv('aes-128-gcm', this._key, GCM_NONCE);
        cipher.setAAD(GCM_AEAD);
        const str = cipher.update(JSON.stringify(output), 'utf8', 'base64');
        const outstr = str + cipher.final('base64');
        this._encTag = cipher.getAuthTag().toString('base64').toString("utf-8");
        return outstr
    }
    
    /**
     * Receive and clear the last generated tag
     */
    getTag() {
        const tmpTag = this._encTag;
        this._encTag = undefined;
        return tmpTag;
    }
}

module.exports = {
    EncryptionService,
    EncryptionServiceGCM,
};
