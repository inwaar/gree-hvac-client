'use strict';

/**
 * Device properties value constants
 *
 * @readonly
 * @property {string} power.on
 * @property {string} power.off
 * @property {string} mode.auto
 * @property {string} mode.dry
 * @property {string} mode.fan_only
 * @property {string} mode.heat
 * @property {string} temperatureUnit.celsius
 * @property {string} temperatureUnit.fahrenheit
 * @property {string} fanSpeed.auto
 * @property {string} fanSpeed.low
 * @property {string} fanSpeed.mediumLow - Not available on 3-speed units
 * @property {string} fanSpeed.medium
 * @property {string} fanSpeed.mediumHigh - Not available on 3-speed units
 * @property {string} fanSpeed.high
 * @property {string} air.off
 * @property {string} air.inside
 * @property {string} air.outside
 * @property {string} air.mode3
 * @property {string} blow.off
 * @property {string} blow.on
 * @property {string} health.off
 * @property {string} health.on
 * @property {string} sleep.off
 * @property {string} sleep.on
 * @property {string} lights.off
 * @property {string} lights.on
 * @property {string} swingHor.default
 * @property {string} swingHor.full - Swing in full range
 * @property {string} swingHor.fixedLeft - Fixed in leftmost position (1/5)
 * @property {string} swingHor.fixedMidLeft - Fixed in middle-left postion (2/5)
 * @property {string} swingHor.fixedMid - Fixed in middle position (3/5)
 * @property {string} swingHor.fixedMidRight - Fixed in middle-right postion (4/5)
 * @property {string} swingHor.fixedRight - Fixed in rightmost position (5/5)
 * @property {string} swingHor.fullAlt - Swing in full range (seems to be same as full)
 * @property {string} swingVert.default
 * @property {string} swingVert.full - Swing in full range
 * @property {string} swingVert.fixedTop - Fixed in the upmost position (1/5)
 * @property {string} swingVert.fixedMidTop - Fixed in the middle-up position (2/5)
 * @property {string} swingVert.fixedMid - Fixed in the middle position (3/5)
 * @property {string} swingVert.fixedMidBottom - Fixed in the middle-low position (4/5)
 * @property {string} swingVert.fixedBottom - Fixed in the lowest position (5/5)
 * @property {string} swingVert.swingBottom - Swing in the downmost region (5/5)
 * @property {string} swingVert.swingMidBottom - Swing in the middle-low region (4/5)
 * @property {string} swingVert.swingMid - Swing in the middle region (3/5)
 * @property {string} swingVert.swingMidTop - Swing in the middle-up region (2/5)
 * @property {string} swingVert.swingTop - Swing in the upmost region (1/5)
 * @property {string} quiet.off
 * @property {string} quiet.mode1
 * @property {string} quiet.mode2
 * @property {string} quiet.mode3
 * @property {string} turbo.off
 * @property {string} turbo.on
 * @property {string} powerSave.off
 * @property {string} powerSave.on
 * @property {string} safetyHeating.off
 * @property {string} safetyHeating.on
 */
const PROPERTY_VALUE = {
    power: {
        off: 'off',
        on: 'on',
    },
    mode: {
        auto: 'auto',
        cool: 'cool',
        dry: 'dry',
        fan_only: 'fan_only',
        heat: 'heat',
    },
    temperatureUnit: {
        celsius: 'celsius',
        fahrenheit: 'fahrenheit',
    },
    temperature: {},
    currentTemperature: {},
    fanSpeed: {
        auto: 'auto',
        low: 'low',
        mediumLow: 'mediumLow',
        medium: 'medium',
        mediumHigh: 'mediumHigh',
        high: 'high',
    },
    air: {
        off: 'off',
        inside: 'inside',
        outside: 'outside',
        mode3: 'mode3',
    },
    blow: {
        off: 'off',
        on: 'on',
    },
    health: {
        off: 'off',
        on: 'on',
    },
    sleep: {
        off: 'off',
        on: 'on',
    },
    lights: {
        off: 'off',
        on: 'on',
    },
    swingHor: {
        default: 'default',
        full: 'full',
        fixedLeft: 'fixedLeft',
        fixedMidLeft: 'fixedMidLeft',
        fixedMid: 'fixedMid',
        fixedMidRight: 'fixedMidRight',
        fixedRight: 'fixedRight',
        fullAlt: 'fullAlt',
    },
    swingVert: {
        default: 'default',
        full: 'full',
        fixedTop: 'fixedTop',
        fixedMidTop: 'fixedMidTop',
        fixedMid: 'fixedMid',
        fixedMidBottom: 'fixedMidBottom',
        fixedBottom: 'fixedBottom',
        swingBottom: 'swingBottom',
        swingMidBottom: 'swingMidBottom',
        swingMid: 'swingMid',
        swingMidTop: 'swingMidTop',
        swingTop: 'swingTop',
    },
    quiet: {
        off: 'off',
        mode1: 'mode1',
        mode2: 'mode2',
        mode3: 'mode3',
    },
    turbo: {
        off: 'off',
        on: 'on',
    },
    powerSave: {
        off: 'off',
        on: 'on',
    },
    safetyHeating: {
        off: 'off',
        on: 'on',
    },
};

module.exports = {
    PROPERTY_VALUE,
};
