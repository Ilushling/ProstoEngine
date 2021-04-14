import { System } from '../System.js';
import { Generated } from '../Components/Generated.js';
import { Renderable } from '../Components/Renderable.js';
import { Position } from '../Components/Position.js';
import { Scale } from '../Components/Scale.js';
import { Shape } from '../Components/Shape.js';
import { Collider } from '../Components/Collider.js';
import { NodeType } from '../Components/NodeType.js';
import { ShapeType } from '../Components/ShapeType.js';
import { Edge } from '../Components/Edge.js';
import { Edges } from '../Components/Edges.js';
import { AStarPathFinder } from '../Components/AStarPathFinder.js';

export class GridGeneratorSystem extends System {
    constructor(world) {
        super();
        this.world = world;
        this._entities = this.world.entityManager.getAllEntities();
        this.eventDispatcher = this.world.eventDispatcher;

        this.defaults = {
            width: 500,
            height: 500,
            cellSize: 20,
            margin: 1
        };

        this.width = typeof window !== 'undefined' ? window.innerWidth : this.defaults.height;
        this.height = typeof window !== 'undefined' ? window.innerHeight : this.defaults.height;
        this.cellSize = this.defaults.cellSize;
        this.margin = this.defaults.margin;
    }

    init() {
        this.initListeners();
        this.generate(this.width, this.height, this.cellSize, this.margin);
    }

    initListeners() {
        this.eventDispatcher.addEventListener('UIGenerateButtonOnClick', () => {
            this.clearGenerated();
            this.generate(this.width, this.height, this.cellSize, this.margin);
            this.eventDispatcher.dispatchEvent('redraw');
            this.eventDispatcher.dispatchEvent('clearPathFinder');
        });

        this.eventDispatcher.addEventListener('UICellSizeOnChange', cellSize => {
            this.cellSize = +cellSize || this.defaults.cellSize;
            this.eventDispatcher.dispatchEvent('onChangeCellSize', this.cellSize);
        });

        this.eventDispatcher.addEventListener('onResize', ({ width, height }) => {
            this.width = width;
            this.height = height;
        });
    }

    clearGenerated() {
        this._entities.forEach(entity => {
            if (!entity.hasComponent(Generated)) {
                return;
            }

            this.world.entityManager.removeEntity(entity);
        });
    }

    generate(width, height, cellSize, margin) {
        const baseWeight = 1;
        const nodesMatrix = [];

        const step = cellSize + margin;
        const xStepsCount = Math.max(height / step - 1, 0);
        const yStepsCount = Math.max(width / step - 1, 0);
        if (!xStepsCount || !yStepsCount) {
            return console.log('cellSize bigger than screen');
        }
        if (xStepsCount + yStepsCount < 2) {
            return console.log('stepCount less than 2');
        }

        const entityIds = [];
        for (let y = 0; y < xStepsCount; y++) {
            nodesMatrix[y] = [];
            for (let x = 0; x < yStepsCount; x++) {
                const entity = this.world.createEntity()
                    .addComponent(Generated)
                    .addComponent(Renderable)
                    .addComponent(Position)
                    .addComponent(Scale)
                    .addComponent(Shape)
                    .addComponent(Collider)
                    .addComponent(NodeType)
                    .addComponent(Edges)
                    .addComponent(AStarPathFinder);

                const position = entity.getComponent(Position);
                const scale = entity.getComponent(Scale);
                const shape = entity.getComponent(Shape);
                const collider = entity.getComponent(Collider);
                const nodeType = entity.getComponent(NodeType);

                position.x = step * x;
                position.y = step * y;
                scale.x = cellSize;
                scale.y = cellSize;

                shape.primitive = ShapeType.BOX;
                shape.rect = {
                    x: position.x,
                    y: position.y,
                    width: scale.x,
                    height: scale.y,
                };

                collider.rect = {
                    x: position.x,
                    y: position.y,
                    width: scale.x,
                    height: scale.y,
                };

                nodeType.id = NodeType.FREE;

                nodesMatrix[y][x] = entity;

                entityIds.push(entity.id);
            }
        }

        // Start End Nodes
        const generatedEntitiesCount = entityIds.length;
        const startEntityIdsId = GridGeneratorSystem.getRandomInteger(0, generatedEntitiesCount);
        let endEntityIdsId = GridGeneratorSystem.getRandomInteger(0, generatedEntitiesCount);
        while (endEntityIdsId == startEntityIdsId) {
            endEntityIdsId = GridGeneratorSystem.getRandomInteger(0, generatedEntitiesCount);
        }

        const startEntity = this.world.entityManager.getEntityById(entityIds[startEntityIdsId]);
        startEntity.getComponent(NodeType).id = NodeType.START;
        const endEntity = this.world.entityManager.getEntityById(entityIds[endEntityIdsId]);
        endEntity.getComponent(NodeType).id = NodeType.END;

        // Node edges
        nodesMatrix.forEach((nodeMatrixX, y) => {
            nodeMatrixX.forEach((entity, x) => {
                const entityEdges = entity.getComponent(Edges);

                const up    = nodesMatrix[y - 1]    ? nodesMatrix[y - 1][x] : undefined;
                const left  = nodesMatrix[y][x - 1];
                const down  = nodesMatrix[y + 1]    ? nodesMatrix[y + 1][x] : undefined;
                const right = nodesMatrix[y][x + 1];

                const upLeft     = nodesMatrix[y - 1] ? nodesMatrix[y - 1][x - 1] : undefined;
                const downLeft   = nodesMatrix[y + 1] ? nodesMatrix[y + 1][x - 1] : undefined;
                const upRight    = nodesMatrix[y - 1] ? nodesMatrix[y - 1][x + 1] : undefined;
                const downRight  = nodesMatrix[y + 1] ? nodesMatrix[y + 1][x + 1] : undefined;

                if (up) {
                    const upEdge = new Edge({ node: up, weight: baseWeight });
                    entityEdges.edges.push(upEdge);
                }
                if (left) {
                    const leftEdge = new Edge({ node: left, weight: baseWeight });
                    entityEdges.edges.push(leftEdge);
                }
                if (down) {
                    const downEdge = new Edge({ node: down, weight: baseWeight });
                    entityEdges.edges.push(downEdge);
                }
                if (right) {
                    const rightEdge = new Edge({ node: right, weight: baseWeight });
                    entityEdges.edges.push(rightEdge);
                }

                // Diagonals
                if (upLeft) {
                    const upLeftEdge = new Edge({ node: upLeft, weight: baseWeight * 1.4 });
                    entityEdges.edges.push(upLeftEdge);
                }
                if (downLeft) {
                    const downLeftEdge = new Edge({ node: downLeft, weight: baseWeight * 1.4 });
                    entityEdges.edges.push(downLeftEdge);
                }
                if (upRight) {
                    const upRightEdge = new Edge({ node: upRight, weight: baseWeight * 1.4 });
                    entityEdges.edges.push(upRightEdge);
                }
                if (downRight) {
                    const downRightEdge = new Edge({ node: downRight, weight: baseWeight * 1.4 });
                    entityEdges.edges.push(downRightEdge);
                }
            });
        });

        this.eventDispatcher.dispatchEvent('onGridGenerate', { cellSize, margin, generatedEntitiesCount });
    }

    static getRandomInteger(min, max) {
        return Math.round(min - 0.5 + Math.random() * (max - min));
    }
}