import { System } from '../System.js';
import { Collider } from '../Components/Collider.js';
import { Hover } from '../Components/Hover.js';
import { NodeType } from '../Components/NodeType.js';

export class InputSystem extends System {
    constructor(world) {
        super();
        this.world = world;
        this._entities = this.world.entityManager._entities;
    }

    init() {
    }

    execute() {
        for (const entity of this._entities) {
            if (!entity.hasComponent(Collider) || !entity.hasComponent(Hover) || !entity.hasComponent(NodeType)) {
                continue;
            }

            const collider = entity.getComponent(Collider);
            const hover = entity.getComponent(Hover);
            const nodeType = entity.getComponent(NodeType);
            hover.isPointerHover = collider.isPointerCollided;

            if (collider.isPointerCollided) { // @TODO ColliderSystem Web Worker can break logic
                if (this.world.inputManager.pointer.leftButton.down) {
                    if (nodeType.id == NodeType.FREE) {
                        this.nodeTypePointerMode = NodeType.WALL;
                    }
                    if (nodeType.id == NodeType.WALL) {
                        this.nodeTypePointerMode = NodeType.FREE;
                    }
                }

                if (this.world.inputManager.pointer.leftButton.pressed && [NodeType.FREE, NodeType.WALL].indexOf(nodeType.id) !== -1) {
                    nodeType.id = this.nodeTypePointerMode;
                }
            }
        }
    }
}