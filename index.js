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

// Determine if a given <style> section should be replaced, based on looking
// at all other sections.  Rules for replacement:
//  - Sections will only ever be replaced by sibling sections that are of the
//    same "scoped" value (i.e., non-scoped or scoped)
//  - All themed sections will be replaced if they are not the current theme
//  - A themed section with a boolean `replace` attribute will replace _all_
//    non-themed sections for the same scoped value
//  - A themed section that passes a value to the `replace` attribute will
//    only replace non-themed sections with `id="..."` where the value matches
//    the value of the `replace` attribute
function shouldReplaceCurrentSection(style, styles, options) {
    const { attrs } = style;
    const sectionScoped = _.get(attrs, 'scoped') === true;
    const sectionTheme = _.get(attrs, 'theme');
    const isThemed = sectionTheme != null && sectionTheme.length > 0;
    const sectionId = _.get(attrs, 'id');

    // Replace all non-active themed sections
    if (isThemed) {
        return sectionTheme !== options.theme;
    }

    // This is a base section, see if we find a themed section to replace us
    const replacementStyle = styles
        // Only look at subsequent active themes
        .filter(s => _.get(s.attrs, 'theme') === options.theme)
        // Of the same scope
        .filter(s => ((_.get(s.attrs, 'scoped') === true) === sectionScoped))
        .find(s => (
            // When we find a boolean replace attribute, we always replace
            _.get(s.attrs, 'replace') === true ||
            // Or we replace if we find a themed section that specified to
            // replace our specific id
            (sectionId != null && _.get(s.attrs, 'replace') === sectionId)
        ));

    return replacementStyle != null;
}

// Given a style section from vue-template-compiler, generate the resulting
// output style section, stripping inactive theme style blocks
function genStyleSection(style, styles, options) {
    if (shouldReplaceCurrentSection(style, styles, options)) {
        replaceWithSpacer(style);
    }

    // Remove the 'id', theme' and 'replace' attributes from the output set of
    // attributes since they're not really valid SFC <style> attributes
    _.set(style, 'attrs', _.omit(style.attrs, 'id', 'theme', 'replace'));

    return genSection('style', style);
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
    const styles = parts.styles
                        .map(s => genStyleSection(s, parts.styles, options))
                        .join('\n');

    let output = '';

    // Maintain any custom blocks at the top of the file
    // This has an assumption now that they are all above <template>
    if (_.isArray(parts.customBlocks)) {
        output += parts.customBlocks.reduce((acc, b) =>
            `${acc}<${b.type}>${b.content}</${b.type}>\n\n`, '');
    }

    // Reconstruct the Vue Single File Component
    output += `${template}\n${script}\n${styles}`;

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
