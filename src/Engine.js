import { World } from './World.js';
import { Position } from './Components/Position.js';
import { Scale } from './Components/Scale.js';
import { Shape } from './Components/Shape.js';
import { Canvas } from './Components/Canvas.js';
import { Collider } from './Components/Collider.js';
import { ColliderType } from './Components/ColliderType.js';
import { NodeType } from './Components/NodeType.js';
import { Edge } from './Components/Edge.js';
import { Edges } from './Components/Edges.js';
import { AStarPathFinder } from './Components/AStarPathFinder.js';
import { UI } from './Components/UI.js';
import { Renderable } from './Components/Renderable.js';
import { Generated } from './Components/Generated.js';
import { GridGeneratorSystem } from './Systems/GridGeneratorSystem.js';
import { CanvasRendererSystem } from './Systems/CanvasRendererSystem.js';
import { ColliderSystem } from './Systems/ColliderSystem.js';
import { ShapeSystem } from './Systems/ShapeSystem.js';
import { InputSystem } from './Systems/InputSystem.js';
import { PathFinderSystem } from './Systems/PathFinderSystem.js';
import { UISystem } from './Systems/UISystem.js';

export class Engine {
    constructor() {
        this.lastTimeStamp = 0;
        this.world = new World(this);

        this.world.registerComponent(Position)
            .registerComponent(Scale)
            .registerComponent(Shape)
            .registerComponent(Collider)
            .registerComponent(ColliderType)
            .registerComponent(NodeType)
            .registerComponent(Edge)
            .registerComponent(Edges)
            .registerComponent(Canvas)
            .registerComponent(Renderable)
            .registerComponent(UI)
            .registerComponent(AStarPathFinder)
            .registerComponent(Generated)
            //.registerSystem(InputSystem)
            .registerSystem(ColliderSystem)
            .registerSystem(PathFinderSystem)
            .registerSystem(ShapeSystem)
            .registerSystem(GridGeneratorSystem)
            .registerSystem(CanvasRendererSystem)
            //.registerSystem(UISystem)

        this.init();

        this.loop();
    }

    async loop(timeStamp = 0) {
        this.deltaTime = Math.min(timeStamp - this.lastTimeStamp, 100) / 1000;

        await this.world.execute(this.deltaTime);

        this.lastTimeStamp = timeStamp;

        this.requestAnimationFrameID = requestAnimationFrame(newTimeStamp => this.loop(newTimeStamp));
    }

    init() {
        this.world.systemManager.initSystems();
    }
}