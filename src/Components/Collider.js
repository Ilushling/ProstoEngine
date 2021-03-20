import { Component } from '../Component.js';
export class Collider extends Component {
    constructor() {
        super();
        this.collided = [];
        this.isMouseCollided = false;
    }
}