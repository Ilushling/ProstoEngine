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
    
    const entitiesCount = entitiesTypedArray.length / columns;
    const entitiesTypedArrayResult = [];
    for (let i = entitiesCount; i--;) {
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
            entitiesTypedArrayResult.push(entityId, isCollide);
        }
    }

    const entitiesBufferResult = new Uint32Array(entitiesTypedArrayResult).buffer;
    return postMessage(entitiesBufferResult, [entitiesBufferResult]);
});

function interpolatePointPositions(point, accuracyDivider) {
    const interpolatedPointPositions = [];

    const distance = {
        x: Math.abs(point.previous.x - point.x),
        y: Math.abs(point.previous.y - point.y)
    };

    const interpolateSteps = point.x == -1 || point.y == -1 ? 0 : ~~((distance.x + distance.y) / accuracyDivider); // ~~ is faster analog Math.floor
    
    for (let i = interpolateSteps; i--;) {
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

    for (let i = interpolatedPointPositions.length; i--;) {
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