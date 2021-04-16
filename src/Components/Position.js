import { Component } from '../Component.js';

export class Position extends Component {
    _x;
    _y;

    constructor(entityId) {
        super(entityId);
    }

    get x() {
        return this._x;
    }

    set x(x) {
        this._x = x;
        Position.componentManager.world.eventDispatcher.dispatchEvent('onPositionChange', this.entityId);
    }

    get y() {
        return this._y;
    }

    set y(y) {
        this._y = y;
        Position.componentManager.world.eventDispatcher.dispatchEvent('onPositionChange', this.entityId);
    }
}