import { Component } from '../Component.js';

export class Scale extends Component {
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
        Scale.componentManager.world.eventDispatcher.dispatchEvent('onScaleChange', this.entityId);
    }

    get y() {
        return this._y;
    }

    set y(y) {
        this._y = y;
        Scale.componentManager.world.eventDispatcher.dispatchEvent('onScaleChange', this.entityId);
    }
}