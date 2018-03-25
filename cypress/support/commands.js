// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//

const { _, $ } = Cypress;

// -- This is a parent command --
Cypress.Commands.add('assetPjaxNavigationTo', url => {
	cy
		.window()
		.its('fetch')
		.should('be.calledWith', 'http://localhost:8080' + url);

	cy.url().should('contain', url);
});

Cypress.Commands.add('spyOnFetchPjax', (subject, method) => {
	const ucFirstMethod = _.upperFirst(method);

	return cy.spy(subject, method).as(`spy${ucFirstMethod}`);
});

//
//
// -- This is a child command --
// Cypress.Commands.add("drag", { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add("dismiss", { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This is will overwrite an existing command --
// Cypress.Commands.overwrite("visit", (originalFn, url, options) => { ... })
