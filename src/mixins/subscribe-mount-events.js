import EventBus from 'lib/eventbus';

function subscribe(event, prefix, context) {
	if (typeof context[`page${prefix}${event}`] === 'function') {
		EventBus.subscribe(
			`router:page${prefix}${event}`,
			context[`page${prefix}${event}`].bind(context)
		);
	}
}

const subscribeToMountEvents = {
	mountEvents: ['Mount', 'Unmount'],

	subscribeToMountEvents() {
		this.mountEvents.forEach(event => {
			subscribe(event, 'Did', this);
			subscribe(event, 'Will', this);
		});
	}
};

export default subscribeToMountEvents;
