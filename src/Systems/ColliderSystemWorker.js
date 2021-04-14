addEventListener('message', event => {
    const data = event.data;
    const entitiesTypedArray = new Uint32Array(data.entitiesBuffer);
    const point = data.point;
    const isInterpolate = data.isInterpolate;
    const cellSize = data.cellSize;
    const columns = data.columns;

    if (isInterpolate) {
        var interpolatedPointPositions = interpolatePointPositions(point, cellSize);
    }
    
    const entityResult = [];
    for (let i = (entitiesTypedArray.byteLength / Uint32Array.BYTES_PER_ELEMENT / columns) - 1; i >= 0; i--) {
        const entityOffset = i * columns;
        const entityId = entitiesTypedArray[entityOffset];
        const rect = {
            x: entitiesTypedArray[entityOffset + 1],
            y: entitiesTypedArray[entityOffset + 2],
            width: entitiesTypedArray[entityOffset + 3],
            height: entitiesTypedArray[entityOffset + 4],
        };

        const isCollide = collides(rect, point, isInterpolate, interpolatedPointPositions);
        if (isCollide) {
            entityResult.push(entityId);
            entityResult.push(isCollide);
        }
    }

    const entitiesBufferResult = new Uint32Array(entityResult).buffer;
    return postMessage(entitiesBufferResult, [entitiesBufferResult]);
});

function interpolatePointPositions(point, accuracyDivider) {
    const interpolatedPointPositions = [];

    const distance = {
        x: Math.abs(point.previous.x - point.x),
        y: Math.abs(point.previous.y - point.y)
    };

    const interpolateSteps = point.x == -1 || point.y == -1 ? 0 : (distance.x + distance.y) / accuracyDivider;
    
    for (let i = interpolateSteps; i > 0; i--) {
        const step = i / interpolateSteps;
        interpolatedPointPositions.push({
            x: lerp(point.previous.x, point.x, step),
            y: lerp(point.previous.y, point.y, step)
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

    for (let i = interpolatedPointPositions.length - 1; i >= 0; i--) {
        const interpolatedPointPosition = interpolatedPointPositions[i];
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