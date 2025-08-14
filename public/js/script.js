import Ball from './modules/Ball.js';
import Paddle from './modules/Paddle.js';
import { ping, waitForSeconds, getFps } from './modules/utility.js';

const PING_FREQUENCY = 500;

const ballInstance = new Ball(document.getElementById('ball'));
const playerPaddle = new Paddle(document.getElementById('player-paddle'));
const player2Paddle = new Paddle(document.getElementById('player2-paddle'));
const playerScoreEle = document.getElementById('player-score');
const player2ScoreEle = document.getElementById('computer-score');
const onlineUsersEle = document.getElementById("users-online");

const fpsEle = document.getElementById("fps");
// const ping = document.getElementById("ping");

let currentOperationEle;
let uiContainer = document.getElementById('ui');
let uiMainMenuButton = document.getElementById('main-menu-button');
let uiButtonsContainer = uiContainer.querySelector('.ui__buttons');
let uiMainMenuButtons = document.querySelectorAll('[data-main-menu]');
let singlePlayerButton = document.getElementById('single-player-button');
let multiPlayerButton = document.getElementById('multiplayer-button');



let isConnected = false;
let isPlayeingOnline = false;
let isSearching = false;
let randomDirection;
let lastTime;
let roomId;
let socket;
let animationId;
let waitTimeOutId;
let pingIntervalId;



function updateCPU() {
    return async (time) => {
        if (lastTime != null) {
            const delta = time - lastTime;
            ballInstance.update(delta, [playerPaddle.rect, player2Paddle.rect])
            player2Paddle.update(delta, ballInstance.y);
        }
        else {
            if (isConnected) {
                ballInstance.reset(randomDirection);
                randomDirection = null;
            }
        }
        lastTime = time;
        if (isLose()) {
            handleLose();
            await waitForSeconds(1, id => waitTimeOutId = id);
            lastTime += 1000;
            if (!animationId) return
        }
        animationId = window.requestAnimationFrame(updateCPU());
    }
}

function isLose() {
    return (
        ballInstance.rect.left <= 0 || ballInstance.rect.right >= window.innerWidth
    )
}
// async function checkRandomDir() {
//     if (randomDirection) {
//         return new Promise(res => {
//             res(randomDirection);
//         });
//     }
//     else {
//         return await new Promise(res => {
//             setTimeout(
//                 res(checkRandomDir())
//                 , 100)
//         });
//     }
// }
function updatePlayerScore(Increment, score) {
    if (!Increment) {
        playerScoreEle.textContent = score;
        return;
    }
    playerScoreEle.textContent = parseInt(playerScoreEle.textContent) + 1;
}
function updatePlayer2Score(Increment, score) {
    if (!Increment) {
        player2ScoreEle.textContent = score;
        return;
    }
    player2ScoreEle.textContent = parseInt(player2ScoreEle.textContent) + 1;
}
function resetScore() {
    updatePlayerScore(false, 0);
    updatePlayer2Score(false, 0);
}
function handleLose() {
    if (ballInstance.rect.right >= window.innerWidth) {
        // var randomDir = ballInstance.reset();
        updatePlayerScore(true);
        ballInstance.reset();
        // if (isConnected) setTimeout(() => socket.emit("endRound", roomId), 10000)
    }
    else if (ballInstance.rect.left <= 0) {
        ballInstance.reset();
        updatePlayer2Score(true);
        // if (isConnected) {
        // Connected
        // if (!randomDirection) {
        //     await checkRandomDir();
        // }
        // ballInstance.reset(randomDirection);
        // randomDirection = null;
        // }
        // else {
        // Not connected
        //     ballInstance.reset();
        //     updatePlayer2Score(parseInt(player2ScoreEle.textContent) + 1)
        // }
    }
    player2Paddle.reset();
    // if (isConnected) {
    //     stopTheGame();
    // }
    // else player2Paddle.reset();
}
function startTheGame(mode) {
    switch (mode) {
        case 1:
            document.onmousemove = e => playerPaddle.position = e.y / window.innerHeight * 100;
            animationId = window.requestAnimationFrame(updateCPU(true));
            uiButtonsContainer.firstElementChild.style.display = 'none';
            break;
        case 2:
            handleMultiplayerGamePlay();
            break;
    }
}

function updateMultiplayer() {
    const ball = document.getElementById('ball')

    socket.on("game-stats", (data, callback) => {
        ball.attributeStyleMap.set("--x", CSSUnparsedValue.parse("--x", data.ballPos[0]));
        ball.attributeStyleMap.set("--y", CSSUnparsedValue.parse("--y", data.ballPos[1]));
        player2Paddle.position = data.oppPos;
        updatePlayer2Score(false, data.oppScore);
        updatePlayerScore(false, data.selfScore);
        callback(playerPaddle.position);
    })
}

function handleMultiplayerGamePlay() {
    // Start the game
    // animationId = requestAnimationFrame(updateMultiplayer(false));
    updateMultiplayer();
    document.onmousemove = e => {
        const position = e.y / window.innerHeight * 100;
        playerPaddle.position = position;
        socket.emit('move', roomId, position);
    };
}
function stopTheGame() {
    if (isPlayeingOnline) {
        socket.emit("leaving");
        isPlayeingOnline = false;
    }
    resetScore();
    ballInstance.reset();
    cancelAnimationFrame(animationId);
    clearTimeout(waitTimeOutId);
    animationId = null;
    lastTime = null;
}
function mainMenu() {
    document.onmousemove = () => { }
    stopTheGame();
    uiButtonsContainer.firstElementChild.style.display = 'grid';
    const currentOperation = ui.querySelector('.ui__current-operation');
    currentOperation?.remove();
    if (isSearching) {
        // socket.off("play-match");
        socket.emit("remove-match");
    }


    // uiMainMenuButtons.forEach(mainMenuButton => {
    //     mainMenuButton.style.display = "block";
    // })
}
function connectToServer() {
    if (isConnected || socket) return false;
    socket = io.connect();
    socket.on("ping", ping);
    pingIntervalId = setInterval(() => {
        const startDate = Date.now();
        socket.emit("ping", startDate);
    }, PING_FREQUENCY);
    socket.on('play-match', (id) => {
        isPlayeingOnline = true;
        isSearching = false;
        roomId = id;
        const currentOperation = ui.querySelector('.ui__current-operation');
        currentOperation?.remove();
        startTheGame(2, socket);
    });
    // socket.on("randomDirection", randomDir => {
    //     randomDirection = randomDir;
    //     animationId = window.requestAnimationFrame(updateCPU(false));
    // });
    socket.on("player-left", () => {
        isPlayeingOnline = false;
        isSearching = false;
        location.reload();
    })
    isConnected = true;
    return socket;
}
function disconnect() {
    isPlayeingOnline = false;
    if (!isConnected) return;
    socket.disconnect();
    isConnected = false;
    roomId = null;
}

function changeUsersOnlineCount(number) {
    onlineUsersEle.textContent = number;
}

function checkOnline() {
    connectToServer();
    socket.emit("connected", changeUsersOnlineCount)
    socket.on("users", changeUsersOnlineCount)
}

// socket.on('move', pos => {
//     player2Paddle.position = pos;
// });
function removeSocketListeners(...events) {
    events.forEach(event => socket.off(event));
}
function mainUpdate() {
    checkOnline();
    uiMainMenuButton.onclick = e => mainMenu();
    window.onresize = e => {
    }
    getFps(fps => fpsEle.textContent = fps)();

    singlePlayerButton.onclick = e => startTheGame(1);
    multiPlayerButton.onclick = async e => {
        if (!socket) return;
        socket.emit('join', () => {
            isSearching = true;
            if (!currentOperationEle) {
                currentOperationEle = document.createElement('div');
                currentOperationEle.className = "ui__current-operation";
                const h2 = document.createElement('h2');
                h2.textContent = "Waiting for someone...";
                currentOperationEle.append(h2);
            }
            uiButtonsContainer.firstElementChild.style.display = 'none';
            uiContainer.appendChild(currentOperationEle);
        });
    }












    const controllerBtn = window.controller;
    let controllerNeededState = false;
    let controllerState = false;
    controllerBtn.onclick = (e) => {
        controllerNeededState = !controllerNeededState;
        if (controllerNeededState) {
            e.currentTarget.textContent = "Remove Controller";
            socket.emit("need-controller");
            socket.on("controller-connected", () => {
                console.log("connected");
            });
            socket.on("controller-data", (data) => {
                playerPaddle.position += data.playerPos;
                console.log(data);
            });
        }
        else {
            e.currentTarget.textContent = "Controller"
            removeSocketListeners("controller-connected", "controller-data");
        }
    }
}
mainUpdate();