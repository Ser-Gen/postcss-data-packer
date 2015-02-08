# postcss-data-packer

Обработчик для [`PostCSS`](https://github.com/postcss/postcss), позволяющий выделять закодированные данные в отдельный файл. Может объединять селекторы правил с одинаковыми закодированными данными.

Данные могут быть значениями свойств `background`, `background-image`, `border-image`, `src` (`@font-face`), `content` (псевдоэлементы).

Для определения данных используется выражение `/url\(["']?data/g`.


## Установка

```
npm install postcss-data-packer
```


## Использование

### Настройки

#### `dataFile` (по умолчанию `true`)

У обработчика есть два режима работы: в одном (`dataFile: false`) он удаляет все свойства с данными, в другом (`dataFile: true`) оставляет только их.


#### `pure` (по умолчанию `true`)

Обработчик может объединять селекторы правил с одинаковыми данными, чтобы минимизировать итоговый файл.

Селекторы правил, у которых одинаковы свойства и их значения, объединяются в первом встретившимся правиле:

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

Эта особенность может привести к проблемам:

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

у элемента `<div class="b c"></div>` применится стиль `.b`, так как специфичность у него больше, хоть он и объявлен раньше `.c` в основном файле.

Замечу, что сжатие при помощи `gzip` вполне может заменить эту возможность, дублирующиеся строки хорошо жмутся.


### Подключение

Обработчик используется так же, как любой другой для `PostCSS`. Например, так для сборки [Галпом](https://github.com/gulpjs/gulp) (используется [gulp-postcss](https://github.com/w0rm/gulp-postcss)):

```js
var $ = require('gulp');
var plugins = require('gulp-load-plugins');

var dataPacker = require('postcss-data-packer');

// удаляем все закодированные данные из основного файла
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

// оставляем только закодированные данные из основного файла и оставляем только уникальные данные
$.task('processcss--data', function () {
    var processors = [
        dataPacker({
            dataFile: true,
            pure: true
        })
    ];
    $.src('css/main.css')
        .pipe(plugins().postcss(processors))
        .pipe(plugins().rename('main_data.css')) // создаём новый файл
        .pipe($.dest('css/'));
});

$.task('default', function () {
    $.watch('css/main.css', ['processcss', 'processcss--data']);
});
```

А так можно настроить сборку [Грантом](https://github.com/gruntjs/grunt) (используется [grunt-postcss](https://github.com/nDmitry/grunt-postcss)):

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

И затем подключаем эти файлы в разметке:

```html
<!-- До основного файла, чтобы упростить переопределение -->
<link rel="stylesheet" href="main_data.css">
<link rel="stylesheet" href="main.css">
```
