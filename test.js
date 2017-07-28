const loader = require('./index');
const loaderUtils = require('loader-utils');

test('leaves template sections alone', () => {
    const input = `
<template>
<div>
    <p>Hello World!</p>
</div>
</template>
`;
    const expected = input.trim();
    const actual = loader(input).trim();
    expect(actual).toBe(expected);
});

test('leaves script sections alone', () => {
    const input = `
<script>
function foo() {
    console.log('foo');
}
export default foo;
</script>
`;
    const expected = input.trim();
    const actual = loader(input).trim();
    expect(actual).toBe(expected);
});

test('leaves combined template/script sections alone', () => {
    const input = `
<template>
<div>
    <p>Hello World!</p>
</div>
</template>

<script>
function foo() {
    console.log('foo');
}
export default foo;
</script>
`;
    const expected = input.trim();
    const actual = loader(input).trim();
    expect(actual).toBe(expected);
});

test('leaves base style sections alone', () => {
    const input = `
<style>
.classname {
    color: red;
}
</style>

<style scoped>
.classname {
    color: green;
}
</style>
`;
    const expected = input.trim();
    const actual = loader(input).trim();
    expect(actual).toBe(expected);
});

test('clears themed style section when no theme is specified', () => {
    const input = `
<style>
.classname {
    color: red;
}
</style>

<style theme="a">
.classname {
    color: orange;
}
</style>

<style scoped>
.classname {
    color: green;
}
</style>

<style scoped theme="a">
.classname {
    color: blue;
}
</style>
`;
    const expected = `
<style>
.classname {
    color: red;
}
</style>

<style>



</style>

<style scoped>
.classname {
    color: green;
}
</style>

<style scoped>



</style>
`.trim();
    const actual = loader(input).trim();
    expect(actual).toBe(expected);
});

test('maintains themed sections when theme is specified', () => {
    const input = `
<style>
.classname {
    color: red;
}
</style>

<style theme="a">
.classname {
    color: orange;
}
</style>

<style scoped>
.classname {
    color: green;
}
</style>

<style scoped theme="a">
.classname {
    color: blue;
}
</style>
`;
    const expected = `
<style>
.classname {
    color: red;
}
</style>

<style>
.classname {
    color: orange;
}
</style>

<style scoped>
.classname {
    color: green;
}
</style>

<style scoped>
.classname {
    color: blue;
}
</style>
`.trim();

    loaderUtils.getOptions.mockReturnValue({
        theme: 'a',
    });
    const actual = loader(input).trim();
    expect(actual).toBe(expected);
});

test('discards inactive themed sections when theme is specified', () => {
    const input = `
<style>
.classname {
    color: red;
}
</style>

<style theme="a">
.classname {
    color: orange;
}
</style>

<style theme="b">
.classname {
    color: yellow;
}
</style>

<style scoped>
.classname {
    color: green;
}
</style>

<style scoped theme="a">
.classname {
    color: blue;
}
</style>

<style scoped theme="b">
.classname {
    color: indigo;
}
</style>
`;
    const expected = `
<style>
.classname {
    color: red;
}
</style>

<style>
.classname {
    color: orange;
}
</style>

<style>



</style>

<style scoped>
.classname {
    color: green;
}
</style>

<style scoped>
.classname {
    color: blue;
}
</style>

<style scoped>



</style>
`.trim();

    loaderUtils.getOptions.mockReturnValue({
        theme: 'a',
    });
    const actual = loader(input).trim();
    expect(actual).toBe(expected);
});

test('replaces base styles when themes specify', () => {
    const input = `
<style>
.classname {
    color: red;
}
</style>

<style theme="a" replace>
.classname {
    color: orange;
}
</style>

<style scoped>
.classname {
    color: green;
}
</style>

<style scoped theme="a" replace>
.classname {
    color: blue;
}
</style>
`;
    const expected = `
<style>



</style>

<style>
.classname {
    color: orange;
}
</style>

<style scoped>



</style>

<style scoped>
.classname {
    color: blue;
}
</style>
`.trim();

    loaderUtils.getOptions.mockReturnValue({
        theme: 'a',
    });
    const actual = loader(input).trim();
    expect(actual).toBe(expected);
});

test('handles all-encompassing scenario', () => {
    const input = `
<style>
.classname {
    color: red;
}
</style>

<style theme="a">
.classname {
    color: orange;
}
</style>

<style theme="b" replace>
.classname {
    color: yellow;
}
</style>

<style scoped>
.classname {
    color: green;
}
</style>

<style scoped theme="a" replace>
.classname {
    color: blue;
}
</style>

<style scoped theme="b">
.classname {
    color: indigo;
}
</style>
`;
    const expected = `
<style>



</style>

<style>



</style>

<style>
.classname {
    color: yellow;
}
</style>

<style scoped>
.classname {
    color: green;
}
</style>

<style scoped>



</style>

<style scoped>
.classname {
    color: indigo;
}
</style>
`.trim();

    loaderUtils.getOptions.mockReturnValue({
        theme: 'b',
    });
    const actual = loader(input).trim();
    expect(actual).toBe(expected);
});
