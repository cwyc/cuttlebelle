/***************************************************************************************************************************************************************
 *
 * Getting and storing frontmatter for later reuse
 *
 * Pages        - Reading all pages frontmatter and keeping them for later lookup
 * Pages.get    - Get the stored frontmatter
 * Pages.setAll - Set all frontmatter to store
 * Pages.set    - Set one pages frontmatter into the store
 * Pages.inject - Inject the data into our global placeholder
 *
 **************************************************************************************************************************************************************/
'use strict'; //--------------------------------------------------------------------------------------------------------------------------------------------------------------
// Dependencies
//--------------------------------------------------------------------------------------------------------------------------------------------------------------
//--------------------------------------------------------------------------------------------------------------------------------------------------------------
// Local
//--------------------------------------------------------------------------------------------------------------------------------------------------------------

var _interopRequireDefault3 = require("@babel/runtime/helpers/interopRequireDefault");

var _interopRequireDefault2 = _interopRequireDefault3(require("@babel/runtime/helpers/interopRequireDefault"));

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Pages = undefined;

var _defineProperty2 = require("@babel/runtime/helpers/defineProperty");

var _defineProperty3 = (0, _interopRequireDefault2.default)(_defineProperty2);

var _helper = require("./helper");

var _settings = require("./settings");

var _parse = require("./parse");

var _files = require("./files");

var _path = require("./path");

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { (0, _defineProperty3.default)(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

/**
 * Reading all pages frontmatter and keeping them for later lookup
 *
 * @type {Object}
 */
const Pages = exports.Pages = {
  /**
   * The store of all frontmatter of all pages
   *
   * @type {Object}
   */
  all: {},

  /**
   * Get the stored frontmatter
   *
   * @return {object} - All frontmatter for each page
   */
  get: () => {
    _helper.Log.verbose(`All pages frontmatter:\n${_helper.Style.yellow(JSON.stringify(Pages.all))}`);

    return Pages.all;
  },

  /**
   * Set all frontmatter to store
   *
   * @param  {array}  pages   - All pages that need to be read and stored
   *
   * @return {promise object} - Resolves once all pages are stored
   */
  setAll: (pages = []) => {
    _helper.Log.verbose(`Setting pages frontmatter for: ${_helper.Style.yellow(JSON.stringify(pages))}`);

    const allPages = [];
    return new Promise((resolve, reject) => {
      pages.forEach(page => {
        allPages.push(Pages.set(page));
      });
      Promise.all(allPages).catch(error => {
        reject(JSON.stringify(error));
      }).then(() => {
        resolve();
      });
    });
  },

  /**
   * Set one pages frontmatter into the store
   *
   * @param  {string} page - The name of the page
   *
   * @return {object}      - An object with all frontmatter inside it's ID key, format: { name: 'ID', [ID]: {} }
   */
  set: page => {
    _helper.Log.verbose(`Setting page frontmatter for ${_helper.Style.yellow(page)}`);

    const content = _path.Path.normalize(`${_settings.SETTINGS.get().folder.content}/${page}/${_settings.SETTINGS.get().folder.index}.yml`);

    return new Promise((resolve, reject) => {
      (0, _files.ReadFile)(content).catch(error => reject(JSON.stringify(error))).then(body => resolve(_objectSpread({
        name: page
      }, Pages.inject(page, (0, _parse.ParseYaml)(body, page)))));
    });
  },

  /**
   * Inject the data into our global placeholder
   *
   * @param  {string} page - The name (ID) of the page
   * @param  {object} data - The data to be injected
   *
   * @return {object}      - The data with generated url
   */
  inject: (page, data) => {
    _helper.Log.verbose(`Injecting page data for ${_helper.Style.yellow(page)} to ${_helper.Style.yellow(JSON.stringify(data))}`);

    let url = `${_settings.SETTINGS.get().site.root}${page}`;

    if (page === _settings.SETTINGS.get().folder.homepage) {
      url = `${_settings.SETTINGS.get().site.root}`;
    }

    data = JSON.parse(JSON.stringify(data)); // cloning

    data = _objectSpread(_objectSpread({}, Pages.all[page]), data);
    data._url = url; // adding url last so it can’t ever be overwritten

    Pages.all[page] = data;
    return data;
  }
};