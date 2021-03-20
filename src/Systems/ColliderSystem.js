import { Canvas } from '../Components/Canvas.js';
import { Collider } from '../Components/Collider.js';
import { Shape } from '../Components/Shape.js';
import { System } from '../System.js';

export class ColliderSystem extends System {
    constructor(world) {
        super();
        this.world = world;
        this.entities = this.world.entityManager._entities;
    }

    init() {
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

        this.entities.forEach(entity => {
            if (!entity.hasComponent(Collider) || !entity.hasComponent(Shape)) {
                return;
            }

            const shape = entity.getComponent(Shape);
            const collider = entity.getComponent(Collider);
            if (shape.path2D && this.world.inputManager) {
                collider.isMouseCollided = this.isPointInPath(shape.path2D, this.world.inputManager.mouse, this.world.inputManager.isMouseInterpolate);
            }
        });
    }

    isPointInPath(path2D, position, isInterpolate) {
        const isHoverByMouse = this.ctx.isPointInPath(path2D, position.x, position.y);
        if (isHoverByMouse) {
            return isHoverByMouse;
        }

        if (!isInterpolate) {
            return false;
        }

        const distance = {
            x: Math.abs(position.previous.x - position.x),
            y: Math.abs(position.previous.y - position.y)
        };

        const direction = {
            x: position.x - position.previous.x,
            y: position.y - position.previous.y
        };

        // Normalize vector
        const invLen = (1 / Math.sqrt(direction.x ** 2 + direction.y ** 2));
        direction.normalized = {
            x: direction.x * invLen,
            y: direction.y * invLen
        }

        const maxMouseLineCollisionSteps = (distance.x + distance.y) / 20;

        //console.log(maxMouseLineCollisionSteps);

        // Interpolate mouse movement
        const stepX = direction.normalized.x * distance.x / maxMouseLineCollisionSteps;
        const stepY = direction.normalized.y * distance.y / maxMouseLineCollisionSteps;
        for (let i = 1; i <= maxMouseLineCollisionSteps; i++) {
            const isHoverBySmoothMouse = this.ctx.isPointInPath(
                path2D,
                position.previous.x + stepX * i,
                position.previous.y + stepY * i
            );

            if (isHoverBySmoothMouse) {
                // Mouse hover detected by interpolated mouse movement
                return isHoverBySmoothMouse;
            }
        }
    }
}