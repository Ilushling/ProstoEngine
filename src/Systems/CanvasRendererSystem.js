import { System } from '../System.js';
import { Shape } from '../Components/Shape.js';
import { ShapeType } from '../Components/ShapeType.js';
import { Canvas } from '../Components/Canvas.js';
import { UI } from '../Components/UI.js';

export class CanvasRendererSystem extends System {
    constructor(world) {
        super();
        this.world = world;
        this._entities = this.world.entityManager._entities;
        this.redraw = false;
    }

    init() {
        this.canvasSceneEntity = this.world.createEntity('CanvasScene').addComponent(Canvas);
        this.canvasUiEntity = this.world.createEntity('CanvasUi').addComponent(Canvas);

        //if (!this.canvasSceneEntity) {
            //this.canvasSceneEntity = this.world.entityManager.getEntityByName('CanvasScene');
            //if (this.canvasSceneEntity && this.canvasSceneEntity.hasComponent(Canvas)) {
                this.canvasSceneComponent = this.canvasSceneEntity.getComponent(Canvas);
                this.canvasScene = this.canvasSceneComponent.canvas = document.getElementById('canvas-scene');
                if (this.canvasScene) {
                    this.ctxScene = this.canvasSceneComponent.ctx = this.canvasScene.getContext('2d');
                } else {
                    console.warn('canvasScene not found');
                }
            //} else {
            //    console.warn('canvasSceneEntity not found');
            //}
        //}

        //if (!this.canvasUiEntity) {
            //this.canvasUiEntity = this.world.entityManager.getEntityByName('CanvasUi');
            //if (this.canvasUiEntity && this.canvasUiEntity.hasComponent(Canvas)) {
                this.canvasUiComponent = this.canvasUiEntity.getComponent(Canvas);
                this.canvasUi = this.canvasUiComponent.canvas = document.getElementById('canvas-ui');
                if (this.canvasUi) {
                    this.ctxUi = this.canvasUiComponent.ctx = this.canvasUi.getContext('2d');
                } else {
                    console.warn('canvasUi not found');
                }
            //} else {
            //    console.warn('canvasUiEntity not found');
            //}
        //}

        this.onResizeCanvas();
        window.addEventListener('resize', () => this.onResizeCanvas());
    }

    execute() {
        this.render();
    }

    render() {
        if (this.canvasScene) {
            //CanvasRendererSystem.clearCanvas(this.canvasScene, this.ctxScene);
            this.renderEntites();
        }

        if (this.canvasUi) {
            //CanvasRendererSystem.clearCanvas(this.canvasUi, this.ctxUi);
            //this.renderUi();
        }
    }

    static clearCanvas(canvas, ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    onResizeCanvas() {
        if (this.canvasScene) {
            this.canvasScene.width = window.innerWidth;
            this.canvasScene.height = window.innerHeight;
        }
        if (this.canvasUi) {
            this.canvasUi.width = window.innerWidth;
            this.canvasUi.height = window.innerHeight;
        }

        this.redraw = true;
    }

    renderEntites() {
        for (const entity of this._entities) {
            if (!entity.hasComponent(Shape)) {
                continue;
            }

            const shape = entity.getComponent(Shape);

            const ctx = entity.hasComponent(UI) ? this.ctxUi : this.ctxScene;

            switch (shape.primitive) {
                case ShapeType.BOX:
                    CanvasRendererSystem.drawRect(ctx, shape, this.redraw);
                    break;
                default:
                    CanvasRendererSystem.drawRect(ctx, shape, this.redraw);
                    break;
            }
        }

        this.redraw = false;
    }

    static drawRect(ctx, shape, redraw = false) {
        if (!shape.path2D) {
            shape.path2D = new Path2D();
            shape.path2D.rect(shape.rect.x, shape.rect.y, shape.rect.width, shape.rect.height);
        }

        if (shape.color != shape.previous.color) {
            shape.previous.color = shape.color;
            redraw = true;
        }

        if (redraw) {
            ctx.fillStyle = shape.color;
            ctx.fillRect(shape.rect.x, shape.rect.y, shape.rect.width, shape.rect.height);
        }
    }
}