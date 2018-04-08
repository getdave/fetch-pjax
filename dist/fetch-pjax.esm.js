import assignDeep from 'assign-deep';
import domify from 'domify';
import isNil from 'lodash.isnil';
import isEmpty from 'lodash.isempty';
import isString from 'lodash.isstring';
import bindAll from 'lodash.bindall';
import curry from 'lodash.curry';
import 'url-search-params-polyfill';

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

		this.initpop = false;

		this.isPjaxing = false;

		this.currentPathname = '';

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
		this.handlePjaxSuccess = curry(this.handlePjaxSuccess, 4);

		if (this.options.autoInit) {
			this.init();
		}
	}

	getDefaults(options) {
		const defaults = {
			autoInit: true,
			eventType: 'click',
			selector: 'a',
			formSelector: 'form',
			handleForms: true,
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

		this.updateCurrentPathname();

		this.addListeners();
	}

	updateCurrentPathname() {
		this.currentPathname = document.location.pathname;
	}

	addListeners() {
		document.addEventListener(this.options.eventType, e => {
			const target = this.checkMatchingTarget(e);
			if (target) {
				this.handleEventType(target, e);
			}
		});

		document.addEventListener('keydown', this.handleKeyPress);

		if (this.options.handleForms) {
			document.addEventListener('submit', this.handleFormSubmit);
		}

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

	buildQueryStringFromFormData(formData) {
		let query = '';

		for (let pair of formData.entries()) {
			query += `&${pair[0]}=${pair[1]}`;
		}

		// Trim of the first (unwanted) ampersand
		return query.substring(1);
	}

	handleFormSubmit(e) {
		let target = e.target;

		if (isNil(target)) {
			return;
		}

		if (!target.matches(this.options.formSelector)) return;

		// Grab all the valid inputs
		const formData = new FormData(target);

		// Determine whether to send as GET or POST
		if (target.method.toUpperCase() === 'POST') {
			const encoding = target.encoding.includes('form-data')
				? 'form-data'
				: 'urlencoded';

			this.sendFormWithPost(target.action, formData, encoding);
		} else {
			this.sendFormWithGet(target.action, formData);
		}

		// Only cancel event if all the conditionals pass
		e.preventDefault();
	}

	/**
	 * Sends the Form data as a POST request 
	 * see https://stackoverflow.com/questions/46640024/how-do-i-post-form-data-with-fetch-api
	 * @param  {string} url      the url to which the form data request should be sent
	 * @param  {FormData} formData the data from the form being submitted
	 * @return {void}          
	 */
	sendFormWithPost(url, data, type = 'urlencoded') {
		// For everything other than form-data
		// transform the FormData object into a query-string
		// via URLSearchParams (polyfilled)
		if (type !== 'form-data') {
			data = new URLSearchParams(data); // polyfilled via https://www.npmjs.com/package/url-search-params-polyfill
		}

		this.doPjax(url, true, {
			method: 'POST',
			body: data // will be one of FormData or URLSearchParams
		});
	}

	sendFormWithGet(url, formData) {
		const query = this.buildQueryStringFromFormData(formData);
		if (isNil(query)) return;
		url = `${url}?${query}`;
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

		if (element.hash && element.pathname === window.location.pathname)
			return true;

		const href = element.href; // avoid the literal href attr as this may be a relative path as a string which cannot be parsed by new URL

		if (!href) {
			return;
		}

		// Ignore cross origin links and allow to behave as normal
		if (
			location.protocol !== element.protocol ||
			location.hostname !== element.hostname
		) {
			return;
		}

		// Request this
		this.doPjax(href);

		// Only cancel event if all the conditionals pass
		e.preventDefault();
	}

	stripHash(url) {
		return url.replace(/#.*/, '');
	}

	handlePopState(e) {
		const historyState = e.state;

		// On same path so could be hashchange so ignore
		if (this.currentPathname === location.pathname) return;

		// Re-request page content but don't add a new History entry as one already exists
		if (isNil(historyState)) {
			return this.doPjax(document.location.href, false);
		}

		const { contents, url } = historyState;

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

				const hash = this.parseHash(url);

				if (!isNil(hash) && hash.length) {
					this.scrollToTarget(hash);
				}

				this.triggerCallback('onSuccessPjax', {
					url,
					html: contents
				});
				this.triggerCallback('onCompletePjax');
			}, this.options.popStateFauxLoadTime);
		} else if (!isNil(url)) {
			// Otherwise fetch the content via PJAX
			this.doPjax(historyState.url, false);
		}
	}

	buildFetchOptions(optionOverides = {}) {
		let bodyWithNonMergableValues = false;

		let fetchOptions = Object.assign(
			{},
			this.options.fetchOptions,
			optionOverides
		);

		if (
			(fetchOptions.body && fetchOptions.body instanceof FormData) ||
			fetchOptions.body instanceof URLSearchParams
		) {
			bodyWithNonMergableValues = fetchOptions.body;
		}

		fetchOptions = this.beforeSend(fetchOptions);

		// Restore following assign-deep operation but only if user hasn't overidden
		if (bodyWithNonMergableValues && isEmpty(fetchOptions.body)) {
			fetchOptions.body = bodyWithNonMergableValues;
		}

		if (fetchOptions.body && fetchOptions.body instanceof URLSearchParams) {
			fetchOptions.headers = Object.assign({}, fetchOptions.headers, {
				'Content-Type':
					'application/x-www-form-urlencoded; charset=UTF-8'
			});
		}

		// See https://www.npmjs.com/package/url-search-params-polyfill#known-issues
		return fetchOptions;
	}

	parseHash(url) {
		return this.parseURL(url).hash;
	}

	parseURL(url) {
		const a = document.createElement('a');
		a.href = url;
		return a;
	}

	doPjax(url, shouldUpdateState = true, options = {}) {
		// If we are already processing a request just ignore
		// nb: until we have a way to cancel fetch requests
		// we can't manage this more effectively
		if (this.isPjaxing) return;

		// Set state as Pjaxing to block
		this.isPjaxing = true;

		// Is there a hash? Save a reference
		const hash = url.includes('#') ? this.parseHash(url) : '';

		const optionOverides = Object.assign({}, options, {
			url: this.stripHash(url)
		});

		const fetchOptions = this.buildFetchOptions(optionOverides);

		this.triggerCallback('onBeforePjax', {
			fetchOptions
		});

		// Curried - allows us provide the url arg upfront
		const handlePjaxSuccess = this.handlePjaxSuccess(
			url,
			hash,
			shouldUpdateState
		);

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

	scrollToTarget(hash) {
		const hashScrollTarget = document.querySelector(hash);

		if (hashScrollTarget) {
			hashScrollTarget.scrollIntoView();
		}
	}

	handlePjaxSuccess(url, hash, shouldUpdateState, html) {
		if (shouldUpdateState) {
			this.updateHistoryState(url, html);
		}

		this.updateCurrentPathname();

		try {
			this.render(html);
		} catch (e) {
			throw new Error(`Unable to render page at ${url}: ${e}`);
		}

		// Attempt to scroll to hash target if it exists
		if (!isNil(hash) && hash.length) {
			this.scrollToTarget(hash);
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
				msg: error
			};
		}
		// Reset Pjax state
		this.isPjaxing = false;

		this.triggerCallback('onErrorPjax', error);
		this.triggerCallback('onCompletePjax');
	}

	handleFetchNonSuccess(response) {
		if (!response.ok) {
			const context = Object.assign(
				{},
				{
					status: response.status,
					statusText: response.statusText
				}
			);

			return Promise.reject({
				msg: response.statusText,
				context
			});
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
				const context = Object.assign(
					{},
					{
						status: response.status,
						statusText: response.statusText
					}
				);
				return Promise.reject({
					msg: response.statusText,
					context
				});
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
		const newState = {
			url: url,
			contents: JSON.stringify(html)
		};

		const method = `${type}State`;

		window.history[method](newState, null, url);
	}
}

// Apply Mixins
applyMixins(FetchPjax, TriggerCallback);

export default FetchPjax;
