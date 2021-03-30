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
                const entitiesBuffer = new Uint16Array(event.data);
                for (let j = 0, length = entitiesBuffer.length; j < length; j += columns) {
                    const entityOffset = j;
                    const entityId = entitiesBuffer[entityOffset];
                    const isCollide = entitiesBuffer[entityOffset + 1];

                    const entity = this._entities[entityId];
                    if (!entity || !entity.hasComponent(Collider)) {
                        return;
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
            this._entities.forEach(entity => {
                if (!entity.hasComponent(Collider) || !entity.hasComponent(Shape) || !entity.hasComponent(Position) || !entity.hasComponent(Scale)) {
                    return;
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

                    return;
                }

                // For check collisions not in Web Worker
                entitiesToCheckCollide.push(entity);
            });

            const entitiesCount = entitiesToCheckCollideInWorker.length;
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

                const entitiesBuffer = new Uint16Array(entitiesToCheckCollideInWorker.slice(start, limit)).buffer;

                worker.postMessage({
                    point: this.world.inputManager.mouse,
                    isInterpolate: this.world.inputManager.isMouseInterpolate,
                    entitiesBuffer,
                }, [entitiesBuffer]);
            }
        } else {
            entitiesToCheckCollide = this._entities;
        }

        entitiesToCheckCollide.forEach((entity, i) => {
            if (!entity.hasComponent(Collider) || !entity.hasComponent(Shape) || !entity.hasComponent(Position) || !entity.hasComponent(Scale)) {
                return;
            }

            const shape = entity.getComponent(Shape);
            const collider = entity.getComponent(Collider);
            const position = entity.getComponent(Position);
            const scale = entity.getComponent(Scale);

            if (shape.path2D && this.world.inputManager) {
                if (shape.primitive == ShapeType.BOX) {
                    if (this.worker) {
                        this.worker.postMessage({
                            entityId: i,
                            rect: { x: position.x, y: position.y, width: scale.x, height: scale.y },
                            point: this.world.inputManager.mouse,
                            isInterpolate: this.world.inputManager.isMouseInterpolate
                        });
                        return;
                    }
                    collider.isMouseCollided = ColliderSystem.isPointInRect(
                        { x: position.x, y: position.y, width: scale.x, height: scale.y }, 
                        this.world.inputManager.mouse, 
                        this.world.inputManager.isMouseInterpolate
                    );
                } else {
                    collider.isMouseCollided = this.isPointInPath(shape.path2D, this.world.inputManager.mouse, this.world.inputManager.isMouseInterpolate);
                }
            }
        });
    }

    isPointInPath(path2D, point, isInterpolate) {
        const isCollide = this.ctx.isPointInPath(path2D, point.x, point.y);
        if (isCollide) {
            return isCollide;
        }

        if (!isInterpolate) {
            return false;
        }

        const distance = {
            x: Math.abs(point.previous.x - point.x),
            y: Math.abs(point.previous.y - point.y)
        };

        const direction = {
            x: point.x - point.previous.x,
            y: point.y - point.previous.y
        };

        // Normalize vector
        const invLen = (1 / Math.sqrt(direction.x ** 2 + direction.y ** 2));
        direction.normalized = {
            x: direction.x * invLen,
            y: direction.y * invLen
        }

        const interpolateSteps = (distance.x + distance.y) / 20;

        // Interpolate
        const stepX = direction.normalized.x * distance.x / interpolateSteps;
        const stepY = direction.normalized.y * distance.y / interpolateSteps;
        for (let i = 1; i <= interpolateSteps; i++) {
            const isCollideByInterpolate = this.ctx.isPointInPath(
                path2D,
                point.previous.x + stepX * i,
                point.previous.y + stepY * i
            );

            if (isCollideByInterpolate) {
                // Collide detected by interpolation
                return isCollideByInterpolate;
            }
        }

        return false;
    }

    static isPointInRect(rect, point, isInterpolate) {
        const isCollide = ColliderSystem.isRectContainsPoint(rect, point);
        if (isCollide) {
            return isCollide;
        }

        if (!isInterpolate) {
            return false;
        }

        const distance = {
            x: Math.abs(point.previous.x - point.x),
            y: Math.abs(point.previous.y - point.y)
        };

        const direction = {
            x: point.x - point.previous.x,
            y: point.y - point.previous.y
        };

        // Normalize vector
        const invLen = (1 / Math.sqrt(direction.x ** 2 + direction.y ** 2));
        direction.normalized = {
            x: direction.x * invLen,
            y: direction.y * invLen
        }

        const interpolateSteps = (distance.x + distance.y) * 2;

        // Interpolate
        const stepX = direction.normalized.x * distance.x / interpolateSteps;
        const stepY = direction.normalized.y * distance.y / interpolateSteps;
        for (let i = 1; i <= interpolateSteps; i++) {
            const isCollideByInterpolate = ColliderSystem.isRectContainsPoint(rect, { x: point.previous.x + stepX * i, y: point.previous.y + stepY * i });

            if (isCollideByInterpolate) {
                // Collide detected by interpolation
                return isCollideByInterpolate;
            }
        }

        return false;
    }

    static isRectContainsPoint(rect, point) {
        return rect.x <= point.x && point.x <= rect.x + rect.width && rect.y <= point.y && point.y <= rect.y + rect.height;
    }

    static stringToUint(string) {
        const str = btoa(unescape(encodeURIComponent(string)))
        const uintArray = []
        const len = str.length
      
        let i = -1
      
        while (++i < len) {
          uintArray[i] = str.charCodeAt(i)
        }
      
        return new Uint8Array(uintArray);
    }
    
    static uintToString(uintArray) {
        var encodedString = String.fromCharCode.apply(null, uintArray),
            decodedString = decodeURIComponent(escape(atob(encodedString)));
        return decodedString;
    }
}