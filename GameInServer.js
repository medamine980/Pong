const BUG_FIX_NUMBER = .5;
class Game {
    constructor(playerName1, id, playerName2, id2, gameId) {
        this.MARGIN = 1;
        this.MAX_SPEED = 2.99;
        this.MIN_SPEED = 1;
        this.PADDLE_WIDTH = 1;
        this.PADDLE_HEIGHT = 10;
        this.BALL_RADIUS = 1;
        this.BALL_HEIGHT = this.BALL_RADIUS * 2;
        this.PADDLE_RIGHT_SIDE_POSITION = this.MARGIN + this.PADDLE_WIDTH;
        this.gameId = gameId;
        this.playerName1 = playerName1;
        this.playerName2 = playerName2;
        this.id = id;
        this.id2 = id2;
        this.players = {
            [id]: { name: playerName1, pos: 50, score: 0 },
            [id2]: { name: playerName2, pos: 50, score: 0 }
        }
        /**
         * 1.5      45
        *  1        50
         * 0.5      -5
         * 0.25     25
         * 36.25
         * 12   
         */
        this.reset();
    }
    /**
     * 
     * @returns {[number, number]}
     */
    getRandomDirection() {
        let x = 0, y = 0;
        while (Math.abs(x) >= 0.8 || Math.abs(x) <= 0.4) {
            const rad = (Math.random() * 360 * Math.PI) / 180;
            x = Math.cos(rad);//

            y = Math.sin(rad);
        }
        return [x, y];//
    }
    update() {
        // this.MAX_SPEED += .00001;
        for (let i = 0; i < this.ballPos.length; i++) this.ballPos[i] += this.ballVelocity[i];
        if (this.ballPos[0] >= 100) {
            this.score(this.id)
            // this.ballPos[0] = 99.99
            // this.ballVelocity[0] *= -1;
        }
        else if (this.ballPos[0] <= 0) {
            // this.ballPos[0] = .99
            this.ballVelocity[0] *= -1;
            this.score(this.id2);
        }
        if (this.ballPos[1] >= 100) {
            // this.ballPos[1] = 99;
            this.ballVelocity[1] *= -1;
        }
        else if (this.ballPos[1] <= 0) {
            // this.ballPos[1] = 1;
            this.ballVelocity[1] *= -1;
        }
        if (
            this.ballPos[1] - (this.BALL_HEIGHT / 2) < this.players[this.id].pos + (this.PADDLE_HEIGHT / 2) &&
            this.ballPos[1] + (this.BALL_HEIGHT / 2) > this.players[this.id].pos - (this.PADDLE_HEIGHT / 2) &&
            this.ballPos[0] + (this.BALL_HEIGHT / 2) >= this.MARGIN &&
            this.ballPos[0] - (this.BALL_HEIGHT / 2) < this.PADDLE_RIGHT_SIDE_POSITION
        ) {
            this.ballPos[0] = this.PADDLE_RIGHT_SIDE_POSITION + this.BALL_RADIUS;
            const relativeIntersectY =
                this.players[this.id].pos - this.ballPos[1];
            // normalized Vector so it's value (length) is between 0 and 1
            const halfDiameter = Math.sqrt(
                ((this.PADDLE_HEIGHT + (this.BALL_HEIGHT / 2)) ** 2)
                +
                ((this.PADDLE_WIDTH + (this.BALL_HEIGHT / 2)) ** 2)
            ) / 2
            const normalizedRelativeIntersect = relativeIntersectY / halfDiameter;
            // console.log("first", (1 - Math.abs(normalizedRelativeIntersect)));
            // console.log("first", (1 - Math.abs(normalizedRelativeIntersect)) * (this.MAX_SPEED - this.MIN_SPEED));
            const vectorStrength =
                (1 - Math.abs(normalizedRelativeIntersect)) * (this.MAX_SPEED - this.MIN_SPEED)
                + this.MIN_SPEED;
            this.ballVelocity[0] = vectorStrength;
            this.ballVelocity[1] = -normalizedRelativeIntersect;
            // console.log("vectorStrength", vectorStrength);
        }
        else if (
            this.ballPos[1] - (this.BALL_HEIGHT / 2) < this.players[this.id2].pos + (this.PADDLE_HEIGHT / 2) &&
            this.ballPos[1] + (this.BALL_HEIGHT / 2) > this.players[this.id2].pos - (this.PADDLE_HEIGHT / 2) &&
            this.ballPos[0] - this.BALL_RADIUS <= 100 - this.MARGIN &&
            this.ballPos[0] + this.BALL_RADIUS > 100 - this.PADDLE_RIGHT_SIDE_POSITION
        ) {
            this.ballPos[0] = 100 - this.PADDLE_RIGHT_SIDE_POSITION - this.BALL_RADIUS;
            const relativeIntersectY =
                this.players[this.id2].pos - this.ballPos[1];
            // // normalized Vector so it's value (length) is between 0 and 1
            const halfDiameter = Math.sqrt(
                ((this.PADDLE_HEIGHT + (this.BALL_HEIGHT / 2)) ** 2)
                +
                ((this.PADDLE_WIDTH + (this.BALL_HEIGHT / 2)) ** 2)
            ) / 2
            const normalizedRelativeIntersect = relativeIntersectY / halfDiameter;
            const vectorStrength = -(
                (1 - Math.abs(normalizedRelativeIntersect)) * (this.MAX_SPEED - this.MIN_SPEED)
                + this.MIN_SPEED);
            this.ballVelocity[0] = vectorStrength;
            this.ballVelocity[1] = -normalizedRelativeIntersect;

            // const relativeIntersectY =
            //     this.ballPos[1] - this.players[this.id2].pos - (this.BALL_HEIGHT / 2);
            // const normalizedRelativeIntersect = relativeIntersectY / (this.PADDLE_HEIGHT + this.PADDLE_WIDTH);
            // const vectorStrength =
            //     -((1 - Math.abs(normalizedRelativeIntersect)) * (this.MAX_SPEED - this.MIN_SPEED)
            //         + this.MIN_SPEED);
            // this.ballVelocity[0] = vectorStrength;
            // this.ballVelocity[1] = normalizedRelativeIntersect;
        }
    }
    score(id) {
        this.players[id].score += 1;
        this.reset();
    }
    reset() {
        this.ballPos = [50, 50];
        let [x, y] = this.getRandomDirection();
        if (y === 0) {
            this.ballVelocity = [
                x * (this.MAX_SPEED - this.MIN_SPEED) + this.MIN_SPEED,
                this.MIN_SPEED
            ];
        }
        else {
            const ySign = Math.sign(y);
            this.ballVelocity = [
                x * (this.MAX_SPEED - this.MIN_SPEED) + this.MIN_SPEED,
                (Math.abs(y * (this.MAX_SPEED - this.MIN_SPEED)) + this.MIN_SPEED) * ySign
            ];
        }
        console.log("y+MMIX", y * (this.MAX_SPEED - this.MIN_SPEED) + this.MIN_SPEED);
        // this.ballPos = [this.PADDLE_RIGHT_SIDE_POSITION + this.BALL_RADIUS, 50];
        // this.ballVelocity = [-this.MAX_SPEED, y * 0];
    }
}

function normalizeFunction(value, maxValue, max, min) {
    return (value * max / maxValue) * (max)
}

module.exports = Game;