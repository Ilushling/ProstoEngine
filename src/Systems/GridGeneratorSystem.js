import { System } from '../System.js';
import { Position } from '../Components/Position.js';
import { Scale } from '../Components/Scale.js';
import { Shape } from '../Components/Shape.js';
import { Collider } from '../Components/Collider.js';
import { NodeType } from '../Components/NodeType.js';
import { Hover } from '../Components/Hover.js';
import { Edge } from '../Components/Edge.js';
import { Edges } from '../Components/Edges.js';
import { AStarPathFinder } from '../Components/AStarPathFinder.js';

export class GridGeneratorSystem extends System {
    constructor(world) {
        super();
        this.world = world;
        this.entities = this.world.entityManager._entities;
        this.width = typeof window !== 'undefined' ? window.innerWidth : 500;
        this.height = typeof window !== 'undefined' ? window.innerHeight : 500;
    }

    init() {
        const boxSize = 50;
        const margin = 1;
        const nodesMatrix = [];

        const step = boxSize + margin;
        const xStepsCount = this.height / step - 1;
        const yStepsCount = this.width / step - 1;

        for (let y = 0; y < xStepsCount; y++) {
            nodesMatrix[y] = [];
            for (let x = 0; x < yStepsCount; x++) {
                const entity = this.world.createEntity(`Entity x ${x} y ${y}`)
                    .addComponent(Position)
                    .addComponent(Scale)
                    .addComponent(Shape)
                    .addComponent(Collider)
                    .addComponent(NodeType)
                    .addComponent(Hover)
                    .addComponent(Edges)
                    .addComponent(AStarPathFinder);

                const position = entity.getComponent(Position);
                const scale = entity.getComponent(Scale);

                position.x = (boxSize + margin) * x;
                position.y = (boxSize + margin) * y;
                scale.x = boxSize;
                scale.y = boxSize;

                nodesMatrix[y][x] = entity;
            }
        }

        // Start End Nodes
        const entitiesCount = this.entities.length;
        const startEntityId = GridGeneratorSystem.getRandomInteger(0, entitiesCount);
        let endEntityId = GridGeneratorSystem.getRandomInteger(0, entitiesCount);
        while (endEntityId == startEntityId) {
            endEntityId = GridGeneratorSystem.getRandomInteger(0, entitiesCount);
        }

        this.world.entityManager.getEntityById(startEntityId).getComponent(NodeType).id = NodeType.START;
        this.world.entityManager.getEntityById(endEntityId).getComponent(NodeType).id = NodeType.END;

        // Node edges
        nodesMatrix.forEach((nodeMatrixX, y) => {
            nodeMatrixX.forEach((entity, x) => {
                const entityEdges = entity.getComponent(Edges);

                const up    = nodesMatrix[y - 1]    ? nodesMatrix[y - 1][x] : undefined;
                const left  = nodesMatrix[y][x - 1];
                const down  = nodesMatrix[y + 1]    ? nodesMatrix[y + 1][x] : undefined;
                const right = nodesMatrix[y][x + 1];

                const upLeft  = nodesMatrix[y - 1]    ? nodesMatrix[y - 1][x - 1] : undefined;
                const downLeft  = nodesMatrix[y + 1]  ? nodesMatrix[y + 1][x - 1] : undefined;
                const upRight = nodesMatrix[y - 1]    ? nodesMatrix[y - 1][x + 1] : undefined;
                const downRight  = nodesMatrix[y + 1] ? nodesMatrix[y + 1][x + 1] : undefined;

                const newEdges = [];

                if (up) {
                    const upEdge = new Edge({ node: up, weight: 1 });
                    newEdges.push(upEdge);
                }
                if (left) {
                    const leftEdge = new Edge({ node: left, weight: 1 });
                    newEdges.push(leftEdge);
                }
                if (down) {
                    const downEdge = new Edge({ node: down, weight: 1 });
                    newEdges.push(downEdge);
                }
                if (right) {
                    const rightEdge = new Edge({ node: right, weight: 1 });
                    newEdges.push(rightEdge);
                }

                // Diagonals
                if (upLeft) {
                    const upLeftEdge = new Edge({ node: upLeft, weight: 1.4 });
                    newEdges.push(upLeftEdge);
                }
                if (downLeft) {
                    const downLeftEdge = new Edge({ node: downLeft, weight: 1.4 });
                    newEdges.push(downLeftEdge);
                }
                if (upRight) {
                    const upRightEdge = new Edge({ node: upRight, weight: 1.4 });
                    newEdges.push(upRightEdge);
                }
                if (downRight) {
                    const downRightEdge = new Edge({ node: downRight, weight: 1.4 });
                    newEdges.push(downRightEdge);
                }

                entityEdges.edges.push(...newEdges);
            });
        });
    }

    static getRandomInteger(min, max) {
        return Math.round(min - 0.5 + Math.random() * (max - min));
    }
}