/***************************************************************************************************************************************************************
 *
 * Parsing different languages
 *
 * ParseContent - Parsing the content of a file into an object
 * ParseMD      - Parsing markdown into HTML
 * ParseYaml    - Parsing yaml into an object
 * ParseHTML    - Clean react output of any silly wrapping divs
 *
 **************************************************************************************************************************************************************/
'use strict'; //--------------------------------------------------------------------------------------------------------------------------------------------------------------
// Dependencies
//--------------------------------------------------------------------------------------------------------------------------------------------------------------

var _interopRequireDefault3 = require("@babel/runtime/helpers/interopRequireDefault");

var _interopRequireDefault2 = _interopRequireDefault3(require("@babel/runtime/helpers/interopRequireDefault"));

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ParseHTML = exports.ParseYaml = exports.ParseMD = exports.ParseContent = undefined;

var _defineProperty2 = require("@babel/runtime/helpers/defineProperty");

var _defineProperty3 = (0, _interopRequireDefault2.default)(_defineProperty2);

var _marked = require("marked");

var _marked2 = (0, _interopRequireDefault2.default)(_marked);

var _jsYaml = require("js-yaml");

var _jsYaml2 = (0, _interopRequireDefault2.default)(_jsYaml);

var _react = require("react");

var _react2 = (0, _interopRequireDefault2.default)(_react);

var _helper = require("./helper");

var _settings = require("./settings");

var _path = require("./path");

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { (0, _defineProperty3.default)(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

/**
 * Parsing the content of a file into an object
 *
 * @param  {string} content - The content of a partial with or without front matter
 * @param  {string} file    - The path of the file to determine what extension this is, optional, default: 'partial.md'
 * @param  {string} props   - An object of all props being passed to the markdown renderer, optional
 *
 * @return {object}         - An object with parsed out front matter and it’s parsed yaml and the body. format: { frontmatter: {}, body: '' }
 */
const ParseContent = exports.ParseContent = (content, file = 'partial.md', props = {}) => {
  _helper.Log.verbose(`Parsing content for ${_helper.Style.yellow(file)}`);

  if (typeof content === 'string') {
    const _isIndex = _path.Path.extname(file) === '.yml';

    const parsedBody = {};
    let frontmatter = '';
    let markdown = '';

    if (_isIndex) {
      // if this is a yml file
      parsedBody.frontmatter = ParseYaml(content, file);
      parsedBody.body = '';
    } else if (/^---(?:\r\n|\r|\n)/.test(content)) {
      // if this is another file that has frontmatter
      const bodyParts = content.split(/---(?:\r\n|\r|\n)/);
      parsedBody.frontmatter = bodyParts[1] ? ParseYaml(bodyParts[1], file) : {};
      parsedBody.body = ParseMD(bodyParts.slice(2).join('---\n'), file, props);
    } else {
      // in all other cases (markdown without frontmatter)
      parsedBody.frontmatter = {};
      parsedBody.body = ParseMD(content, file, props);
    }

    return parsedBody;
  } else {
    return content;
  }
};
/**
 * Parsing markdown into HTML using https://github.com/chjj/marked
 *
 * @param  {string} markdown - The markdown string
 * @param  {string} file     - The file where this markdown comes from for error handling
 * @param  {string} props    - An object of all props for the custom renderer
 *
 * @return {string}          - HTML rendered from the given markdown
 */


const ParseMD = exports.ParseMD = (markdown, file, props) => {
  if (typeof markdown === 'string') {
    let renderer = new _marked2.default.Renderer();

    if (_settings.SETTINGS.get().site.markdownRenderer) {
      const filePath = _path.Path.normalize(`${process.cwd()}/${_settings.SETTINGS.get().site.markdownRenderer}`);

      try {
        const customRenderer = require(filePath);

        renderer = customRenderer(_objectSpread(_objectSpread({
          Marked: new _marked2.default.Renderer()
        }, props), {}, {
          mangle: false
        }));
      } catch (error) {
        _helper.Log.error(`Using the custom renderer for markdown caused an error at ${_helper.Style.yellow(filePath)}`);

        _helper.Log.error(error);

        if (process.env.NODE_ENV === 'production') {
          // let’s die in a fiery death if something goes wrong in production
          process.exit(1);
        }
      }
    }

    try {
      if (typeof renderer.preparse === 'function') {
        markdown = renderer.preparse(markdown);
      }

      return (0, _marked2.default)(markdown, {
        renderer: renderer,
        mangle: false
      });
    } catch (error) {
      _helper.Log.error(`Rendering markdown caused an error in ${_helper.Style.yellow(file)}`);

      _helper.Log.error(error);

      if (process.env.NODE_ENV === 'production') {
        // let’s die in a fiery death if something goes wrong in production
        process.exit(1);
      }
    }
  } else {
    return markdown;
  }
};
/**
 * Parsing yaml into an object using https://github.com/jeremyfa/yaml.js
 *
 * @param  {string} yaml - A yaml string
 * @param  {string} file - The file where this yaml comes from for error handling
 *
 * @return {object}      - The parsed yaml
 */


const ParseYaml = exports.ParseYaml = (yaml, file) => {
  if (typeof yaml === 'string') {
    try {
      return _jsYaml2.default.safeLoad(yaml, warning => _helper.Log.error(warning)) || {};
    } catch (error) {
      _helper.Log.error(`Rendering yaml caused an error in ${_helper.Style.yellow(file)}`);

      _helper.Log.error(error);

      if (process.env.NODE_ENV === 'production') {
        // let’s die in a fiery death if something goes wrong in production
        process.exit(1);
      }
    }
  } else {
    return yaml;
  }
};
/**
 * Clean react output of any silly wrapping divs
 *
 * @param  {string} html - The HTML generated with react
 *
 * @return {string}      - The cleaned HTML
 */


const ParseHTML = exports.ParseHTML = html => {
  if (typeof html === 'string') {
    return html.replace(/<cuttlebellesillywrapper>/g, '').replace(/<\/cuttlebellesillywrapper>/g, '');
  } else {
    return html;
  }
};