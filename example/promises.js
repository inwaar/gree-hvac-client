const Gree = require('gree-hvac-client');

const client = new Gree.Client({
    host: '192.168.7.60',
    autoConnect: false,
});

client
    .connect()
    .then(() => client.setProperty(Gree.PROPERTY.lights, Gree.VALUE.lights.on))
    .then(() => console.log('Updated'))
    .finally(() => client.disconnect())
    .catch(error => console.error(error));
