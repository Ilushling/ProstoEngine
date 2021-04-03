import { Canvas } from '../Components/Canvas.js';
import { Collider } from '../Components/Collider.js';
import { Shape } from '../Components/Shape.js';
import { Position } from '../Components/Position.js';
import { Scale } from '../Components/Scale.js';
import { System } from '../System.js';
import { ShapeType } from '../Components/ShapeType.js';

export class ColliderSystem extends System {
    constructor(world) {
        super();
        this.world = world;
        this._entities = this.world.entityManager._entities;
    }

    init() {
        this.workersCount = 1;
        this.workers = [];
        for (let i = 0; i < this.workersCount; i++) {
            this.workers.push(new Worker('src/Systems/ColliderSystemWorker.js', { type: 'module' }));
            const worker = this.workers[i];

            const columns = 2; // Columns from ColliderSystemWorker
            worker.onmessage = event => {
                // @TODO packages may get lost because web worker can handles longer than frame
                const entitiesBuffer = new Uint16Array(event.data);
                for (let j = 0, length = entitiesBuffer.length; j < length; j += columns) {
                    const entityOffset = j;
                    const entityId = entitiesBuffer[entityOffset];
                    const isCollide = entitiesBuffer[entityOffset + 1];

                    const entity = this._entities[entityId];
                    if (!entity) {
                        continue;
                    }
    
                    const collider = entity.getComponent(Collider);
                    collider.isMouseCollided = isCollide;
                }
            };
        }
    }

    execute() {
        if (!this.canvas) {
            this.canvasEntity = this.world.entityManager.getEntityByName('CanvasScene');
            if (this.canvasEntity && this.canvasEntity.hasComponent(Canvas)) {
                this.canvasComponent = this.canvasEntity.getComponent(Canvas);
                this.canvas = this.canvasComponent.canvas;
                this.ctx = this.canvasComponent.ctx;
            } else {
                return;
            }
        }

        const workersCount = this.workers.length;
        let entitiesToCheckCollide = [];
        if (workersCount) {
            // Prepare entities for check collision in worker
            const entitiesToCheckCollideInWorker = [];
            for (const entity of this._entities) {
                if (!entity.hasComponent(Collider) || !entity.hasComponent(Shape) || !entity.hasComponent(Position) || !entity.hasComponent(Scale)) {
                    continue;
                }

                const shape = entity.getComponent(Shape);
                const position = entity.getComponent(Position);
                const scale = entity.getComponent(Scale);

                // Fast check collision in Web Worker
                if (shape.primitive == ShapeType.BOX) {
                    // 5 columns
                    entitiesToCheckCollideInWorker.push(
                        entity.id,
                        position.x, 
                        position.y, 
                        scale.x, 
                        scale.y
                    );

                    continue;
                }

                // For check collisions not in Web Worker
                entitiesToCheckCollide.push(entity);
            }

            const entitiesCount = entitiesToCheckCollideInWorker.length;
            const entitiesTypedArray = new Uint16Array(entitiesToCheckCollideInWorker);
            // Columns to ColliderSystemWorker (in entitiesToCheckCollideInWorker)
            const columns = 5;
            for (let i = 0; i < workersCount; i++) {
                const worker = this.workers[i];
                if (!worker) {
                    return;
                }
                const count = entitiesCount / workersCount * columns;
                const start = count * i;
                const limit = start + count;

                const entitiesBuffer = entitiesTypedArray.slice(start, limit).buffer;

                worker.postMessage({
                    point: this.world.inputManager.mouse,
                    isInterpolate: this.world.inputManager.isMouseInterpolate,
                    entitiesBuffer,
                }, [entitiesBuffer]);
            }
        } else {
            entitiesToCheckCollide = this._entities;
        }

        if (this.world.inputManager.isMouseInterpolate) {
            var interpolatedPointPositions = ColliderSystem.interpolatePointPositions(this.world.inputManager.mouse);
        }

        for (const entity of entitiesToCheckCollide) {
            if (!entity.hasComponent(Collider) || !entity.hasComponent(Shape) || !entity.hasComponent(Position) || !entity.hasComponent(Scale)) {
                continue;
            }

            const shape = entity.getComponent(Shape);
            const collider = entity.getComponent(Collider);
            const position = entity.getComponent(Position);
            const scale = entity.getComponent(Scale);

            if (shape.path2D && this.world.inputManager) {
                if (shape.primitive == ShapeType.BOX) {
                    collider.isMouseCollided = ColliderSystem.collides(
                        { x: position.x, y: position.y, width: scale.x, height: scale.y }, 
                        this.world.inputManager.mouse, 
                        this.world.inputManager.isMouseInterpolate, 
                        interpolatedPointPositions
                    );
                } else {
                    collider.isMouseCollided = this.collides2D(shape.path2D, this.world.inputManager.mouse, this.world.inputManager.isMouseInterpolate, interpolatedPointPositions);
                }
            }
        }
    }

    static interpolatePointPositions(point) {
        const interpolatedPointPositions = [];
    
        const distance = {
            x: Math.abs(point.previous.x - point.x),
            y: Math.abs(point.previous.y - point.y)
        };
    
        const interpolateSteps = (distance.x + distance.y) / 40;
        
        for (let i = 0; i <= interpolateSteps; i++) {
            const lerpPoint = {
                x: ColliderSystem.lerp(point.previous.x, point.x, i / interpolateSteps),
                y: ColliderSystem.lerp(point.previous.y, point.y, i / interpolateSteps)
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
    
        for (const interpolatedPointPosition of interpolatedPointPositions) {
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
    
        for (const interpolatedPointPosition of interpolatedPointPositions) {
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
}