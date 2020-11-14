/***************************************************************************************************************************************************************
 *
 * Watch all relevant files for changes
 *
 * browsersync   - The global browser sync instance
 * Watch         - Our file watcher object
 * Watch.start   - Starting the watch
 * UpdateChange  - Triage changes the the appropriate functions
 * UpdateAssets  - Build assets folder
 * UpdateContent - Build from content pages/partials
 * UpdateReact   - Build from react components
 * UpdateAll     - Build all pages
 * Layouts       - Keep track of all layouts
 * Layouts.get   - Get all layouts we have stored so far
 * Layouts.set   - Keep track of what pages use what react component
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
exports.Layouts = exports.UpdateAll = exports.UpdateReact = exports.UpdateContent = exports.UpdateAssets = exports.UpdateChange = exports.DebouncedWatch = exports.Watch = undefined;

var _defineProperty2 = require("@babel/runtime/helpers/defineProperty");

var _defineProperty3 = (0, _interopRequireDefault2.default)(_defineProperty2);

var _browserSync = require("browser-sync");

var _browserSync2 = (0, _interopRequireDefault2.default)(_browserSync);

var _fs = require("fs");

var _fs2 = (0, _interopRequireDefault2.default)(_fs);

var _render = require("./render");

var _helper = require("./helper");

var _files = require("./files");

var _settings = require("./settings");

var _progress = require("./progress");

var _parse = require("./parse");

var _site = require("./site");

var _path = require("./path");

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { (0, _defineProperty3.default)(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

/**
 * The global browser sync instance
 *
 * @type {function}
 */
const browsersync = _browserSync2.default.create('cuttlebelle');
/**
 * Our file watcher object
 *
 * @type {Object}
 */


const Watch = exports.Watch = {
  lastChange: new Date(),
  running: false,

  /**
   * Starting the watch
   */
  start: () => {
    browsersync.watch([// watch all content and src files
    _path.Path.normalize(`${_settings.SETTINGS.get().folder.content}/**/*.yml`), _path.Path.normalize(`${_settings.SETTINGS.get().folder.content}/**/*.md`), _path.Path.normalize(`${_settings.SETTINGS.get().folder.content}/**/*.html`), _path.Path.normalize(`${_settings.SETTINGS.get().folder.code}/**/*.js`), _path.Path.normalize(`${_settings.SETTINGS.get().folder.assets}/**/*`)], {
      ignoreInitial: true
    }).on('change', path => {
      const thisChange = new Date(); // double save detection

      if (thisChange - Watch.lastChange < _settings.SETTINGS.get().site.watchTimeout) {
        _helper.Log.info(`${_helper.Style.bold('Double save detected')}; regenerating all files`);

        DebouncedWatch(path, true);
      } else {
        _helper.Log.verbose(`Time since last change: ${_helper.Style.yellow(thisChange - Watch.lastChange)}`);

        _helper.Log.info(`File has changed ${_helper.Style.yellow(path.replace(_settings.SETTINGS.get().folder.cwd, ''))}`);

        DebouncedWatch(path, false);
      }

      Watch.lastChange = thisChange;
    }).on('add', path => {
      _helper.Log.info(`File has been added ${_helper.Style.yellow(path.replace(_settings.SETTINGS.get().folder.cwd, ''))}`);

      DebouncedWatch(path, true);
    }).on('unlink', path => {
      _helper.Log.info(`File has been deleted ${_helper.Style.yellow(path.replace(_settings.SETTINGS.get().folder.cwd, ''))}`);

      DebouncedWatch(path, true);
    });
    Watch.running = true;

    _helper.Log.info(`Watching for changes`);

    const defaultOptions = {
      logLevel: 'silent',
      host: '127.0.0.1',
      port: 8080
    };

    const options = _objectSpread(_objectSpread({}, defaultOptions), _settings.SETTINGS.get().site.browserSync);

    options.server = _settings.SETTINGS.get().folder.site;
    browsersync.init(options);
  }
};
/**
 * Debounce watch as simple as possible
 *
 * @param  {string}  path      - The path of the changed file
 * @param  {boolean} _buildAll - Whether or not to build everything
 */

let timeout;
let buildAll = false;
let history = [];

const DebouncedWatch = exports.DebouncedWatch = (path, _buildAll) => {
  history.push(path); // let’s keep a record of the changes

  if (_buildAll) {
    buildAll = true; // remember if we ever wanted to rebuild everything and stick with that
  }

  if (timeout) {
    clearTimeout(timeout);
    timeout = null;
  }

  timeout = setTimeout(() => {
    UpdateChange(path, history, buildAll);
    buildAll = false; // now let’s go back to where we were before

    history = [];
  }, _settings.SETTINGS.get().site.watchTimeout);
};
/**
 * Triage changes the the appropriate functions
 *
 * @param  {array}   path          - The path of the change
 * @param  {array}   history       - All changes that have happened since last debounce
 * @param  {boolean} _doEverything - Shall we just do all pages?
 */


const UpdateChange = exports.UpdateChange = (path, history, _doEverything = false) => {
  const startTime = process.hrtime();

  const _isReact = path.startsWith(_settings.SETTINGS.get().folder.code);

  const _isAssets = path.startsWith(_settings.SETTINGS.get().folder.assets);

  _progress.Progress.done = 0; // A page is being changed

  if (!_doEverything) {
    _progress.Progress.set(1);

    if (_isAssets) {
      UpdateAssets(startTime);
    } else if (!_isReact) {
      _helper.Log.verbose(`Detected content changes`);

      const page = _path.Path.dirname(path).replace(_settings.SETTINGS.get().folder.content, '');

      if (!_fs2.default.existsSync(_path.Path.normalize(`${_settings.SETTINGS.get().folder.content}/${page}/${_settings.SETTINGS.get().folder.index}.yml`))) {
        UpdateAll(startTime);
      } else {
        UpdateContent(startTime, path, page);
      }
    } // A react component is being changed
    else {
        // delete require.cache[ require.resolve('babel-register') ];
        process.env.BABEL_DISABLE_CACHE = 1;
        delete require.cache[require.resolve(path)]; // cache busting

        UpdateReact(startTime, path);
      }
  } // double save
  else {
      if (history.find(item => item.startsWith(_settings.SETTINGS.get().folder.code)) !== undefined || history.find(item => item.startsWith(_settings.SETTINGS.get().folder.content)) !== undefined) {
        UpdateAll(startTime); // re-generating all pages
      }

      if (history.find(item => item.startsWith(_settings.SETTINGS.get().folder.assets)) !== undefined) {
        UpdateAssets(startTime); // re-generating assets
      }
    }
};
/**
 * Build assets folder
 *
 * @param  {array} startTime - The Hrtime array
 */


const UpdateAssets = exports.UpdateAssets = startTime => {
  _helper.Log.verbose(`Only doing assets changes`);

  let assetsLocation = _settings.SETTINGS.get().folder.assets.split('/');

  assetsLocation = _path.Path.normalize(`${_settings.SETTINGS.get().folder.site}/${assetsLocation[assetsLocation.length - 2]}/`); // copy entire assets folder again

  (0, _render.RenderAssets)(_settings.SETTINGS.get().folder.assets, assetsLocation).catch(error => _helper.Log.error(error)).then(() => {
    const elapsedTime = process.hrtime(startTime);

    _helper.Log.done(`Successfully built ${_helper.Style.yellow('assets')} folder to ${_helper.Style.yellow(_settings.SETTINGS.get().folder.site.replace(_settings.SETTINGS.get().folder.cwd, ''))} ` + `in ${_helper.Style.yellow(`${(0, _helper.ConvertHrtime)(elapsedTime)}s`)}`);

    browsersync.reload();
  });
};
/**
 * Build from content pages/partials
 *
 * @param  {array}  startTime - The Hrtime array
 * @param  {string} path      - The path of the changed file
 * @param  {string} page      - The path to the page attached to the changed content
 */


const UpdateContent = exports.UpdateContent = (startTime, path, page) => {
  _helper.Log.verbose(`Only doing content changes`);

  const filePath = _path.Path.normalize(`${_settings.SETTINGS.get().folder.content}/${page}/${_settings.SETTINGS.get().folder.index}.yml`);

  (0, _files.ReadFile)(filePath).catch(error => {
    _helper.Log.error(`An error occured while trying to generate ${_helper.Style.yellow(path.replace(_settings.SETTINGS.get().folder.cwd, ''))}`);

    _helper.Log.error(error);
  }).then(content => (0, _render.RenderFile)(content, filePath.replace(_settings.SETTINGS.get().folder.content, ''))).then(HTML => {
    const newPath = _path.Path.normalize(`${_settings.SETTINGS.get().folder.site}/${page === _settings.SETTINGS.get().folder.homepage ? '' : page}/index.html`);

    (0, _files.CreateFile)(newPath, (0, _parse.ParseHTML)(_settings.SETTINGS.get().site.doctype + HTML)).catch(error => reject(error));

    _progress.Progress.tick();

    return newPath.replace(_settings.SETTINGS.get().folder.cwd, '');
  }).then(page => {
    const elapsedTime = process.hrtime(startTime);

    _helper.Log.done(`Successfully built ${_helper.Style.yellow(page)} ` + `in ${_helper.Style.yellow(`${(0, _helper.ConvertHrtime)(elapsedTime)}s`)}`);

    browsersync.reload();
  });
};
/**
 * Build from react components
 *
 * @param  {array}  startTime - The Hrtime array
 * @param  {string} path      - The path of the changed file
 */


const UpdateReact = exports.UpdateReact = (startTime, path) => {
  _helper.Log.verbose(`Only doing react changes`);

  const page = path.replace(_settings.SETTINGS.get().folder.code, '').replace('.js', '');

  _helper.Log.verbose(`Changes effected ${_helper.Style.yellow(JSON.stringify(Layouts.get()[page]))}`);

  const layout = (0, _site.GetLayout)();

  if (Layouts.get()[page]) {
    // render only if we have something to render
    (0, _render.RenderAllPages)(Layouts.get()[page], layout).catch(error => {
      _helper.Log.error(`An error occured while trying to generate all pages`);

      _helper.Log.error(error);
    }).then(pages => {
      const elapsedTime = process.hrtime(startTime);

      _helper.Log.done(`Successfully built ${_helper.Style.yellow(pages.length)} pages to ${_helper.Style.yellow(_settings.SETTINGS.get().folder.site.replace(_settings.SETTINGS.get().folder.cwd, ''))} ` + `in ${_helper.Style.yellow(`${(0, _helper.ConvertHrtime)(elapsedTime)}s`)}`);

      browsersync.reload();
    });
  } else {
    _helper.Log.info(`No pages were found to be attached to ${_helper.Style.yellow(path.replace(_settings.SETTINGS.get().folder.cwd, ''))}.`);

    _helper.Log.info(`Consider a double-save to render all pages.`);
  }
};
/**
 * Build all pages
 *
 * @param  {array} startTime - The Hrtime array
 */


const UpdateAll = exports.UpdateAll = startTime => {
  // remove babel register components from require cache
  const allComponents = Object.keys(require.cache).filter(key => key.startsWith(_settings.SETTINGS.get().folder.code));
  allComponents.map(component => {
    delete require.cache[component]; // cache busting
  });
  (0, _render.PreRender)().catch(error => {
    _helper.Log.error(`Trying to initilize the pages failed.`);

    _helper.Log.error(error);

    process.exit(1);
  }).then(({
    content,
    layout
  }) => {
    (0, _render.RenderAllPages)(content, layout).catch(error => {
      _helper.Log.error(`Generating pages failed :(`);

      _helper.Log.error(error);

      process.exit(1);
    }).then(pages => {
      const elapsedTime = process.hrtime(startTime);

      _helper.Log.done(`${pages.length > 0 ? `Successfully built ${_helper.Style.yellow(pages.length)} pages ` : `No pages have been build `}` + `to ${_helper.Style.yellow(_settings.SETTINGS.get().folder.site.replace(_settings.SETTINGS.get().folder.cwd, ''))} ` + `in ${_helper.Style.yellow(`${(0, _helper.ConvertHrtime)(elapsedTime)}s`)}`);

      browsersync.reload();
    });
  });
};
/**
 * Keep track of all layouts
 *
 * @type {Object}
 */


const Layouts = exports.Layouts = {
  /**
   * The global layouts object
   *
   * @type {Object}
   */
  all: {},

  /**
   * Get all layouts we have stored so far
   *
   * @return {object} - The layouts object
   */
  get: () => {
    return Layouts.all;
  },

  /**
   * Keep track of what pages use what react component
   *
   * @param  {string} page   - The name of the page
   * @param  {string} layout - The name of the react component
   */
  set: (page, layout) => {
    _helper.Log.verbose(`Keeping track of the page ${_helper.Style.yellow(page)} for layout ${_helper.Style.yellow(layout)}`);

    if (!Layouts.all[layout]) {
      Layouts.all[layout] = [];
    }

    if (!Layouts.all[layout].includes(page)) {
      Layouts.all[layout].push(page);
    }
  }
};