class MyEventEmitter {
    constructor() {
        this._events = {};
    }

    on(name, listener) {
        if (!this._events[name]) {
            this._events[name] = [];
        }

        this._events[name].push(listener);
    }

    emit(name, data) {
        if (!this._events[name]) {
            throw new Error(`Can't emit an event. Event "${name}" doesn't exits.`);
        }

        const fireCallbacks = (callback) => {
            callback(data);
        };

        this._events[name].forEach(fireCallbacks);
    }
}
