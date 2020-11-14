/***************************************************************************************************************************************************************
 *
 * Build documentation from your react layouts
 *
 * Ipsum                 - The source of our ipsum lorem
 * BuildDocs             - Build our docs from the source folder
 * GetCategories         - Get an array of folder names from an array of paths
 * GetCategoryComponents - Pick all components of a category and send them to the parser
 * GetCss                - Get all css files from the assets folder recursively
 * CreateCategory        - Generate the category html and write it to disk
 * CreateIndex           - Generate the homepage html and write it to disk
 * ParseComponent        - Get infos about a react component by running it through our propType parser
 * BuildPropsYaml        - Build our props and yaml from the description of our propTypes
 * BuildHTML             - Build out HTML for the component so we can show it
 * ParseExample          - Parse an example object
 * ReplaceMagic          - Replace some magic strings with something more human readable
 * MakePartials          - Make a partial placeholder
 * MakeIpsum             - Make some dummy text from a text file with n amount of sentences
 * vocabulary            - Magic strings and how to handle them
 *
 *
 *              input              ╔═════▶ output
 *                ║                ║
 *                ║                          ───────────────────▶┌───────────────────────┐
 *                ▼                7       6                     │     RenderAssets      │
 *               ┌───────────────────────┐   ───────────────────▶└───────────────────────┘
 *               │       BuildDocs       │
 *               └───────────────────────┘ 5 ──────────────┐
 *                           1  2   3     4                ▼
 *                           │  │ loop  loop   ┌───────────────────────┐
 * ┌───────────────────────┐ │  │   ○     ○    │      CreateIndex      │
 * │     GetCategories     │◀┘  │   │     │    └───────────────────────┘
 * └───────────────────────┘    │   │     │
 * ┌───────────────────────┐    │   │     │ ┌───────────────────────┐
 * │        GetCSS         │◀───┘   │     └▶│    CreateCategory     │
 * └───────────────────────┘        │       └───────────────────────┘
 *                                  │
 *                                  │
 *                                  ▼
 *                      ┌───────────────────────┐
 *                      │ GetCategoryComponents │
 *                      └───────────────────────┘
 *                                loop
 *                                  ○
 *                                  │
 *                                  ▼
 *                      ┌───────────────────────┐
 *                      │    ParseComponent     │
 *                      └───────────────────────┘
 *                                  │
 *                                  │                ┌───────────────────────┐
 *                                  ▼             ┌─▶│     ParseExample      │
 *                      ┌───────────────────────┐ │  └───────────────────────┘        ┌ ─ ─ ─ ─ ─ ─
 *                      │    BuildPropsYaml     │─┤                      loop ○──────▶  vocabulary │
 *                      └───────────────────────┘ │  ┌───────────────────────┐        └ ─ ─ ─ ─ ─ ─
 *                                  │             └─▶│     ReplaceMagic      │               │    ┌───────────────────────┐
 *                                  │                └───────────────────────┘               ├───▶│     MakePartials      │
 *                                  ▼                                                        │    └───────────────────────┘
 *                      ┌───────────────────────┐                                            │    ┌───────────────────────┐
 *                      │       BuildHTML       │                                            └───▶│       MakeIpsum       │
 *                      └───────────────────────┘                                                 └───────────────────────┘
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
exports.vocabulary = exports.MakeIpsum = exports.MakePartials = exports.ReplaceMagic = exports.ParseExample = exports.BuildHTML = exports.BuildPropsYaml = exports.ParseComponent = exports.CreateIndex = exports.CreateCategory = exports.GetCss = exports.GetCategoryComponents = exports.GetCategories = exports.BuildDocs = exports.Ipsum = undefined;

var _server = require("react-dom/server");

var _server2 = (0, _interopRequireDefault2.default)(_server);

var _prettifyHtml = require("prettify-html");

var _prettifyHtml2 = (0, _interopRequireDefault2.default)(_prettifyHtml);

var _react = require("react");

var _react2 = (0, _interopRequireDefault2.default)(_react);

var _fs = require("fs");

var _fs2 = (0, _interopRequireDefault2.default)(_fs);

var _render = require("./render");

var _files = require("./files");

var _parse = require("./parse");

var _settings = require("./settings");

var _helper = require("./helper");

var _site = require("./site");

var _pages = require("./pages");

var _store = require("./store");

var _path = require("./path");

var _nav = require("./nav");

const ReactDocs = require('react-docgen');

/**
 * The source of our ipsum lorem
 *
 * @type {string}
 */
const Ipsum = exports.Ipsum = _fs2.default.readFileSync(_path.Path.normalize(`${__dirname}/../assets/ipsum.txt`), 'utf8').replace(/\r?\n/g, '\n');
/**
 * Build our docs from the source folder
 */


const BuildDocs = exports.BuildDocs = () => {
  _helper.Log.info(`Generating docs`);

  const components = (0, _site.GetLayout)();
  const categories = GetCategories(components);
  const css = GetCss();
  const allLayouts = [];
  categories.map(category => {
    allLayouts.push(GetCategoryComponents(category, components) // getting HTML of components for each category
    );
  });
  return new Promise((resolve, reject) => {
    Promise.all(allLayouts).catch(error => reject(error)).then(pages => {
      const enabledPages = [];
      const allPages = [];
      const forPages = [];
      const forNav = [];
      (0, _files.RemoveDir)([_settings.SETTINGS.get().folder.docs]); // empty docs folder first

      pages.map(page => {
        // let’s prepare some props
        let category = _path.Path.dirname(page[0].file);

        const inside = [];
        const enabledComponents = [];
        page.map(component => {
          // weed out all disabled components
          if (!component.disabled) {
            inside.push(component.file);
            enabledComponents.push(component);
          }
        });

        if (inside.length > 0) {
          if (category === '.') {
            category = 'index'; // preparing some props for the pages
          }

          forNav.push(category);
          forPages.push({
            ID: category,
            components: inside
          });

          _pages.Pages.inject(category, {
            title: category
          }); // injecting the props for each page


          enabledPages.push(enabledComponents);
        }
      });

      _nav.Nav.set(forNav);

      enabledPages.map(page => {
        allPages.push(CreateCategory(forPages, page, css) // let’s create each category page
        );
      });
      allPages.push(CreateIndex(forPages, components, css) // also need that homepage
      );
      allPages.push( // and docs assets; no sexy look without assets!
      (0, _render.RenderAssets)(_path.Path.normalize(`${__dirname}/../.template/docs/assets/`), _path.Path.normalize(`${_settings.SETTINGS.get().folder.docs}/assets/`)));
      allPages.push( // we also need all css files from our project
      (0, _render.RenderAssets)(_settings.SETTINGS.get().folder.assets, _path.Path.normalize(`${_settings.SETTINGS.get().folder.docs}/assets/pages/`)));
      Promise.all(allPages).catch(error => reject(error)).then(() => {
        resolve(allPages.length);
      });
    });
  });
};
/**
 * Get an array of folder names from an array of paths
 *
 * @param  {array} components - An array of all layout components
 *
 * @return {array}            - An array of all category paths
 */


const GetCategories = exports.GetCategories = components => {
  _helper.Log.verbose(`Getting all categories`);

  const categories = [];
  components.map(component => {
    const category = _path.Path.dirname(component);

    if (!categories.includes(category)) {
      categories.push(category);
    }
  });

  _helper.Log.verbose(`Categories are:\n${_helper.Style.yellow(JSON.stringify(categories))}`);

  return categories;
};
/**
 * Pick all components of a category and send them to the parser
 *
 * @param  {string} category   - The category we are in
 * @param  {array}  components - All components in a neat array
 *
 * @return {Promise object}    - The parsed components
 */


const GetCategoryComponents = exports.GetCategoryComponents = (category, components) => {
  _helper.Log.verbose(`Getting all components for categories ${_helper.Style.yellow(category)}`);

  const allComponents = [];

  if (Array.isArray(components)) {
    return new Promise((resolve, reject) => {
      components.map(component => {
        if (_path.Path.dirname(component) === category) {
          _helper.Log.verbose(`Found component ${_helper.Style.yellow(component)} for categories ${_helper.Style.yellow(category)}`);

          allComponents.push(ParseComponent(component) // Parse the component first
          .then(data => BuildPropsYaml(data, component)) // then we build the yaml and props
          .then(data => BuildHTML(data)) // now we shoot it all into the HTML blender
          .then(data => Object.assign({}, {
            category
          }, data)) // and finally we keep category in our return value
          );
        }
      });
      Promise.all(allComponents).catch(error => reject(error)).then(parsedComponents => resolve(parsedComponents));
    });
  } else {
    Promise.reject(`Components must be an array, was "${_helper.Style.yellow(typeof components)}"`);
  }
};
/**
 * Get all css files from the assets folder recursively
 *
 * @param  {string} folder    - The start folder we search in
 * @param  {array}  structure - We keep track of what we found so far to recursively find all folders
 *
 * @return {array}            - An array of all relative paths of all css files
 */


const GetCss = exports.GetCss = (folder = _settings.SETTINGS.get().folder.assets, structure = []) => {
  if (_fs2.default.existsSync(folder)) {
    _fs2.default.readdirSync(folder) // starting from this level
    .map(file => {
      // iterate over all files
      if (_fs2.default.statSync(_path.Path.join(folder, file)).isDirectory()) {
        // if this is a directory we just call ourself again
        structure = [...GetCss(_path.Path.join(folder, file), structure)]; // and spread the result into our array
      } else {
        if (_path.Path.extname(file) === '.css') {
          // we only want css files and ignore invisible files
          _helper.Log.verbose(`Found css in ${_helper.Style.yellow(_path.Path.join(folder, file))}`);

          const replaceString = _path.Path.normalize(_settings.SETTINGS.get().folder.cwd + _settings.SETTINGS.get().folder.assets.replace(_settings.SETTINGS.get().folder.cwd, ''));

          structure.push(_path.Path.join(folder, file).replace(replaceString, ''));
        }
      }
    });

    return structure;
  } else {
    return [];
  }
};
/**
 * Generate the category html and write it to disk
 *
 * @param  {array}  categories          - An array of all categories
 * @param  {array}  components          - An array of all components parsed
 * @param  {string} components.category - The category of this component
 * @param  {string} components.file     - The file name of this component
 * @param  {string} components.yaml     - The parsed yaml markup
 * @param  {string} components.html     - The parsed HTML
 *
 * @return {Promise object}             - Resolve when done
 */


const CreateCategory = exports.CreateCategory = (categories, components, css) => {
  _helper.Log.verbose(`Creating category ${_helper.Style.yellow(components.category)}`);

  return new Promise((resolve, reject) => {
    const categoryPath = _path.Path.normalize(`${_settings.SETTINGS.get().folder.docs}/${_settings.SETTINGS.get().docs.root}/${components[0].category}/index.html`);

    const layoutPath = _settings.SETTINGS.get().docs.category;

    const ID = components[0].category === '.' ? `index` : components[0].category;
    const level = ID === 'index' ? 0 : ID.split('/').length;
    const props = {
      _ID: ID,
      _isDocs: true,
      _title: `Category ${components[0].category}`,
      _level: level,
      _css: css,
      _components: components,
      _categories: categories,
      _pages: _pages.Pages.get(),
      _nav: _nav.Nav.get(),
      _relativeURL: (URL, ID) => {
        if (ID === 'index') {
          ID = `.`;
        }

        return _path.Path.posix.relative(_path.Path.normalize(`${_settings.SETTINGS.get().folder.docs}/${_settings.SETTINGS.get().docs.root}${ID}`), _path.Path.normalize(`${_settings.SETTINGS.get().folder.docs}/${_settings.SETTINGS.get().docs.root}/${URL.replace(_settings.SETTINGS.get().site.root, '')}`));
      }
    };
    (0, _files.ReadFile)(layoutPath).catch(error => reject(error)).then(layout => (0, _render.RenderReact)(_path.Path.basename(layoutPath), props, layout)).then(html => (0, _files.CreateFile)(categoryPath, (0, _parse.ParseHTML)(html))).then(() => resolve());
  });
};
/**
 * Generate the homepage html and write it to disk
 *
 * @param  {array}  categories - An array of all categories
 * @param  {array}  components - An array of all components
 *
 * @return {Promise object} - Resolve when done
 */


const CreateIndex = exports.CreateIndex = (categories, components, css) => {
  _helper.Log.verbose(`Creating index page`);

  return new Promise((resolve, reject) => {
    const categoryPath = _path.Path.normalize(`${_settings.SETTINGS.get().folder.docs}/index.html`);

    const layoutPath = _settings.SETTINGS.get().docs.index;

    const props = {
      _ID: '/homepage/',
      _isDocs: true,
      _title: `Docs home`,
      _css: css,
      _pages: _pages.Pages.get(),
      _nav: _nav.Nav.get(),
      _components: components,
      _categories: categories,
      _relativeURL: (URL, ID) => {
        if (ID === 'index') {
          ID = '.';
        }

        return _path.Path.posix.relative(_settings.SETTINGS.get().folder.docs, _path.Path.normalize(`${_settings.SETTINGS.get().folder.docs}/${_settings.SETTINGS.get().docs.root}/${URL.replace(_settings.SETTINGS.get().site.root, '')}`));
      }
    };
    (0, _files.ReadFile)(layoutPath).catch(error => reject(error)).then(layout => (0, _render.RenderReact)(_path.Path.basename(layoutPath), props, layout)).then(html => (0, _files.CreateFile)(categoryPath, (0, _parse.ParseHTML)(html))).then(() => resolve());
  });
};
/**
 * Get infos about a react component by running it through our propType parser
 *
 * @param  {string} component - The path to the layout file
 *
 * @return {Promise object}   - The object with all gathered infos, format: { file: '', infos: {} }
 */


const ParseComponent = exports.ParseComponent = component => {
  _helper.Log.verbose(`Getting component infos from ${_helper.Style.yellow(component)}`);

  return new Promise((resolve, reject) => {
    const componentPath = _path.Path.normalize(`${_settings.SETTINGS.get().folder.code}/${component}`);

    (0, _files.ReadFile)(componentPath).catch(error => reject(error)).then(react => {
      if (react.includes('@disable-docs')) {
        resolve({
          file: component,
          infos: {},
          disabled: true
        });
      } else {
        try {
          resolve({
            file: component,
            infos: ReactDocs.parse(react),
            disabled: false
          });
        } catch (error) {
          _helper.Log.info(`Trying to gather infos from the react component ${_helper.Style.yellow(component)} failed.`);

          _helper.Log.info(error);

          resolve({
            file: component,
            infos: {},
            disabled: false
          });
        }
      }
    });
  });
};
/**
 * Build our props and yaml from the description of our propTypes
 *
 * @param  {object} object          - The object with infos about this react component
 * @param  {string} object.file     - The file path and name
 * @param  {object} object.infos    - The object with parsed infos about the react component
 * @param  {object} component       - The component name for stack trace
 *
 * @return {object}                 - The object with all gathered infos, format: { file: '', contents: '', infos: {}, props: {}, yaml: '' }
 */


const BuildPropsYaml = exports.BuildPropsYaml = (object, component) => {
  _helper.Log.verbose(`Building props and yaml from the gathered infos for ${_helper.Style.yellow(object.file)}`);

  return new Promise((resolve, reject) => {
    const flags = {
      required: `<span class="cuttlebelle-flag cuttlebelle-flag--optional">Optional</span>`,
      default: value => `<span class="cuttlebelle-flag cuttlebelle-flag--default">default: <span class="cuttlebelle-flag__value">${value}</span></span>`,
      oneof: items => `<span class="cuttlebelle-flag cuttlebelle-flag--default">one of: ` + items.map(item => `<span class="cuttlebelle-flag__value">${item.value}</span>`) + `</span>`
    };
    let props = {};
    let yaml = `<span class="cuttlebelle-yaml-line">layout: ${object.file.slice(0, -3)}</span>\n`;
    let _hasBody = false;

    if (object.infos.props && !object.disabled) {
      Object.keys(object.infos.props).map(propKey => {
        const prop = object.infos.props[propKey];
        let example;
        prop.description = prop.description || '';
        example = (0, _parse.ParseYaml)(prop.description, `props example for ${component}`);
        props = Object.assign({}, props, ParseExample(example));

        if (propKey === '_body') {
          _hasBody = true;
        } else {
          yaml += `<span class="cuttlebelle-yaml-line">${prop.required ? '' : flags['required']}${prop.type.name === 'enum' ? flags['oneof'](prop.type.value) : ''}${prop.defaultValue ? flags['default'](prop.defaultValue.value) : ''}${ReplaceMagic(prop.description)}</span>\n`;
        }
      });
    }

    if (_hasBody) {
      yaml = `---\n${yaml}---\n\n${Ipsum.split('.').slice(0, 4).join('.')}...`;
    }

    resolve({
      file: object.file,
      infos: object.infos,
      props,
      disabled: object.disabled,
      yaml: /*#__PURE__*/_react2.default.createElement("cuttlebellesillywrapper", {
        dangerouslySetInnerHTML: {
          __html: yaml
        }
      })
    });
  });
};
/**
 * Build out HTML for the component so we can show it
 *
 * @param  {object} object          - The object with infos about this react component
 * @param  {string} object.file     - The file path and name
 * @param  {object} object.infos    - The object with parsed infos about the react component
 * @param  {object} object.props    - The object with all props we need
 * @param  {string} object.yaml     - The yaml
 *
 * @return {object}                 - The object with all gathered infos, format: { file: '', yaml: '', html: '' }
 */


const BuildHTML = exports.BuildHTML = object => {
  _helper.Log.verbose(`Building HTML for ${_helper.Style.yellow(object.file)}`);

  return new Promise((resolve, reject) => {
    let html = ''; // let’s provide the same props a real site would have

    object.props._ID = object.props._ID || _settings.SETTINGS.get().docs.IDProp;
    object.props._self = object.props._self || _settings.SETTINGS.get().docs.selfProp;
    object.props._isDocs = true;
    object.props._nav = object.props._nav || _settings.SETTINGS.get().docs.navProp;
    object.props._pages = object.props._pages || _settings.SETTINGS.get().docs.pagesProp;
    object.props._relativeURL = object.props._relativeURL || _render.RelativeURL;
    object.props._storeSet = _store.Store.set;
    object.props._store = _store.Store.get;

    object.props._parseYaml = (yaml, file) => (0, _parse.ParseYaml)(yaml, file);

    object.props._parseReact = component => {
      try {
        return _server2.default.renderToStaticMarkup(component);
      } catch (error) {
        _helper.Log.error(`An error occurred inside ${_helper.Style.yellow(object.file)} while running ${_helper.Style.yellow('_renderReact')}`);

        _helper.Log.error(error);
      }
    };

    const parents = object.props._ID.split('/').map((item, i) => {
      return object.props._ID.split('/').splice(0, object.props._ID.split('/').length - i).join('/');
    }).reverse();

    object.props._parents = object.props._parents || parents;

    object.props._parseMD = markdown => /*#__PURE__*/_react2.default.createElement("cuttlebellesillywrapper", {
      key: `${object.props._ID}-md`,
      dangerouslySetInnerHTML: {
        __html: (0, _parse.ParseMD)(markdown, object.props._self, {
          _ID: object.props._ID,
          _isDocs: true,
          _self: object.props._self,
          _parents: object.props._parents,
          _storeSet: object.props._storeSet,
          _store: object.props._store,
          _nav: object.props._nav,
          _relativeURL: object.props._relativeURL,
          _parseYaml: object.props._parseYaml,
          _parseReact: object.props._parseReact
        })
      }
    });

    if (!object.disabled) {
      const componentPath = _path.Path.normalize(`${_settings.SETTINGS.get().folder.code}/${object.file}`);

      (0, _render.RenderReact)(componentPath, object.props).then(html => {
        resolve({
          file: object.file,
          yaml: object.yaml,
          disabled: object.disabled,
          html: (0, _prettifyHtml2.default)((0, _parse.ParseHTML)(html)).replace(/\r?\n/g, '\n'),
          component: /*#__PURE__*/_react2.default.createElement("cuttlebellesillywrapper", {
            dangerouslySetInnerHTML: {
              __html: html
            }
          })
        });
      });
    } else {
      resolve({
        file: object.file,
        yaml: object.yaml,
        disabled: object.disabled,
        html: (0, _prettifyHtml2.default)((0, _parse.ParseHTML)(html)).replace(/\r?\n/g, '\n'),
        component: /*#__PURE__*/_react2.default.createElement("cuttlebellesillywrapper", {
          dangerouslySetInnerHTML: {
            __html: html
          }
        })
      });
    }
  });
};
/**
 * Parse an example object
 *
 * @param  {object} example - The example from our props description already rendered in yaml
 *
 * @return {object}         - The example object with all magic strings replaced
 */


const ParseExample = exports.ParseExample = example => {
  _helper.Log.verbose(`Parsing example for magic inside ${_helper.Style.yellow(example)}`);

  const parsedExample = Object.assign({}, example); // cloning

  vocabulary.map(command => {
    Object.keys(example).map(key => {
      const exampleVar = example[key];

      if (typeof exampleVar === 'object') {// TODO
      } else if (typeof exampleVar === 'string' && exampleVar.includes('(' + command.name + ')(')) {
        const partials = exampleVar.split(`(${command.name})(`);
        const amount = parseInt(partials[1].slice(0, -1));

        if (amount > 0) {
          parsedExample[key] = command.func(amount);
        }
      }
    });
  });
  return parsedExample;
};
/**
 * Replace some magic strings with something more human readable
 *
 * @param  {string} example - The string to be unmagified
 *
 * @return {string}         - More human readable string
 */


const ReplaceMagic = exports.ReplaceMagic = example => {
  let parsedExample = example;
  vocabulary.map(command => {
    const regex = new RegExp(`(\\(${command.name}\\))[(].*[)]`, 'g');
    parsedExample = parsedExample.replace(regex, command.replacement);
  });
  return parsedExample.replace(/\r?\n/g, '\n');
};
/**
 * Make a partial placeholder
 *
 * @param  {integer} amount - The amount of partials we want to show
 *
 * @return {react object}   - The partial placeholders
 */


const MakePartials = exports.MakePartials = amount => {
  const html = '<img src="http://via.placeholder.com/700x100?text=partial" class="cuttlebelle-partial" /> '.repeat(amount);
  return /*#__PURE__*/_react2.default.createElement("cuttlebellesillywrapper", {
    dangerouslySetInnerHTML: {
      __html: html
    }
  });
};
/**
 * Make some dummy text from a text file with n amount of sentences
 *
 * @param  {integer} amount - Amount of sentences
 *
 * @return {react object}   - The dummy text
 */


const MakeIpsum = exports.MakeIpsum = amount => {
  const sentences = Ipsum.split('.');
  let output = '';

  if (amount >= sentences.length) {
    const mulitplier = Math.floor(amount / sentences.length);
    output = `${Ipsum}\n`.repeat(mulitplier);
    amount -= mulitplier * sentences.length;
  }

  for (let i = 0; i < amount; i++) {
    output += `${sentences[i]}.`;
  }

  ;
  output = (0, _parse.ParseMD)(output).replace(/(?:\r\n|\r|\n)/g, ' ').replace(/\r?\n/g, '\n');
  return /*#__PURE__*/_react2.default.createElement("cuttlebellesillywrapper", {
    dangerouslySetInnerHTML: {
      __html: output
    }
  });
};
/**
 * Magic strings and how to handle them
 *
 * @type {Array}
 */


const vocabulary = exports.vocabulary = [{
  name: 'partials',
  func: MakePartials,
  replacement: '\n  - partial1.md\n  - partial2.md\n  - partial3.md'
}, {
  name: 'text',
  func: MakeIpsum,
  replacement: `${Ipsum.slice(0, 53).replace(/\r?\n/g, '\n')}...`
}];