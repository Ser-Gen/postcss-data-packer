# postcss-data-packer

[`PostCSS`](https://github.com/postcss/postcss) plugin to move an embedded data into a separate file. It can also combine selectors of rules with the same data!

Embedded data can be used in value of these properties: `background`, `background-image`, `border-image`, `src` (`@font-face`), `content` (pseudoelements).

Regexp `/url\(["']?data/g` is using to detect a data in values.

Этот документ [по-русски](https://github.com/Ser-Gen/postcss-data-packer/blob/master/README_RU.md).


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


### Using

Plugin can be used just like any other `PostCSS` plugin. For example, [Gulp](https://github.com/gulpjs/gulp) setup (using [gulp-postcss](https://github.com/w0rm/gulp-postcss)):

```js
var $ = require('gulp');
var plugins = require('gulp-load-plugins');

var dataPacker = require('postcss-data-packer');

// remove all embedded data from main.css
$.task('processcss', function () {
    var processors = [
        dataPacker({
            dataFile: false
        })
    ];
    $.src('css/main.css')
        .pipe(plugins().postcss(processors))
        .pipe($.dest('css/'));
});

// remove everything except data
$.task('processcss--data', function () {
    var processors = [
        dataPacker({
            dataFile: true,
            pure: true
        })
    ];
    $.src('css/main.css')
        .pipe(plugins().postcss(processors))
        .pipe(plugins().rename('main_data.css')) // new file
        .pipe($.dest('css/'));
});

$.task('default', function () {
    $.watch('css/main.css', ['processcss', 'processcss--data']);
});
```

And [Grunt](https://github.com/gruntjs/grunt) setup (using [grunt-postcss](https://github.com/nDmitry/grunt-postcss)):

```js
module.exports = function(grunt) {
    'use strict';
    require('load-grunt-tasks')(grunt);

    var dataPaker = require('postcss-data-packer');

    grunt.initConfig({
        postcss: {
            data: {
                options: {
                    map: false,
                    processors: [
                        dataPaker()
                    ]
                },
                src: 'css/main.css',
                dest: 'css/main_data.css'
            },
            pure: {
                options: {
                    map: false,
                    processors: [
                        dataPaker({
                            dataFile: false
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

And then declare these files in the markup:

```html
<!-- Data is before main styles to simplify the redefinition of declarations -->
<link rel="stylesheet" href="main_data.css">
<link rel="stylesheet" href="main.css">
```
