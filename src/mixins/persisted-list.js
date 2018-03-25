import { fetchFromStorage, persistToStorage } from 'lib/clientstorage';

/**
 * PERSISTED LIST
 *
 * persists a list of values to localstorage and the global store
 */

const PersistedList = {
	fetch() {
		const items = new Set(fetchFromStorage(this.key));

		this.store.set(this.key, items);
		return items;
	},

	get() {
		return this.list;
	},

	getRaw() {
		return Array.from(this.get());
	},

	save() {
		persistToStorage(this.key, this.getRaw());
		this.store.set(this.key, this.list);
	},

	clear() {
		this.list.clear(); // clear out Set in memory first as this is an ajax app
		this.save();
	},

	add(bookmark) {
		if (!this.list) {
			this.fetch();
		}

		this.list = new Set(this.list);
		this.list.add(bookmark);
		this.save();
	},

	remove(bookmark) {
		if (!this.list) {
			this.fetch();
		}

		this.list = new Set(this.list); // must return new Set instance to trigger store value notification change (mutations do not trigger change)
		this.list.delete(bookmark);
		this.save();
	}
};

export default PersistedList;
