# vue-themed-style-loader

A Webpack plugin to be used in conjunction with [vue-loader](https://github.com/vuejs/vue-loader/) to assist in generating themed builds of a [Vue.js](https://vuejs.org/) application.


## Usage

To use the `vue-themed-style-loader`, simply install the theme:

```
npm install --save-dev vue-themed-style-loader
```

And then add an entry to your webpack configuration file, after the `vue-loader`:

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

And then begin specifying themes in your Vue component styles:

```vue
// Base theme
<style>
.classname {
    color: black;
}
</style>

// Bold theme
<style theme="bold">
.heading {
    font-weight: bold;
}
</style>

// Underline theme
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

```
<style>
.heading { color: black; }

.theme-red .heading { color: red; }

.theme-blue .heading { color: blue }
</style>
```

This will certainly work, however, it doesn't scale very well as your application and number of themes grows.  The size of you stylesheet grows at least linearly with the number of themes, even though only one theme is likely being used at any given point in time.

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

And, now that the base styles aren't being included, we no longer need the parent theme class anymore, and can reduce our output themed stylesheets to simply:

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

// "red" theme
<style theme="blue">
.heading { color: blue; }
</style>
```

Now, add the loader to your webpack config.  It is important to note that because all webpack loaders are run from right-to-left (see (Pitching Loaders)[https://webpack.js.org/api/loaders/#pitching-loader]), the `vue-themed-style-loader` must be specified _after_ the `vue-loader`.  this ensures it will execute _before_ the `vue-loader` to discard inactive themed style sections.  

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

In this setup, with the `"red"` theme specified, the loader will only preserve unthemed and `theme="red"` `<style>` sections in your component, and will remove the `theme="blue"` section.

### Replacing

In cases where a given theme section wants to completely replace the base styles, the `replace` attribute can be specified on the `<style>` block:

```
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

This will result in the base styles also being stripped, and _only_ the `theme="red"` styles being included in the output.  If a single `replace` section is found for the active theme, then _all_ corresponding base styles will be stripped

### Scoped styles

The removal algorithm operates independently on normal and scoped style blocks.  So, it can be chosen to replace in one scenario and inherit in another.  For example:

```
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
