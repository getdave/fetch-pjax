'use strict';

/**
 * APPLY MIXINS
 * accepts a target constructor and extends it's delegate prototype
 * with one or more mixin objects. This follows the best practice of
 * preferring object composition over class hierarchies
 */
export default function applyMixins(target, ...mixins) {
	mixins.reduce(function(acc, mixin) {
		return Object.assign(acc, mixin);
	}, target.prototype);

	return target;
}
