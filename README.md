# Fetch Pjax
> PJAX (PushState + Ajax) navigation functionality using the native Fetch API

Fetch Pjax uses AJAX (via the `fetch` API) to deliver a __super fast browsing experience__ by loading HTML from your server and replacing __only the relevant portions of the page__ with the Ajax'd HTML. This means the browser doesn't have to reload the page CSS/JavaScript on each request (as it does on a normal page request) which therefore delivers __lighting fast page loads__.

Fetch Pjax __provides full url, back button and history support__ via liberal usage of `history.pushState` and the `window.onpopstate` event. 

## Installation

```sh
npm install fetch-pjax --save
```

or

```sh
yarn add fetch-pjax
```

### Requirements / Assumptions

`FetchPjax` expects that you are using an environment that supports the `fetch` API. If your environment _does not_ support fetch natively, you will need to include a suitable polyfill before usage.


## Usage

By default `FetchPjax` will run "config-less" - that is, it has a set of sensible defaults designed to account for the majority of use cases. However, it is designed to be highly configurable, allowing you to extend and modify it's behaviour to suit your needs.

### Signature

The basic usage signature of a `FetchPjax` is:

`new FetchPjax(options); // options is an plain JS object {}`

### Basic Usage

For many users, creating an instance of `FetchPjax` will be enough to get PJAX working on your site.

```
new FetchPjax(); // sensible defaults applied
```

For the above example, all clicks on `<a>` elements will now be intercepted and replaced by an AJAX request issued to the url defined by the anchor's `href` attribute. Assuming that the response is valid HTML, it will be parsed and the relevant sections of the page will be updated with the new HTML retrived from the PJAX request. In addition the browser's address bar will reflect the new page url. In short, the page will appear and behave in a "normal" manner.

By default the sections of the DOM matching the following selectors will be updated on each PJAX request:

* `main` - the `<main>` element of the page. Usually assumed to contain the page's main content
* `title` - the page's `<title>` element from the `<head>`

As everyone's site is different, you can easily customise this by providing the `targets` option. For example:

```
new FetchPjax({
	targets: { // define which portions of the current page should be replaced
		title: 'title' 
		content: '#main-content',  
		sidebar: 'aside.sidebar',
		specialArea: '.my-special-area-selector'
	}
});
```

Note that when you provide a `targets` option, the defaults are overidden, so you will need to include them manually. 

### Customising Fetch Request Options

As suggested by the name, `FetchPjax` utilises `fetch` under the hood. In some cases you may wish to customise the options provided to the underlying `fetch()` call for each PJAX request. To do this simply provide the `fetchOptions` option. For example:

```
const token = btoa('someuser:somepassword');

new FetchPjax({
	fetchOptions: {
		headers: {
			'X-PJAX': true, // we recommend retaining this identify PJAX requests
			'Authorization: `Bearer ${token}`' // send HTTP auth headers with every request
		}
	}
});
```

These options will be set on every PJAX request. If you need to update the options on a per request basis consider utilising the `modifyFetchOptions` option.

### Lifecycle Callbacks

`FetchPjax` provides a number of callback functions which you can use to hook into key events in the plugin execution lifecycle. Events include:

* `onBeforePjax`
* `onSuccessPjax`
* `onErrorPjax`
* `onCompletePjax`
* `onBeforeRender`
* `onAfterRender`
* `onBeforeTargetRender`
* `onAfterTargetRender`

Making use of a callback is easy. Simply provide an object as the `callbacks` option. For example: 

```
new FetchPjax({
	callbacks: {
		onBeforePjax: () => {
			// do something here before PJAX is dispatched
		},
		onErrorPjax: () => {
			// do something here when PJAX encounters an error
		}
	}
});
```

Different callbacks receive different arguments. For more on callbacks, see the callback documentation.

## Options

The following options can be provided to customise the functionality of `FetchPjax`.


Option | Type | Default | Description
------ | ---- | ------- | -----------
`autoInit` | `boolean` | `true` | determines whether `FetchPjax` should initialise itself by default when a new instance is created. Useful for situations where you might need to defer execution.
`eventType` | `string` | `click` | defines the event type on which to listen to trigger a PJAX cycle. For example, specifying `touchstart` would then only trigger PJAX for `touchstart` events.
`selector` | `string` | `a` | a valid DOM selector for the elements on which you wish to listen for clicks (or other valid `eventType`)
`targets` | `object` | `{ content: 'main', title: 'title' }` | defines which portions of the page should be replaced by the Ajax'd content on each PJAX request. The object keys _must_ be unique, but are entirely arbitary and can be anything that helps you to identify them. The object values must be a valid DOM selector for an element which _must_ exist within the page DOM at the point of creating a `FetchPjax` instance
`popStateFauxLoadTime` | `int` | `300` | a period (in milliseconds) to wait before cached content retrieved from the `history.state` is used to update the DOM. This is intended to improve the user experience by simulating a network request delay. Without this content is replaced too quickly to be perceivable. Only utilised when the `popStateUseContentCache` option is set to `true` 
`fetchOptions` | `object` | `{ headers: { 'X-PJAX': true } }` | sets the options argument sent to the underlying `fetch(url, options={})` call for each PJAX request. Must be a valid options object as provided to the second `init` argument of the [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch#Syntax). To overide on a per-request basis, see [`modifyFetchOptions`](#callbacks)
`popStateUseContentCache` | `boolean` | `true` | determines whether to cache visted urls request HTML in the browser `history.state` object for faster 
`trackInitialState` | `boolean` | `true` | determines whether the intial page is added to the `window.history` state using `history.replaceState()`. You probably don't want to disable this.
`callbacks` | `object` | - | see [Callbacks](#callbacks)

### Callbacks

FetchPjax provides callback functions which run at Useful points in it's execution cycle. Callback functions should be passed as part of the `callbacks` option object (see [Example Callback Usage](#example-callback-usage))

__Note:__ all callbacks (with the exception of `modifyFetchOptions`) are passed the current `instance` of `FetchPjax` as their first argument. 

Callback | Args    | Description
---------| ------- | -------------
`modifyFetchOptions` | `fetchOptions (object)` | provides the ability to __conditionally modify__ the `fetchOptions` object on a per request basis. You can conditionally choose to return an objects object from your supplied callback function. When you do, this object will be used as the [second] `init` options argument of the `fetch()` call for the PJAX request (refer to the [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch#Syntax) documentation for details)
`onBeforePjax` | `instance`[, `fetchOptions (object)`] | called before the PJAX request is fired. `fetchOptions` object may be undefined if  called as part of popState cache handling
`onSuccessPjax` | `instance`, `url (string), html (string)` | called upon the completion of the PJAX request when the response was successful. Receives the request `url` and the response `html`
`onErrorPjax` | `instance`, `error (object)` | called upon the completion of the PJAX request when the request resulted in an error. Called with `error` object containing `status` and `statusText` properties
`onCompletePjax` | `instance` | _always_ called upon the completion of a PJAX request regardless of whether result is `success` or `error`. Useful for logic that must always run post-PJAX cycle. Called _after_ `onSuccessPjax` and `onErrorPjax`.
`onBeforeRender` | `instance` | called before the start of a render cycle (where the `targets` are updated in the DOM)
`onAfterRender` | `instance` | called after the end of a render cycle (where the `targets` are updated in the DOM)
`onBeforeTargetRender` | `instance`, `targetKey (string)`, `targetEl (DOM Node)`, `contentEl (DOM Node)`[, `renderer (function OR undefined)]` | called before an _individual target_ is updated in the DOM. Called with the `targetKey` being updated, the `targetEl` in the page DOM, the `contentEl` in the Ajax'd content and [if it was provided] the custom `renderer` function.
`onAfterTargetRender` | `instance`, `targetKey (string)`, `targetEl (DOM Node)`, `contentEl (DOM Node)`[, `renderer (function OR undefined)]` | called after an _individual target_ is updated in the DOM. Called with the `targetKey` being updated, the `targetEl` in the page DOM, the `contentEl` in the Ajax'd content and [if it was provided] the custom `renderer` function.

### Example Callback usage

```
new FetchPjax({	
	callbacks: {
        onBeforePjax: (instance, fetchOptions) => {
        	// do something here
    	},
    	onCompletePjax: (instance) => {
        	// do something here always
    	}
    }
});
```

### Recipes

#### Customising Fetch options on a per request basis

__Problem:__ you need to modify the options passed to `fetch()` on a per request basis.

__Solution:__ utilise the `modifyFetchOptions` option to conditionally modify the `fetchOptions` based on the request.

__Example:__	
```
new FetchPjax({	
	modifyFetchOptions: (fetchOptions) => {

		// Set different fetchOptions for different urls
		if (fetchOptions.url.includes('foo')) {
		    return { // notice we must return the object
		        headers: {
		            'X-SPECIAL-HEADER': true // note this will be *merged* into the default headers object
		        }
		    };
		}

		if (fetchOptions.url.includes('bar')) {
		    return { // notice we must return the object
		        headers: {
		            'X-SOME-DIFFERENT-HEADER': true // note this will be merged into the default headers object
		        }
		    };
		}

	}
});
```

__Notes:__ the object returned from `modifyFetchOptions` is merged into the existing `fetchOptions` object. It __will not overwrite__ the original `fetchOptions`. Rather it is deep-merged into it using [`assign-deep`](https://github.com/jonschlinkert/assign-deep) to ensure nested objects are retained.


## Development setup

To contribute to the development of FetchPjax first ensure you have `node` installed on your system. Also ensure you have either `npm` or `yarn` available.

A integration test suite is available via [Cypress.io](https://www.cypress.io/). This should be run continuous during development to ensure your modifications do not adversely effect the existing functionality.

To start the tests run `npm run test:dev` - a server will start and Cypress will load shortly after. In another terminal window start `rollup` in `watch` mode using `npm run dev`. Start developing!

All new functionality must be tested, following the existing conventions for guidance.


## Release History

See `CHANGELOG.md`.

## Meta

FetchPjax is the brain child of David Smith 
* Twitter - [@get_dave](https://twitter.com/get_dave)
* Website - [aheadcreative.co.uk](https://aheadcreative.co.uk)
* Github - [https://github.com/getdave/](https://github.com/getdave/)

Distributed under the MIT license. See ``LICENSE`` for more information.



## Contributing

This project uses Gitflow. All pull requests should be branched from the `develop` branch only.

1. Fork it 
2. Checkout the `develop` branch
3. Create your feature branch (`git checkout -b feature/fooBar`)
4. Commit your changes (`git commit -am 'Add some fooBar'`)
5. Push to the branch (`git push origin feature/fooBar`)
6. Create a new Pull Request

<!-- Markdown link & img dfn's -->
[npm-image]: https://img.shields.io/npm/v/fetch-pjax.svg?style=flat-square
[npm-url]: https://npmjs.org/package/fetch-pjax
[npm-downloads]: https://img.shields.io/npm/dm/fetch-pjax.svg?style=flat-square
