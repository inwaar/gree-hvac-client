const assert = require('assert');
const PropertyTransformer = require('../lib/property-transformer').Transformer;

describe('PropertyTransformer', function () {
    describe('#fromVendor()', function () {
        it('should transform from vendor to human friendly', function () {
            const SUT = new PropertyTransformer();
            const result = SUT.fromVendor({
                Mod: 1,
                SetTem: 25,
                TemSen: 67,
            });

            assert.deepEqual(result, {
                mode: 'cool',
                temperature: 25,
                currentTemperature: 27
            });
        });

        it('should not subtract 40 from vendor value in case of zero', function () {
            const SUT = new PropertyTransformer();
            const result = SUT.fromVendor({
                TemSen: 0
            });

            assert.deepEqual(result, {
                currentTemperature: 0
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
        it('should not allow to change read-only property', function () {
            const SUT = new PropertyTransformer();
            assert.throws(() => {
                SUT.toVendor({
                    currentTemperature: 30
                })
            }, {
                name: 'Error',
                message: 'Cannot set read-only property currentTemperature'
            });
        });
    });
});
