# vue-themed-style-loader

A Webpack plugin to be used in conjunction with [vue-loader] to assist in generating themed builds of a [Vue.js] application.

* [Getting Started](#getting-started) 
* [Use case](#use-case)
* [Example](#example)
* [Contributing](#contributing)
* [Versioning](#versioning)
* [License](#license)
* [Acknowledgements](#acknowledgments)


## Getting Started

### Prerequisites

* [Node] v6.9.1 or greater
* [Vue.js] v2.2.6 or greater
* [Webpack] 2.3.3 or greater

### Usage

To use the `vue-themed-style-loader`, install the theme:

```
npm install --save-dev vue-themed-style-loader
```

Add an entry to your webpack configuration file, after the `vue-loader`:

```js
    ...
    module: {
        rules: [{
            test: /\.vue$/,
            loader: 'vue-loader',
            options: { ... },
        }, {
            test: /\.vue$/,
            loader: 'vue-themed-style-loader',
            options: {
                theme: 'your-theme-name',
            },
        }]
    },
    ...
```

And begin specifying themes in your Vue component styles:

```vue
<style>
.classname {
    color: black;
}
</style>

<style theme="bold">
.heading {
    font-weight: bold;
}
</style>

<style theme="underline">
.heading {
    text-decoration: underline;
}
</style>
```


## Use Case

Consider this simple Vue Single File Component that renders and styles a dynamic `<h1>` tag:

```vue
<template>
    <h1 class="heading">{{title}}</h1>
</template>

<script>
export default {
    name: 'heading-h1',
    props: [ 'title' ],
};
</script>

<style>
.heading { color: black; }
</style>
```

### Themed display

Considering applying different styling "themes" which will alter the color of the heading, which may normally be done via a parent CSS class:

```vue
<style>
.heading { color: black; }

.theme-red .heading { color: red; }

.theme-blue .heading { color: blue }
</style>
```

This will certainly work, however, it doesn't scale very well as your application and number of themes grows.  The size of you stylesheet grows with the number of themes, even though only one theme is likely being used at any given point in time.  the more complex the themes, the faster the stylesheet size will grow per theme.

Instead, it would be ideal for our resulting stylesheet to only include the styles relevant to our current theme:

```css
/* styles.css */
.heading {  color: black; }

/* styles-red.css */
.heading {  color: black; }
.theme-red .heading { color: red; }

/* styles-blue.css */
.heading { color: black; }
.theme-blue .heading { color: blue; }
```

Or, even better, in the cases where a theme completely overrides a base style, it would be ideal to remove the base style altogether:

```css
/* styles.css */
.heading {  color: black; }

/* styles-red.css */
.theme-red .heading { color: red; }

/* styles-blue.css */
.theme-blue .heading { color: blue; }
```

And, if the base styles aren't being included, we don't need the parent theme class anymore, and could ideally reduce our output themed stylesheets to simply:

```css
/* styles.css */
.heading { color: black; }

/* styles-red.css */
.heading { color: red; }

/* styles-blue.css */
.heading { color: blue; }
```

This is exactly what `vue-themed-style-loader` set's out to do :)


## Example

Let's alter the `<style>` sections of our component to use the `vue-themed-style-loader` to generate the proper themed output:

```vue
// Base, unthemed styles
<style>
.heading { color: black; }
</style>

// "red" theme
<style theme="red">
.heading { color: red; }
</style>

// "blue" theme
<style theme="blue">
.heading { color: blue; }
</style>
```

Now, add the loader to your webpack config.  It is important to note that because all webpack loaders are run from right-to-left (see [Pitching Loaders][pitching-loaders], the `vue-themed-style-loader` must be specified _after_ the `vue-loader`.  this ensures it will execute _before_ the `vue-loader` to discard inactive themed style sections.  

Here's an example `webpack.config.js`:

```js
    ...
    module: {
        rules: [{
            test: /\.vue$/,
            loader: 'vue-loader',
            options: { ... },
        }, {
            test: /\.vue$/,
            loader: 'vue-themed-style-loader',
            options: {
                theme: 'red',
            },
        }]
    },
    ...
```

In this setup, with the `"red"` theme specified, the loader will only preserve `<style>` and `<style theme="red">` sections in your component, and will remove the `<style theme="blue">` section.

### Replacing

#### Global replacement

In cases where a given theme section wants to completely replace the base styles, the `replace` attribute can be specified without a value on the `<style>` block:

```vue
<style>
.heading { color: black; }
</style>

<style theme="red" replace>
.heading { color: red; }
</style>

<style theme="blue">
.heading { color: blue; }
</style>
```

This will result in all the base styles being stripped, and _only_ the `<style theme="red">` section being included in the output.  If a single `replace` section is found for the active theme, then _all_ corresponding base styles will be stripped.

#### Targeted Replacing

In some cases, it may be beneficial to inherit _some_ base styles and replace others.  This can be done via targeted replacement.  IF you identify base style secton with an `id` attribute, you can then specify a specific ID to replace in the `replace` attribute.  For example:

```vue
<style>
.heading { font-weight:bold; }
</style>

<style id="colors">
.heading { color: black; }
</style>

<style theme="red" replace="colors">
.heading { color: red; }
</style>

<style theme="blue" replace="colors">
.heading { color: blue; }
</style>
```

In this instance, our themed style only specified `replace="colors"`, so the base style block with id="colors"` will be replaced, but the base style block without an id will still be inherited.

### Scoped styles

The removal algorithm operates independently on normal versus scoped style blocks.  A non-scoped block will only ever be replaced by a themed, non-scoped block.  And a scoped block will only ever be replaced by a themed, scoped block.  In this manner, they can be chosen to replace in one scenario and inherit in another.  For example:

```vue
<style>
.heading { color: black; }
</style>

<style scoped>
.heading { font-weight: bold; }
</style>

<style theme="red" replace>
.heading { color: red; }
</style>

<style scoped theme="red">
.heading { text-decoration: underline; }
</style>
```

In this scenario, the scoped base style would be maintained because no scoped sections for the active theme specified the `replace` attribute.

```css
.heading { font-weight: bold; }
.heading { color: red; }
.heading { text-decoration: underline; }
```


## Contributing

Contributions and Pull Requests are welcome!  Or if you find something wrong, please file an issue, and provide a detailed description of the problem.


## Versioning

This repository uses [SemVer] for versioning. For the versions available, see the [releases on this repository][releases]. 


## License

This project is licensed under the MIT License - see the [LICENSE] file for details


## Acknowledgments

* This would not be possible without [Webpack] and [Vue.js].  
  * Notably, the [vue-template-compiler] module
* This work was inspired by some of the interesting work we're doing over at [URBN]


[Node]: https://nodejs.org/en/
[LICENSE]: LICENSE 
[pitching-loaders]: https://webpack.js.org/api/loaders/#pitching-loader
[releases]: https://github.com/brophdawg11/vue-themed-style-loader/releases
[SemVer]: http://semver.org/
[Vue.js]: https://vuejs.org/
[vue-loader]: https://github.com/vuejs/vue-loader/
[vue-template-compiler]: https://www.npmjs.com/package/vue-template-compiler
[Webpack]: https://webpack.js.org/
[URBN]: https://github.com/urbn
