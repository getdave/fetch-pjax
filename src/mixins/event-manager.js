'use strict';

const EventManager = {
	bindEventHandlers() {
		this.events.forEach(event => {
			const { handler } = event;
			this[handler] = this[handler].bind(this);
		});
	},

	registerEvents() {
		if (!this.events) {
			logger('No events bound. Missing "events" array definition');
			return;
		}

		this.bindEventHandlers();

		this.events.forEach(event => {
			const { selector, handler, type } = event;

			// Create reference to event handler so it can be
			// unbound (cleaned-up) on pageUnMount event
			event._boundHandler = e => {
				let target = e.target;

				if (!target.matches(selector)) {
					target = target.closest(selector);
				}

				if (target && target.matches(selector)) {
					e.preventDefault();
					this[handler](target, e);
				}
			};

			document.addEventListener(type, event._boundHandler);
		});
	},

	deRegisterEvents() {
		if (!this.events) return;

		this.events.forEach(event => {
			if (event._boundHandler !== undefined) {
				document.removeEventListener('click', event._boundHandler);
			}
		});
	}
};

export default EventManager;
