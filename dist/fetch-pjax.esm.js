import assignDeep from 'assign-deep';
import domify from 'domify';
import isNil from 'lodash.isnil';
import isString from 'lodash.isstring';
import bindAll from 'lodash.bindall';
import curry from 'lodash.curry';

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

class FetchPjax {
	constructor(options) {
		this.options = this.getDefaults(options);

		this.targets = {};

		this.state = {};

		this.initpop = false;

		this.isPjaxing = false;

		// Bind all the callbacks
		bindAll(this, [
			'handlePjaxSuccess',
			'handlePjaxError',
			'handlePopState',
			'handleKeyPress',
			'handleFormSubmit',
			'handleFetchNonSuccess',
			'handleFetchTextResponse'
		]);

		// Requires two args but for Promise chaining it's
		// easier to curry/partially apply
		this.handlePjaxSuccess = curry(this.handlePjaxSuccess, 2);

		if (this.options.autoInit) {
			this.init();
		}
	}

	getDefaults(options) {
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
				headers: {
					'X-PJAX': true // identify PJAX requests
				}
			},
			popStateUseContentCache: true,
			trackInitialState: true,
			modifyFetchOptions: false,
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
				true,
				'replace' // avoids a double initial entry
			);
		}

		this.addListeners();
	}

	addListeners() {
		document.addEventListener(this.options.eventType, e => {
			const target = this.checkMatchingTarget(e);
			if (target) {
				this.handleEventType(target, e);
			}
		});

		document.addEventListener('keydown', this.handleKeyPress);

		document.addEventListener('submit', this.handleFormSubmit);

		window.addEventListener('popstate', e => this.handlePopState(e));
	}

	checkMatchingTarget(e) {
		let target = e.target;

		if (target && target.matches(this.options.selector)) {
			return target;
		}

		return (target = target.closest(this.options.selector));
	}

	handleKeyPress(e) {
		const enterKey = 13;
		let key = e.which || e.keyCode;

		if (key !== enterKey) {
			return;
		}

		// Check we hit "Enter" on a matching target element
		// else it just fires for everything!
		const target = this.checkMatchingTarget(e);

		if (target) {
			this.handleEventType(target, e);
		}
	}

	handleFormSubmit(e) {
		let target = e.target;

		if (isNil(target)) {
			return;
		}
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

		// If no state than trigger a PJAX request for the page
		if (isNil(this.state)) {
			return this.doPjax(document.location.href);
		}

		const { contents, url } = this.state;

		// If we have a cached HTML for this History state then just show that
		if (
			this.options.popStateUseContentCache &&
			!isNil(contents) &&
			contents.length &&
			isString(contents)
		) {
			this.triggerCallback('onBeforePjax');

			// Set a fake timer to indicate to the user that something
			// happened as per UX best practise
			setTimeout(() => {
				this.render(JSON.parse(contents));
				this.triggerCallback('onSuccessPjax', {
					url,
					html: contents
				});
				this.triggerCallback('onCompletePjax');
			}, this.options.popStateFauxLoadTime);
		} else if (!isNil(url)) {
			// Otherwise fetch the content via PJAX
			this.doPjax(this.state.url, false);
		}
	}

	buildFetchOptions(url) {
		const fetchOptions = this.options.fetchOptions;
		fetchOptions.url = url;
		return this.beforeSend(fetchOptions);
	}

	doPjax(url, shouldUpdateState = true) {
		// If we are already processing a request just ignore
		// nb: until we have a way to cancel fetch requests
		// we can't manage this more effectively
		if (this.isPjaxing) return;

		// Set state as Pjaxing to block
		this.isPjaxing = true;

		const fetchOptions = this.buildFetchOptions(url);

		this.triggerCallback('onBeforePjax', {
			fetchOptions
		});

		// Curried - allows us provide the url arg upfront
		const handlePjaxSuccess = this.handlePjaxSuccess(url);

		// fetchOptions.headers = new Headers(fetchOptions.headers);
		fetch(fetchOptions.url, fetchOptions)
			.then(response => {
				this.isPjaxing = false; // Reset Pjax state
				return response; // this is needed for the chain
			})
			.then(this.handleFetchNonSuccess)
			.then(this.handleFetchTextResponse)
			.then(handlePjaxSuccess)
			.catch(this.handlePjaxError);
	}

	handlePjaxSuccess(url, html) {
		this.updateHistoryState(url, html);

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
	}

	handlePjaxError(error) {
		if (isString(error)) {
			error = {
				status: 'fail',
				statusText: error
			};
		}
		// Reset Pjax state
		this.isPjaxing = false;

		this.triggerCallback('onErrorPjax', error);
		this.triggerCallback('onCompletePjax');
	}

	handleFetchNonSuccess(response) {
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
		const beforeSendOption = this.options.modifyFetchOptions;

		// Allow overide of Request options via function
		const overides = typeof beforeSendOption === 'function'
			? beforeSendOption(fetchOptions)
			: {};

		return assignDeep({}, fetchOptions, overides);
	}

	handleFetchTextResponse(response) {
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
		if (isNil(html) || !isString(html)) return;

		// Reliably parse the PJAX'd HTML string into a document fragment
		const dom = domify(html);

		this.triggerCallback('onBeforeRender');

		Object.keys(this.targets).forEach(targetKey => {
			const targetConfig = this.targets[targetKey];

			const targetEl = targetConfig.target;
			const contentEl = dom.querySelector(targetConfig.selector);
			const renderer = targetConfig.renderer;

			if (isNil(targetEl)) {
				console.log(
					`targetEl ${targetConfig.target} is unavailable in renderer "${targetKey}"`
				);
				return;
			}

			if (isNil(contentEl)) {
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
				targetKey,
				targetEl,
				contentEl,
				renderer
			});
		});

		this.triggerCallback('onAfterRender');
	}

	updateHistoryState(url, html, force = false, type = 'push') {
		if (!force && window.history.state && window.history.state.url == url) {
			return;
		}

		this.state = {
			url: url,
			contents: JSON.stringify(html)
		};

		const method = `${type}State`;

		window.history[method](this.state, null, url);
	}
}

// Apply Mixins
applyMixins(FetchPjax, TriggerCallback);

export default FetchPjax;
