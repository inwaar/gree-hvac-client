'use strict';

/**
 * Device vendor properties value constants
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
 * @private
 */
const PROPERTY_VALUE = {
    power: {
        off: 0,
        on: 1,
    },
    mode: {
        auto: 0,
        cool: 1,
        dry: 2,
        fan_only: 3,
        heat: 4,
    },
    temperatureUnit: {
        celsius: 0,
        fahrenheit: 1,
    },
    temperature: {},
    currentTemperature: {},
    fanSpeed: {
        auto: 0,
        low: 1,
        mediumLow: 2,
        medium: 3,
        mediumHigh: 4,
        high: 5,
    },
    air: {
        off: 0,
        inside: 1,
        outside: 2,
        mode3: 3,
    },
    blow: {
        off: 0,
        on: 1,
    },
    health: {
        off: 0,
        on: 1,
    },
    sleep: {
        off: 0,
        on: 1,
    },
    lights: {
        off: 0,
        on: 1,
    },
    swingHor: {
        default: 0,
        full: 1,
        fixedLeft: 2,
        fixedMidLeft: 3,
        fixedMid: 4,
        fixedMidRight: 5,
        fixedRight: 6,
        fullAlt: 7,
    },
    swingVert: {
        default: 0,
        full: 1,
        fixedTop: 2,
        fixedMidTop: 3,
        fixedMid: 4,
        fixedMidBottom: 5,
        fixedBottom: 6,
        swingBottom: 7,
        swingMidBottom: 8,
        swingMid: 9,
        swingMidTop: 10,
        swingTop: 11,
    },
    quiet: {
        off: 0,
        mode1: 1,
        mode2: 2,
        mode3: 3,
    },
    turbo: {
        off: 0,
        on: 1,
    },
    powerSave: {
        off: 0,
        on: 1,
    },
    safetyHeating: {
        off: 0,
        on: 1,
    },
};

module.exports = {
    PROPERTY_VALUE,
};
