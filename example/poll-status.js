const Gree = require('gree-hvac-client');

const client = new Gree.Client({
    host: '192.168.7.60',
    debug: false,
});

client.on('connect', client => {
    console.log('connected to', client.getDeviceId());
});
client.on('update', (updatedProperties, properties) => {
    console.log(updatedProperties, properties);
});
client.on('disconnect', () => {
    console.log('disconnect');
});
client.on('no_response', () => {
    console.log('no_response');
});
client.on('error', error => {
    console.error(error);
});
