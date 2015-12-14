var path = require('path');

var fsExtra = require('fs-extra');
var postcss = require('postcss');

var dataRegexp = /url\(["']?data/g;

module.exports = postcss.plugin('postcss-data-packer', plugin);

function plugin (opts) {
	opts = opts || {};

	var defs = {
		dataFile: true,
		pure: true,
		dest: false,
		map: false
	};

	opts = extend(defs, opts);

	return function (css, result) {

		opts.from = result.opts.from;
		opts.to = result.opts.to;

		if (opts.dest !== false) {
			generateDataFile(css, opts);
		}
		else if (opts.dataFile) {
			getData(css, opts);
		}
		else {
			removeData(css);
		};

	};
};


// оставляем только данные
function getData (css, opts) {
	var helper = {};

	// удаляем комментарии
	css.walkComments(function (comment) {
		comment.remove();
	});

	// удаляем свойства и правила без данных
	css.walkRules(function (rule, i) {
		rule.walkDecls(function (decl, j) {
			if (!decl.value.match(dataRegexp)) {
				decl.remove();
			};

			if (rule.nodes.length === 0) {
				rule.remove();
			};
		});
	});
	css.walkAtRules(function (atRule) {
		if (atRule.nodes && atRule.nodes.length === 0) {
			atRule.remove();
		};

		if (atRule.name === 'font-face') {
			atRule.walkDecls(function (decl, j) {
				if (decl.prop === 'src') {
					if (!decl.value.match(dataRegexp)) {
						atRule.remove();
					};
				};
			});
		};
	});

	if (opts.pure) {

		// очищаем итоговый файл от дубликатов данных
		css.walkRules(function (rule, i) {
			rule.walkDecls(function (decl, j) {

				var arr;

				if (!helper.hasOwnProperty(decl.prop)) {
					helper[decl.prop] = [];
				};

				// запоминаем массив положений нужного свойства
				arr = helper[decl.prop];

				// получили индекс правила с нужными данными
				// если он есть
				var index = findValue(arr, decl.value);

				if ((arr.length === 0) || (index < 0)) {

					// запоминаем уникальные данные
					arr.push({
						pos: i,
						val: purifyValue(decl.value)
					});
				}
				else if (index >= 0) {

					// собираем селекторы с одинаковыми данными
					css.nodes[index].selector += ','+ rule.selector;
					css.nodes[index].selector = cleanSelector(css.nodes[index].selector);

					decl.remove();
				};

				// сохраняем нужный массив положений свойства
				helper[decl.prop] = arr;

			});

			if (rule.nodes.length === 0) {
				rule.remove();
			};
		});

		// после слияния правил могут остаться пустые медиавыражения
		css.walkAtRules(function (atRule) {
			if (atRule.nodes && atRule.nodes.length === 0) {
				atRule.remove();
			};
		});
	};
};


// удаляем данные
function removeData (css) {
	css.walkRules(function (rule, i) {
		rule.walkDecls(function (decl, j) {
			if (decl.value.match(dataRegexp)) {
				decl.remove();
			};

			if (rule.nodes.length === 0) {
				rule.remove();
			};
		});
	});

	css.walkAtRules(function (atRule) {
		if (atRule.name === 'font-face') {
			atRule.walkDecls(function (decl, j) {
				if (decl.prop === 'src') {
					if (decl.value.match(dataRegexp)) {
						atRule.remove();
					};
				};
			});
		};
	});
};


// создаём файл с данными
// и удаляем данные из основного файла
function generateDataFile (css, opts) {
	var dataCSS = postcss.root();

	dataCSS.append(css);
	getData(dataCSS, opts);

	if (typeof opts.dest === 'string') {
		opts.dest = {
			path: opts.dest
		};
	};

	if (!opts.dest.map) {
		opts.dest.map = false;
	};

	var data = dataCSS.toResult({
		to: (typeof opts.dest.path === 'function') ? opts.dest.path(opts) : opts.dest.path,
		map: (typeof opts.dest.map === 'function') ? opts.dest.map(opts) : opts.dest.map
	});

	if (!data.css.length) return;

	fsExtra.outputFileSync(data.opts.to, data.css);

	if (data.map) {
		fsExtra.outputFileSync(getMapPath(data.opts), data.map.toString());
	};

	removeData(css);
};


// расширяем объект
function extend (target, source) {
	var a = Object.create(target);

	Object.keys(source).map(function (prop) {
		prop in a && (a[prop] = source[prop]);
	});
	return a;
};

// очищаем селектор
// для добавления только недостающего
function cleanSelector (o) {
	var a = o.replace(/\s*,\s*/g, ",").replace(/\n/g, "").split(',');

	a = a.filter( function( item, index, inputArray ) {
		return inputArray.indexOf(item) == index;
	});

	return a.join(',\n');
};

// ищем сохранённые значения
function findValue (arr, value) {
	value = purifyValue(value);

	for (var i = arr.length - 1; i >= 0; i--) {
		if (arr[i].val === value) {
			return arr[i].pos;
		};

		if (i === 0) {
			return -1;
		};
	};
};

// очищаем значение от кавычек
function purifyValue (value) {
	return value.replace(/\(["']/, '(').replace(/["']\)/, ')');
};

// генерируем пути к карте кода
function getMapPath (opts) {
	var result;

	if (opts.map.annotation) {
		result = path.dirname(opts.to) +'/'+ opts.map.annotation;
	}
	else {
		result = opts.to +'.map';
	};

	return path.normalize(result);
};
