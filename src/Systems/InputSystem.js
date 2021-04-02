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
            hover.isMouseHover = collider.isMouseCollided;

            if (collider.isMouseCollided) {
                if (this.world.inputManager.mouse.leftButton.down) {
                    if (nodeType.id == NodeType.FREE) {
                        this.nodeTypeMouseMode = NodeType.WALL;
                    }
                    if (nodeType.id == NodeType.WALL) {
                        this.nodeTypeMouseMode = NodeType.FREE;
                    }
                }

                if (this.world.inputManager.mouse.leftButton.pressed && [NodeType.FREE, NodeType.WALL].indexOf(nodeType.id) !== -1) {
                    nodeType.id = this.nodeTypeMouseMode;
                }
            }
        }
    }
}