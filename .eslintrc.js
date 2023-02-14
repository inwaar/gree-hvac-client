module.exports = {
    root: true,
    env: {
        node: true,
        es2021: true,
    },
    plugins: ['prettier'],
    overrides: [
        {
            files: '*.js',
            extends: ['prettier'],
            rules: {
                'prettier/prettier': 'error',
            },
        },
    ]
};
