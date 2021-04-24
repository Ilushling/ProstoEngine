import { World } from './World.js';
import { Position } from './Components/Position.js';
import { Scale } from './Components/Scale.js';
import { Shape } from './Components/Shape.js';
import { Canvas } from './Components/Canvas.js';
import { Collider } from './Components/Collider.js';
import { ColliderType } from './Components/ColliderType.js';
import { NodeType } from './Components/NodeType.js';
import { Edges } from './Components/Edges.js';
import { AStarPathFinder } from './Components/AStarPathFinder.js';
import { UI } from './Components/UI.js';
import { Renderable } from './Components/Renderable.js';
import { Generated } from './Components/Generated.js';
import { GridGeneratorSystem } from './Systems/GridGeneratorSystem.js';
import { CanvasRendererSystem } from './Systems/CanvasRendererSystem.js';
import { ColliderSystem } from './Systems/ColliderSystem.js';
import { ShapeSystem } from './Systems/ShapeSystem.js';
import { PathFinderSystem } from './Systems/PathFinderSystem.js';

import { Chart } from '../vendor/ilushling/ChartJS/src/Chart.js';

export class Engine {
    constructor() {
        this.deltaTime = 0;
        this.lastTimeStamp = 0;
        this.handleTime = 0;
        this.logs = [];
        this.chart = new Chart({
            el: document.getElementById('canvas-chart'),
            data: this.logs,
            step: 1,
            height: 150
        });

        this.world = new World(this);

        this.world.registerComponent(Position)
            .registerComponent(Scale)
            .registerComponent(Shape)
            .registerComponent(Collider)
            .registerComponent(ColliderType)
            .registerComponent(NodeType)
            .registerComponent(Edges)
            .registerComponent(Canvas)
            .registerComponent(Renderable)
            .registerComponent(UI)
            .registerComponent(AStarPathFinder)
            .registerComponent(Generated)
            .registerSystem(ColliderSystem)
            .registerSystem(PathFinderSystem)
            .registerSystem(ShapeSystem)
            .registerSystem(GridGeneratorSystem)
            .registerSystem(CanvasRendererSystem)

        this.init();

        this.loop();
    }

    async loop(timeStamp = 0) {
        this.deltaTime = Math.min(timeStamp - this.lastTimeStamp, 1000) / 1000;
        const startHandleTime = Date.now();

        await this.world.execute(this.deltaTime);

        this.handleTime = (Date.now() - startHandleTime) / 1000;
        this.lastTimeStamp = timeStamp;

        this.log(this.handleTime, this.deltaTime);

        //setTimeout(() => {
            this.requestAnimationFrameID = requestAnimationFrame(newTimeStamp => this.loop(newTimeStamp));
        //}, 280);
    }

    init() {
        this.world.systemManager.initSystems();
    }

    log(handleTime, deltaTime) {
        //this.logs.push({
        //    handleTime,
        //    deltaTime
        //});

        this.logUpdate(handleTime, deltaTime);
    }

    logUpdate(handleTime, deltaTime) {
        const handleTimeMS = ~~(handleTime * 1000);
        const deltaTimeMS = ~~(deltaTime * 1000);

        const handleTimeElement = this.handleTimeElement;
        if (!handleTimeElement) {
            this.handleTimeElement = document.getElementById('handleTime');
        }

        if (handleTimeElement) {
            handleTimeElement.innerText = handleTimeMS;
        }

        const deltaTimeElement = this.deltaTimeElement;
        if (!deltaTimeElement) {
            this.deltaTimeElement = document.getElementById('deltaTime');
        }

        if (deltaTimeElement) {
            deltaTimeElement.innerText = deltaTimeMS;
        }

        this.chart.add({
            value: handleTimeMS
        });
    }
}