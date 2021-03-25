import { System } from '../System.js';
import { Position } from '../Components/Position.js';
import { Scale } from '../Components/Scale.js';
import { Shape } from '../Components/Shape.js';
import { ShapeType } from '../Components/ShapeType.js';
import { Canvas } from '../Components/Canvas.js';

export class CanvasRendererSystem extends System {
    constructor(world) {
        super();
        this.world = world;
        this.entities = this.world.entityManager._entities;
        this.canvasEntity = this.world.createEntity('Canvas').addComponent(Canvas);
    }

    init() {
        window.addEventListener('resize', () => this.onResizeCanvas());
    }

    execute() {
        if (this.canvas) {
            this.render();
        } else {
            this.canvasEntity = this.world.entityManager.getEntityByName('Canvas');
            if (this.canvasEntity && this.canvasEntity.hasComponent(Canvas)) {
                this.canvasComponent = this.canvasEntity.getComponent(Canvas);
                this.canvas = this.canvasComponent.canvas;
                this.ctx = this.canvasComponent.ctx;
                this.onResizeCanvas();
            }
        }
    }

    render() {
        this.clearCanvas();

        this.renderEntites();
    }

    clearCanvas() {
        //this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    onResizeCanvas() {
        if (this.canvas) {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        }
        this.reDraw = true;
    }

    renderEntites() {
        this.entities.forEach(entity => {
            if (!entity.hasComponent(Position) || !entity.hasComponent(Scale) || !entity.hasComponent(Shape)) {
                return;
            }

            const position = entity.getComponent(Position);
            const scale = entity.getComponent(Scale);
            const shape = entity.getComponent(Shape);
            switch (shape.primitive) {
                case ShapeType.BOX:
                    this.drawRect(position.x, position.y, scale.x, scale.y, { shape });
                    break;
                default:
                    this.drawRect(position.x, position.y, scale.x, scale.y, { shape });
                    break;
            }
        });

        this.reDraw = false;
    }

    drawRect(x, y, width, height, { shape }) {
        if (!shape.path2D) {
            shape.path2D = new Path2D();
            shape.path2D.rect(x, y, width, height);
        }

        if (shape.color != shape.previous.color || this.reDraw) {
            this.ctx.fillStyle = shape.color;
            this.ctx.fill(shape.path2D);
        }
    }
}