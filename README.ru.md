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


#### `dest` (по умолчанию `false`)

Файл с данными можно генерировать напрямую из плагина. При этом основной файл будет очищен от данных.

Укажите в `dest.path` путь, куда хотите сохранить этот файл.

`dest.map` (по умолчанию `false`) служит для настройки генерации карты кода. Принимает параметры, описанные [в руководстве](https://github.com/postcss/postcss#source-map) `PostCSS`.

Если выбран отдельный файл карты кода, он сохранится по пути, указанному в `annotation`. Этот путь указывается относительно файла с данными.

В следующей ситуации будут созданы файлы `/css/main_data.css` и `/css/maps/main_data.css.map`.

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

Если карта кода не нужна, нужно лишь указать путь к создаваемому файлу.

```js
dataPacker({
	dest: 'css/main_data.css'
})
```


### Подключение

Обработчик используется так же, как любой другой для `PostCSS`. Например, так для сборки [Галпом](https://github.com/gulpjs/gulp) (используется [gulp-postcss](https://github.com/w0rm/gulp-postcss)):

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

А так можно настроить сборку [Грантом](https://github.com/gruntjs/grunt) (используется [grunt-postcss](https://github.com/nDmitry/grunt-postcss)):

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

(остальные способы использования [в документации](https://github.com/postcss/postcss#usage) `PostCSS`)

И затем подключаем эти файлы в разметке. Например, так:

```html
<!-- До основного файла, чтобы упростить переопределение -->
<link rel="stylesheet" href="main_data.css">
<link rel="stylesheet" href="main.css">
```
