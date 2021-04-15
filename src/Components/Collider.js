import { Component } from '../Component.js';

export class Collider extends Component {
    primitive;
    rect = {
        x: 0,
        y: 0,
        width: 0,
        height: 0,
    };
    collided = [];
    _isPointerCollided = false;

    constructor(entityId) {
        super(entityId);
    }

    set isPointerCollided(isPointerCollided) {
        this._isPointerCollided = isPointerCollided;
        Collider.componentManager.world.eventDispatcher.dispatchEvent('pointerCollidedOnChange', this.entityId);
    }

    get isPointerCollided() {
        return this._isPointerCollided;
    }
}