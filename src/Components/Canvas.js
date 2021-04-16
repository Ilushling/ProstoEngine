import { Component } from '../Component.js';

export class Canvas extends Component {
    canvas;
    ctx;

    constructor(entityId) {
        super(entityId);
    }
}