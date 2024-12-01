const DEVICE_KEY = '---BINDED-KEY---';

const device = {
    t: 'dev',
    cid: '-CLIENT-ID-',
    bc: 'gree',
    brand: 'gree',
    catalog: 'gree',
    mac: '-CLIENT-ID-',
    mid: '10002',
    model: 'gree',
    name: '2g8201b5',
    series: 'gree',
    vender: '1',
    ver: 'V1.1.13',
    lock: 0,
};

const bindOk = {
    t: 'bindok',
    mac: '-CLIENT-ID-',
    key: DEVICE_KEY,
    r: 200,
};

const status = {
    t: 'dat',
    mac: '-CLIENT-ID-',
    r: 200,
    cols: [
        'Pow',
        'Mod',
        'TemUn',
        'SetTem',
        'TemSen',
        'WdSpd',
        'Air',
        'Blo',
        'Health',
        'SwhSlp',
        'Lig',
        'SwingLfRig',
        'SwUpDn',
        'Quiet',
        'Tur',
        'SvSt',
        'StHt',
    ],
    dat: [0, 1, 0, 25, 0, 0, 0, 1, 1, 0, 1, 2, 2, 0, 0, 0, 0],
};

const pack = function (pack, i = 0) {
    return {
        t: 'pack',
        i,
        uid: 0,
        cid: '-CLIENT-ID-',
        tcid: '',
        pack,
    };
};

module.exports = {
    fixtures: {
        device,
        bindOk,
        status,
        pack,
    },
};
