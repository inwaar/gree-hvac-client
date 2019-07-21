'use strict';

const PROPERTY_VENDOR_VALUE = require('./property-vendor-value').PROPERTY_VALUE;
const PROPERTY_VENDOR_CODES = {
    power: 'Pow',
    mode: 'Mod',
    temperatureUnit: 'TemUn',
    temperature: 'SetTem',
    fanSpeed: 'WdSpd',
    air: 'Air',
    blow: 'Blo',
    health: 'Health',
    sleep: 'SwhSlp',
    lights: 'Lig',
    swingHor: 'SwingLfRig',
    swingVert: 'SwUpDn',
    quiet: 'Quiet',
    turbo: 'Tur',
    powerSave: 'SvSt',
};

/**
 * Transforms device properties from vendor names to human friendly names and back
 * @private
 */
class PropertyTransformer {
    constructor() {
        this._properties = PROPERTY_VENDOR_CODES;
        this._values = PROPERTY_VENDOR_VALUE;
        this._reversedProperties = this._reverseProperties();
        this._reversedValues = this._reverseValues();
    }

    /**
     * Transforms device properties from vendor names to human friendly names
     * @param properties Object.<string,string|number>
     * @returns {Object.<string,string|number>}
     * @example
     * const properties = transformer.fromVendor({
     *     Mod: 1,
     *     SetTem: 25
     * });
     *
     * console.log(properties);
     *
     * // {
     * //    mode: 'cool',
     * //    temperature: 25
     * // }
     */
    fromVendor(properties) {
        let ret = {};
        for (let [property, value] of Object.entries(properties)) {
            const reversedProperty = this._reversedProperties[property];
            ret[reversedProperty] = this._reversedValues[reversedProperty][value] || value;
        }
        return ret;
    }

    /**
     * Transforms device properties from human friendly names to vendor names
     * @param properties Object.<string,string|number>
     * @returns {Object.<string,string|number>}
     */
    toVendor(properties) {
        let ret = {};
        for (let [property, value] of Object.entries(properties)) {
            const vendorProperty = this._properties[property];
            const values = this._values[property] || {};
            ret[vendorProperty] = values[value] !== undefined ? values[value] : value;
        }
        return ret;
    }

    arrayToVendor(properties) {
        return properties.map((property) => this._properties[property]);
    }

    _reverseProperties() {
        let reversed = {};
        for (let [k, v] of Object.entries(this._properties)) {
            reversed[v] = k;
        }
        return reversed;
    }

    _reverseValues() {
        let reversed = {};
        for (let [k, v] of Object.entries(this._values)) {
            reversed[k] = {};
            for (let [valueKey, valueValue] of Object.entries(v)) {
                reversed[k][valueValue] = valueKey;
            }
        }
        return reversed;
    }
}

module.exports = {
    Transformer: PropertyTransformer
};
