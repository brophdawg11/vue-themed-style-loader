const path = require('path');
const compiler = require('vue-template-compiler');
const loaderUtils = require('loader-utils');
const _ = require('lodash');

// Given a key-value object of attributes, compose the attribute potion of the
// Vue Single File Component tag
//
// Example:
//     genAttrs({ foo: 'bar', baz: 'qux' })
//
//     => ' foo="bar" baz="qux"'
function genAttrs(attrs) {
    return _.reduce(attrs, (acc, v, k) => {
        let attr = ` ${k}`;
        if (v !== true) {
            attr += `="${v}"`;
        }
        return acc + attr;
    }, '');
}

// Given a tag and a vue-template-compiler section, re-generate the Single File
// Component structure
//
// Example:
//     genSection('template', {
//         attrs: {
//             foo: 'bar'
//         },
//         content: '<h1>Hello World!</h1>'
//     })
//
//     => '<template foo="bar"><h1>Hello World</h1></template>'
function genSection(tag, section) {
    if (!section) {
        return '';
    }
    const attrs = genAttrs(section.attrs);
    const content = section.content || '';
    return `<${tag}${attrs}>${content}</${tag}>\n`;
}

// Replace the contents for a given style block with blank lines so that
// line numbers remain the same as the input file
//
// Example:
//     replaceWithSpacer({
//         content: '.class-name {\n  color: red;\n  font-weight: bold;\n}\n'
//     })
//
//     => {
//         content: '\n\n\n\n'
//     }
function replaceWithSpacer(style) {
    const lines = style.content.split('\n').length;
    const spacer = new Array(lines).join('\n');
    _.set(style, 'content', spacer);
}

// Given a style section from vue-template-compiler, generate the resulting
// output style section, stripping inactive theme style blocks
function genStyleSection(style, replacements, options) {
    const blockTheme = _.get(style.attrs, 'theme');
    if (blockTheme) {

        if (blockTheme !== options.theme) {
            // This style block specifies an inactive theme, replace the block
            // with blank lines, so that line numbers remain the same as the
            // input file
            replaceWithSpacer(style);
        }

    } else if ((replacements.global && !style.scoped) ||
               (replacements.scoped && style.scoped)) {
        // This is an unbranded style theme and we've found an active theme
        // 'replace' block elsewhere, so clear out these base styles
        replaceWithSpacer(style);
    }

    // Remove the 'theme' and 'replace' attributes from the output set of
    // attributes since they're not really a Vue-supported attribute
    _.set(style, 'attrs', _.omit(style.attrs, 'theme', 'replace'));

    return genSection('style', style);
}

// Utility function to determine if this component contains theme replacement
// styles for global or scoped style sections.  If so, we'll use those to clear
// out the corresponding base styles we encounter
function getReplacements(styles, options) {
    // Is this block for the current active theme
    const isActiveTheme = s => _.get(s.attrs, 'theme') === options.theme;
    // Does the style block contain the replace attribute
    const hasReplace = s => _.get(s.attrs, 'replace');
    return {
        global: styles.filter(s => !s.scoped && isActiveTheme(s))
                      .find(s => hasReplace(s)) != null,
        scoped: styles.filter(s => s.scoped && isActiveTheme(s))
                      .find(s => hasReplace(s)) != null,
    };
}

function vueThemedStyleLoader(source) {
    // Grab options passed in via webpack config
    const options = _.defaults(loaderUtils.getOptions(this) || {}, {
        theme: null,
        debug: false,
    });

    // Parse the Vue Single File Component
    const parts = compiler.parseComponent(source);

    // Generate the singular <template>/<script> sections
    const template = genSection('template', parts.template);
    const script = genSection('script', parts.script);

    // Loop over style sections, eliminating inactive brands
    const replacements = getReplacements(parts.styles, options);
    const styles = parts.styles
                        .map(s => genStyleSection(s, replacements, options))
                        .join('\n');

    // Reconstruct the Vue Single File Component
    const output = `${template}\n${script}\n${styles}`;

    if (options.debug) {
        const filePath = this.resourcePath;
        const fileName = path.basename(filePath);
        console.log(`---------- Begin ${fileName} ----------`);
        console.log(output);
        console.log(`---------- End ${fileName} ----------`);
    }

    return output;
}

module.exports = vueThemedStyleLoader;
