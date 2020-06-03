const assert = require('assert');
const PropertyTransformer = require('../lib/property-transformer').Transformer;

describe('PropertyTransformer', function () {
    describe('#fromVendor()', function () {
        it('should transform from vendor to human friendly', function () {
            const SUT = new PropertyTransformer();
            const result = SUT.fromVendor({
                Mod: 1,
                SetTem: 25,
                TemSen: 27,
            });

            assert.deepEqual(result, {
                mode: 'cool',
                temperature: 25,
                currentTemperature: 27
            });
        });
    });
    describe('#toVendor()', function () {
        it('should transform from human friendly to vendor', function () {
            const SUT = new PropertyTransformer();
            const result = SUT.toVendor({
                mode: 'cool',
                temperature: 25
            });

            assert.deepEqual(result, {
                Mod: 1,
                SetTem: 25
            });
        });
    });
});
