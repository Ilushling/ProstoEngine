export class Chart {
    el;
    type;
    data;
    step;
    lineWidth;
    strokeStyle;
    width;
    height;
    ctx;

    constructor({ el, type, data, step = 3, lineWidth = 2, strokeStyle = '#DDDDDD', width = el?.width, height = el?.width, isAutoResize = true, isAutoFullScreenResize }) {
        this.el = el;
        this.type = type;
        this.data = data;
        this.step = step;
        this.lineWidth = lineWidth;
        this.strokeStyle = strokeStyle;
        this.width = width;
        this.height = height;
        this.isAutoResize = isAutoResize;
        this.isAutoFullScreenResize = isAutoFullScreenResize;
        this.ctx = Chart.initCanvas(this.el);
        
        if (this.isAutoResize) {
            this.resizeCanvas(this.el, this.width, this.height);
        }

        if (this.isAutoFullScreenResize) {
            this.resizeCanvas(this.el, window.innerWidth, window.innerHeight);
        }

        this.initListeners();

        if (this.data) {
            this.dataRender = this.getDataRender(this.data);
            requestAnimationFrame(() => this.render(this.ctx, this.dataRender));
        }
    }

    initListeners() {
        if (this.isAutoFullScreenResize) {
            window.addEventListener('resize', () => this.resizeCanvas(this.el, window.innerWidth, window.innerHeight));
        }
    }

    static initCanvas(el) {
        if (el) {
            return el.getContext('2d');
        }
    }

    static clearCanvas(ctx) {
        if (ctx) {
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        }
    }

    resizeCanvas(el, width, height) {
        this.width = width;
        this.height = height;
        if (el) {
            el.width = this.width;
            el.height = this.height;
        }

        this.dataRender = this.getDataRender(this.data);

        requestAnimationFrame(() => this.render(this.ctx, this.dataRender));
    }

    render(ctx = this.ctx, data = this.data) {
        if (!ctx || !data) {
            return;
        }

        Chart.clearCanvas(ctx);

        const heightMargin = 0.05;
        const heightMarginTop = 1 + (heightMargin * 2);
        const heightToTop = this.factor * heightMarginTop;
        const heightMarginBottom = 1 - heightMargin;

        const width = ctx.canvas.width;
        const height = ctx.canvas.height * heightMarginBottom;

        let xOffset = width;

        ctx.beginPath();
        for (let i = data.length; i--;) {
            const item = data[i];

            const position = {
                x: xOffset, 
                y: height - Chart.getPercent(item.value, this.min, heightToTop)
            };

            ctx.lineTo(position.x, position.y);

            xOffset -= this.step;
        }

        ctx.lineWidth = this.lineWidth;
        ctx.strokeStyle = this.strokeStyle;
        ctx.stroke();

        ctx.fillStyle = this.strokeStyle;
        ctx.font = "28px sans-serif";
        ctx.fillText(~~this.min, 5, height - Chart.getPercent(this.min, this.min, heightToTop) + 7);
        ctx.fillText(~~this.max, 5, height - Chart.getPercent(this.max, this.min, heightToTop) + 14);
    }

    add(item) {
        this.data.push(item);

        this.dataRender = this.getDataRender(this.data);

        requestAnimationFrame(() => this.render(this.ctx, this.dataRender));
    }

    setData(data) {
        this.data = data;

        this.dataRender = this.getDataRender(this.data);

        requestAnimationFrame(() => this.render(this.ctx, this.dataRender));
    }

    getDataRender(data) {
        if (!data || !data.length) {
            return [];
        }

        const margin = this.width * 0.1;
        const dataCountFromEnd = (this.width - margin) / this.step;
        const dataRender = data.slice(-dataCountFromEnd);
        const { min, max } = Chart.getMinMax(dataRender);
        this.min = min;
        this.max = max;
        this.minFactor = this.min / this.height;
        this.maxFactor = this.max / this.height;
        this.factor = this.maxFactor - this.minFactor;
        return dataRender;
    }

    static getMinMax(data) {
        let min = data[0].value, max = 0;
        for (let i = data.length; i--;) {
            const value = data[i].value;
            if (value > max) {
                max = value;
            }
    
            if (value < min) {
                min = value;
            }
        }
    
        return { min, max };
    }

    static getPercent(value, min, factor) {
        return (value - min) / factor;
    }
}