import { Canvas } from '../Components/Canvas.js';
import { Collider } from '../Components/Collider.js';
import { Shape } from '../Components/Shape.js';
import { Position } from '../Components/Position.js';
import { Scale } from '../Components/Scale.js';
import { System } from '../System.js';
import { ShapeType } from '../Components/ShapeType.js';

export class ColliderSystem extends System {
    constructor(world) {
        super(world);
        this.world = world;
        this.entityManager = this.world.entityManager;
        this.inputManager = this.world.inputManager;
        this._entities = this.entityManager.getAllEntities();
        this.eventDispatcher = this.world.eventDispatcher;

        this.isEnableHoverCollider = true;
        this.defaults = {
            cellSize: 20
        };
        // Need subtract from original value for more accuracy interpolation
        this.cellSize = Math.ceil(this.defaults.cellSize - (this.defaults.cellSize / 4)) || this.defaults.cellSize;
    }

    init() {
        this.initListeners();
        this.initCanvas();

        this.workersCount = 4;
        this.workersResolvedCount = 0;
        this.workers = [];
        this.hoveredEntitesLastFrame = [];
        this.isWorkerEntityUpdate = true;
        this.entitiesToCheckCollideInWorker = [];
        this.entitiesToCheckCollide = [];
        for (let i = this.workersCount - 1; i >= 0; i--) {
            const worker = new Worker('src/Systems/ColliderSystemWorker.js', { type: 'module' });
            this.workers.push(worker);

            const columns = 2; // Columns from ColliderSystemWorker
            worker.onmessage = event => {
                const entitiesTypedArray = new Uint32Array(event.data);
                for (let j = entitiesTypedArray.length - columns; j >= 0; j -= columns) {
                    const entityOffset = j;
                    const entityId = entitiesTypedArray[entityOffset];
                    const isCollide = entitiesTypedArray[entityOffset + 1];

                    const entity = this.entityManager.getEntityById(entityId);
                    if (!entity || !entity.hasComponent(Collider)) {
                        continue;
                    }

                    const collider = entity.getComponent(Collider);
                    collider.isPointerCollided = isCollide;

                    this.hoveredEntitesLastFrame.push(entity);
                }

                this.workersResolvedCount++;
                if (this.workersResolvedCount == this.workersCount) {
                    this.workersResolvedCount = 0;
                    this.resolveSystemPromise();
                }
            };
        }
    }

    initListeners() {
        this.eventDispatcher.addEventListener('onGridGenerate', ({ cellSize }) => {
            // Need subtract from original value for more accuracy interpolation
            this.cellSize = Math.ceil(cellSize - (cellSize / 4)) 
                || Math.ceil(this.defaults.cellSize - (this.defaults.cellSize / 4)) 
                || this.defaults.cellSize;
        });

        this.eventDispatcher.addEventListener('onCreateEntity', () => {
            this.isWorkerEntityUpdate = true;
        });
        this.eventDispatcher.addEventListener('onRemoveEntity', () => {
            this.isWorkerEntityUpdate = true;
        });
    }

    initCanvas() {
        this.canvasEntity = this.entityManager.getEntityByName('CanvasScene');
        if (this.canvasEntity && this.canvasEntity.hasComponent(Canvas)) {
            this.canvasComponent = this.canvasEntity.getComponent(Canvas);
            this.canvas = this.canvasComponent.canvas;
            this.ctx = this.canvasComponent.ctx;
        }
    }

    clearHover() {
        let entity;
        while (entity = this.hoveredEntitesLastFrame.pop()) {
            if (!entity.hasComponent(Collider)) {
                return;
            }
    
            const collider = entity.getComponent(Collider);
            collider.isPointerCollided = false;
        }
    }

    execute() {
        return new Promise((resolve, reject) => {
            this.resolveSystemPromise = resolve;
            if (!this.isEnableHoverCollider) {
                return this.resolveSystemPromise();
            }

            const inputManager = this.inputManager;
            if (!inputManager) {
                console.log('inputManager not found');
                return this.resolveSystemPromise();
            }

            const point = inputManager.pointer;
            const isInterpolate = inputManager.isPointerInterpolate;
            let entitiesToCheckCollide = [];
            let interpolatedPointPositions = [];
            if (this.workersCount) {
                entitiesToCheckCollide = this.workersHandle(this.workers, this._entities, point, isInterpolate, this.cellSize);
            } else {
                entitiesToCheckCollide = this._entities;
            }

            if (isInterpolate) {
                interpolatedPointPositions = ColliderSystem.interpolatePointPositions(point, this.cellSize);
            }

            entitiesToCheckCollide.forEach(entity => {
                if (!entity.hasComponent(Collider) || !entity.hasComponent(Shape)) {
                    return;
                }

                const collider = entity.getComponent(Collider);
                const shape = entity.getComponent(Shape);

                if (shape.primitive == ShapeType.BOX) {
                    collider.isPointerCollided = ColliderSystem.collides(
                        collider.rect, 
                        point, 
                        isInterpolate, 
                        interpolatedPointPositions
                    );
                } else {
                    if (!this.canvas) {
                        initCanvas();
                    }

                    if (!this.canvas) {
                        return console.log('canvas not found');
                    }

                    if (!shape.path2D) {
                        return console.log('shape.path2D not found');
                    }

                    collider.isPointerCollided = this.collides2D(shape.path2D, point, isInterpolate, interpolatedPointPositions);
                }
            });

            if (!this.workersCount) {
                return this.resolveSystemPromise();
            }
        });
    }

    afterExecute() {
        this.clearHover();
    }

    static interpolatePointPositions(point, accuracyDivider) {
        const interpolatedPointPositions = [];
    
        const distance = {
            x: Math.abs(point.previous.x - point.x),
            y: Math.abs(point.previous.y - point.y)
        };
    
        const interpolateSteps = (distance.x + distance.y) / accuracyDivider;
        
        for (let i = interpolateSteps; i > 0; i--) {
            const step = i / interpolateSteps;
            const lerpPoint = {
                x: ColliderSystem.lerp(point.previous.x, point.x, step),
                y: ColliderSystem.lerp(point.previous.y, point.y, step)
            };
            interpolatedPointPositions.push(lerpPoint);
        }
    
        return interpolatedPointPositions;
    }

    static lerp(start, end, weight) {
        return start * (1 - weight) + end * weight;
    }

    collides2D(path2D, point, isInterpolate = false, interpolatedPointPositions = []) {
        let isCollide = this.ctx.isPointInPath(path2D, point.x, point.y);
        if (isCollide) {
            return isCollide;
        }
    
        if (!isInterpolate) {
            return false;
        }

        for (let i = interpolatedPointPositions.length - 1; i >= 0; i--) {
            const interpolatedPointPosition = interpolatedPointPositions[i];
            isCollide = this.ctx.isPointInPath(path2D, interpolatedPointPosition);
    
            if (isCollide) {
                return isCollide;
            }
        }
    
        return false;
    }

    static collides(rect, point, isInterpolate = false, interpolatedPointPositions = []) {
        let isCollide = this.rectContains(rect, point);
        if (isCollide) {
            return isCollide;
        }
    
        if (!isInterpolate) {
            return false;
        }
    
        for (let i = interpolatedPointPositions.length - 1; i >= 0; i--) {
            const interpolatedPointPosition = interpolatedPointPositions[i];
            isCollide = this.rectContains(rect, interpolatedPointPosition);
    
            if (isCollide) {
                return isCollide;
            }
        }
    
        return false;
    }

    static rectContains(rect, point) {
        return rect.x  <= point.x && 
               point.x <= rect.x + rect.width && 
               rect.y  <= point.y && 
               point.y <= rect.y + rect.height;
    }

    workersHandle(workers, entities, point, isInterpolate, cellSize) {
        // Columns to ColliderSystemWorker (in entitiesToCheckCollideInWorker)
        const columns = 5;
        // Prepare entities for check collision in worker
        if (this.isWorkerEntityUpdate) {
            this.isWorkerEntityUpdate = false;
            this.entitiesToCheckCollideInWorker = [];
            this.entitiesToCheckCollide = [];
            entities.forEach(entity => {
                if (!entity.hasComponent(Collider) || !entity.hasComponent(Shape) || !entity.hasComponent(Position) || !entity.hasComponent(Scale)) {
                    return;
                }

                const shape = entity.getComponent(Shape);
                const position = entity.getComponent(Position);
                const scale = entity.getComponent(Scale);

                // Fast check collision in Web Worker
                if (shape.primitive == ShapeType.BOX) {
                    // 5 columns
                    this.entitiesToCheckCollideInWorker.push(
                        entity.id,
                        position.x, 
                        position.y, 
                        scale.x, 
                        scale.y
                    );

                    return;
                }

                // For check collisions not in Web Worker
                this.entitiesToCheckCollide.push(entity);
            });
        }

        const workersCount = workers.length;
        const entitiesCount = this.entitiesToCheckCollideInWorker.length;
        const remain = entitiesCount / workersCount % columns;
        const entitiesToWorkerCount = entitiesCount / workersCount - remain;
        let entitiesTypedArray = new Uint32Array(this.entitiesToCheckCollideInWorker);
        for (let i = workersCount - 1; i >= 0; i--) {
            const worker = workers[i];
            if (!worker) {
                return;
            }

            const start = entitiesToWorkerCount * i;
            const limit = start + entitiesToWorkerCount + (i == workersCount - 1 ? remain * workersCount : 0);

            const entitiesBuffer = entitiesTypedArray.slice(start, limit).buffer;

            worker.postMessage({
                point,
                isInterpolate,
                workerI: i,
                cellSize,
                columns,
                entitiesBuffer
            }, [entitiesBuffer]);
        }

        return this.entitiesToCheckCollide;
    }
}