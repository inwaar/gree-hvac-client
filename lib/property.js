'use strict';

/**
 * Device properties constants
 *
 * @readonly
 * @property {string} power - Power state of the device
 * @property {string} mode - Mode of operation
 * @property {string} temperatureUnit - Temperature unit (must be together with set temperature)
 * @property {string} temperature - Set temperature (must be together with temperature unit)
 * @property {string} currentTemperature - Get current temperature from the internal (?) sensor (This value can not be set, only received. HVAC must support this feature otherwise the value is 0)
 * @property {string} fanSpeed - Fan speed
 * @property {string} air - Fresh air valve
 * @property {string} blow - Keeps the fan running for a while after shutting down (also called "X-Fan", only usable in Dry and Cool mode)
 * @property {string} health - Controls Health ("Cold plasma") mode, only for devices equipped with "anion generator", which absorbs dust and kills bacteria
 * @property {string} sleep - Sleep mode, which gradually changes the temperature in Cool, Heat and Dry mode
 * @property {string} lights - Turns all indicators and the display on the unit on or off
 * @property {string} swingHor - Controls the swing mode of the horizontal air blades (not available on all units)
 * @property {string} swingVert - Controls the swing mode of the vertical air blades
 * @property {string} quiet - Controls the Quiet mode which slows down the fan to its most quiet speed. Not available in Dry and Fan mode
 * @property {string} turbo - Sets fan speed to the maximum. Fan speed cannot be changed while active and only available in Dry and Cool mode
 * @property {string} powerSave - Power saving mode
 */
const PROPERTY = {
    power: 'power',
    mode: 'mode',
    temperatureUnit: 'temperatureUnit',
    temperature: 'temperature',
    currentTemperature: 'currentTemperature',
    fanSpeed: 'fanSpeed',
    air: 'air',
    blow: 'blow',
    health: 'health',
    sleep: 'sleep',
    lights: 'lights',
    swingHor: 'swingHor',
    swingVert: 'swingVert',
    quiet: 'quiet',
    turbo: 'turbo',
    powerSave: 'powerSave',
    safetyHeating: 'safetyHeating',
};

module.exports = {
    PROPERTY,
};
