import { System } from '../System.js';
import { Position } from '../Components/Position.js';
import { Scale } from '../Components/Scale.js';
import { Shape } from '../Components/Shape.js';
import { ShapeType } from '../Components/ShapeType.js';
import { Collider } from '../Components/Collider.js';
import { UI } from '../Components/UI.js';
import { PathFinderSystem } from './PathFinderSystem.js';

export class UISystem extends System {
    constructor(world) {
        super();
        this.world = world;
        this._entities = this.world.entityManager._entities;
        this.eventDispatcher = this.world.entityManager.eventDispatcher;
    }

    init() {
        this.initButtons();
    }

    initButtons() {
        this.initStartButton();
        this.initClearButton();
    }

    initStartButton() {
        this.startButton = this.world.entityManager.getEntityByName('UIStartButton');
        if (!this.startButton) {
            this.startButton = this.world.createEntity('UIStartButton')
                .addComponent(Position)
                .addComponent(Scale)
                .addComponent(Shape)
                .addComponent(Collider)
                .addComponent(UI);
        }
        if (this.startButton) {
            this.startButtonId = this.startButton.id;

            const startButtonPosition = this.startButton.getComponent(Position);
            const startButtonScale    = this.startButton.getComponent(Scale);
            const startButtonShape    = this.startButton.getComponent(Shape);

            if (startButtonPosition && startButtonScale && startButtonShape) {
                startButtonPosition.x = 10;
                startButtonPosition.y = 10;

                startButtonScale.x = 100;
                startButtonScale.y = 40;

                startButtonShape.rect = {
                    x: startButtonPosition.x,
                    y: startButtonPosition.y,
                    width: startButtonScale.x,
                    height: startButtonScale.y,
                };

                startButtonShape.primitive = ShapeType.BOX;
                startButtonShape.color = '#55AA55';
            }

            this.eventDispatcher.addEventListener(
                'UIStartButtonOnClick',
                () => this.startStopPathFinder()
            );
        }
    }

    initClearButton() {
        this.clearButton = this.world.entityManager.getEntityByName('UIClearButton');
        if (!this.clearButton) {
            this.clearButton = this.world.createEntity('UIClearButton')
                .addComponent(Position)
                .addComponent(Scale)
                .addComponent(Shape)
                .addComponent(Collider)
                .addComponent(UI);
        }

        if (this.clearButton) {
            this.clearButtonId = this.clearButton.id;

            const clearButtonPosition = this.clearButton.getComponent(Position);
            const clearButtonScale    = this.clearButton.getComponent(Scale);
            const clearButtonShape    = this.clearButton.getComponent(Shape);

            if (clearButtonPosition && clearButtonScale && clearButtonShape) {
                clearButtonPosition.x = 10;
                clearButtonPosition.y = 60;

                clearButtonScale.x = 100;
                clearButtonScale.y = 40;

                clearButtonShape.rect = {
                    x: clearButtonPosition.x,
                    y: clearButtonPosition.y,
                    width: clearButtonScale.x,
                    height: clearButtonScale.y,
                };

                clearButtonShape.primitive = ShapeType.BOX;
                clearButtonShape.color = '#FF7777';
            }

            this.eventDispatcher.addEventListener(
                'UIClearButtonOnClick',
                () => this.clearPathFinder()
            );
        }
    }

    execute() {
        for (const entity of this._entities) {
            if (!entity.hasComponent(UI) || !entity.hasComponent(Collider)) {
                continue;
            }

            if (entity.id == this.startButtonId) {
                const collider = entity.getComponent(Collider);
                if (collider.isPointerCollided && this.world.inputManager.pointer.leftButton.down) {
                    this.eventDispatcher.dispatchEvent('UIStartButtonOnClick', entity);
                }
                continue;
            }

            if (entity.id == this.clearButtonId) {
                const collider = entity.getComponent(Collider);
                if (collider.isPointerCollided && this.world.inputManager.pointer.leftButton.down) {
                    this.eventDispatcher.dispatchEvent('UIClearButtonOnClick', entity);
                }
                continue;
            }
        }
    }

    startStopPathFinder() {
        const pathFinderSystem = this.world.systemManager.getSystem(PathFinderSystem);
        if (!pathFinderSystem) {
            return;
        }

        pathFinderSystem.isEnabled = !pathFinderSystem.isEnabled;
    }

    clearPathFinder() {
        const pathFinderSystem = this.world.systemManager.getSystem(PathFinderSystem);
        if (!pathFinderSystem) {
            return;
        }

        pathFinderSystem.clear();
    }
}