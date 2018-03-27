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

    it('should work with defaults', function() {
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
    beforeEach(() => {
        cy.visit('/', {
            onBeforeLoad(win) {
                cy.spy(win, 'fetch').as('windowFetch');
            }
        });
    });

    it('should handle form submits', function() {
        cy.window().then(win => {
            const firstName = 'Jon';
            const lastName = 'Doe';

            const expectedUrl = `http://localhost:8080/page1.html`;

            const expectedQs = `?firstname=${firstName}lastname=${lastName}`;

            const subject = fetchPjaxFactory(win);

            cy.spyOnFetchPjax(subject, 'doPjax');

            cy.get('input[name=firstname]').type(firstName);
            cy.get('input[name=lastname]').type(lastName);
            cy.get('[data-cy-form]').trigger('submit');

            cy
                .get('@spyDoPjax')
                .should('be.calledWith', expectedUrl + expectedQs);

            cy.assetPjaxNavigationTo(page1Url + expectedQs);
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
            fetchPjaxFactory(win, {
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

                    expect(errorStubFunc.args[0][1]).to.include(errorMsg);
                });

                // Complete should be called on happy and error paths
                cy.get('@stubCbComplete').should('be.calledOnce');

                // Double check success wasn't called
                cy.get('@stubCbSuccess').should('not.be.called');
            });
        });

        it('should trigger onErrorPjax and onCompletePjax when fetch response status is no "ok"', function() {
            const errorResponse = {
                ok: false,
                status: 'Not good',
                statusText: 'Some bad things happened'
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

                    expect(errorStubFunc.args[0][1]).to.include(errorResponse);
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
                beforeSend: fetchOptions => {
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
