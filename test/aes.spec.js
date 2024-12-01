const dgram = require('dgram');

const { Client } = require('../src/client');

const device = require('./support/device');
const {
    EncryptionService,
    EcbCipher,
    GcmCipher,
} = require('../src/encryption-service');

jest.mock('dgram');
jest.useFakeTimers();

describe('AES encryption', () => {
    let SUT;
    let ecb;
    let gcm;
    let feedClient;
    let clientEncrypt;
    let clientSocketSend;
    let done, connected;

    beforeEach(async () => {
        ecb = new EcbCipher();
        gcm = new GcmCipher();

        dgram.createSocket.mockReturnValue({
            bind: jest.fn(cb => cb()),
            setBroadcast: jest.fn(),
            on: (event, cb) => (feedClient = cb),
            send: (buff, start, length, port, host, cb) => cb(),
            close: cb => cb(),
        });

        SUT = new Client({
            autoConnect: false,
        });

        done = new Promise(resolve => SUT.once('update', resolve));
        SUT.once('error', console.error);

        clientSocketSend = jest.spyOn(SUT, '_socketSend');
        clientEncrypt = jest.spyOn(EncryptionService.prototype, 'encrypt');

        connected = SUT.connect();
    });

    afterEach(async () => {
        await connected;
        await done;
        await SUT.disconnect();
        jest.restoreAllMocks();
    });

    it('should get device status with ECB', async () => {
        // 1) client sends SCAN
        expect(clientSocketSend.mock.calls[0][0]).toMatchInlineSnapshot(`
                {
                  "t": "scan",
                }
            `);

        // 2) device send DEV to the client as a response to SCAN
        const message2 = device.scan(ecb);
        expect(message2).toMatchInlineSnapshot(`
                {
                  "cipher": "EcbCipher",
                  "key": "a3K8Bx%2r8Y7#xDh",
                  "payload": "{"t":"pack","i":0,"uid":0,"cid":"-CLIENT-ID-","tcid":"","pack":"LP24Ek0OaYogxs3iQLjL4GwpxwJULijnBHAZXZV9hr4AWT6MVTINHBKb52nmO2dIraMvU1lTEk6wfLHnMx7KWOtrGvS4JDfI3aJErejLGI1sKccCVC4o5wRwGV2VfYa+T+QdseyMn6rJqBDjrcCixkpqEMpcnu8xdjXvztU4yLwrD9Cbt47kA8HasyxJXbwOiieHPzc0Sc1my/xyXLHlUhVmSXbN2eMe8SoPC4s/dUamSgKomGMxz2kBOzbBnntE7S3m+bE+PAVAiTLUp1aVUg=="}",
                  "source": {
                    "cid": "-CLIENT-ID-",
                    "i": 0,
                    "pack": {
                      "bc": "gree",
                      "brand": "gree",
                      "catalog": "gree",
                      "cid": "-CLIENT-ID-",
                      "lock": 0,
                      "mac": "-CLIENT-ID-",
                      "mid": "10002",
                      "model": "gree",
                      "name": "2g8201b5",
                      "series": "gree",
                      "t": "dev",
                      "vender": "1",
                      "ver": "V1.1.13",
                    },
                    "t": "pack",
                    "tcid": "",
                    "uid": 0,
                  },
                  "tag": undefined,
                }
            `);
        feedClient(message2.payload);

        // 3) client sends BIND request, attempt 1 ECB
        expect(clientEncrypt.mock.calls[0][0]).toMatchInlineSnapshot(`
                {
                  "mac": "-CLIENT-ID-",
                  "t": "bind",
                  "uid": 0,
                }
            `);
        expect(clientEncrypt.mock.results[0].value).toMatchInlineSnapshot(`
                {
                  "cipher": "ecb",
                  "key": "a3K8Bx%2r8Y7#xDh",
                  "payload": "ddMD+/erG3STAZvk6iV1oJxrMo6m/1rGE7RiuotePqdcAeWW/XDtzpfgvpySqWVy",
                }
            `);

        await jest.advanceTimersByTimeAsync(100);

        // 5) device sends BINDOK in response to BIND
        const message5 = device.bind(ecb);
        expect(message5).toMatchInlineSnapshot(`
                {
                  "cipher": "EcbCipher",
                  "key": "---BINDED-KEY---",
                  "payload": "{"t":"pack","i":0,"uid":0,"cid":"-CLIENT-ID-","tcid":"","pack":"T2tGu9JTsZPLMhoPO/mBcqoSWBS63O9Gvp3U/IoUVhtQHOIPj97ISq4ABzS4fL7NmZ+VPPlQDQvy7hlZk+LTLoWC2xoMv7mooDYoeYl4Qnw="}",
                  "source": {
                    "cid": "-CLIENT-ID-",
                    "i": 0,
                    "pack": {
                      "key": "---BINDED-KEY---",
                      "mac": "-CLIENT-ID-",
                      "r": 200,
                      "t": "bindok",
                    },
                    "t": "pack",
                    "tcid": "",
                    "uid": 0,
                  },
                  "tag": undefined,
                }
            `);
        feedClient(message5.payload);

        // 6) client sends STATUS request
        expect(clientEncrypt.mock.calls[1][0]).toMatchInlineSnapshot(`
                {
                  "cols": [
                    "Pow",
                    "Mod",
                    "TemUn",
                    "SetTem",
                    "TemSen",
                    "WdSpd",
                    "Air",
                    "Blo",
                    "Health",
                    "SwhSlp",
                    "Lig",
                    "SwingLfRig",
                    "SwUpDn",
                    "Quiet",
                    "Tur",
                    "SvSt",
                    "StHt",
                  ],
                  "mac": "-CLIENT-ID-",
                  "t": "status",
                }
            `);
        expect(clientEncrypt.mock.results[1].value).toMatchInlineSnapshot(`
                {
                  "cipher": "ecb",
                  "key": "---BINDED-KEY---",
                  "payload": "JavRSk7J1K823T9pA0lgKsE3GJbwrQLUMKiobwiFTEGxzx6Y67+U8TXRsLNtxKnfdJdeOnLymrBy3bWEGzPogUfVWHGFkj5prdUB5TC3LHVHubu1ILbqdLI9ecbR3+vb+YSBeoh8+G/wkxD8pnt5yoS1GRJuZLZzEGPFhEamq31cc9SS1oL3J5y4dQMniwH0vtm4P+QXaBmM/DBUs0CoGofZxbbqTmV20hhhqVVic/I=",
                }
            `);

        // 7) device sends DAT in response to STATUS
        const message7 = device.status(ecb);
        expect(message7).toMatchInlineSnapshot(`
                {
                  "cipher": "EcbCipher",
                  "key": "---BINDED-KEY---",
                  "payload": "{"t":"pack","i":0,"uid":0,"cid":"-CLIENT-ID-","tcid":"","pack":"9/E19K3H5vyKLfsAsx0188oFr++Fxk1jrN8GJW8xMteRHX2MvYUrzB/PcZE1KzdgRX/I5jjvWOWlvAAarErFh8sN20illnIwlV4mt2lTZEml41UElq1N8TciM603+MNJvuMH3/9JYXURFN/BqoO28Z/KVOdf3CjMjwlPWBtkUmuilbRjliUc2HVcmk6Pidog6baW13wD0bszO4/QmRdOwDHpU1x9tI5mMi+UFZ44flaFMXwZZnRoxJ5MBTBQkKNRxt9e43Z2BmXNjx5UJylr50Et1bu5e5A4R9oevrUL3ts="}",
                  "source": {
                    "cid": "-CLIENT-ID-",
                    "i": 0,
                    "pack": {
                      "cols": [
                        "Pow",
                        "Mod",
                        "TemUn",
                        "SetTem",
                        "TemSen",
                        "WdSpd",
                        "Air",
                        "Blo",
                        "Health",
                        "SwhSlp",
                        "Lig",
                        "SwingLfRig",
                        "SwUpDn",
                        "Quiet",
                        "Tur",
                        "SvSt",
                        "StHt",
                      ],
                      "dat": [
                        0,
                        1,
                        0,
                        25,
                        0,
                        0,
                        0,
                        1,
                        1,
                        0,
                        1,
                        2,
                        2,
                        0,
                        0,
                        0,
                        0,
                      ],
                      "mac": "-CLIENT-ID-",
                      "r": 200,
                      "t": "dat",
                    },
                    "t": "pack",
                    "tcid": "",
                    "uid": 0,
                  },
                  "tag": undefined,
                }
            `);

        feedClient(message7.payload);
    });

    it('should get device status with GCM', async () => {
        // 1) client sends SCAN
        expect(clientSocketSend.mock.calls[0][0]).toMatchInlineSnapshot(`
                {
                  "t": "scan",
                }
            `);

        // 2) device send DEV to the client as a response to SCAN
        const message2 = device.scan(ecb);
        expect(message2).toMatchInlineSnapshot(`
                {
                  "cipher": "EcbCipher",
                  "key": "a3K8Bx%2r8Y7#xDh",
                  "payload": "{"t":"pack","i":0,"uid":0,"cid":"-CLIENT-ID-","tcid":"","pack":"LP24Ek0OaYogxs3iQLjL4GwpxwJULijnBHAZXZV9hr4AWT6MVTINHBKb52nmO2dIraMvU1lTEk6wfLHnMx7KWOtrGvS4JDfI3aJErejLGI1sKccCVC4o5wRwGV2VfYa+T+QdseyMn6rJqBDjrcCixkpqEMpcnu8xdjXvztU4yLwrD9Cbt47kA8HasyxJXbwOiieHPzc0Sc1my/xyXLHlUhVmSXbN2eMe8SoPC4s/dUamSgKomGMxz2kBOzbBnntE7S3m+bE+PAVAiTLUp1aVUg=="}",
                  "source": {
                    "cid": "-CLIENT-ID-",
                    "i": 0,
                    "pack": {
                      "bc": "gree",
                      "brand": "gree",
                      "catalog": "gree",
                      "cid": "-CLIENT-ID-",
                      "lock": 0,
                      "mac": "-CLIENT-ID-",
                      "mid": "10002",
                      "model": "gree",
                      "name": "2g8201b5",
                      "series": "gree",
                      "t": "dev",
                      "vender": "1",
                      "ver": "V1.1.13",
                    },
                    "t": "pack",
                    "tcid": "",
                    "uid": 0,
                  },
                  "tag": undefined,
                }
            `);
        feedClient(message2.payload);

        // 3) client sends BIND request, attempt 1 ECB
        expect(clientEncrypt.mock.calls[0][0]).toMatchInlineSnapshot(`
                {
                  "mac": "-CLIENT-ID-",
                  "t": "bind",
                  "uid": 0,
                }
            `);
        expect(clientEncrypt.mock.results[0].value).toMatchInlineSnapshot(`
                {
                  "cipher": "ecb",
                  "key": "a3K8Bx%2r8Y7#xDh",
                  "payload": "ddMD+/erG3STAZvk6iV1oJxrMo6m/1rGE7RiuotePqdcAeWW/XDtzpfgvpySqWVy",
                }
            `);

        await jest.advanceTimersByTimeAsync(500);

        // 4) client sends BIND request, attempt 2 GCM
        expect(clientEncrypt.mock.calls[1][0]).toMatchInlineSnapshot(`
                {
                  "mac": "-CLIENT-ID-",
                  "t": "bind",
                  "uid": 0,
                }
            `);
        expect(clientEncrypt.mock.results[1].value).toMatchInlineSnapshot(`
                {
                  "cipher": "gcm",
                  "key": "{yxAHAY_Lm6pbC/<",
                  "payload": "JtoT1XUt89L+xbD+HwchGuYFpcEOwFPkOkY2VLSPhOTTY2QLz1tuNw==",
                  "tag": "nLD1n6lnA33dk/0u9V2siQ==",
                }
            `);

        // 5) device sends BINDOK in response to BIND
        const message5 = device.bind(gcm);
        expect(message5).toMatchInlineSnapshot(`
                {
                  "cipher": "GcmCipher",
                  "key": "---BINDED-KEY---",
                  "payload": "{"t":"pack","i":0,"uid":0,"cid":"-CLIENT-ID-","tcid":"","pack":"JtoKliwtq5m94pPceGVXWs4iqtkAz2SKSSEaafei4uXTOi8EiBh8cMq4+qHmI6v6ptu9eePWIftb4JbIMuzOhLHP0A==","tag":"CWtsfNdNIuHTyB/Snl1bSw=="}",
                  "source": {
                    "cid": "-CLIENT-ID-",
                    "i": 0,
                    "pack": {
                      "key": "---BINDED-KEY---",
                      "mac": "-CLIENT-ID-",
                      "r": 200,
                      "t": "bindok",
                    },
                    "t": "pack",
                    "tcid": "",
                    "uid": 0,
                  },
                  "tag": "CWtsfNdNIuHTyB/Snl1bSw==",
                }
            `);

        feedClient(message5.payload);

        // 6) client sends STATUS request
        expect(clientEncrypt.mock.calls[2][0]).toMatchInlineSnapshot(`
                {
                  "cols": [
                    "Pow",
                    "Mod",
                    "TemUn",
                    "SetTem",
                    "TemSen",
                    "WdSpd",
                    "Air",
                    "Blo",
                    "Health",
                    "SwhSlp",
                    "Lig",
                    "SwingLfRig",
                    "SwUpDn",
                    "Quiet",
                    "Tur",
                    "SvSt",
                    "StHt",
                  ],
                  "mac": "-CLIENT-ID-",
                  "t": "status",
                }
            `);
        expect(clientEncrypt.mock.results[2].value).toMatchInlineSnapshot(`
                {
                  "cipher": "gcm",
                  "key": "---BINDED-KEY---",
                  "payload": "UDrTdyaO9ZW39UVjLgF3uLeCNJWMC5lr4yJ01vL2QQqmxi0B9v9Y0pQ67Oe53rsi1014mp9NyLjjTK/Jz8yOaRMZQCQqe2AihWDzOLyl3OHk9S6wve7u6ahTlvr+Ot8z5T9ClNM0YO5LX9My/cVIoRqKh8bpKj0wp6EeaHNnzAnp9S6XY1PgOTkYmicP+fqX+3ceiv+U9VqSrFcSoyobQpVgOlF30Ujg8hkg9xJFyA==",
                  "tag": "kU+8zsV1q/tqV9mXlamlJg==",
                }
            `);

        // 7) device sends DAT in response to STATUS
        const message7 = device.status(gcm);
        expect(message7).toMatchInlineSnapshot(`
                {
                  "cipher": "GcmCipher",
                  "key": "---BINDED-KEY---",
                  "payload": "{"t":"pack","i":0,"uid":0,"cid":"-CLIENT-ID-","tcid":"","pack":"UDrEOnDfs86Y9TkuNEI4uMDPffTsYIhA2lpTsPP2Pk2gsHJe5ONWpJI40/H1xswi0EZcyNdNqfXGB/HJt4uhUBIZQCQxe3UalGXzOLyizuTk/DCwve715JwB3vqBb/c08FEI5Pg/LeBFLuwC7O1S6xSE9OD3Jxp++6FmP00shwmWoS6UKBGlJisCh2Jw+fqp7UFM9LObmjSKnHAj+kFzTeM5agd5yTnl1Qx2rkM0wemYZsR6m+N0Rbsxa5QsHgd+WdEkZOizY73S/5SIWH0xkfNY1rBkJjnMYU6L9CalJA==","tag":"A5sgsk9Npgk9aUQ8fMmH2A=="}",
                  "source": {
                    "cid": "-CLIENT-ID-",
                    "i": 0,
                    "pack": {
                      "cols": [
                        "Pow",
                        "Mod",
                        "TemUn",
                        "SetTem",
                        "TemSen",
                        "WdSpd",
                        "Air",
                        "Blo",
                        "Health",
                        "SwhSlp",
                        "Lig",
                        "SwingLfRig",
                        "SwUpDn",
                        "Quiet",
                        "Tur",
                        "SvSt",
                        "StHt",
                      ],
                      "dat": [
                        0,
                        1,
                        0,
                        25,
                        0,
                        0,
                        0,
                        1,
                        1,
                        0,
                        1,
                        2,
                        2,
                        0,
                        0,
                        0,
                        0,
                      ],
                      "mac": "-CLIENT-ID-",
                      "r": 200,
                      "t": "dat",
                    },
                    "t": "pack",
                    "tcid": "",
                    "uid": 0,
                  },
                  "tag": "A5sgsk9Npgk9aUQ8fMmH2A==",
                }
            `);

        feedClient(message7.payload);
    });
});
