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

const PROPERTY_VALUE_TRANSFORMERS = {
    currentTemperature: {
        fromVendor: function (value) {
            // Temperature from the AC should be transformed by subtract 40 to get real temperature
            // AC returns temperature+40. I believe it's because it has unsigned data type
            // When TemSen=0 it likely means the devices does not support the feature
            // @see https://github.com/ddenisyuk/homebridge-gree-heatercooler/blob/3979fc6dad9d1935c59c686eb1764a062246ee7c/index.js#L224-L226
            if (value !== 0) {
                value -= 40
            }

            return value;
        },
        toVendor: function (value) {
            throw new Error(`Cannot set read-only property currentTemperature`);
        },
    }
}

const NOOP_PROPERTY_VALUE_TRANSFORMER = {
    fromVendor: value => value,
    toVendor: value => value
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
            ret[reversedProperty] = this._valueFromVendor(reversedProperty, value);
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
            ret[this._properties[property]] = this._valueToVendor(property, value);
        }
        return ret;
    }

    arrayToVendor(properties) {
        return properties.map((property) => this._properties[property]);
    }

    _valueFromVendor(property, value) {
        const reversedValue = this._reversedValues[property][value] || value;
        return this._getValueTransformer(property).fromVendor(reversedValue);
    }

    _valueToVendor(property, value) {
        const values = this._values[property] || {};
        return this._getValueTransformer(property).toVendor(values[value] !== undefined ? values[value] : value);
    }

    _getValueTransformer(property) {
        return PROPERTY_VALUE_TRANSFORMERS[property] || NOOP_PROPERTY_VALUE_TRANSFORMER;
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
