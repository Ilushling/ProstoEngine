import { Component } from '../Component.js';

export class Canvas extends Component {
    constructor() {
        super();
        this.canvas = document.getElementById('canvas');
        this.ctx = canvas.getContext('2d');
    }
}