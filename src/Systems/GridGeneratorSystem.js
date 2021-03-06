import { System } from '../System.js';
import { Generated } from '../Components/Generated.js';
import { Renderable } from '../Components/Renderable.js';
import { Position } from '../Components/Position.js';
import { Scale } from '../Components/Scale.js';
import { Shape } from '../Components/Shape.js';
import { Collider } from '../Components/Collider.js';
import { ColliderType } from '../Components/ColliderType.js';
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
            cellSize: 10,
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

        const step = cellSize + margin;
        const countInRow = Math.max(Math.ceil(width / step - 1 /* 1 block from right border */), 0);
        const countInColumn = Math.max(Math.ceil(height / step - 1 /* 1 block from bottom border */), 0);
        if (!countInRow || !countInColumn) {
            return console.log('cellSize bigger than screen');
        }
        if (countInRow + countInColumn < 2) {
            return console.log('stepCount less than 2');
        }

        const nodesMatrix = Array.from(Array(countInColumn), () => []);
        const entityIds = new Map();
        for (let y = 0; y < countInColumn; y++) {
            const entityIdI = y * countInRow;
            for (let x = 0; x < countInRow; x++) {
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

                collider.primitive = ColliderType.BOX;
                collider.rect = {
                    x: position.x,
                    y: position.y,
                    width: scale.x + margin,
                    height: scale.y + margin,
                };

                nodeType.id = NodeType.FREE;

                nodesMatrix[y][x] = entity;

                entityIds.set(entityIdI + x, entity.id);
            }
        }

        // Start End Nodes
        const generatedEntitiesCount = entityIds.size;
        const startEntityId = GridGeneratorSystem.getRandomInteger(0, generatedEntitiesCount);
        let endEntityId = GridGeneratorSystem.getRandomInteger(0, generatedEntitiesCount);
        while (endEntityId == startEntityId) {
            endEntityId = GridGeneratorSystem.getRandomInteger(0, generatedEntitiesCount);
        }

        const startEntity = this.world.entityManager.getEntityById(entityIds.get(startEntityId));
        startEntity.getComponent(NodeType).id = NodeType.START;
        const endEntity = this.world.entityManager.getEntityById(entityIds.get(endEntityId));
        endEntity.getComponent(NodeType).id = NodeType.END;

        // Node edges
        nodesMatrix.forEach((nodeMatrixX, y) => {
            nodeMatrixX.forEach((entity, x) => {
                const entityEdges = entity.getComponent(Edges);

                const up    = nodesMatrix[y - 1]    ? nodesMatrix[y - 1][x] : undefined;
                const left  = nodesMatrix[y][x - 1];
                const down  = nodesMatrix[y + 1]    ? nodesMatrix[y + 1][x] : undefined;
                const right = nodesMatrix[y][x + 1];

                const upLeft    = nodesMatrix[y - 1] ? nodesMatrix[y - 1][x - 1] : undefined;
                const downLeft  = nodesMatrix[y + 1] ? nodesMatrix[y + 1][x - 1] : undefined;
                const upRight   = nodesMatrix[y - 1] ? nodesMatrix[y - 1][x + 1] : undefined;
                const downRight = nodesMatrix[y + 1] ? nodesMatrix[y + 1][x + 1] : undefined;

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
                const diagonalWeight = baseWeight * 1.4;
                if (upLeft) {
                    const upLeftEdge = new Edge({ node: upLeft, weight: diagonalWeight });
                    entityEdges.edges.push(upLeftEdge);
                }
                if (downLeft) {
                    const downLeftEdge = new Edge({ node: downLeft, weight: diagonalWeight });
                    entityEdges.edges.push(downLeftEdge);
                }
                if (upRight) {
                    const upRightEdge = new Edge({ node: upRight, weight: diagonalWeight });
                    entityEdges.edges.push(upRightEdge);
                }
                if (downRight) {
                    const downRightEdge = new Edge({ node: downRight, weight: diagonalWeight });
                    entityEdges.edges.push(downRightEdge);
                }
            });
        });

        this.eventDispatcher.dispatchEvent('onGridGenerate', { cellSize, margin, generatedEntitiesCount, countInRow, countInColumn });
    }

    static getRandomInteger(min, max) {
        return Math.round(min - 0.5 + Math.random() * (max - min));
    }
}