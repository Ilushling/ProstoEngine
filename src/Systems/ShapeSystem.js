import { System } from '../System.js';
import { Shape } from '../Components/Shape.js';
import { NodeType } from '../Components/NodeType.js';
import { Collider } from '../Components/Collider.js';

export class ShapeSystem extends System {
    constructor(world) {
        super();
        this.world = world;
        this._entities = this.world.entityManager.getAllEntities();
        this.eventDispatcher = this.world.eventDispatcher;

        this.nodeTypePointerMode = undefined;
    }

    init() {
        this.initListeners();
    }

    initListeners() {
        // @TODO merge functions
        this.eventDispatcher.addEventListener('nodeTypeOnChange', entityId => {
            const entity = this.world.entityManager.getEntityById(entityId)
            if (!entity.hasComponent(Shape) || !entity.hasComponent(NodeType)) {
                return;
            }

            const shape = entity.getComponent(Shape);
            const nodeType = entity.getComponent(NodeType);
            const collider = entity.getComponent(Collider);

            shape.color = ShapeSystem.getColor(nodeType.id, collider.isPointerCollided);
        });

        // @TODO merge functions
        this.eventDispatcher.addEventListener('pointerCollidedOnChange', entityId => {
            const entity = this.world.entityManager.getEntityById(entityId)
            if (!entity.hasComponent(Shape) || !entity.hasComponent(NodeType) || !entity.hasComponent(Collider)) {
                return;
            }

            const shape = entity.getComponent(Shape);
            const nodeType = entity.getComponent(NodeType);
            const collider = entity.getComponent(Collider);

            const color = ShapeSystem.getColor(nodeType.id, collider.isPointerCollided);
            shape.color = color;

            if (collider.isPointerCollided) {
                if (this.world.inputManager.pointer.leftButton.down) {
                    if (nodeType.id == NodeType.FREE) {
                        this.nodeTypePointerMode = NodeType.WALL;
                    }
                    if (nodeType.id == NodeType.WALL) {
                        this.nodeTypePointerMode = NodeType.FREE;
                    }
                }

                if (this.world.inputManager.pointer.leftButton.pressed && (nodeType.id == NodeType.FREE || nodeType.id == NodeType.WALL)) {
                    nodeType.id = this.nodeTypePointerMode;
                }
            }
        });
    }

    execute() {
        
    }

    static getColor(nodeTypeId, isPointerCollided) {
        if (isPointerCollided) {
            return '#E0E0E0';
        }

        switch (nodeTypeId) {
            case NodeType.FREE:
                return '#FAFAFA';
            case NodeType.WALL:
                return '#BDBDBD';
            case NodeType.START:
                return '#62DA97';
            case NodeType.END:
                return '#F93E58';
            case NodeType.EXPLORING:
                return '#FFF59D';
            case NodeType.EXPLORED:
                return '#B3E5FC';
            case NodeType.PATH:
                return '#4FC3F7';
            default:
                return '#FAFAFA';
        }
    }
}