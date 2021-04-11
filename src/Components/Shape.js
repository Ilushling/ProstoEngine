import { Component } from '../Component.js';

export class Shape extends Component {
    primitive;
    _color;
    path2D;
    rect = {};
    previous = {
        color: undefined
    };

    constructor(entityId) {
        super(entityId);
    }

    get color() {
        return this._color;
    }

    set color(color) {
        if (color != this.color) {
            this.previous.color = this.color;
            this._color = color;
            Shape.componentManager.world.eventDispatcher.dispatchEvent('render', this.entityId);
        }
    }
}