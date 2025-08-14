export async function waitForSeconds(seconds, callback) {
    return new Promise((res) => {
        const waitTimeOutId = setTimeout(() => {
            res(seconds);
        }, seconds * 1000);
        callback(waitTimeOutId)
    })
};

export function ping(startDate) {
    const ping = Date.now() - startDate;
    document.getElementById("ping").textContent = `${ping}`;
}

let lastTime;
export function getFps(callback) {
    return time => {
        requestAnimationFrame(getFps(callback));
        if (lastTime == null) {
            lastTime = time;
            return;
        }
        const delta = time - lastTime;
        callback((1000 / delta).toFixed(1));
        lastTime = time;
    }
}