module.exports = function (opts) {
  return function (css) {

    opts = opts || {};

    var defs = {
      dataFile: true,
      pure: true
    };
    var dataRegexp = /url\(["']?data/g;

    opts = extend(defs, opts);

    if (opts.dataFile) {
      getData();
    } else {
      removeData();
    };

    // записываем данные
    function getData () {

      var helper = {};

      // удаляем комментарии
      css.eachComment(function (comment) {
        comment.removeSelf();
      });

      // удаляем свойства и правила без данных
      css.eachRule(function (rule, i) {
        rule.eachDecl(function (decl, j) {
          if (!decl.value.match(dataRegexp)) {
            decl.removeSelf();
          };
          if (rule.nodes.length === 0) {
            rule.removeSelf();
          };
        });
      });
      css.eachAtRule(function (atRule) {
        if (atRule.nodes && atRule.nodes.length === 0) {
          atRule.removeSelf();
        };
      });

      if (opts.pure) {

        // очищаем итоговый файл от дубликатов данных
        css.eachRule(function (rule, i) {
          rule.eachDecl(function (decl, j) {

            var arr;

            if (!helper.hasOwnProperty(decl.prop)) {
              helper[decl.prop] = [];
            };

            // запоминаем массив положений нужного свойства
            arr = helper[decl.prop];

            // получили индекс правила с нужным фоном
            // если он есть
            var index = findValue(arr, decl.value);

            if ((arr.length === 0) || (index < 0)) {

              // запоминаем уникальные данные
              arr.push({
                pos: i,
                val: decl.value
              });
            } else if (index >= 0) {

              // собираем селекторы с одинаковыми данными
              css.nodes[index].selector += ','+ rule.selector;
              css.nodes[index].selector = cleanSelector(css.nodes[index].selector);

              decl.removeSelf();
            };

            // сохраняем нужный массив положений свойства
            helper[decl.prop] = arr;

          });
          if (rule.nodes.length === 0) {
            rule.removeSelf();
          };
        });

        // после слияния правил могут остаться пустые медиавыражения
        css.eachAtRule(function (atRule) {
          if (atRule.nodes && atRule.nodes.length === 0) {
            atRule.removeSelf();
          };
        });
      };

      // для добавления в селектор только недостающего
      function cleanSelector (o) {
        var a = o.replace(/\s*,\s*/g, ",").replace(/\n/g, "").split(',');

        a = a.filter( function( item, index, inputArray ) {
          return inputArray.indexOf(item) == index;
        });

        return a.join(',\n');
      };

      // для поиска сохранённого значения
      function findValue (arr, value) {
        for (var i = arr.length - 1; i >= 0; i--) {
          if (arr[i].val === value) {
            return arr[i].pos;
          };
          if (i === 0) {
            return -1;
          };
        };
      };
    };

    // удаляем данные
    function removeData () {
      css.eachRule(function (rule, i) {
        rule.eachDecl(function (decl, j) {
          if (decl.value.match(dataRegexp)) {
            decl.removeSelf();
          };
          if (rule.nodes.length === 0) {
            rule.removeSelf();
          };
        });
      });
      css.eachAtRule(function (atRule) {
        if (atRule.name === 'font-face') {
          atRule.eachDecl(function (decl, j) {
            if (decl.prop === 'src') {
              if (decl.value.match(dataRegexp)) {
                atRule.removeSelf();
              };
            };
          });
        };
      });
    };

    function extend (target, source) {
      var a = Object.create(target);
      Object.keys(source).map(function (prop) {
        prop in a && (a[prop] = source[prop]);
      });
      return a;
    };

  };
};
