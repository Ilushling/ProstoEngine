export class Edge {
    node;
    weight = 1;

    constructor({ node, weight = 1 }) {
        this.node = node;
        this.weight = weight;
    }
}