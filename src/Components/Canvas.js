import { Component } from '../Component.js';

export class Canvas extends Component {
    constructor(entityId) {
        super(entityId);
        this.canvas = undefined;
        this.ctx = undefined;
    }
}