// http://eslint.org/docs/user-guide/configuring

module.exports = {
    root: true,
    parserOptions: {
        sourceType: 'module'
    },
    env: {
        browser: true,
        jasmine: true,
    },
    extends: 'airbnb-base',
    // required to lint *.vue files
    plugins: [
        'jest',
    ],
    globals: {
        jest: true,
        test: true,
    },
    // add your custom rules here
    rules: {
        // 4 space indent
        'indent': [ 'error', 4 ],
        // Don't enforce a blank line or not at the beginning of a block
        'padded-blocks': 0,
        // Don't enforce one-var for now
        'one-var': 0,
        // Require spaces in array brackets, unless it's an array of objects
        'array-bracket-spacing': [ 'error', 'always', { 'objectsInArrays': false } ],
        // Allow unary + and -- operators
        'no-plusplus': 0,
        // don't require .vue extension when importing
        'import/extensions': ['error', 'always', {
            'js': 'never',
            'vue': 'never'
        }],
        // allow optionalDependencies
        'import/no-extraneous-dependencies': ['error', {
            'optionalDependencies': ['test/unit/index.js']
        }],
        'no-console': 0,
    },
};
