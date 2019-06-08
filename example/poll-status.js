const Gree = require('gree-hvac-client');

const client = new Gree.Client({
    host: '192.168.7.60',
    debug: false,
});

client.on('connect', (client) => {
    console.log('connected to', client.getDeviceId());
});
client.on('update', (updatedProperties, properties) => {
    console.log(updatedProperties, properties);
});
