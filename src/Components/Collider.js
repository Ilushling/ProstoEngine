import { Component } from '../Component.js';

export class Collider extends Component {
    constructor(entityId) {
        super(entityId);
        this.rect = {
            x: 0,
            y: 0,
            width: 0,
            height: 0,
        };
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