/***************************************************************************************************************************************************************
 *
 * Render partials or even whole pages
 *
 * RelativeURL     - Resolve two paths relative to each other
 * RenderReact     - Render a react component to string
 * RenderFile      - Render a file to HTML
 * FindPartial     - Iterate frontmatter and look for partials to render
 * RenderPartial   - Render a partial to HTML from the string inside frontmatter
 * RenderAllPages  - Render all pages in the content folder
 * PreRender       - Pre-render all pages to populate all helpers
 * RenderAssets    - Render assets folder
 *
 *
 * ┌──────────────────┐
 * │  RenderAllPages  │
 * └──────────────────┘
 *        ○ loop            ┌───────────────┐
 *        │     ┌──────────▶│  FindPartial  │
 *        │     │           └───────────────┘
 *        ▼     │                 loop
 *      ┌───────────────┐           ○
 *      │  RenderFile   │           │
 *      └───────────────┘           │
 *          │   ▲                   │
 *          │   │                   ▼
 *          │   │           ┌───────────────┐
 *          │   └───────────│ RenderPartial │
 *          │               └───────────────┘
 *          ▼
 *      ┌───────────────┐
 *      │  RenderReact  │
 *      └───────────────┘
 *              ║
 *              ║
 *              ▼
 *            output
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
exports.RenderAssets = exports.PreRender = exports.RenderAllPages = exports.RenderPartial = exports.FindPartial = exports.RenderFile = exports.RenderReact = exports.RelativeURL = undefined;

var _defineProperty2 = require("@babel/runtime/helpers/defineProperty");

var _defineProperty3 = (0, _interopRequireDefault2.default)(_defineProperty2);

var _requireFromString = require("require-from-string");

var _requireFromString2 = (0, _interopRequireDefault2.default)(_requireFromString);

var _server = require("react-dom/server");

var _server2 = (0, _interopRequireDefault2.default)(_server);

var _traverse = require("traverse");

var _traverse2 = (0, _interopRequireDefault2.default)(_traverse);

var _react = require("react");

var _react2 = (0, _interopRequireDefault2.default)(_react);

var _fs = require("fs");

var _fs2 = (0, _interopRequireDefault2.default)(_fs);

var _files = require("./files");

var _parse = require("./parse");

var _site = require("./site");

var _helper = require("./helper");

var _watch = require("./watch");

var _settings = require("./settings");

var _progress = require("./progress");

var _pages = require("./pages");

var _store = require("./store");

var _path = require("./path");

var _nav = require("./nav");

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { (0, _defineProperty3.default)(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

/**
 * Resolve two paths relative to each other
 *
 * @param  {string} URL - The URL you want to link to
 * @param  {string} ID  - The ID of the page you are on
 *
 * @return {string}     - A relative path to URL from ID
 */
const RelativeURL = exports.RelativeURL = (URL, ID) => {
  if (ID === _settings.SETTINGS.get().folder.homepage) {
    ID = '';
  }

  let relative = _path.Path.posix.relative(`${_settings.SETTINGS.get().site.root}${ID}`, `${_settings.SETTINGS.get().site.root}${URL}`); // bug in node 12: https://github.com/nodejs/node/issues/28549


  if (URL === '/' && relative.endsWith('/')) {
    relative = relative.slice(0, -1);
  }

  return relative === '' ? '.' : relative;
};
/**
 * Render a react component to string
 *
 * @param  {string} componentPath - The path to the react component
 * @param  {object} props         - The props for the component
 * @param  {object} source        - An optional string to compile from a string rather than from a file, optional
 *
 * @return {string}               - The static markup of the component
 */


const RenderReact = exports.RenderReact = (componentPath, props, source = '') => {
  _helper.Log.verbose(`Rendering react component ${_helper.Style.yellow(componentPath.replace(_settings.SETTINGS.get().folder.code, ''))}`); // babelfy components
  // we have to keep the presets and plugins close as we want to support and even encourage global installs


  const registerObj = {
    presets: [require.resolve('@babel/preset-react'), [require.resolve('@babel/preset-env'), {
      targets: {
        node: 'current'
      }
    }]],
    plugins: [require.resolve('babel-plugin-transform-es2015-modules-commonjs'), require.resolve('@babel/plugin-proposal-object-rest-spread'), [require.resolve('@babel/plugin-transform-runtime'), {
      'helpers': false
    }]]
  };
  const redirectReact = [require.resolve('@babel/plugin-syntax-dynamic-import'), [require.resolve('babel-plugin-import-redirect'), {
    redirect: {
      react: require.resolve('react'),
      'prop-types': require.resolve('prop-types')
    },
    suppressResolveWarning: true
  }]]; // optional we redirect import statements for react to our local node_module folder
  // so react doesn’t have to be installed separately on globally installed cuttlebelle

  if (_settings.SETTINGS.get().site.redirectReact || source !== '') {
    registerObj.plugins = [...registerObj.plugins, ...redirectReact];
  }

  let component;

  try {
    if (source !== '') {
      // require from string
      registerObj.filename = _path.Path.normalize(`${__dirname}/cuttlebelle-temp-file`); // bug in babel https://github.com/yahoo/babel-plugin-react-intl/issues/156

      const transpiledSource = require('@babel/core').transformSync(source, registerObj);

      component = (0, _requireFromString2.default)(transpiledSource.code).default;
    } else {
      // require from file
      registerObj.cache = !_watch.Watch.running; // we don’t need to cache during watch

      require('@babel/register')(registerObj);

      component = require(componentPath).default;
    }
  } catch (error) {
    _helper.Log.error(`Babel failed for ${_helper.Style.yellow(componentPath.replace(_settings.SETTINGS.get().folder.code, ''))}:`);

    _helper.Log.error(error);

    _helper.Log.verbose(JSON.stringify(registerObj));

    if (process.env.NODE_ENV === 'production') {
      // let’s die in a fiery death if the render fails in production
      process.exit(1);
    }

    return '';
  }

  try {
    const getInitialProps = component.getInitialProps;

    if (typeof getInitialProps !== 'function') {
      // no getInitialProps in this component
      return Promise.resolve(_server2.default.renderToStaticMarkup( /*#__PURE__*/_react2.default.createElement(component, props)));
    }

    const initialProps = getInitialProps(props); // now let's run this thing and see what happens

    if (Object.prototype.toString.call(initialProps) === '[object Promise]') {
      return new Promise((resolve, reject) => {
        initialProps.catch(error => {
          _helper.Log.error(`Render failed for ${_helper.Style.yellow(componentPath.replace(_settings.SETTINGS.get().folder.code, ''))}:`);

          reject(error);
        }).then(newProps => resolve(_server2.default.renderToStaticMarkup( /*#__PURE__*/_react2.default.createElement(component, _objectSpread(_objectSpread({}, newProps), props)))));
      });
    } else {
      // in case getInitialProps isn't used as an async function (which is silly)
      _helper.Log.info('The getInitialProps() method is meant for async data fetching. It should return a promise. Maybe use `static async getInitialProps()`');

      return Promise.resolve(_server2.default.renderToStaticMarkup( /*#__PURE__*/_react2.default.createElement(component, _objectSpread(_objectSpread({}, initialProps), props))));
    }
  } catch (error) {
    _helper.Log.error(`The react component ${_helper.Style.yellow(componentPath.replace(_settings.SETTINGS.get().folder.code, ''))} had trouble rendering:`);

    _helper.Log.error(error);

    _helper.Log.verbose(JSON.stringify(registerObj));

    if (process.env.NODE_ENV === 'production') {
      // let’s die in a fiery death if the render fails in production
      process.exit(1);
    }

    return Promise.resolve('');
  }
};
/**
 * Render a file to HTML
 *
 * @param  {string} content  - The content of the file to be rendered
 * @param  {string} file     - The path to this file
 * @param  {string} parent   - The path to the parent file, optional, default: ''
 * @param  {array}  rendered - An array of all pages that have been through this render loop to detect circular dependencies, optional, default: []
 * @param  {number} iterator - An iterator so we can generate unique IDs, default 0
 *
 * @return {promise object}  - The HTML content of the page
 */


const RenderFile = exports.RenderFile = (content, file, parent = '', rendered = [], iterator = 0) => {
  _helper.Log.verbose(`Rendering file ${_helper.Style.yellow(file)}`);

  if (parent === '') {
    parent = file;
  }

  iterator++;

  if (rendered.includes(file)) {
    return Promise.reject(`A circular dependency (${_helper.Style.yellow(file)}) was detected in ${_helper.Style.yellow(parent)}`);
  } else {
    return new Promise((resolve, reject) => {
      const ID = _path.Path.normalize(parent.length > 0 ? _path.Path.dirname(parent) : _path.Path.dirname(file)); // the ID of this page is the folder in which it exists
      // to get the parents we just look at the path


      let parents = ID.split('/').map((item, i) => {
        return ID.split('/').splice(0, ID.split('/').length - i).join('/');
      }); // we add the homepage to the parents root

      if (ID !== _settings.SETTINGS.get().folder.index) {
        parents.push(_settings.SETTINGS.get().folder.index);
      }

      parents = parents.reverse(); // gotta have it the right way around
      // prepare some common props that will go into the custom markdown renderer and the react renderer

      const defaultProps = {
        _ID: ID,
        _self: file,
        _isDocs: false,
        _parents: parents,
        _storeSet: _store.Store.set,
        _store: _store.Store.get,
        _nav: _nav.Nav.get(),
        _relativeURL: RelativeURL,
        _parseYaml: (yaml, file) => (0, _parse.ParseYaml)(yaml, file),
        _parseReact: component => {
          try {
            return _server2.default.renderToStaticMarkup(component);
          } catch (error) {
            _helper.Log.error(`An error occurred inside ${_helper.Style.yellow(file)} while running ${_helper.Style.yellow('_parseReact')}`);

            _helper.Log.error(error);
          }
        },
        _globalProp: _settings.SETTINGS.get().site.globalProp || {}
      }; // parsing out front matter for this file

      let parsedBody = (0, _parse.ParseContent)(content, file, _objectSpread({
        _pages: _pages.Pages.get()
      }, defaultProps));
      rendered.push(file); // keeping track of all files we render to avoid circular dependencies

      _pages.Pages.inject(ID, parsedBody.frontmatter); // we inject the frontmatter early so partials have access to it


      process.nextTick(() => FindPartial(parsedBody.frontmatter, _path.Path.normalize(`${_settings.SETTINGS.get().folder.content}/${file}`), parent, rendered, iterator).catch(error => {
        _helper.Log.error(`Generating page failed in ${_helper.Style.yellow(file)}`);

        reject(error);
      }).then(frontmatter => {
        parsedBody.frontmatter = frontmatter ? frontmatter : {}; // we only got one promise to resolve
        // set the default layout

        if (file.endsWith('.yml')) {
          parsedBody.frontmatter.layout = parsedBody.frontmatter.layout || _settings.SETTINGS.get().layouts.page;
        } else {
          parsedBody.frontmatter.layout = parsedBody.frontmatter.layout || _settings.SETTINGS.get().layouts.partial;
        } // keeping track of all pages per layout will make the watch better


        _watch.Layouts.set(ID, parsedBody.frontmatter.layout); // and off we go into the react render machine


        let pageHTML = RenderReact(_path.Path.normalize(`${_settings.SETTINGS.get().folder.code}/${parsedBody.frontmatter.layout}`), _objectSpread(_objectSpread({
          _pages: _pages.Pages.get(),
          _parseMD: (markdown, file, props = defaultProps) => /*#__PURE__*/_react2.default.createElement("cuttlebellesillywrapper", {
            key: `${ID}-${iterator}-md`,
            dangerouslySetInnerHTML: {
              __html: (0, _parse.ParseMD)(markdown, file, props)
            }
          }),
          _body: /*#__PURE__*/_react2.default.createElement("cuttlebellesillywrapper", {
            key: `${ID}-${iterator}`,
            dangerouslySetInnerHTML: {
              __html: parsedBody.body
            }
          })
        }, defaultProps), parsedBody.frontmatter)).then(pageHTML => resolve(pageHTML));
      }));
    });
  }
};
/**
 * Iterate frontmatter and look for partials to render
 *
 * @param  {object}  object   - The frontmatter object
 * @param  {string}  file     - The file path we got the frontmatter from
 * @param  {string}  parent   - The path to the parent file
 * @param  {array}   rendered - An array of all pages rendered so far
 * @param  {integer} iterator - An iterator so we can generate unique ID keys
 *
 * @return {promise object}   - The converted frontmatter now with partials replaced with their content
 */


const FindPartial = exports.FindPartial = (object, file, parent, rendered, iterator = 0) => {
  _helper.Log.verbose(`Rendering all partials ${_helper.Style.yellow(JSON.stringify(object))}`);

  return new Promise((resolve, reject) => {
    const allPartials = [];
    let tree;

    try {
      tree = (0, _traverse2.default)(object); // we have to convert the deep object into a tree
    } catch (error) {
      _helper.Log.error(`Traversing frontmatter failed in ${_helper.Style.yellow(file)}`);

      reject(error);
    }

    tree.map(function (partial) {
      // so we can walk through the leaves and check for partial string
      if (this.isLeaf && typeof partial === 'string') {
        iterator++;
        allPartials.push(RenderPartial(partial, file, parent, this.path, [...rendered], iterator).catch(error => {
          _helper.Log.error(`Render partial failed for ${_helper.Style.yellow(partial)}`);

          reject(error);
        }));
      }
    });
    Promise.all(allPartials) // after all partials have been rendered out
    .catch(error => reject(error)).then(frontmatter => {
      frontmatter.map(partial => {
        if (typeof partial === 'object' && partial.path) {
          tree.set(partial.path, partial.partial); // we replace the partial string with the partial content
        }
      });
      resolve(object);
    });
  });
};
/**
 * Render a partial to HTML from the string inside frontmatter
 *
 * @param  {string}  partial  - The partial string
 * @param  {string}  file     - The file path we got the frontmatter from
 * @param  {string}  parent   - The path to the parent file
 * @param  {array}   path     - The path to the deep object structure of the frontmatter
 * @param  {array}   rendered - An array of all pages rendered so far
 * @param  {integer} iterator - An iterator so we can generate unique ID keys
 *
 * @return {promise object}   - An object with the path and the rendered HTML react object, format: { path, partial }
 */


const RenderPartial = exports.RenderPartial = (partial, file, parent, path, rendered, iterator = 0) => {
  _helper.Log.verbose(`Testing if we can render ${_helper.Style.yellow(partial)} as partial`);

  return new Promise((resolve, reject) => {
    let cwd = _path.Path.dirname(file); // we assume relative links


    if (partial.startsWith('/')) {
      // unless the path starts with a slash
      cwd = _settings.SETTINGS.get().folder.content;
    }

    const partialPath = _path.Path.normalize(`${cwd}/${partial}`);

    if ((partial.endsWith('.md') || partial.endsWith('.html')) && _fs2.default.existsSync(partialPath)) {
      // only if the string ends with ".md" and the corresponding file exists
      _helper.Log.verbose(`Partial ${_helper.Style.yellow(partial)} found`);

      const ID = partialPath.replace(_settings.SETTINGS.get().folder.content, '');

      const filePath = _path.Path.normalize(`${_settings.SETTINGS.get().folder.content}/${ID}`);

      const handleError = error => {
        _helper.Log.error(`Generating partial failed in ${_helper.Style.yellow(partial)}`);

        reject(error);
      };

      const renderMD = content => RenderFile(content, filePath.replace(_settings.SETTINGS.get().folder.content, ''), parent, rendered, iterator).catch(reason => reject(reason));

      const reactWrapper = HTML => {
        const ID = `cuttlebelleID${(0, _helper.Slug)(partial)}-${iterator}`; // We generate a unique ID for react

        _helper.Log.verbose(`Rendering partial ${_helper.Style.yellow(partial)} complete with ID ${_helper.Style.yellow(ID)}`);

        resolve({
          // to resolve we need to keep track of the path of where this partial was mentioned
          path: path,
          partial: /*#__PURE__*/_react2.default.createElement("cuttlebellesillywrapper", {
            key: ID,
            dangerouslySetInnerHTML: {
              __html: HTML
            }
          })
        });
      };

      if (partial.endsWith('.md')) process.nextTick(() => (0, _files.ReadFile)(filePath).catch(handleError).then(renderMD).then(reactWrapper));else process.nextTick(() => (0, _files.ReadFile)(filePath).catch(handleError).then(reactWrapper));
    } else {
      resolve(partial); // looks like the string wasn’t a partial so we just return it unchanged
    }
  });
};
/**
 * Render all pages in the content folder
 *
 * @param  {array}  content - An array of all pages
 * @param  {array}  layout  - An array of all layout components
 *
 * @return {promise object} - The array of all pages
 */


const RenderAllPages = exports.RenderAllPages = (content = [], layout = []) => {
  _helper.Log.verbose(`Rendering all pages:\n${_helper.Style.yellow(JSON.stringify(content))}`);

  if (content) {
    (0, _files.RemoveDir)([...content]);
    return new Promise((resolve, reject) => {
      const allPages = [];
      content.forEach(page => process.nextTick(() => {
        const filePath = _path.Path.normalize(`${_settings.SETTINGS.get().folder.content}/${page}/${_settings.SETTINGS.get().folder.index}.yml`);

        allPages.push((0, _files.ReadFile)(filePath).catch(error => reject(error)).then(content => RenderFile(content, filePath.replace(_settings.SETTINGS.get().folder.content, ''))).then(HTML => {
          const newPath = _path.Path.normalize(`${_settings.SETTINGS.get().folder.site}/${page === _settings.SETTINGS.get().folder.homepage ? '' : page}/index.html`);

          (0, _files.CreateFile)(newPath, (0, _parse.ParseHTML)(_settings.SETTINGS.get().site.doctype + HTML)).catch(error => reject(error));

          _progress.Progress.tick();
        }));
      }));
      process.nextTick(async () => {
        try {
          const pages = await Promise.all(allPages);
          resolve(pages);
        } catch (error) {
          reject(error);
        }
      });
    });
  } else {
    return Promise.resolve([]);
  }
};
/**
 * Pre-render all pages to populate all helpers
 *
 * @return {Promise object} - An object of content and layout arrays, format: { content: [], layout: {} }
 */


const PreRender = exports.PreRender = () => {
  // Getting all pages
  const content = (0, _site.GetContent)();

  _helper.Log.verbose(`Found following content: ${_helper.Style.yellow(JSON.stringify(content))}`); // Setting nav globally


  _nav.Nav.set(content); // Getting all layout components


  const layout = (0, _site.GetLayout)();

  _helper.Log.verbose(`Found following layout:\n${_helper.Style.yellow(JSON.stringify(layout))}`);

  if (content === undefined) {
    return Promise.resolve({
      content: [],
      layout: []
    });
  } else {
    // Setting how many pages we will have to go through
    _progress.Progress.set(content.length);

    return new Promise(async (resolve, reject) => {
      try {
        // Get all front matter from all pages and put them into a global var
        await _pages.Pages.setAll(content);
      } catch (error) {
        reject(error);
      }

      resolve({
        content,
        layout
      });
    });
  }
};
/**
 * Render assets folder
 *
 * @param  {string} source      - The source path
 * @param  {string} destination - The destination path
 *
 * @return {promise object}     - Resolves when finished
 */


const RenderAssets = exports.RenderAssets = (source, destination) => {
  return new Promise((resolve, reject) => {
    (0, _files.CreateDir)(destination);
    (0, _files.CopyFiles)(source, destination).catch(error => {
      _helper.Log.error(`Error encountered while atempting to copy files from ${_helper.Style.yellow(source)} to ${_helper.Style.yellow(destination)}`);

      _helper.Log.error(error);

      reject(error);
    }).then(finished => {
      resolve(finished);
    });
  });
};