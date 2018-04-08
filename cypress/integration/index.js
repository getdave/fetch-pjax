const { _, $ } = Cypress;

const baseUrl = 'http://localhost:8080';
const page1Url = '/page1.html';
const page2Url = '/page2.html';

function fetchPjaxFactory(cyWindow, args = {}) {
    const FetchPjax = cyWindow.FetchPjax;
    return new FetchPjax(args);
}

// cy.on('window:before:load', function onBeforeLoad(win) {
//     cy.spy(win, 'fetch').as('windowFetch');
// });
describe('Initial', function() {
    beforeEach(() => {
        cy.visit('/');
    });

    it('should be availble on the global in browser', function() {
        cy.window().should('have.property', 'FetchPjax');
    });
});

describe('Defaults', function() {
    beforeEach(() => {
        cy.visit('/', {
            onBeforeLoad(win) {
                cy.spy(win, 'fetch').as('windowFetch');
            }
        });
    });

    it('should "just work" with defaults', function() {
        cy.window().then(win => {
            fetchPjaxFactory(win);

            cy.get('[data-cy-link]').click();

            cy.url().should('contain', 'page1.html');

            cy.title().should('eq', 'Page 1');

            cy.get('[data-cy-link]').click();

            cy.url().should('contain', 'page2.html');

            cy.title().should('eq', 'Page 2');

            // Simulate browser "Back" button
            cy.go('back');

            cy.url().should('contain', 'page1.html');

            cy.title().should('eq', 'Page 1');

            cy.go('back');

            cy.url().should('eq', baseUrl + '/');

            cy.title().should('eq', 'Index Page');
        });
    });

    it('should not init when autoInit is set to false', function() {
        cy.window().then(win => {
            const FetchPjax = win.FetchPjax;

            const spy = cy.spy(FetchPjax.prototype, 'init').as('spyInit');

            const subject = fetchPjaxFactory(win, {
                autoInit: false
            });

            cy.get('@spyInit').should('not.be.called');
        });
    });
});

describe('Render Targets', function() {
    beforeEach(() => {
        cy.visit('/', {
            onBeforeLoad(win) {
                cy.spy(win, 'fetch').as('windowFetch');
            }
        });
    });

    it('should handle multiple render targets', function() {
        cy.window().then(win => {
            fetchPjaxFactory(win, {
                targets: {
                    title: 'title',
                    content: 'main',
                    aside: '.sidebar'
                }
            });

            cy.get('.sidebar').should('be.empty');

            cy.get('[data-cy-link]').click();

            cy.assetPjaxNavigationTo(page1Url);

            cy.get('.sidebar').should('contain', 'Sidebar');
        });
    });

    it('should throw error if a render target is missing in the initial DOM', function(
        done
    ) {
        cy.window().then(win => {
            const missingTargetId = 'flibbleWibble';
            const missingTargetSelector = '.flibblywibbly';

            const subject = fetchPjaxFactory(win, {
                autoInit: false, // important!
                targets: {
                    title: 'title',
                    content: 'main',
                    [missingTargetId]: missingTargetSelector // won't be found!
                }
            });

            // See https://docs.cypress.io/api/events/catalog-of-events.html#Uncaught-Exceptions
            //
            // docs don't seem to work so we manually catch the Exception
            // and assert our outcome
            try {
                subject.init();
            } catch (err) {
                expect(err.message).to.eq(
                    `The target with identifier '${missingTargetId}' could not be matched in the initial DOM using selector '${missingTargetSelector}'.`
                );
                done(); // needed to end the test
            }
        });
    });

    it('should handle custom renderers', function() {
        cy.window().then(win => {
            fetchPjaxFactory(win, {
                targets: {
                    title: 'title',
                    content: 'main',
                    routeData: {
                        selector: '#meta-route-data',
                        renderer: (targetEl, contentEl) => {
                            targetEl.setAttribute(
                                'content',
                                contentEl.getAttribute('content')
                            );
                        }
                    }
                }
            });

            cy.get('[data-cy-link]').click();

            cy.assetPjaxNavigationTo(page1Url);

            cy.get('#meta-route-data').then($el => {
                expect($($el).attr('content')).to.eq('somespecialdatahere_123');
            });
        });
    });
});

describe('Customisation of Headers', function() {
    beforeEach(() => {
        cy.visit('/', {
            onBeforeLoad(win) {
                cy.spy(win, 'fetch').as('windowFetch');
            }
        });
    });

    it('should set the X-PJAX header by default', function() {
        cy.window().then(win => {
            fetchPjaxFactory(win, {
                fetchOptions: {
                    headers: {
                        'X-PJAX': true
                    }
                }
            });

            cy.get('[data-cy-link]').click();

            cy.assetPjaxNavigationTo(page1Url);

            cy.get('@windowFetch').should('be.calledWithMatch', page1Url, {
                headers: {
                    'X-PJAX': true
                },
                url: baseUrl + page1Url
            });
        });
    });

    it('should allow setting of custom headers', function() {
        cy.window().then(win => {
            const token = btoa('someuser:somepassword');

            fetchPjaxFactory(win, {
                fetchOptions: {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            });

            cy.get('[data-cy-link]').click();

            cy.assetPjaxNavigationTo(page1Url);

            cy.get('@windowFetch').should('be.calledWithMatch', page1Url, {
                headers: {
                    Authorization: `Bearer ${token}`
                },
                url: baseUrl + page1Url
            });
        });
    });
});

describe('Navigation Event Types', function() {
    beforeEach(() => {
        cy.visit('/', {
            onBeforeLoad(win) {
                cy.spy(win, 'fetch').as('windowFetch');
            }
        });
    });

    describe('Selectors', function() {
        it('should listen on <a> elements by default', function() {
            cy.window().then(win => {
                const subject = fetchPjaxFactory(win);

                cy.spyOnFetchPjax(subject, 'doPjax');

                cy.get('a[data-cy-link]').click();

                cy.get('@spyDoPjax').should('be.called');
            });
        });

        it('should listen on custom selectors', function() {
            cy.window().then(win => {
                const selector = '.special-selector a';

                const subject = fetchPjaxFactory(win, {
                    selector
                });

                cy.spyOnFetchPjax(subject, 'doPjax');

                cy.get(selector).click();

                cy.get('@spyDoPjax').should('be.called');
            });
        });
    });

    describe('Event Types', function() {
        it('should listen to custom event types', function() {
            cy.window().then(win => {
                const eventType = 'touchstart';

                const subject = fetchPjaxFactory(win, {
                    eventType
                });

                cy.spyOnFetchPjax(subject, 'doPjax');

                cy.get('a[data-cy-link]').trigger(eventType);

                cy.get('@spyDoPjax').should('be.called');
            });
        });
    });
});

describe('Handling Forms', function() {
    let winFetchSpy;
    const firstName = 'Jon';
    const lastName = 'Doe';

    beforeEach(() => {
        cy.visit('/', {
            onBeforeLoad(win) {
                winFetchSpy = cy.spy(win, 'fetch').as('windowFetch');
            }
        });
    });

    it('should handle all form submits by default', function() {
        cy.window().then(win => {
            const expectedUrl = `http://localhost:8080/page1.html`;

            const expectedQueryString = `?firstname=${firstName}&lastname=${lastName}`;

            const subject = fetchPjaxFactory(win);

            cy.spyOnFetchPjax(subject, 'doPjax');

            cy.get('[data-cy-form]').within($form => {
                cy.get('input[name=firstname]').type(firstName);
                cy.get('input[name=lastname]').type(lastName);

                cy.root().submit();
            });

            cy
                .get('@spyDoPjax')
                .should('be.calledWith', expectedUrl + expectedQueryString);

            cy.assetPjaxNavigationTo(page1Url + expectedQueryString);
        });
    });

    it('should not handle form submits when handleForms option is set to false', function() {
        cy.window().then(win => {
            const subject = fetchPjaxFactory(win, {
                handleForms: false
            });

            // Note: we spy on handler because expected eventListener not to
            // even be registered if this option is set
            cy.spyOnFetchPjax(subject, 'handleFormSubmit');

            cy.get('[data-cy-form]').within($form => {
                cy.get('input[name=firstname]').type(firstName);
                cy.get('input[name=lastname]').type(lastName);
                cy.root().submit();
            });

            cy.get('@spyHandleFormSubmit').should('not.be.called');
        });
    });

    it('should handle forms matching the given formSelector option', function() {
        cy.window().then(win => {
            const formSelector = '.special-form';

            const subject = fetchPjaxFactory(win, {
                formSelector: formSelector
            });

            cy.spyOnFetchPjax(subject, 'doPjax');

            cy.get(`form${formSelector}`).within($form => {
                cy.get('input[name=firstname]').type(firstName);
                cy.get('input[name=lastname]').type(lastName);
                cy.root().submit();
                cy.get('@spyDoPjax').should('be.called'); // assert
            });
        });
    });

    it('should not handle forms which do not match the given formSelector option', function() {
        cy.window().then(win => {
            const formSelector = '.special-form';

            const subject = fetchPjaxFactory(win, {
                formSelector: formSelector
            });

            cy.spyOnFetchPjax(subject, 'doPjax');

            cy
                .get(`form:not(${formSelector})[data-cy-form-get]`)
                .within($form => {
                    cy.get('input[name=firstname]').type(firstName);
                    cy.get('input[name=lastname]').type(lastName);

                    cy.root().submit();
                    cy.get('@spyDoPjax').should('not.be.called');
                });
        });
    });

    it('should send forms with get method by default', function() {
        cy.window().then(win => {
            const subject = fetchPjaxFactory(win);

            cy.get('[data-cy-form-get]').within($form => {
                cy.get('input[name=firstname]').type(firstName);
                cy.get('input[name=lastname]').type(lastName);
                cy.root().submit().then(() => {
                    const fetchCallArgs = winFetchSpy.args[0][1];

                    expect(fetchCallArgs).not.to.include({
                        method: 'POST'
                    });
                });
            });
        });
    });

    it('should send forms with the specific method type when present', function() {
        cy.window().then(win => {
            const subject = fetchPjaxFactory(win);

            cy.get('[data-cy-form-post]').within($form => {
                cy.get('input[name=firstname]').type(firstName);
                cy.get('input[name=lastname]').type(lastName);
                cy.root().submit().then(() => {
                    const fetchCallArgs = winFetchSpy.args[0][1];

                    expect(fetchCallArgs).to.include({
                        method: 'POST'
                    });
                });
            });
        });
    });

    it('should send forms with the specific encoding when present in enctype', function() {
        cy.window().then(win => {
            const subject = fetchPjaxFactory(win);

            // Forms with multipart Form Data will be sent with FormData body
            // rather than URLSearchParams
            cy.get('[enctype="multipart/form-data"]').within($form => {
                cy.get('input[name=firstname]').type(firstName);
                cy.get('input[name=lastname]').type(lastName);
                cy.root().submit().then(() => {
                    const fetchCallArgs = winFetchSpy.args[0][1];
                    let bodyName = Object.getPrototypeOf(fetchCallArgs.body)
                        .constructor.name;

                    // Unsure why this doens't work but whilst we known it's an instance of FormData
                    // JavaScript's instanceof returns a false result
                    expect(
                        bodyName,
                        'Body was not an instance of FormData'
                    ).to.equal('FormData');
                });
            });
        });
    });
});

describe('History API', function() {
    beforeEach(() => {
        cy.visit('/', {
            onBeforeLoad(win) {
                cy.spy(win, 'fetch').as('windowFetch');
            }
        });
    });

    it('should append url & DOM contents to History state', function() {
        cy.window().then(win => {
            fetchPjaxFactory(win);

            // Click on Index Page
            cy.get('[data-cy-link]').click().then(() => {
                expect(win.history.state.url).to.equal(
                    'http://localhost:8080/page1.html'
                );
                expect(win.history.state.contents).to.include(
                    '<title>Page 1</title>'
                );
            });

            // Click on Page1
            cy.get('[data-cy-link]').click().then(() => {
                expect(win.history.state.url).to.equal(
                    'http://localhost:8080/page2.html'
                );
                expect(win.history.state.contents).to.include(
                    '<title>Page 2</title>'
                );
            });

            // Return to Page 1
            cy.go('back').then(() => {
                expect(win.history.state.url).to.equal(
                    'http://localhost:8080/page1.html'
                );
                expect(win.history.state.contents).to.include(
                    '<title>Page 1</title>'
                );
            });

            cy.go('back').then(() => {
                expect(win.history.state.url).to.equal(
                    'http://localhost:8080/'
                );
                expect(win.history.state.contents).to.include(
                    '<title>Index Page</title>'
                );
            });
        });
    });
});

describe('Callbacks', function() {
    let cbStubFunc;

    beforeEach(() => {
        cy.visit('/', {
            onBeforeLoad(win) {}
        });

        cbStubFunc = cy.stub().as('stubCb'); // aliased for reuse
    });

    it('should trigger onBeforePjax before PJAX request', function() {
        cy.window().then(win => {
            const subject = fetchPjaxFactory(win, {
                callbacks: {
                    onBeforePjax: cbStubFunc
                }
            });

            // Standard navigation
            cy.get('[data-cy-link]').click();

            // Popstate
            cy.go('back');

            cy.get('@stubCb').should('be.calledTwice');
        });
    });

    it('should trigger onSuccessPjax with correct args on successful PJAX request', function() {
        cy.window().then(win => {
            fetchPjaxFactory(win, {
                callbacks: {
                    onSuccessPjax: cbStubFunc
                }
            });

            cy.get('[data-cy-link]').click().then(() => {
                const args = cbStubFunc.args[0][1];

                expect(cbStubFunc).to.be.calledOnce;

                expect(args.url).to.eq('http://localhost:8080/page1.html');

                expect(args.html).to.contain('<title>Page 1</title>');
            });

            cy.go('back');

            cy.get('@stubCb').should('be.calledOnce');
        });
    });

    it('should trigger onCompletePjax after PJAX on happy path', function() {
        cy.window().then(win => {
            fetchPjaxFactory(win, {
                callbacks: {
                    onCompletePjax: cbStubFunc
                }
            });

            // Standard navigation
            cy.get('[data-cy-link]').click();

            // Popstate
            cy.go('back');

            cy.get('@stubCb').should('be.calledTwice');
        });
    });

    describe('Error callback handling', () => {
        let errorStubFunc;
        let successStubFunc;
        let completeStubFunc;
        let fauxFetchFunc;

        beforeEach(() => {
            errorStubFunc = cy.stub().as('stubCbError');
            successStubFunc = cy.stub().as('stubCbSuccess');
            completeStubFunc = cy.stub().as('stubCbComplete');
        });

        it('should trigger onErrorPjax and onCompletePjax callbacks on PJAX failure', function() {
            const errorMsg = 'Some error message';

            cy.window().then(win => {
                cy
                    .stub(win, 'fetch', () => Promise.reject(errorMsg))
                    .as('windowFetchStub');

                fetchPjaxFactory(win, {
                    callbacks: {
                        onSuccessPjax: successStubFunc,
                        onErrorPjax: errorStubFunc,
                        onCompletePjax: completeStubFunc
                    }
                });

                cy.get('[data-cy-link]').click().then(() => {
                    expect(errorStubFunc).to.be.calledOnce;

                    expect(errorStubFunc.args[0][1]).to.include({
                        msg: errorMsg
                    });
                });

                // Complete should be called on happy and error paths
                cy.get('@stubCbComplete').should('be.calledOnce');

                // Double check success wasn't called
                cy.get('@stubCbSuccess').should('not.be.called');
            });
        });

        it('should trigger onErrorPjax and onCompletePjax when fetch response has a non "ok" status', function() {
            const errorResponse = {
                ok: false,
                status: 401,
                statusText: 'Some bad things happened'
            };

            const expected = {
                msg: 'Some bad things happened',
                context: {
                    status: 401,
                    statusText: 'Some bad things happened'
                }
            };

            cy.window().then(win => {
                cy
                    .stub(win, 'fetch', () => Promise.resolve(errorResponse))
                    .as('windowFetchStub');

                fetchPjaxFactory(win, {
                    callbacks: {
                        onSuccessPjax: successStubFunc,
                        onErrorPjax: errorStubFunc,
                        onCompletePjax: completeStubFunc
                    }
                });

                cy.get('[data-cy-link]').click().then(() => {
                    expect(errorStubFunc).to.be.calledOnce;

                    expect(errorStubFunc.args[0][1]).to.deep.equal(expected);
                });

                // Complete should be called on happy and error paths
                cy.get('@stubCbComplete').should('be.calledOnce');

                // Double check success wasn't called
                cy.get('@stubCbSuccess').should('not.be.called');
            });
        });
    });

    describe('Render callbacks', () => {
        it('should call before/after Render callbacks before/after  render cycle', () => {
            const beforeRenderStub = cy.stub().as('stubBeforeRender');
            const afterRenderStub = cy.stub().as('stubAfterRender');

            cy.window().then(win => {
                fetchPjaxFactory(win, {
                    callbacks: {
                        onBeforeRender: beforeRenderStub,
                        onAfterRender: afterRenderStub
                    }
                });
            });

            cy.get('[data-cy-link]').click();

            // Specifically this should be called once only!
            cy.get('@stubBeforeRender').should('be.calledOnce');
            cy.get('@stubAfterRender').should('be.calledOnce');
        });

        it('should call before/after callbacks for each render target', () => {
            const beforeRenderSpy = cy.spy().as('stubBeforeTargetRender');
            const afterRenderSpy = cy.spy().as('stubAfterTargetRender');

            cy.window().then(win => {
                fetchPjaxFactory(win, {
                    targets: {
                        title: 'title',
                        content: 'main',
                        aside: '.sidebar'
                    },
                    callbacks: {
                        onBeforeTargetRender: beforeRenderSpy,
                        onAfterTargetRender: afterRenderSpy
                    }
                });
            });

            cy.get('[data-cy-link]').click().then(() => {
                expect(beforeRenderSpy).to.be.calledThrice;
                expect(afterRenderSpy).to.be.calledThrice;

                // Verify all calls have the required keys
                beforeRenderSpy.getCalls().forEach(call => {
                    const beforeArgs = beforeRenderSpy.args[0][1];

                    expect(beforeArgs).to.have.all.keys([
                        'targetKey',
                        'targetEl',
                        'renderer',
                        'contentEl'
                    ]);
                });

                // 1st call
                expect(beforeRenderSpy.getCall(0).args[1].targetKey).to.eq(
                    'title'
                );

                // 2nd call
                expect(beforeRenderSpy.getCall(1).args[1].targetKey).to.eq(
                    'content'
                );

                // 3rd call
                expect(beforeRenderSpy.getCall(2).args[1].targetKey).to.eq(
                    'aside'
                );
            });

            // Specifically this should be called once only!
            // cy.get('@stubBeforeTargetRender').should('be.calledThrice');
            // cy.get('@stubAfterTargetRender').should('be.calledThrice');
        });
    });
});

describe('Overiding fetch options', () => {
    let windowFetchSpy;

    beforeEach(() => {
        cy.visit('/', {
            onBeforeLoad(win) {
                windowFetchSpy = cy.spy(win, 'fetch').as('windowFetch');
            }
        });
    });

    it('should allow overiding of fetchOptions on a per request basis', function() {
        const headerValuePage1 = 'the value for page1 url';
        const headerValuePage2 = 'the value for page2 url';

        cy.window().then(win => {
            fetchPjaxFactory(win, {
                fetchOptions: {
                    headers: {
                        'X-SOME-HEADER': true // the base
                    }
                },
                modifyFetchOptions: fetchOptions => {
                    // Set different fetchOptions for different urls
                    if (fetchOptions.url.includes('page1')) {
                        return {
                            headers: {
                                'X-ANOTHER-HEADER': headerValuePage1
                            }
                        };
                    }

                    if (fetchOptions.url.includes('page2')) {
                        return {
                            headers: {
                                'X-ANOTHER-HEADER': headerValuePage2
                            }
                        };
                    }
                }
            });

            // Navigate to /page1.html
            cy.get('[data-cy-link="page1"]').click().then(() => {
                const fetchArgsCallOne = windowFetchSpy.getCall(0).args[1];
                expect(fetchArgsCallOne.headers).to.include({
                    'X-SOME-HEADER': true,
                    'X-ANOTHER-HEADER': 'the value for page1 url'
                });
            });

            // Navigate to /page2.html
            cy.get('[data-cy-link="page2"]').click().then(() => {
                const fetchArgsCallTwo = windowFetchSpy.getCall(1).args[1];
                expect(fetchArgsCallTwo.headers).to.include({
                    'X-SOME-HEADER': true,
                    'X-ANOTHER-HEADER': 'the value for page2 url'
                });
            });
        });
    });
});

describe('Popstate handling', () => {
    beforeEach(() => {
        cy.visit('/', {
            onBeforeLoad(win) {}
        });
    });
    it('should use previously cached contents on popstate to previously visted url', () => {
        cy.window().then(win => {
            const subject = fetchPjaxFactory(win);

            cy.get('[data-cy-link="page1"]').click();

            cy.get('[data-cy-link="page2"]').click();

            cy.spyOnFetchPjax(subject, 'doPjax');
            cy.spyOnFetchPjax(subject, 'handlePopState');
            cy.spyOnFetchPjax(subject, 'render');

            // Triggers the window.onpopstate event
            cy.go('back');

            // Have we used the cache?
            cy.get('@spyHandlePopState').should('be.called');
            cy.get('@spyDoPjax').should('not.be.called');

            cy.get('@spyRender').should('be.called');
        });
    });

    it('should not use previously cached contents on popstate when "popStateUseContentCache" option is false', () => {
        cy.window().then(win => {
            const subject = fetchPjaxFactory(win, {
                popStateUseContentCache: false
            });

            cy.get('[data-cy-link="page1"]').click();

            cy.get('[data-cy-link="page2"]').click();

            cy.spyOnFetchPjax(subject, 'doPjax');
            cy.spyOnFetchPjax(subject, 'handlePopState');

            // Triggers the window.onpopstate event
            cy.go('back');

            cy.get('@spyHandlePopState').should('be.called');

            // If this is called then we've hard-requested the content
            cy.get('@spyDoPjax').should('be.called');
        });
    });

    it('should correctly use "popStateFauxLoadTime" as value for fake timeout for popstate', () => {
        // Set artificially high timeout so there can't realistically
        // be anything masking the timeout taking THIS long!
        const popStateFauxLoadTime = 20000; // 20secs

        // Control the clock
        cy.clock();

        cy.window().then(win => {
            const subject = fetchPjaxFactory(win, {
                popStateFauxLoadTime
            });

            cy.get('[data-cy-link="page1"]').click();

            cy.get('[data-cy-link="page2"]').click();

            cy.spyOnFetchPjax(subject, 'render');

            // Triggers the window.onpopstate event
            cy.go('back');

            // Shouldn't be called immediately as there is a
            // timeout set
            cy.get('@spyRender').should('not.be.called');

            // Tick the clock on by the value set in options
            cy.tick(popStateFauxLoadTime);

            // Only now the render method should be called
            cy.get('@spyRender').should('be.called');
        });
    });

    it('should track the initial page load into history state by default', () => {
        cy.window().then(win => {
            const FetchPjax = win.FetchPjax;

            const spy = cy
                .spy(FetchPjax.prototype, 'updateHistoryState')
                .as('spyUpdateHistoryState');

            const subject = fetchPjaxFactory(win);

            cy.get('@spyUpdateHistoryState').should('be.called');

            expect(win.history.state.url).to.eq('http://localhost:8080/');
            expect(win.history.state.contents).to.include(
                '<title>Index Page</title>'
            );
        });
    });

    it('should not track the initial page load into history state when trackInitialState is false', () => {
        cy.window().then(win => {
            const FetchPjax = win.FetchPjax;

            const spy = cy
                .spy(FetchPjax.prototype, 'updateHistoryState')
                .as('spyUpdateHistoryState');

            const subject = fetchPjaxFactory(win, {
                trackInitialState: false
            });

            cy.get('@spyUpdateHistoryState').should('not.be.called');

            expect(win.history.state).not.to.exist;
        });
    });
});

describe('Internal "hash" link handling', () => {
    beforeEach(() => {
        cy.visit('/', {
            onBeforeLoad(win) {
                cy.spy(win, 'fetch').as('windowFetch');
            }
        });
    });

    it('should handle internal links', () => {
        cy.window().then(win => {
            fetchPjaxFactory(win);

            cy.get('[data-cy-internal]').click();

            cy.url().should('eq', baseUrl + '/#internal-anchor');

            cy.get('[data-cy-internal-two]').click();

            cy.url().should('eq', baseUrl + '/#internal-anchor-two');

            cy.go('back');

            cy.url().should('eq', baseUrl + '/#internal-anchor');

            cy.go('back');

            cy.url().should('eq', baseUrl + '/');
        });
    });

    it('should scroll to a matching target when returning to a history entry whose url contains a hash', function() {
        cy.window().then(win => {
            fetchPjaxFactory(win);

            cy.get('[data-cy-internal]').click();

            cy.url().should('eq', baseUrl + '/#internal-anchor');

            cy.get('[data-cy-link]').click({
                force: true
            });

            cy.assetPjaxNavigationTo(page1Url);

            cy.go('back');

            cy.url().should('eq', baseUrl + '/#internal-anchor');

            // Has the target represented by the hash value in the url
            // been scroll to (ie: is it within the current viewport?)
            cy.get('#internal-anchor').should($el => {
                const elementTop = $el.offset().top;
                const elementBottom = elementTop + $el.outerHeight();
                const viewportTop = $(win).scrollTop();
                const viewportBottom = viewportTop + $(win).height();
                const inViewPort =
                    elementBottom > viewportTop && elementTop < viewportBottom;

                expect(inViewPort, 'The target was not within the viewport').to
                    .be.true;
            });

            cy.go('back');

            cy.url().should('eq', baseUrl + '/');
        });
    });
});
