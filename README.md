# postcss-data-packer

[`PostCSS`](https://github.com/postcss/postcss) plugin to move an embedded data into a separate file. It can also combine selectors of rules with the same data!

Embedded data can be used in value of these properties: `background`, `background-image`, `border-image`, `src` (`@font-face`), `content` (pseudoelements).

Regexp `/url\(["']?data/g` is using to detect a data in values.


---

Этот документ [по-русски](https://github.com/Ser-Gen/postcss-data-packer/blob/master/README.ru.md).

---


## Installation

```
npm install postcss-data-packer
```


## How to use

### Options

#### `dataFile` (default: `true`)

Plugin can work in two modes: `dataFile: false` removes all embedded data from stylesheet, `dataFile: true` removes everything except data.


#### `pure` (default: `true`)

Plugin can combine selectors of rules with the same data to minimize output.

Selectors are combined in first rule with a corresponding pair property-value of declaration.

```css
.a { background-image: url(/*a.png*/); }
.b { background-image: url(/*a.png*/); }
.c { background-image: url(/*a.png*/); }
```
```css
.a,
.b,
.c { background-image: url(/*a.png*/); }
```

This feature could lead to problems:

```css
.a { background-image: url(/*a.png*/) }
.b { background-image: url(/*b.png*/) }
.c { background-image: url(/*a.png*/) }
```
```css
.a,
.c { background-image: url(/*a.png*/) }
.b { background-image: url(/*b.png*/) }
```

An element `<div class="b c"></div>` will use only styles of `.b` because specifity of `.c` is lower, although `.c` is declared later in main file.

Note that a reliable `gzip` can replace this function because duplicate rows can be easily compressed.


#### `dest` (default: `false`)

You can generate data file directly by plugin.

Define by `dest.path` path of saving data file.

`dest.map` (default: `false`) is for set up source map creation of data file. You can set it up like in `PostCSS` [manual](https://github.com/postcss/postcss#source-map).

If you do not want inline source map, you can set path for it by `annotation`. This path is relative to data file.

In next case you will get two files: `/css/main_data.css` and `/css/maps/main_data.css.map`.

```js
dataPacker({
	dest: {
		path: 'css/main_data.css',
		map: {
			inline: false,
			annotation: 'maps/main_data.css.map'
		}
	}
})
```

If you do not need source map, you can set path for saving just like this:

```js
dataPacker({
	dest: 'css/main_data.css'
})
```

You can use functions as values of `dest.path` and `dest.path.map.annotation`. This functions must return strings.
Example (from [#13](https://github.com/Ser-Gen/postcss-data-packer/pull/13)):

```js
dataPacker({
	dest: {
		path: function (opts) {
			return path.join('build/css', path.basename(opts.from, '.css') + '.data.css');
		}
	}
})
```


### Using

Plugin can be used just like any other `PostCSS` plugin. For example, [Gulp](https://github.com/gulpjs/gulp) setup (using [gulp-postcss](https://github.com/w0rm/gulp-postcss)):

```js
var gulp = require('gulp');
var rename = require('gulp-rename');

var postcss = require('gulp-postcss');

gulp.task('processcss', function () {
	var processors = [
		require('postcss-data-packer')({
			dest: 'css/main_data.css'
		})
	];
	gulp.src('css/main.css')
		.pipe(postcss(processors))
		.pipe(gulp.dest('css'));
});

gulp.task('default', function () {
	gulp.watch('css/main.css', ['processcss']);
});
```

And [Grunt](https://github.com/gruntjs/grunt) setup (using [grunt-postcss](https://github.com/nDmitry/grunt-postcss)):

```js
module.exports = function(grunt) {
	require('load-grunt-tasks')(grunt);

	grunt.initConfig({
		postcss: {
			files: {
				options: {
					map: false,
					processors: [
						require('postcss-data-packer')({
							dest: 'css/main_data.css'
						})
					]
				},
				src: 'css/main.css'
			}
		}
	});

	return grunt.registerTask('default', ['postcss']);
};
```

(see other usage options [in docs](https://github.com/postcss/postcss#usage) of `PostCSS`)

And then declare these files in the markup:

```html
<!-- Data is before main styles to simplify the redefinition of declarations -->
<link rel="stylesheet" href="main_data.css">
<link rel="stylesheet" href="main.css">
```
