(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global.FetchPjax = factory());
}(this, (function () { 'use strict';

	/**
	 * APPLY MIXINS
	 * accepts a target constructor and extends it's delegate prototype
	 * with one or more mixin objects. This follows the best practice of
	 * preferring object composition over class hierarchies
	 */
	function applyMixins(target, ...mixins) {
		mixins.reduce(function(acc, mixin) {
			return Object.assign(acc, mixin);
		}, target.prototype);

		return target;
	}

	/**
	 * TRIGGER CALLBACK
	 *
	 * provides ability to trigger a named callback function which is passed in as a "setting"
	 */

	const TriggerCallback = {
		triggerCallback(eventName, data = {}) {
			if (this.options.callbacks === undefined) {
				return;
			}

			if (
				this.options.callbacks[eventName] !== undefined &&
				typeof this.options.callbacks[eventName] === 'function'
			) {
				this.options.callbacks[eventName](this, data);
			}
		}
	};

	/*!
	 * is-primitive <https://github.com/jonschlinkert/is-primitive>
	 *
	 * Copyright (c) 2014-2015, Jon Schlinkert.
	 * Licensed under the MIT License.
	 */

	// see http://jsperf.com/testing-value-is-primitive/7
	var isPrimitive = function isPrimitive(value) {
	  return value == null || (typeof value !== 'function' && typeof value !== 'object');
	};

	/*!
	 * assign-symbols <https://github.com/jonschlinkert/assign-symbols>
	 *
	 * Copyright (c) 2015, Jon Schlinkert.
	 * Licensed under the MIT License.
	 */

	var assignSymbols = function(receiver, objects) {
	  if (receiver === null || typeof receiver === 'undefined') {
	    throw new TypeError('expected first argument to be an object.');
	  }

	  if (typeof objects === 'undefined' || typeof Symbol === 'undefined') {
	    return receiver;
	  }

	  if (typeof Object.getOwnPropertySymbols !== 'function') {
	    return receiver;
	  }

	  var isEnumerable = Object.prototype.propertyIsEnumerable;
	  var target = Object(receiver);
	  var len = arguments.length, i = 0;

	  while (++i < len) {
	    var provider = Object(arguments[i]);
	    var names = Object.getOwnPropertySymbols(provider);

	    for (var j = 0; j < names.length; j++) {
	      var key = names[j];

	      if (isEnumerable.call(provider, key)) {
	        target[key] = provider[key];
	      }
	    }
	  }
	  return target;
	};

	var toString = Object.prototype.toString;

	/**
	 * Get the native `typeof` a value.
	 *
	 * @param  {*} `val`
	 * @return {*} Native javascript type
	 */

	var kindOf = function kindOf(val) {
	  var type = typeof val;

	  // primitivies
	  if (type === 'undefined') {
	    return 'undefined';
	  }
	  if (val === null) {
	    return 'null';
	  }
	  if (val === true || val === false || val instanceof Boolean) {
	    return 'boolean';
	  }
	  if (type === 'string' || val instanceof String) {
	    return 'string';
	  }
	  if (type === 'number' || val instanceof Number) {
	    return 'number';
	  }

	  // functions
	  if (type === 'function' || val instanceof Function) {
	    if (typeof val.constructor.name !== 'undefined' && val.constructor.name.slice(0, 9) === 'Generator') {
	      return 'generatorfunction';
	    }
	    return 'function';
	  }

	  // array
	  if (typeof Array.isArray !== 'undefined' && Array.isArray(val)) {
	    return 'array';
	  }

	  // check for instances of RegExp and Date before calling `toString`
	  if (val instanceof RegExp) {
	    return 'regexp';
	  }
	  if (val instanceof Date) {
	    return 'date';
	  }

	  // other objects
	  type = toString.call(val);

	  if (type === '[object RegExp]') {
	    return 'regexp';
	  }
	  if (type === '[object Date]') {
	    return 'date';
	  }
	  if (type === '[object Arguments]') {
	    return 'arguments';
	  }
	  if (type === '[object Error]') {
	    return 'error';
	  }
	  if (type === '[object Promise]') {
	    return 'promise';
	  }

	  // buffer
	  if (isBuffer(val)) {
	    return 'buffer';
	  }

	  // es6: Map, WeakMap, Set, WeakSet
	  if (type === '[object Set]') {
	    return 'set';
	  }
	  if (type === '[object WeakSet]') {
	    return 'weakset';
	  }
	  if (type === '[object Map]') {
	    return 'map';
	  }
	  if (type === '[object WeakMap]') {
	    return 'weakmap';
	  }
	  if (type === '[object Symbol]') {
	    return 'symbol';
	  }
	  
	  if (type === '[object Map Iterator]') {
	    return 'mapiterator';
	  }
	  if (type === '[object Set Iterator]') {
	    return 'setiterator';
	  }
	  if (type === '[object String Iterator]') {
	    return 'stringiterator';
	  }
	  if (type === '[object Array Iterator]') {
	    return 'arrayiterator';
	  }
	  
	  // typed arrays
	  if (type === '[object Int8Array]') {
	    return 'int8array';
	  }
	  if (type === '[object Uint8Array]') {
	    return 'uint8array';
	  }
	  if (type === '[object Uint8ClampedArray]') {
	    return 'uint8clampedarray';
	  }
	  if (type === '[object Int16Array]') {
	    return 'int16array';
	  }
	  if (type === '[object Uint16Array]') {
	    return 'uint16array';
	  }
	  if (type === '[object Int32Array]') {
	    return 'int32array';
	  }
	  if (type === '[object Uint32Array]') {
	    return 'uint32array';
	  }
	  if (type === '[object Float32Array]') {
	    return 'float32array';
	  }
	  if (type === '[object Float64Array]') {
	    return 'float64array';
	  }

	  // must be a plain object
	  return 'object';
	};

	/**
	 * If you need to support Safari 5-7 (8-10 yr-old browser),
	 * take a look at https://github.com/feross/is-buffer
	 */

	function isBuffer(val) {
	  return val.constructor
	    && typeof val.constructor.isBuffer === 'function'
	    && val.constructor.isBuffer(val);
	}

	function assign(target/*, objects*/) {
	  target = target || {};
	  var len = arguments.length, i = 0;
	  if (len === 1) {
	    return target;
	  }
	  while (++i < len) {
	    var val = arguments[i];
	    if (isPrimitive(target)) {
	      target = val;
	    }
	    if (isObject(val)) {
	      extend(target, val);
	    }
	  }
	  return target;
	}

	/**
	 * Shallow extend
	 */

	function extend(target, obj) {
	  assignSymbols(target, obj);

	  for (var key in obj) {
	    if (key !== '__proto__' && hasOwn(obj, key)) {
	      var val = obj[key];
	      if (isObject(val)) {
	        if (kindOf(target[key]) === 'undefined' && kindOf(val) === 'function') {
	          target[key] = val;
	        }
	        target[key] = assign(target[key] || {}, val);
	      } else {
	        target[key] = val;
	      }
	    }
	  }
	  return target;
	}

	/**
	 * Returns true if the object is a plain object or a function.
	 */

	function isObject(obj) {
	  return kindOf(obj) === 'object' || kindOf(obj) === 'function';
	}

	/**
	 * Returns true if the given `key` is an own property of `obj`.
	 */

	function hasOwn(obj, key) {
	  return Object.prototype.hasOwnProperty.call(obj, key);
	}

	/**
	 * Expose `assign`
	 */

	var assignDeep = assign;

	/**
	 * Expose `parse`.
	 */

	var domify = parse;

	/**
	 * Tests for browser support.
	 */

	var innerHTMLBug = false;
	var bugTestDiv;
	if (typeof document !== 'undefined') {
	  bugTestDiv = document.createElement('div');
	  // Setup
	  bugTestDiv.innerHTML = '  <link/><table></table><a href="/a">a</a><input type="checkbox"/>';
	  // Make sure that link elements get serialized correctly by innerHTML
	  // This requires a wrapper element in IE
	  innerHTMLBug = !bugTestDiv.getElementsByTagName('link').length;
	  bugTestDiv = undefined;
	}

	/**
	 * Wrap map from jquery.
	 */

	var map = {
	  legend: [1, '<fieldset>', '</fieldset>'],
	  tr: [2, '<table><tbody>', '</tbody></table>'],
	  col: [2, '<table><tbody></tbody><colgroup>', '</colgroup></table>'],
	  // for script/link/style tags to work in IE6-8, you have to wrap
	  // in a div with a non-whitespace character in front, ha!
	  _default: innerHTMLBug ? [1, 'X<div>', '</div>'] : [0, '', '']
	};

	map.td =
	map.th = [3, '<table><tbody><tr>', '</tr></tbody></table>'];

	map.option =
	map.optgroup = [1, '<select multiple="multiple">', '</select>'];

	map.thead =
	map.tbody =
	map.colgroup =
	map.caption =
	map.tfoot = [1, '<table>', '</table>'];

	map.polyline =
	map.ellipse =
	map.polygon =
	map.circle =
	map.text =
	map.line =
	map.path =
	map.rect =
	map.g = [1, '<svg xmlns="http://www.w3.org/2000/svg" version="1.1">','</svg>'];

	/**
	 * Parse `html` and return a DOM Node instance, which could be a TextNode,
	 * HTML DOM Node of some kind (<div> for example), or a DocumentFragment
	 * instance, depending on the contents of the `html` string.
	 *
	 * @param {String} html - HTML string to "domify"
	 * @param {Document} doc - The `document` instance to create the Node for
	 * @return {DOMNode} the TextNode, DOM Node, or DocumentFragment instance
	 * @api private
	 */

	function parse(html, doc) {
	  if ('string' != typeof html) throw new TypeError('String expected');

	  // default to the global `document` object
	  if (!doc) doc = document;

	  // tag name
	  var m = /<([\w:]+)/.exec(html);
	  if (!m) return doc.createTextNode(html);

	  html = html.replace(/^\s+|\s+$/g, ''); // Remove leading/trailing whitespace

	  var tag = m[1];

	  // body support
	  if (tag == 'body') {
	    var el = doc.createElement('html');
	    el.innerHTML = html;
	    return el.removeChild(el.lastChild);
	  }

	  // wrap map
	  var wrap = map[tag] || map._default;
	  var depth = wrap[0];
	  var prefix = wrap[1];
	  var suffix = wrap[2];
	  var el = doc.createElement('div');
	  el.innerHTML = prefix + html + suffix;
	  while (depth--) el = el.lastChild;

	  // one element
	  if (el.firstChild == el.lastChild) {
	    return el.removeChild(el.firstChild);
	  }

	  // several elements
	  var fragment = doc.createDocumentFragment();
	  while (el.firstChild) {
	    fragment.appendChild(el.removeChild(el.firstChild));
	  }

	  return fragment;
	}

	/**
	 * lodash 4.0.0 (Custom Build) <https://lodash.com/>
	 * Build: `lodash modularize exports="npm" -o ./`
	 * Copyright 2012-2016 The Dojo Foundation <http://dojofoundation.org/>
	 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
	 * Copyright 2009-2016 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
	 * Available under MIT license <https://lodash.com/license>
	 */

	/**
	 * Checks if `value` is `null` or `undefined`.
	 *
	 * @static
	 * @memberOf _
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is nullish, else `false`.
	 * @example
	 *
	 * _.isNil(null);
	 * // => true
	 *
	 * _.isNil(void 0);
	 * // => true
	 *
	 * _.isNil(NaN);
	 * // => false
	 */
	function isNil(value) {
	  return value == null;
	}

	var lodash_isnil = isNil;

	/**
	 * lodash 4.0.1 (Custom Build) <https://lodash.com/>
	 * Build: `lodash modularize exports="npm" -o ./`
	 * Copyright 2012-2016 The Dojo Foundation <http://dojofoundation.org/>
	 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
	 * Copyright 2009-2016 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
	 * Available under MIT license <https://lodash.com/license>
	 */

	/** `Object#toString` result references. */
	var stringTag = '[object String]';

	/** Used for built-in method references. */
	var objectProto = Object.prototype;

	/**
	 * Used to resolve the [`toStringTag`](http://ecma-international.org/ecma-262/6.0/#sec-object.prototype.tostring)
	 * of values.
	 */
	var objectToString = objectProto.toString;

	/**
	 * Checks if `value` is classified as an `Array` object.
	 *
	 * @static
	 * @memberOf _
	 * @type Function
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
	 * @example
	 *
	 * _.isArray([1, 2, 3]);
	 * // => true
	 *
	 * _.isArray(document.body.children);
	 * // => false
	 *
	 * _.isArray('abc');
	 * // => false
	 *
	 * _.isArray(_.noop);
	 * // => false
	 */
	var isArray = Array.isArray;

	/**
	 * Checks if `value` is object-like. A value is object-like if it's not `null`
	 * and has a `typeof` result of "object".
	 *
	 * @static
	 * @memberOf _
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
	 * @example
	 *
	 * _.isObjectLike({});
	 * // => true
	 *
	 * _.isObjectLike([1, 2, 3]);
	 * // => true
	 *
	 * _.isObjectLike(_.noop);
	 * // => false
	 *
	 * _.isObjectLike(null);
	 * // => false
	 */
	function isObjectLike(value) {
	  return !!value && typeof value == 'object';
	}

	/**
	 * Checks if `value` is classified as a `String` primitive or object.
	 *
	 * @static
	 * @memberOf _
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
	 * @example
	 *
	 * _.isString('abc');
	 * // => true
	 *
	 * _.isString(1);
	 * // => false
	 */
	function isString(value) {
	  return typeof value == 'string' ||
	    (!isArray(value) && isObjectLike(value) && objectToString.call(value) == stringTag);
	}

	var lodash_isstring = isString;

	class FetchPjax {
		constructor(options) {
			this.options = this.setOptions(options);

			this.targets = {};

			this.state = {};

			this.initpop = false;

			this.isPjaxing = false;

			if (this.options.autoInit) {
				this.init();
			}
		}

		setOptions(options) {
			const defaults = {
				autoInit: true,
				eventType: 'click',
				selector: 'a',
				targets: {
					content: 'main',
					title: 'title'
				},
				popStateFauxLoadTime: 300,
				fetchOptions: {
					// can be overidden on a per request basis as required using beforeSend
					headers: {
						'X-PJAX': true
					}
				},
				trackInitialState: true,
				callbacks: {
					onBeforePjax: false,
					onSuccessPjax: false,
					onErrorPjax: false,
					onCompletePjax: false,
					onBeforeRender: false,
					onAfterRender: false,
					onBeforeTargetRender: false,
					onAfterTargetRender: false
				}
			};

			return Object.assign({}, defaults, options);
		}

		init() {
			this.parseTargets();

			// Typically we will want to track the initial url and html into the History API state
			if (this.options.trackInitialState) {
				this.updateHistoryState(
					document.location.href,
					document.documentElement.innerHTML,
					true
				);
			}

			this.addListeners();
		}

		addListeners() {
			document.addEventListener(this.options.eventType, e => {
				let target = e.target;

				if (!target.matches(this.options.selector)) {
					target = target.closest(this.options.selector);
				}

				if (target && target.matches(this.options.selector)) {
					this.handleEventType(target, e);
				}
			});

			document.addEventListener('keydown', e => {
				let key = e.which || e.keyCode;

				if (key !== 13) {
					return;
				}

				let target = e.target;

				if (!target.matches(this.options['selector'])) {
					target = target.closest(this.options['selector']);
				}

				if (target && target.matches(this.options['selector'])) {
					this.handleEventType(target, e);
				}
			});

			document.addEventListener('submit', e => {
				let target = e.target;

				if (!target) {
					return;
				}

				this.handleFormSubmit(target, e);
			});

			window.addEventListener('popstate', e => {
				this.handlePopState(e);
			});
		}

		handleFormSubmit(target, e) {
			// Grab all the valid inputs
			const formData = new FormData(target);

			let query = '';

			for (let pair of formData.entries()) {
				query += pair[0] + '=' + pair[1];
			}

			if (query === undefined) {
				return;
			}

			// Only cancel event if all the conditionals pass
			e.preventDefault();

			const url = `${target.action}?${query}`;

			// Request this
			this.doPjax(url);
		}

		parseTargets() {
			Object.keys(this.options.targets).forEach(targetKey => {
				const value = this.options.targets[targetKey];
				let selector;
				let renderer;

				if (value !== null && typeof value === 'object') {
					selector = value.selector;
					renderer = value.renderer;
				} else {
					selector = value; // value is a selector string
				}

				const target = document.querySelector(selector);

				if (target) {
					this.targets[targetKey] = {
						target,
						selector,
						renderer
					};
				} else {
					throw new Error(
						`The target with identifier '${targetKey}' could not be matched in the initial DOM using selector '${selector}'.`
					);
				}
			});
		}

		handleEventType(element, e) {
			// Ignore middle clicks and cmd/ctrl + clicks
			if (e.which > 13 || 13 > e.which > 1 || e.metaKey || e.ctrlKey) return;

			if (element.nodeName.toUpperCase() !== 'A') return;

			if (element.getAttribute('target') === '_blank') return;

			const href = element.href; // avoid the literal href attr as this may be a relative path as a string which cannot be parsed by new URL

			if (!href) {
				return;
			}

			// Allow cross origin links to behave as normal
			if (new URL(href).hostname !== location.hostname) {
				return;
			}

			// Request this
			this.doPjax(href);

			// Only cancel event if all the conditionals pass
			e.preventDefault();
		}

		handlePopState(e) {
			this.state = e.state;
			// Bail for empty state
			if (lodash_isnil(this.state)) return;

			// If we have a cached HTML for this History state then just show that
			if (
				!lodash_isnil(e.state.contents) &&
				e.state.contents.length &&
				lodash_isstring(e.state.contents)
			) {
				this.triggerCallback('onBeforePjax');

				// Set a fake timer to indicate to the user that something
				// happened as per UX best practise
				setTimeout(() => {
					this.render(JSON.parse(e.state.contents));
					this.triggerCallback('onSuccessPjax');
					this.triggerCallback('onCompletePjax');
				}, this.options.popStateFauxLoadTime);
			} else if (!lodash_isnil(e.state.url)) {
				// Otherwise fetch the content via PJAX
				this.doPjax(e.state.url, false);
			}
		}

		doPjax(url, shouldUpdateState = true) {
			// If we are already processing a request just ignore
			// nb: until we have a way to cancel fetch requests
			// we can't manage this more effectively
			if (this.isPjaxing) return;

			// Set state as Pjaxing to block
			this.isPjaxing = true;

			const fetchOptions = this.options.fetchOptions;
			fetchOptions['url'] = url;

			let requestOptions = this.beforeSend(fetchOptions);

			this.triggerCallback('onBeforePjax', {
				requestOptions
			});

			// requestOptions.headers = new Headers(requestOptions.headers);
			fetch(requestOptions.url, requestOptions)
				.then(response => {
					// Reset Pjax state
					this.isPjaxing = false;
					return response; // this is needed for the chain
				})
				.then(this.handleErrors)
				.then(this.handleTextResponse)
				.then(html => {
					if (shouldUpdateState) {
						this.updateHistoryState(url, html);
					}

					try {
						this.render(html);
					} catch (e) {
						throw new Error(`Unable to render page at ${url}: ${e}`);
					}

					this.triggerCallback('onSuccessPjax', {
						url,
						html
					});
					this.triggerCallback('onCompletePjax');
				})
				.catch(error => {
					// Reset Pjax state
					this.isPjaxing = false;

					this.triggerCallback('onErrorPjax', error);
					this.triggerCallback('onCompletePjax');
				});
		}

		handleErrors(response) {
			if (!response.ok) {
				return Promise.reject(
					Object.assign(
						{},
						{
							status: response.status,
							statusText: response.statusText
						},
						response
					)
				);
			}

			return response;
		}

		beforeSend(fetchOptions) {
			// TODO - add edge case to clone the "body" option if it is an instance of
			// FormData. Then once the main merge has completed re-overide the body option
			// with the cloned FormData. This is required because assignDeep will not correctly
			// handle non basic objects so FormData gets lost in the "assign" operation
			const beforeSendOption = this.options.beforeSend;

			// Allow overide of Request options via function
			const overides = typeof beforeSendOption === 'function'
				? beforeSendOption(fetchOptions)
				: {};

			return assignDeep({}, fetchOptions, overides);
		}

		handleTextResponse(response) {
			return response.text().then(text => {
				if (text && text.length) {
					return Promise.resolve(text);
				} else {
					return Promise.reject(
						Object.assign(
							{},
							{
								status: response.status,
								statusText: response.statusText
							},
							text
						)
					);
				}
			});
		}

		render(html) {
			if (lodash_isnil(html) || !lodash_isstring(html)) return;

			// Reliably parse the PJAX'd HTML string into a document fragment
			const dom = domify(html);

			this.triggerCallback('onBeforeRender');

			Object.keys(this.targets).forEach(targetKey => {
				const targetConfig = this.targets[targetKey];

				const targetEl = targetConfig.target;
				const contentEl = dom.querySelector(targetConfig.selector);
				const renderer = targetConfig.renderer;

				if (lodash_isnil(targetEl)) {
					console.log(
						`targetEl ${targetConfig.target} is unavailable in renderer "${targetKey}"`
					);
					return;
				}

				if (lodash_isnil(contentEl)) {
					console.log(
						`contentEl ${targetConfig.selector} is unavailable in renderer "${targetKey}"`
					);
					return;
				}

				this.triggerCallback('onBeforeTargetRender', {
					targetKey,
					targetEl,
					contentEl,
					renderer
				});

				// If the user supplied a customer renderer for this target
				// then call that
				if (typeof renderer === 'function') {
					renderer(targetEl, contentEl);
				} else {
					targetEl.innerHTML = contentEl.innerHTML;
				}

				this.triggerCallback('onAfterTargetRender', {
					targetEl,
					contentEl,
					renderer
				});
			});

			this.triggerCallback('onAfterRender');
		}

		updateHistoryState(url, html, force = false) {
			if (!force && window.history.state && window.history.state.url == url) {
				return;
			}

			this.state = {
				url: url,
				contents: JSON.stringify(html)
			};

			window.history.pushState(this.state, null, url);
		}
	}

	// Apply Mixins
	applyMixins(FetchPjax, TriggerCallback);

	return FetchPjax;

})));
