import { System } from '../System.js';
import { Renderable } from '../Components/Renderable.js';
import { Shape } from '../Components/Shape.js';
import { ShapeType } from '../Components/ShapeType.js';
import { Canvas } from '../Components/Canvas.js';
import { UI } from '../Components/UI.js';

export class CanvasRendererSystem extends System {
    constructor(world) {
        super();
        this.world = world;
        this._entities = this.world.entityManager.getAllEntities();
        this.eventDispatcher = this.world.eventDispatcher;

        this.renderQueue = [];

        this.isRedraw = false;
    }

    init() {
        this.initListeners();

        this.initCanvasScene();
        //this.initCanvasUi();

        window.addEventListener('resize', () => this.eventDispatcher.dispatchEvent('onResize', { width: window.innerWidth, height: window.innerHeight }) );
    }

    initListeners() {
        this.eventDispatcher.addEventListener('redraw', () => {
            this.isRedraw = true;
            this.clearRender();
        });
        this.eventDispatcher.addEventListener('onResize', ({ width, height }) => {
            this.isRedraw = true;
            this.resizeCanvases(width, height);
        });
        this.eventDispatcher.addEventListener('render', entityId => {
            const entity = this.world.entityManager.getEntityById(entityId);
            const renderable = entity.getComponent(Renderable);
            renderable.isRedraw = true;
            this.renderQueue.push(entity);
        });
    }

    initCanvasScene() {
        this.canvasSceneEntity = this.world.createEntity('CanvasScene').addComponent(Canvas);
        this.canvasSceneComponent = this.canvasSceneEntity.getComponent(Canvas);
        this.canvasScene = this.canvasSceneComponent.canvas = document.getElementById('canvas-scene');
        if (this.canvasScene) {
            this.ctxScene = this.canvasSceneComponent.ctx = this.canvasScene.getContext('2d');
            this.resizeCanvases(window.innerWidth, window.innerHeight);
        } else {
            console.warn('canvasScene not found');
        }
    }

    initCanvasUi() {
        this.canvasUiEntity = this.world.createEntity('CanvasUi').addComponent(Canvas);
        this.canvasUiComponent = this.canvasUiEntity.getComponent(Canvas);
        this.canvasUi = this.canvasUiComponent.canvas = document.getElementById('canvas-ui');
        if (this.canvasUi) {
            this.ctxUi = this.canvasUiComponent.ctx = this.canvasUi.getContext('2d');
            this.resizeCanvases(window.innerWidth, window.innerHeight);
        } else {
            console.warn('canvasUi not found');
        }
    }

    execute() {
        //this.clearRender();

        if (this.canvasScene) {
            this.renderEntities();
        }

        if (this.canvasUi) {
            //this.renderUi();
        }
    }

    clearRender() {
        if (this.canvasScene) {
            CanvasRendererSystem.clearCanvas(this.canvasScene, this.ctxScene);
        }

        if (this.canvasUi) {
            CanvasRendererSystem.clearCanvas(this.canvasUi, this.ctxUi);
        }
    }

    static clearCanvas(canvas, ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    resizeCanvases(width, height) {
        if (this.canvasScene) {
            this.canvasScene.width = width;
            this.canvasScene.height = height;
        }
        if (this.canvasUi) {
            this.canvasUi.width = width;
            this.canvasUi.height = height;
        }

        this.isRedraw = true;
    }

    renderEntities() {
        if (this.isRedraw) {
            this._entities.forEach(entity => this.renderEntity(entity));
            this.isRedraw = false;
            return;
        }

        this.renderQueue.forEach(entity => this.renderEntity(entity));
        this.renderQueue = [];
    }

    renderEntity(entity) {
        if (!entity.hasComponent(Renderable) || !entity.hasComponent(Shape)) {
            return;
        }

        const renderable = entity.getComponent(Renderable);
        if (!renderable?.isEnable || (!this.isRedraw && !renderable.isRedraw)) {
            return;
        }
        renderable.isRedraw = false;

        const ctx = this.ctxUi && entity.hasComponent(UI) ? this.ctxUi : this.ctxScene;
        if (!ctx) {
            return;
        }

        const shape = entity.getComponent(Shape);

        switch (shape.primitive) {
            case ShapeType.BOX:
                CanvasRendererSystem.drawRect(ctx, shape);
                break;
            default:
                CanvasRendererSystem.drawRect(ctx, shape);
                break;
        }
    }

    static drawRect(ctx, shape) {
        if (!shape.path2D) {
            shape.path2D = new Path2D();
            shape.path2D.rect(shape.rect.x, shape.rect.y, shape.rect.width, shape.rect.height);
        }

        ctx.fillStyle = shape.color;
        ctx.fillRect(shape.rect.x, shape.rect.y, shape.rect.width, shape.rect.height);
    }
}