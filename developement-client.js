const footer = document.createElement("footer");
const ball = document.getElementById("ball");
const serverBallOutline = document.createElement("div");
serverBallOutline.style.cssText = `
    height: 2vh;
    width: 2vw;
    border-radius: 50%;
    border: red .25vmin ridge;
`;
ball.appendChild(serverBallOutline);
footer.attributeStyleMap.set("position", new CSSKeywordValue("fixed"));
footer.attributeStyleMap.set("bottom", new CSSUnitValue("0", "px"));
footer.attributeStyleMap.set("right", new CSSUnitValue("0", "px"));
footer.attributeStyleMap.set("font-size", new CSSUnitValue("2", "em"));
footer.attributeStyleMap.set("background-color", CSSUnparsedValue.parse("background-color", "#0004"));
footer.textContent = (window.innerWidth / window.innerHeight).toFixed(2);
document.body.appendChild(footer);
window.addEventListener("resize", () => {
    footer.textContent = (window.innerWidth / window.innerHeight).toFixed(2);
})