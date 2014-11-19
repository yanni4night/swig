var only = 'only';

/**
 * Includes a template partial in place. The template is rendered within the current locals variable context.
 *
 * @alias include
 *
 * @example
 * // food = 'burritos';
 * // drink = 'lemonade';
 * {% include "./partial.html" %}
 * // => I like burritos and lemonade.
 *
 * @example
 * // my_obj = { food: 'tacos', drink: 'horchata' };
 * {% include "./partial.html" with context=my_obj only %}
 * // => I like tacos and horchata.
 *
 *
 * @param {string|var}  file      The path, relative to the template root, to render into the current context.
 * @param {literal}     [with]    Literally, "with".
 * @param {object}      [context] Local variable key-value object context to provide to the included file.
 * @param {literal}     [only]    Restricts to <strong>only</strong> passing the <code>with context</code> as local variables–the included template will not be aware of any other local variables in the parent template. For best performance, usage of this option is recommended if possible.
 */
exports.compile = function(compiler, args) {
  var file = args.shift(),
    onlyIdx = args.indexOf(only),
    onlyCtx = onlyIdx !== -1 ? args.splice(onlyIdx, 1) : false,
    parentFile = (args.pop() || '').replace(/\\/g, '\\\\'),
    w = args.join('');

  return '(function(){var _in_ctx={};' + w + ';_output += _swig.compileFile(' + file + ', {' +
    'resolveFrom: "' + parentFile + '"' +
    '})(' +
    ((onlyCtx && w) ? w : (!w ? '_ctx' : '_utils.extend({}, _ctx, _in_ctx)')) +
    ')})();\n';
};

exports.parse = function(str, line, parser, types, stack, opts) {
  var file, w, nameSet;
  parser.on(types.STRING, function(token) {
    if (!file) {
      file = token.match;
      this.out.push(file);
      return;
    }

    return true;
  });

  parser.on(types.ASSIGNMENT, function(token) {
    if ('=' !== token.match) {
      throw new Error('Unexpected token "' + token.match + '" on line ' + line + '.');
    }
    this.out.push(token.match);
  });

  parser.on(types.VAR, function(token) {
    if (!file) {
      file = token.match;
      return true;
    }

    if (!w && token.match === 'with') {
      w = true;
      return;
    }

    if (w && token.match === only && this.prevToken.match !== 'with') {
      this.out.push(token.match);
      return;
    }

    if (w && this.prevToken.match !== '=') {
      this.out.push('_in_ctx.' + token.match);
      return
    }

    if (w && this.prevToken.match === '=') {
      this.filterApplyIdx.push(this.out.length);
      return true;
    }

    return true;
  });

  parser.on('end', function() {
    this.out.push(opts.filename || null);
  });

  return true;
};