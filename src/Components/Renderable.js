import { Component } from '../Component.js';

export class Renderable extends Component {
    isEnable = true;
    isRedraw = true;

    constructor(entityId) {
        super(entityId);
    }
}