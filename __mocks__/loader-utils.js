const loaderUtils = jest.genMockFromModule('loader-utils');

loaderUtils.getOptions = jest.fn(() => ({
    theme: null,
    debug: false,
}));

module.exports = loaderUtils;
