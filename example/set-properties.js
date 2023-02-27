const Gree = require('gree-hvac-client');

const client = new Gree.Client({
    host: '192.168.7.60',
    debug: false,
});

client.on('connect', () => {
    client.setProperty(Gree.PROPERTY.lights, Gree.VALUE.lights.off);
});

client.on('success', updatedProperties => {
    console.log('properties updated:', updatedProperties);
    client.disconnect();
});

client.on('error', error => {
    console.error(error);
});
