export default class Ball {
    /**
     * 
     * @param {HTMLElement} ballEle 
     */
    constructor(ballEle) {
        this.ballEle = ballEle;
        this.VELOCITY_INCREASE = 0.0604;
        this.reset();
    }
    get rect() {
        return this.ballEle.getBoundingClientRect();
    }
    get x() {
        return parseFloat(getComputedStyle(this.ballEle).getPropertyValue('--x'));
    }
    get y() {
        return parseFloat(getComputedStyle(this.ballEle).getPropertyValue('--y'));
    }
    set x(value) {
        this.ballEle.style.setProperty('--x', value);
    }
    set y(value) {
        this.ballEle.style.setProperty('--y', value);
    }
    reset(randomDirection) {
        this.x = 50;
        this.y = 50
        this.direction = randomDirection || { x: 0 };
        while (!randomDirection && (Math.abs(this.direction.x) <= .3 || Math.abs(this.direction.x) >= .8)) {
            const randomRad = randomNumberBetween(0, 2 * Math.PI);

            this.direction = { x: Math.cos(randomRad), y: Math.sin(randomRad) };
        }
        this.velocity = .03;
        return this.direction;
    }
    /**
     * 
     * @param {number} delta 
     * @param {Array} paddleRects 
     */
    isCollision(rect) {
        return (
            rect.right >= this.rect.left &&
            rect.left <= this.rect.right &&
            rect.top <= this.rect.bottom &&
            rect.bottom >= this.rect.top
        )
    }
    update(delta, paddleRects) {
        this.x += this.direction.x * delta * this.velocity;
        this.y += this.direction.y * delta * this.velocity;
        if (paddleRects.some(rect => this.isCollision(rect))) {
            this.direction.x *= -1;
        }
        if (this.rect.top <= 0 || this.rect.bottom >= window.innerHeight) {
            this.direction.y *= -1;
        }
        // this.velocity *= this.VELOCITY_INCREASE * delta;
        this.velocity += (delta * 0.00001);
    }

}

function randomNumberBetween(min, max) {
    return Math.max(min, Math.random() * max)
}