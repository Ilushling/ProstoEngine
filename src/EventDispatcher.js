export class EventDispatcher {
    constructor() {
        this._listeners = {};
    }

    addEventListener(eventName, listener) {
        if (!this.hasEventListener(eventName, listener)) {
            if (!Array.isArray(this._listeners[eventName])) {
                this._listeners[eventName] = [];
            }
            this._listeners[eventName].push(listener);
        }
    }

    hasEventListener(eventName, listener) {
        return this._listeners[eventName] != undefined && this._listeners[eventName].includes(listener);
    }

    removeEventListener(eventName, listener) {
        if (this.hasEventListener(eventName, listener)) {
            const listeners = this._listeners[eventName];
            const listenerIndex = listeners.indexOf(listener);
            if (listenerIndex !== -1) {
                listeners.splice(listenerIndex, 1);
            }
        }
    }

    dispatchEvent(eventName, entity, component) {
        const listeners = this._listeners[eventName];
        if (listeners != undefined) {
            for (let i = 0, len = listeners.length; i < len; i++) {
                listeners[i](entity, component);
            }
        }
    }
}