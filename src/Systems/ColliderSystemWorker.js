addEventListener('message', event => {
    const data = event.data;
    const entitiesBuffer = new Uint16Array(data.entitiesBuffer);
    const point = data.point;
    const isInterpolate = data.isInterpolate;
    const columns = 5; // Columns from ColliderSystem

    if (isInterpolate) {
        var interpolatedPointPositions = interpolatePointPositions(point);
    }
    
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

        const isCollide = collides(rect, point, isInterpolate, interpolatedPointPositions);
        entityResult.push(isCollide);
    }

    const entitiesBufferResult = new Uint16Array(entityResult).buffer;
    return postMessage(entitiesBufferResult, [entitiesBufferResult]);
});

function interpolatePointPositions(point) {
    const interpolatedPointPositions = [];

    const distance = {
        x: Math.abs(point.previous.x - point.x),
        y: Math.abs(point.previous.y - point.y)
    };

    const interpolateSteps = (distance.x + distance.y) / 40;
    
    for (let i = 0; i <= interpolateSteps; i++) {
        interpolatedPointPositions.push({
            x: lerp(point.previous.x, point.x, i / interpolateSteps),
            y: lerp(point.previous.y, point.y, i / interpolateSteps)
        });
    }

    return interpolatedPointPositions;
}

function lerp(start, end, weight) {
    return start * (1 - weight) + end * weight;
}

function collides(rect, point, isInterpolate = false, interpolatedPointPositions = []) {
    let isCollide = rectContains(rect, point);
    if (isCollide) {
        return isCollide;
    }

    if (!isInterpolate) {
        return false;
    }

    for (const interpolatedPointPosition of interpolatedPointPositions) {
        isCollide = rectContains(rect, interpolatedPointPosition);

        if (isCollide) {
            return isCollide;
        }
    }

    return false;
}

function rectContains(rect, point) {
    return rect.x  <= point.x && 
           point.x <= rect.x + rect.width && 
           rect.y  <= point.y && 
           point.y <= rect.y + rect.height;
}