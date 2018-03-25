/**
 * FOCUS MANAGER
 *
 * Reallocates focus state
 */

const FocusManager = {
    focusOn(element) {
        this.appendToFocusHistory();

        element.focus();
    },

    focusOnFirstChild(element) {
        this.appendToFocusHistory();

        element.querySelector(`
            a:first-of-type,
            input:first-of-type,
            select:first-of-type,
            textarea:first-of-type,
            button:first-of-type
        `).focus();
    },

    focusOnPrevious() {
        if (!this.previous) {
            return;
        }

        let element = this.previous.pop();

        if (element) {
            element.focus();
        }
    },

    appendToFocusHistory() {
        if (!this.previous) {
            this.previous = [];
        }

        this.previous.push(document.activeElement);
    }
};

export default FocusManager;
