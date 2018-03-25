'use strict';
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

export default TriggerCallback;
