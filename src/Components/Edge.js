import { Component } from '../Component.js';

export class Edge extends Component {
    constructor({ node, weight = 1 }) {
        super();
        this.node = node;
        this.weight = weight;
    }
}