import { Component } from '../Component.js';
import { ShapeType } from './ShapeType.js';
export class Shape extends Component {
    constructor(primitive = ShapeType.BOX, color = 'white') {
        super();
        this.primitive = primitive;
        this.color = color;
        this.previous = { };
    }
}