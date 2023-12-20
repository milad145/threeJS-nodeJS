let clothData = null;
const myEventEmitter = new MyEventEmitter();
myEventEmitter.on("playerLoaded", playerLoaded)

function playerLoaded() {
    let data = {
        "name": "1694366732036-q16934.glb",
        "url": "/cloth-model/2023/9/10/1694366714998-za5vu6.glb",
        "scale": {"x": 1, "y": 1, "z": 1},
        "rotation": {"_x": 0, "_y": 0, "_z": 0, "_order": "XYZ"},
        "position": {"x": 2.6, "y": -50.16, "z": -7.2},
        type: 'glb'
    }
    console.log(clothData)
    myEventEmitter.emit("dataLoaded", data);
}

$(document).ready(function () {
    try {
        clothData = JSON.parse($("#cloth-data").val())
    } catch (e) {
        console.error(e)
    }

})