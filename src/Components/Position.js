import { Component } from '../Component.js';

export class Position extends Component {
    constructor(entityId) {
        super(entityId);
        this.x = 0;
        this.y = 0;
    }
}