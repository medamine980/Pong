const express = require("express");
const fs = require('fs');
const path = require('path');
const http = require('http');
const Game = require("./GameInServer");
const app = express();
const server = http.createServer(app);
const io = new (require('socket.io').Server)(server);

const PORT = process.env.PORT || 8000
const TICKS = 30;

app.set('view engine', path.resolve(__dirname, 'views'));
app.use(express.static(path.resolve(__dirname, 'public')));

// app.use((req, res, next) => {
//     res.send(Date.now().toString());
//     return next();
// });

app.get("/", (req, res) => {
    res.sendFile(path.resolve(__dirname, "views/index.html"));
});
app.get("/:id", (req, res) => {
    res.sendFile(path.resolve(__dirname, "views/controller.html"));
})
app.get("/errorProne", (req, res) => {
    if (!process.env.NODE_ENV) {
        res.sendFile(path.resolve(__dirname, "developement-client.js"));
    }
})
const emptyRooms = [];
// const matchmaking = [];
const occupiedRooms = [];
const games = [];
const needControllers = [];
const users = {};

io.on("connection", socket => {
    users[socket.id] = socket
    socket.on("connected", (callback) => {
        callback(Object.keys(users).length);
        socket.broadcast.emit("users", Object.keys(users).length)
    });
    socket.on("ping", startDate => {
        socket.emit("ping", startDate);
    })
    socket.on("need-controller", () => {
        console.log(socket.id);
        const c = needControllers.find(v => v.id === socket.id);
        if (!c)
            needControllers.push({
                socket,
                id: socket.id,
                contollerId: null
            });
    });
    socket.on("controller-connected", remoteId => {
        const c = needControllers.find(v => v.id === remoteId)
        if (c && !c.controllerId) {
            c.controllerId = remoteId;
            c.socket.emit("controller-connected");
            socket.emit("controller-connected");
        }
    })
    socket.on("controller-data", (remoteId, data) => {
        console.log(data, remoteId);

        const c = needControllers.find(v => v.id === remoteId);

        if (c) {
            c.socket.emit("controller-data", data);
        }
    });
    socket.on("join", (callback) => {
        callback();
        if (emptyRooms.length > 0) {
            const roomId = emptyRooms[0][0]// room Id
            const opponent = emptyRooms[0][1];
            occupiedRooms.push([opponent, socket.id]);
            // games[opponent] = new Game(
            //     "1", opponent.substring(0, opponent.length - 1),
            //     "2", socket.id);
            games.push(
                new Game(
                    "1", opponent,
                    "2", socket.id,
                    roomId)
            );
            socket.join(roomId);
            emptyRooms.splice(0, 1);
            // const randomDir = getRandomDirection();
            // socket.emit('play', opponent, {
            //     x: randomDir.x * (-1),
            //     y: randomDir.y
            // });
            // socket.broadcast.to(opponent).emit('play', opponent, randomDir);
            io.to(roomId).emit('play-match', roomId);
        }
        else {
            const roomId = Date.now();
            socket.join(roomId);
            emptyRooms.push([roomId, socket.id]);
        }
    });
    socket.on("remove-match", () => {
        removeUserFromEmptyRooms(socket);
    });
    socket.on("remove-controller", () => {

    })
    socket.on('endRound', roomId => {
        const randomDir = getRandomDirection();
        console.log(randomDir, roomId)
        socket.emit('nextRandomDirection', {
            x: randomDir.x * -1,
            y: randomDir.y
        });
        socket.broadcast.to(roomId).emit("randomDirection", randomDir);
    });

    socket.on("randomDirection", (roomId, randomDirection) => {
        const randomDir = {
            x: randomDirection.x * -1,
            y: randomDirection.y
        };
        socket.broadcast.to(roomId).emit("randomDirection", randomDir);
    })
    socket.on("move", (roomId, position) => {
        socket.broadcast.to(roomId).emit('move', position);
    });
    socket.on("leaving", () => {
        onDisconnection(socket, false);
    })
    socket.on("disconnect", () => {
        onDisconnection(socket, true);
    })
});
function removeUserFromEmptyRooms(socket) {
    const index = emptyRooms.findIndex(ids => ids[1] === socket.id);
    if (index !== -1) {
        emptyRooms.splice(index, 1);
    }
    return index;
}
function onDisconnection(socket, deleteUser = true) {
    const i = needControllers.findIndex(v => v.id === socket.id);
    if (i !== -1)
        needControllers.splice(
            i,
            1
        );
    else {
        const controllerIndex = needControllers.findIndex(v => v.controllerId === socket.id);
        if (controllerIndex !== -1) needControllers[controllerIndex].controllerId = null;
    }
    let foundIndex = removeUserFromEmptyRooms(socket);
    if (foundIndex === -1) {
        foundIndex = occupiedRooms.findIndex(id => id === socket.id);
        games.forEach((game, index) => {
            console.log(Object.keys(users).length);
            if (game.id === socket.id) {
                io.to(game.id2).emit("player-left");
                games.splice(index, 1);
                socket.leave(game.gameId)
                return;
            }
            if (game.id2 === socket.id) {
                io.to(game.id).emit("player-left");
                games.splice(index, 1);
                socket.leave(game.gameId)
                return;
            }
        })
        occupiedRooms.splice(foundIndex, 1);
    }
    if (deleteUser) delete users[socket.id];
    io.sockets.emit("users", Object.keys(users).length);
}
function getRandomDirection() {
    let randomDir = {
        x: 0
    }
    while (Math.abs(randomDir.x) <= 0.3 || Math.abs(randomDir.x) >= .8)
        randomDir = {
            x: Math.cos(Math.random() * 2 * Math.PI),
            y: Math.sin(Math.random() * 2 * Math.PI)
        }
    return randomDir;
}
server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server started at ${PORT}`);
    setInterval(() => {
        for (let key in games) {
            // console.log("still-processing");
            /**
             * @type {Game}
             */
            const game = games[key];

            game.update();
            users[game.id].emit("game-stats",
                {
                    ballPos: game.ballPos,
                    selfScore: game.players[game.id].score,
                    oppPos: game.players[game.id2].pos,
                    oppScore: game.players[game.id2].score,
                },
                pos => {
                    game.players[game.id].pos = pos;
                });
            const ballPosReversed = [...game.ballPos].map((pos, i) => {
                if (i === 0) return pos * -1 + 100;
                return pos;
            })
            users[game.id2].emit("game-stats",
                {
                    ballPos: ballPosReversed,
                    selfScore: game.players[game.id2].score,
                    oppPos: game.players[game.id].pos,
                    oppScore: game.players[game.id].score,
                },
                pos => {
                    game.players[game.id2].pos = pos;
                });
            // console.log("done-processing");
        }
    }, 1000 / TICKS)
})
