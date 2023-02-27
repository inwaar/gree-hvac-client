const assert = require('assert');
const { EventEmitter } = require('stream');

const { Client } = require('../src/client');
const {
    ClientSocketSendError,
    ClientNotConnectedError,
    ClientConnectTimeoutError,
    ClientCancelConnectError,
} = require('../src/errors');

/**
 * Promisify EventEmitter error events
 *
 * @param {EventEmitter} emitter
 */
function onceError(emitter) {
    return new Promise((_, reject) => {
        emitter.once('error', reject);
    });
}

describe('Client', () => {
    describe('connect', () => {
        const INCORRECT_HOST = '127.0.0.1000';

        it('should reject when host is incorrect when autoConnect is disabled', async () => {
            const SUT = new Client({
                host: INCORRECT_HOST,
                autoConnect: false,
            });

            await assert.rejects(SUT.connect(), ClientSocketSendError);
            await SUT.disconnect();
        });

        it('should emit error when host is incorrect when autoConnect is enabled', async () => {
            const SUT = new Client({
                host: INCORRECT_HOST,
            });

            await assert.rejects(onceError(SUT), ClientSocketSendError);
            await SUT.disconnect();
        });

        it('should reconnect if not connected', async () => {
            const SUT = new Client({
                host: 'localhost',
                connectTimeout: 1,
            });

            await assert.rejects(onceError(SUT), ClientConnectTimeoutError);
            await assert.rejects(onceError(SUT), ClientConnectTimeoutError);
            await assert.rejects(onceError(SUT), ClientConnectTimeoutError);

            await SUT.disconnect();
            await assert.rejects(onceError(SUT), ClientCancelConnectError);
        });
    });

    describe('setProperty', () => {
        it('should reject setting a property on disconnected client', async () => {
            const SUT = new Client({
                autoConnect: false,
            });

            await assert.rejects(
                SUT.setProperty('property', 'value'),
                ClientNotConnectedError
            );
        });
    });

    describe('disconnect', () => {
        it('should reject disconnection on disconnected client', async () => {
            const SUT = new Client({
                autoConnect: false,
            });

            await assert.rejects(SUT.disconnect(), ClientNotConnectedError);
        });

        it('should stop connecting when disconnect is invoked', async () => {
            const SUT = new Client({
                autoConnect: false,
            });

            setTimeout(() => SUT.disconnect());
            await assert.rejects(SUT.connect(), ClientCancelConnectError);
        });
    });
});
