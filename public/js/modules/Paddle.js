export default class Paddle {
    /**
     * 
     * @param {HTMLElement} paddleEle 
     */
    constructor(paddleEle) {
        this.paddleEle = paddleEle;
    }
    get position() {
        return parseFloat(window.getComputedStyle(this.paddleEle).getPropertyValue('--position'));
    }
    get rect() {
        return this.paddleEle.getBoundingClientRect();
    }
    set position(value) {
        this.paddleEle.style.setProperty('--position', Math.min(Math.max(value, 0), 100));
    }
    reset() {
        this.position = 50;
    }
    update(delta, ballPos) {
        this.position += delta * .02 * (ballPos - this.position);
    }
}