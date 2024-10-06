const { fixtures } = require('./fixtures');

const DEVICE_KEY = '---BINDED-KEY---';

const message = (fixture, cipher) => {
    const payload = fixtures.pack(fixture);
    const encrypted = cipher.encrypt(payload.pack);

    if (fixture === fixtures.bindOk) {
        cipher.setKey(DEVICE_KEY);
    }

    return {
        key: cipher.getKey(),
        cipher: cipher.constructor.name,
        source: payload,
        tag: encrypted.tag,
        payload: JSON.stringify({
            ...payload,
            pack: encrypted.payload,
            tag: encrypted.tag,
        }),
    };
};

const scan = cipher => message(fixtures.device, cipher);
const bind = cipher => message(fixtures.bindOk, cipher);
const status = cipher => message(fixtures.status, cipher);

module.exports = {
    scan,
    bind,
    status,
};
