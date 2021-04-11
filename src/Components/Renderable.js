import { Component } from '../Component.js';

export class Renderable extends Component {
    constructor(entityId) {
        super(entityId);
        this.isEnable = true;
        this.isRedraw = true;
    }
}