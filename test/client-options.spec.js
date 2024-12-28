const { createOptions } = require('../src/client-options');

describe('Client options', () => {
    it('should coalesce in order of client options, env and default options', () => {
        process.env.GREE_HVAC_HOST = '10.0.0.1';
        process.env.GREE_HVAC_PORT = '1234';

        expect(
            createOptions({
                host: '1.2.3.4',
            })
        ).toMatchInlineSnapshot(`
            {
              "autoConnect": true,
              "connectTimeout": 3000,
              "debug": false,
              "host": "1.2.3.4",
              "logLevel": "error",
              "poll": true,
              "pollingInterval": 3000,
              "pollingTimeout": 1000,
              "port": "1234",
            }
        `);
    });
});
