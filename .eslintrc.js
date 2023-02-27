module.exports = {
    root: true,
    env: {
        node: true,
        es2021: true,
    },
    plugins: ['jsdoc', 'prettier'],
    overrides: [
        {
            files: '*.js',
            extends: ['plugin:jsdoc/recommended', 'prettier'],
            rules: {
                'prettier/prettier': 'error',
                'jsdoc/require-property-description': 'off',
                'jsdoc/require-param-type': 'off',
                'jsdoc/require-param-description': 'off',
                'jsdoc/require-param-description': 'off',
                'jsdoc/require-returns-description': 'off',
                'jsdoc/check-property-names': 'off',
                'jsdoc/sort-tags': 'error',
            },
        },
    ],
};
