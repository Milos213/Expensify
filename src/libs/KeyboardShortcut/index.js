import _ from 'underscore';

const events = {};

/**
 * Checks if an event for that key is configured and if so, runs it.
 * @param {Event} event
 */
function bindHandlerToKeyupEvent(event) {
    if (events[event.keyCode] === undefined) {
        return;
    }

    // The active callback is the last element in the array
    const eventCallbacks = events[event.keyCode];
    const callback = eventCallbacks[eventCallbacks.length - 1];

    const pressedModifiers = _.all(callback.modifiers, (modifier) => {
        if (modifier === 'shift' && !event.shiftKey) {
            return false;
        }
        if (modifier === 'control' && !event.ctrlKey) {
            return false;
        }
        if (modifier === 'alt' && !event.altKey) {
            return false;
        }
        if (modifier === 'meta' && !event.metaKey) {
            return false;
        }
        return true;
    });

    if (!pressedModifiers) {
        return;
    }

    // If configured to do so, prevent input text control to trigger this event
    if (!callback.captureOnInputs && (
        event.target.nodeName === 'INPUT'
        || event.target.nodeName === 'TEXTAREA'
        || event.target.contentEditable === 'true'
    )) {
        return;
    }

    if (_.isFunction(callback.callback)) {
        callback.callback(event);
    }
    event.preventDefault();
}

// Make sure we don't add multiple listeners
document.removeEventListener('keydown', bindHandlerToKeyupEvent);
document.addEventListener('keydown', bindHandlerToKeyupEvent);

/**
 * Module storing the different keyboard shortcut
 *
 * We are using a push/pop model where new event are pushed at the end of an
 * array of events. When the event occur, we trigger the callback of the last
 * element. This allow us to replace shortcut from a page to a dialog without
 * having the page having to handle that logic.
 *
 * This is also following the convention of the PubSub module.
 * The "subClass" is used by pages to bind /unbind with no worries
 */
const KeyboardShortcut = {
    /**
     * Subscribes to a keyboard event.
     * @param {String} key The key code to watch
     * @param {Function} callback The callback to call
     * @param {String|Array} modifiers Can either be shift or control
     * @param {Boolean} captureOnInputs Should we capture the event on inputs too?
     */
    subscribe(key, callback, modifiers = 'shift', captureOnInputs = false) {
        const keyCode = key.charCodeAt(0);
        if (events[keyCode] === undefined) {
            events[keyCode] = [];
        }
        events[keyCode].push({callback, modifiers: _.isArray(modifiers) ? modifiers : [modifiers], captureOnInputs});
    },

    /**
     * Unsubscribes to a keyboard event.
     * @param {Number} keyCode The key code to stop watching
     */
    unsubscribe(keyCode) {
        delete events[keyCode];
    },
};

export default KeyboardShortcut;
