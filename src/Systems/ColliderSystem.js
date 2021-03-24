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
        this.entities = this.world.entityManager._entities;
    }

    init() {
        this.workersCount = 1;
        this.workers = [];
        for (let i = 0; i < this.workersCount; i++) {
            this.workers.push(new Worker('src/Systems/ColliderSystemWorker.js', { type: 'module' }));
            const worker = this.workers[i];

            worker.onmessage = event => {
                const workerEntities = event.data;
                workerEntities.forEach(workerEntity => {
                    const entity = this.entities.find(_entity => _entity.id == workerEntity.entityId);
                    if (!entity || !entity.hasComponent(Collider)) {
                        return;
                    }
    
                    const collider = entity.getComponent(Collider);
                    collider.isMouseCollided = workerEntity.isCollide;
                });
            };
        }
    }

    execute() {
        if (!this.canvas) {
            this.canvasEntity = this.world.entityManager.getEntityByName('Canvas');
            if (this.canvasEntity && this.canvasEntity.hasComponent(Canvas)) {
                this.canvasComponent = this.canvasEntity.getComponent(Canvas);
                this.canvas = this.canvasComponent.canvas;
                this.ctx = this.canvasComponent.ctx;
            } else {
                return;
            }
        }

        const workersCount = this.workers.length;
        if (workersCount) {
            const entitiesCount = this.entities.length;
            for (let i = 0; i < workersCount; i++) {
                const worker = this.workers[i];
                if (!worker) {
                    return;
                }
                const start = entitiesCount / workersCount * i;
                const limit = start + entitiesCount / workersCount;

                const entitiesToCheckCollide = this.entities.map(entity => {
                    if (!entity.hasComponent(Collider) || !entity.hasComponent(Shape) || !entity.hasComponent(Position) || !entity.hasComponent(Scale)) {
                        return;
                    }

                    const shape = entity.getComponent(Shape);
                    const position = entity.getComponent(Position);
                    const scale = entity.getComponent(Scale);

                    if (shape.primitive != ShapeType.BOX) {
                        return;
                    }

                    return {
                        entityId: entity.id,
                        rect: { x: position.x, y: position.y, width: scale.x, height: scale.y }
                    };
                }).filter(entity => entity);

                worker.postMessage({
                    entities: entitiesToCheckCollide.slice(start, limit),
                    point: this.world.inputManager.mouse,
                    isInterpolate: this.world.inputManager.isMouseInterpolate
                });
            }
            return;
        }

        this.entities.forEach((entity, i) => {
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
}