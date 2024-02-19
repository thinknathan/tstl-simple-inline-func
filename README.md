# tstl-simple-inline-func

[![CI](https://github.com/thinknathan/tstl-simple-inline-func/actions/workflows/ci.yml/badge.svg)](https://github.com/thinknathan/tstl-simple-inline-func/actions/workflows/ci.yml)

TypeScriptToLua plugin that performs [inline expansion](https://en.wikipedia.org/wiki/Inline_expansion) to functions that you annotate.

This plugin is intended to handle functions that do NOT take parameters. If you need to handle parameters, try [TSTL-extensions by @Cheatoid](https://github.com/Cheatoid/TSTL-extensions) instead.

Inline expansion may or may not provide any performance benefit depending on your Lua runtime. Always measure with real world code.

:exclamation: Use this and any code transformation plugin with caution. Mistakes are possible.

## Usage

Add a comment containing `@inlineStart` before the function you want to inline, and `@inlineEnd` directly afterwards.

Example:

```ts
/** @inlineStart */
const FOO = () => {
	const BAR = 1 + 2 + 3;
};
/** @inlineEnd */

FOO();
```

Becomes:

```lua
-- @inlineStart@inlineEnd
local BAR = 1 + 2 + 3
```

### Subsequent comments

Keep in mind, TSTL may choose to strip comments. If you have multiple inline functions next to each other, you may have to combine comments.

This example may NOT work because the first `@inlineEnd` may get stripped:

```ts
/** @inlineStart */
const FOO = () => {
	...
};
/** @inlineEnd */
/** @inlineStart */
const BAR = () => {
	...
};
/** @inlineEnd */
```

This example may work because we've combined the middle comments:

```ts
/** @inlineStart */
const FOO = () => {
	...
};
/** @inlineEnd @inlineStart */
const BAR = () => {
	...
};
/** @inlineEnd */
```

### Removing return

To strip the `return` keyword from your function, add a comment with `@removeReturn` somewhere after `@inlineStart`.

Example:

```ts
/** @inlineStart @removeReturn */
const FOO = () => {
	return 7;
};
/** @inlineEnd */

const BAR = FOO();
```

Becomes:

```lua
-- @inlineStart@inlineEnd
local BAR =  7
```

## Installation

Requires TSTL >= 1.22.0

1. Install this plugin

```bash
yarn add tstl-simple-inline-func -D
# or
npm install tstl-simple-inline-func --save-dev
```

2. Add `tstl-simple-inline-func` to `tstl.luaPlugins` in `tsconfig.json`

```diff
{
	"tstl": {
		"luaPlugins": [
+			{ "name": "tstl-simple-inline-func" }
		],
	}
}
```

## License

CC0
