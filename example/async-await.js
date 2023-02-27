const Gree = require('gree-hvac-client');

const client = new Gree.Client({
    host: '192.168.7.60',
    autoConnect: false,
});

(async () => {
    try {
        await client.connect();
        await client.setProperty(Gree.PROPERTY.lights, Gree.VALUE.lights.on);
        console.log('Updated');
    } catch (error) {
        console.error(error);
    } finally {
        await client.disconnect();
    }
})();
