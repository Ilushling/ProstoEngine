import { Component } from '../Component.js';

export class Collider extends Component {
    primitive;
    _rect = {
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        widthX: 0,
        heightY: 0
    };
    collided = [];
    _isPointerCollided = false;

    constructor(entityId) {
        super(entityId);
    }

    get rect () {
        return this._rect;
    }

    set rect(rect) {
        rect.widthX = rect.x + rect.width;
        rect.heightY = rect.y + rect.height;
        this._rect = rect;
    }

    set isPointerCollided(isPointerCollided) {
        this._isPointerCollided = isPointerCollided;
        Collider.componentManager.world.eventDispatcher.dispatchEvent('pointerCollidedOnChange', this.entityId);
    }

    get isPointerCollided() {
        return this._isPointerCollided;
    }
}