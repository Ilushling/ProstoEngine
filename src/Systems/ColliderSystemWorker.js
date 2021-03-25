addEventListener('message', event => {
    const data = event.data;
    const entitiesBuffer = new Uint16Array(data.entitiesBuffer);
    const point = data.point;
    const isInterpolate = data.isInterpolate;
    const columns = 5;
    
    const entityResult = [];
    for (let i = 0, length = entitiesBuffer.byteLength / 2 / columns; i < length; i++) {
        const entityOffset = i * columns;
        const entityId = entitiesBuffer[entityOffset];
        const rect = {
            x: entitiesBuffer[entityOffset + 1],
            y: entitiesBuffer[entityOffset + 2],
            width: entitiesBuffer[entityOffset + 3],
            height: entitiesBuffer[entityOffset + 4],
        };
        entityResult.push(entityId);

        let isCollide = isRectContainsPoint(rect, point);
        if (isCollide) {
            entityResult.push(isCollide);
            continue;
        }

        if (!isInterpolate) {
            break;
        }
        
        const distance = {
            x: Math.abs(point.previous.x - point.x),
            y: Math.abs(point.previous.y - point.y)
        };

        const direction = {
            x: point.x - point.previous.x,
            y: point.y - point.previous.y
        };

        // Normalize vector
        const invLen = (1 / Math.sqrt(direction.x ** 2 + direction.y ** 2));
        direction.normalized = {
            x: direction.x * invLen,
            y: direction.y * invLen
        }

        const interpolateSteps = (distance.x + distance.y) / 20;

        // Interpolate
        const stepX = direction.normalized.x * distance.x / interpolateSteps;
        const stepY = direction.normalized.y * distance.y / interpolateSteps;
        
        for (let interpolateI = 1; interpolateI <= interpolateSteps; interpolateI++) {
            isCollide = isRectContainsPoint(rect, { x: point.previous.x + stepX * interpolateI, y: point.previous.y + stepY * interpolateI });

            if (isCollide) {
                break;
            }
        }

        entityResult.push(isCollide);
    }

    const entitiesBufferResult = new Uint16Array(entityResult).buffer;
    return postMessage(entitiesBufferResult, [entitiesBufferResult]);
});

function isRectContainsPoint(rect, point) {
    return rect.x <= point.x && point.x <= rect.x + rect.width && rect.y <= point.y && point.y <= rect.y + rect.height;
}