import { Component } from '../Component.js';

export class Collider extends Component {
    constructor(entityId) {
        super(entityId);
        this.collided = [];
        this._isPointerCollided = false;
    }

    set isPointerCollided(isPointerCollided) {
        this._isPointerCollided = isPointerCollided;
        Collider.componentManager.world.eventDispatcher.dispatchEvent('pointerCollidedOnChange', this.entityId);
    }

    get isPointerCollided() {
        return this._isPointerCollided;
    }
}