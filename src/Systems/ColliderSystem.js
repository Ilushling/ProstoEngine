import { Canvas } from '../Components/Canvas.js';
import { Collider } from '../Components/Collider.js';
import { ColliderType } from '../Components/ColliderType.js';
import { Position } from '../Components/Position.js';
import { Scale } from '../Components/Scale.js';
import { Shape } from '../Components/Shape.js';
import { System } from '../System.js';

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
            cellSize: 20,
            workersCount: 4
        };
        // Need subtract from original value for more accuracy interpolation
        this.cellSize = Math.ceil(this.defaults.cellSize - (this.defaults.cellSize / 4)) || this.defaults.cellSize;
        this.workersCount = this.workersCount ?? this.defaults.workersCount;

        this.isWorkerEntityUpdate = true;
        this.entitiesToCheckCollideInWorker = [];
        this.entitiesToCheckCollide = [];
        this.hoveredEntitesLastFrame = [];
    }

    init() {
        this.initListeners();
        this.initCanvas();
        this.initWorkers();
    }

    initListeners() {
        this.eventDispatcher.addEventListener('onGridGenerate', ({ cellSize }) => {
            // Need subtract from original value for more accuracy interpolation
            this.cellSize = Math.ceil(cellSize - (cellSize / 4)) 
                || Math.ceil(this.defaults.cellSize - (this.defaults.cellSize / 4)) 
                || this.defaults.cellSize;
        });
        this.eventDispatcher.addEventListener('UIWorkersCountOnChange', workersCount => {
            this.workersCount = Math.abs(+workersCount) ?? this.defaults.workersCount;
            this.resolveSystemPromise();
            this.initWorkers();
        });

        this.eventDispatcher.addEventListener('onCreateEntity', () => {
            this.isWorkerEntityUpdate = true;
        });
        this.eventDispatcher.addEventListener('onRemoveEntity', () => {
            this.isWorkerEntityUpdate = true;
        });

        this.eventDispatcher.addEventListener('onPositionChange', entityId => {
            const entity = this.entityManager.getEntityById(entityId);
            if (!entity || !entity.hasComponent(Collider) || !entity.hasComponent(Position) || !entity.hasComponent(Scale)) {
                return;
            }

            const collider = entity.getComponent(Collider);
            const position = entity.getComponent(Position);
            const scale = entity.getComponent(Scale);

            const rect = collider.rect;
            rect.x = position.x;
            rect.y = position.y;
            rect.width = scale.y;
            rect.height = scale.y;
        });

        this.eventDispatcher.addEventListener('onScaleChange', entityId => {
            const entity = this.entityManager.getEntityById(entityId);
            if (!entity || !entity.hasComponent(Collider) || !entity.hasComponent(Position) || !entity.hasComponent(Scale)) {
                return;
            }

            const collider = entity.getComponent(Collider);
            const position = entity.getComponent(Position);
            const scale = entity.getComponent(Scale);

            const rect = collider.rect;
            rect.x = position.x;
            rect.y = position.y;
            rect.width = scale.y;
            rect.height = scale.y;
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

    initWorkers() {
        if (Array.isArray(this.workers)) {
            this.terminateWorkers(this.workers);
        }
        this.workers = [];

        this.workersResolvedCount = 0;
        if (Array.isArray(this.hoveredEntitesLastFrame) && this.hoveredEntitesLastFrame.length) {
            this.clearHover();
        }
        for (let i = this.workersCount; i--;) {
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

                    // if isCollide == true
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

    terminateWorkers(workers) {
        for (let i = workers.length; i--;) {
            const worker = workers[i];
            worker.terminate();
        }
    }

    clearHover() {
        for (let i = this.hoveredEntitesLastFrame.length; i--;) {
            const entity = this.hoveredEntitesLastFrame[i];
            if (!entity.hasComponent(Collider)) {
                return;
            }
    
            const collider = entity.getComponent(Collider);
            collider.isPointerCollided = false;
        }
        this.hoveredEntitesLastFrame = [];
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
                if (!entity.hasComponent(Collider)) {
                    return;
                }

                const collider = entity.getComponent(Collider);

                if (collider.primitive == ColliderType.BOX) {
                    const isCollide = ColliderSystem.collides(
                        collider.rect, 
                        point, 
                        isInterpolate, 
                        interpolatedPointPositions
                    );
                    if (isCollide) {
                        collider.isPointerCollided = isCollide;
                        this.hoveredEntitesLastFrame.push(entity);
                    }
                } else {
                    if (!this.canvas) {
                        this.initCanvas();
                    }

                    if (!this.canvas) {
                        return console.log('canvas not found');
                    }

                    if (!entity.hasComponent(Shape)) {
                        return;
                    }

                    const shape = entity.getComponent(Shape);

                    if (!shape.path2D) {
                        return console.log('shape.path2D not found');
                    }

                    const isCollide = this.collides2D(shape.path2D, point, isInterpolate, interpolatedPointPositions);
                    if (isCollide) {
                        collider.isPointerCollided = isCollide;
                        this.hoveredEntitesLastFrame.push(entity);
                    }
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
    
        const interpolateSteps = point.x == -1 || point.y == -1 ? 0 : ~~((distance.x + distance.y) / accuracyDivider); // ~~ is faster analog Math.floor
        
        for (let i = interpolateSteps; i--;) {
            const step = i / interpolateSteps;
            interpolatedPointPositions.push({
                x: ColliderSystem.lerp(point.previous.x, point.x, step),
                y: ColliderSystem.lerp(point.previous.y, point.y, step)
            });
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

        for (let i = interpolatedPointPositions.length; i--;) {
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
    
        for (let i = interpolatedPointPositions.length; i--;) {
            const interpolatedPointPosition = interpolatedPointPositions[i];
            isCollide = this.rectContains(rect, interpolatedPointPosition);
    
            if (isCollide) {
                return isCollide;
            }
        }
    
        return false;
    }

    static rectContains(rect, point) {
        return (point.x > rect.x && point.x < rect.widthX) && 
               (point.y > rect.y && point.y < rect.heightY);
    }

    workersHandle(workers, entities, point, isInterpolate, cellSize) {
        // Columns to ColliderSystemWorker (in entitiesToCheckCollideInWorker)
        const columns = 5;
        // Prepare entities for check collision in worker
        if (this.isWorkerEntityUpdate) {
            this.entitiesToCheckCollideInWorker = [];
            this.entitiesToCheckCollide = [];
            entities.forEach(entity => {
                if (!entity.hasComponent(Collider)) {
                    return;
                }

                const collider = entity.getComponent(Collider);

                // Fast check collision in Web Worker
                if (collider.primitive == ColliderType.BOX) {
                    // 5 columns
                    const rect = collider.rect;
                    this.entitiesToCheckCollideInWorker.push(
                        entity.id,
                        rect.x, 
                        rect.y, 
                        rect.widthX, 
                        rect.heightY
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
        if (this.isWorkerEntityUpdate) {
            this.entitiesTypedArray = new Uint32Array(this.entitiesToCheckCollideInWorker);
        }
        for (let i = workersCount; i--;) {
            const worker = workers[i];
            if (!worker) {
                return;
            }

            const start = entitiesToWorkerCount * i;
            const limit = start + entitiesToWorkerCount + (i == workersCount ? remain * workersCount : 0);

            const entitiesBuffer = this.entitiesTypedArray.slice(start, limit).buffer;

            worker.postMessage({
                point,
                isInterpolate,
                workerI: i,
                cellSize,
                columns,
                entitiesBuffer
            }, [entitiesBuffer]);
        }

        this.isWorkerEntityUpdate = false;

        return this.entitiesToCheckCollide;
    }
}