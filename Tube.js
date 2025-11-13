class Tube {
    constructor(id, capacity = 4) {
        this.id = id;
        this.capacity = capacity;
        this.waterLayers = [];
        this.element = null;
    }

    addWater(color) {
        if (this.waterLayers.length < this.capacity) {
            this.waterLayers.push(color);
            return true;
        }
        return false;
    }

    removeWater() {
        return this.waterLayers.pop();
    }

    getTopColor() {
        if (this.waterLayers.length === 0) return null;
        return this.waterLayers[this.waterLayers.length - 1];
    }

    getTopColors(count) {
        const topColors = [];
        const topColor = this.getTopColor();
        
        if (!topColor) return topColors;
        
        for (let i = this.waterLayers.length - 1; i >= 0; i--) {
            if (this.waterLayers[i] === topColor && topColors.length < count) {
                topColors.push(this.waterLayers[i]);
            } else {
                break;
            }
        }
        
        return topColors;
    }

    isFull() {
        return this.waterLayers.length === this.capacity;
    }

    isEmpty() {
        return this.waterLayers.length === 0;
    }

    isComplete() {
        if (this.isEmpty()) return false;
        if (this.waterLayers.length !== this.capacity) return false;
        
        const firstColor = this.waterLayers[0];
        return this.waterLayers.every(color => color === firstColor);
    }

    canPourInto(otherTube) {
        if (this.isEmpty()) return false;
        if (otherTube.isFull()) return false;
        if (otherTube.isEmpty()) return true;
        
        return this.getTopColor() === otherTube.getTopColor();
    }

    pourInto(otherTube) {
        if (!this.canPourInto(otherTube)) return false;
        
        const topColors = this.getTopColors(otherTube.capacity - otherTube.waterLayers.length);
        
        for (let color of topColors) {
            otherTube.addWater(color);
            this.removeWater();
        }
        
        return true;
    }

    createElement() {
        const tubeDiv = document.createElement('div');
        tubeDiv.className = 'tube';
        tubeDiv.dataset.tubeId = this.id;
        
        this.updateElement(tubeDiv);
        this.element = tubeDiv;
        
        return tubeDiv;
    }

    updateElement(element = this.element) {
        if (!element) return;
        
        element.innerHTML = '';
        
        this.waterLayers.forEach((color, index) => {
            const waterLayer = document.createElement('div');
            waterLayer.className = `water-layer water-${color}`;
            waterLayer.style.height = `${(100 / this.capacity)}%`;
            waterLayer.style.bottom = `${(index * 100 / this.capacity)}%`;
            element.appendChild(waterLayer);
        });
    }

    clone() {
        const newTube = new Tube(this.id, this.capacity);
        newTube.waterLayers = [...this.waterLayers];
        return newTube;
    }
}