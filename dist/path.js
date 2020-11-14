/***************************************************************************************************************************************************************
 *
 * Path wrapper
 *
 * Path - Wrapping the path standard lib to unify directory separators
 *
 * @flow
 **************************************************************************************************************************************************************/
'use strict'; //--------------------------------------------------------------------------------------------------------------------------------------------------------------
// Dependencies
//--------------------------------------------------------------------------------------------------------------------------------------------------------------

var _interopRequireDefault3 = require("@babel/runtime/helpers/interopRequireDefault");

var _interopRequireDefault2 = _interopRequireDefault3(require("@babel/runtime/helpers/interopRequireDefault"));

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Path = undefined;

var _defineProperty2 = require("@babel/runtime/helpers/defineProperty");

var _defineProperty3 = (0, _interopRequireDefault2.default)(_defineProperty2);

var _path = require("path");

var _path2 = (0, _interopRequireDefault2.default)(_path);

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { (0, _defineProperty3.default)(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

//--------------------------------------------------------------------------------------------------------------------------------------------------------------
// Local
//--------------------------------------------------------------------------------------------------------------------------------------------------------------

/**
 * Wrapping the path standard lib to unify directory separators
 *
 * @type {Object}
 */
const Path = exports.Path = _objectSpread(_objectSpread({}, _path2.default.posix), {}, {
  sep: '/',
  normalize: (input
  /*: string */
  ) =>
  /*: string */
  _path2.default.posix.normalize(input.replace(/\\/g, '/')).replace(/\\/g, '/')
});