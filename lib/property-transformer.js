'use strict';

const PROPERTY_VENDOR_VALUE = require('./property-vendor-value').PROPERTY_VALUE;
const PROPERTY_VENDOR_CODES = {
    power: 'Pow',
    mode: 'Mod',
    temperatureUnit: 'TemUn',
    temperature: 'SetTem',
    currentTemperature: 'TemSen',
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

const PROPERTY_OPTIONS = {
    currentTemperature: {
        readOnly: true,
        fromVendorTransformer: function (value) {
            // Temperature from the AC should be transformed by subtract 40 to get real temperature
            // AC returns temperature+40. I believe it's because it has unsigned data type
            // When TemSen=0 it means real temperature is -40 degrees
            // @see https://github.com/ddenisyuk/homebridge-gree-heatercooler/blob/3979fc6dad9d1935c59c686eb1764a062246ee7c/index.js#L224-L226
            return value - 40;
        },
    }
}

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
            const transformValue = PROPERTY_OPTIONS[reversedProperty]
                && PROPERTY_OPTIONS[reversedProperty].fromVendorTransformer || (v => v);
            const reversedValue = this._reversedValues[reversedProperty][value] || value;
            ret[reversedProperty] = transformValue(reversedValue);
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
            const propertyOptions = PROPERTY_OPTIONS[property] || {};
            if (propertyOptions.readOnly) {
                throw new Error(`Cannot set read-only property ${property}`)
            }
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
