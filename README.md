# Fetch Pjax
> PJAX (PushState + Ajax) navigation functionality using the native Fetch API

Fetch Pjax uses AJAX (via the `fetch` API) to deliver a super fast browsing experience by loading HTML from your server and replacing only the relevant portions of the page with the Ajax'd HTML. This means the browser doesn't have to reload the page CSS/JavaScript on each request (as it does on a normal page request) which therefore delivers lighting fast page loads.

Fetch Pjax provides full url, back button and history support via liberal usage of `history.pushState` and the `window.onpopstate` event. 

## Installation

```sh
npm install fetch-pjax --save
```

or

```sh
yarn add fetch-pjax
```


## Usage

By default `FetchPjax` will run "config-less" - that is, it has a set of sensible defaults designed to account for the majority of use cases.

### Basic Usage

For many users, creating an instance of `FetchPjax` will be enough to get PJAX working on your site.

```
$iFetchPjax = new FetchPjax();
```

For the above example, all clicks on `a` elements will now be intercepted and replaced by an AJAX request issued to the url defined by the anchor's `href` attribute. Assuming that the response is valid HTML, it will be parsed and the relevant sections of the page will be updated with the new HTML retrived from the PJAX request. In addition the browser's address bar will reflect the new page url. In short, the page will appear and behave in a "normal" manner.

By default the sections of the DOM matching the following selectors will be updated on each PJAX request:

* `main` - the `<main>` element of the page. Usually assumed to contain the page's main content
* `title` - the page's `<title>` element from the `<head>`

As everyone's site is different, you can easily customise this by providing the `targets` option. For example:

```
$iFetchPjax = new FetchPjax({
	targets: {
		title: 'title' // 
		content: '#main-content',  
		sidebar: 'aside.sidebar',
		specialArea: '.my-special-area-selector'
	}
});
```

Note that when you provide a `targets` option, the defaults are overidden, so you will need to include them manually. 

### Fetch Options

As suggested by the name, `FetchPjax` utilises `fetch` under the hood. In some cases you may wish to customise the options provided to `fetch` for each PJAX request. To do this simply provide the `fetchOptions` option. For example:

```
const token = btoa('someuser:somepassword');

$iFetchPjax = new FetchPjax({
	fetchOptions: {
		headers: {
			'X-PJAX': true, // we recommend retaining this identify PJAX requests
			'Authorization: `Bearer ${token}`' // send HTTP auth headers with every request
		}
	}
});
```

These options will be set on every PJAX request. If you need to update the options on a per request basis consider utilising the `beforeSend` option.


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
$iFetchPjax = new FetchPjax({
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


## Development setup

Describe how to install all development dependencies and how to run an automated test-suite of some kind. Potentially do this for multiple platforms.

```sh
make install
npm test
```

## Release History

* 0.2.1
    * CHANGE: Update docs (module code remains unchanged)
* 0.2.0
    * CHANGE: Remove `setDefaultXYZ()`
    * ADD: Add `init()`
* 0.1.1
    * FIX: Crash when calling `baz()` (Thanks @GenerousContributorName!)
* 0.1.0
    * The first proper release
    * CHANGE: Rename `foo()` to `bar()`
* 0.0.1
    * Work in progress

## Meta

Your Name – [@YourTwitter](https://twitter.com/dbader_org) – YourEmail@example.com

Distributed under the XYZ license. See ``LICENSE`` for more information.

[https://github.com/yourname/github-link](https://github.com/dbader/)

## Contributing

1. Fork it (<https://github.com/yourname/yourproject/fork>)
2. Create your feature branch (`git checkout -b feature/fooBar`)
3. Commit your changes (`git commit -am 'Add some fooBar'`)
4. Push to the branch (`git push origin feature/fooBar`)
5. Create a new Pull Request

<!-- Markdown link & img dfn's -->
[npm-image]: https://img.shields.io/npm/v/datadog-metrics.svg?style=flat-square
[npm-url]: https://npmjs.org/package/datadog-metrics
[npm-downloads]: https://img.shields.io/npm/dm/datadog-metrics.svg?style=flat-square
[travis-image]: https://img.shields.io/travis/dbader/node-datadog-metrics/master.svg?style=flat-square
[travis-url]: https://travis-ci.org/dbader/node-datadog-metrics
[wiki]: https://github.com/yourname/yourproject/wiki