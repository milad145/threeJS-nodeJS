const myEventEmitter = new MyEventEmitter();
let worldScales = 20, selectedFileType, chromaKey = null;
let objects = {}, videoSettings = {};

function radians_to_degrees(radians) {
    let pi = Math.PI;
    let value = parseInt(radians * (180 / pi));
    if (value === -180) value = 0
    return value
}

function degrees_to_radians(degrees) {
    var pi = Math.PI;
    return degrees * (pi / 180);
}

myEventEmitter.on("modelTransform", modelTransform);
myEventEmitter.on("selectObject", selectObject);
myEventEmitter.on("detachObject", detachObject);
myEventEmitter.on("objectAdded", objectAdded)
myEventEmitter.on("objectVisibilityToggled", objectVisibilityToggled)
myEventEmitter.on("objectDeleted", objectDeleted)
myEventEmitter.on("publishScene", publishScene)

function publishScene(objects) {
    console.log(JSON.stringify(objects))
    $(".manage-side").hide();
}

function modelTransform(object) {
    fillPanelInputs(object)
}

function selectObject(object) {
    $(".imported-object").css({"background": "#ced4da", color: "#2c3e50"});
    $(`#${object.uuid}`).css({"background": "#3581ff", color: "white"})
    fillPanelInputs(object)
}

function detachObject() {
    $("#manage-panel").hide()
}

function objectAdded(object) {
    let objectBox = `<div class="btn btn-light btn-block imported-object mb-1" id="${object.uuid}">
                    <div class="imported-object-name">
                        ${object.name}
                    <div class="imported-object-logo">  </div>
                    </div>
                    <div class="imported-object-logo toggle-object">
                        <img src="/images/visible.svg" alt="visibility">
                    </div>
                    <div class="imported-object-logo delete-object">
                        <img src="/images/delete.svg" alt="delete">
                    </div>
                    <div class="imported-object-logo clone-object">
                        <img src="/images/clone.svg" alt="clone">
                    </div>
                </div>`

    $(`#${object.type}-box`).append(objectBox)

    $(`#${object.uuid} .imported-object-name`).on('click', function () {
        attachObject(object.uuid)
    })

    $(`#${object.uuid} .toggle-object img`).on("click", function () {
        console.log('test')
        toggleObjectVisibility(object.uuid)
    })

    $(`#${object.uuid} .delete-object img`).on("click", function () {
        deleteObject(object.uuid)
    })

    $(`#${object.uuid} .clone-object img`).on("click", function () {
        cloneObject(object.uuid)
    })
}

function objectVisibilityToggled(object) {
    $(`#${object.uuid} .toggle-object img`).attr({src: object.visible ? "/images/visible.svg" : "/images/hidden.svg"})
}

function objectDeleted(uuid) {
    $(`#${uuid}`).remove();
}

function attachObject(uuid) {
    myEventEmitter.emit("attachObject", uuid);
}

function toggleObjectVisibility(uuid) {
    myEventEmitter.emit("toggleObjectVisibility", uuid);
}

function deleteObject(uuid) {
    myEventEmitter.emit("deleteObjectFromScene", uuid);
}

function cloneObject(uuid) {
    myEventEmitter.emit("cloneObject", uuid);
}

function fillPanelInputs(object) {
    $("#manage-panel").show()
    $("#position-x").val((object.position.x / worldScales).toFixed(2))
    $("#position-y").val((object.position.y / worldScales).toFixed(2))
    $("#position-z").val((object.position.z / worldScales).toFixed(2))
    $("#rotation-x").val(radians_to_degrees(object.rotation.x))
    $("#rotation-y").val(radians_to_degrees(object.rotation.y))
    $("#rotation-z").val(radians_to_degrees(object.rotation.z))
    $("#scale").val(((object.scale.x + object.scale.y + object.scale.z) / 3).toFixed(6))
    $("#scale-x").val((object.scale.x).toFixed(6))
    $("#scale-y").val((object.scale.y).toFixed(6))
    $("#scale-z").val((object.scale.z).toFixed(6))
}

function openVideoTypeModal(data) {
    videoSettings = data
    $(".form-check-input").prop("checked", false);
    $("#color-part input").val("#00ff00");
    $(".video-settings-sec #color-part").css({display: "none"})
    $("#videoType-wrapper").css({display: "flex"})
    $("#videoType-wrapper video").attr("src", URL.createObjectURL(data.file))

}

function insertVideo() {
    $("#videoType-wrapper").css({display: "none"})
    $("#videoType-wrapper video").attr("src", '')
    myEventEmitter.emit("addingObject", videoSettings);
}

$(document).ready(function () {
    $("#manage-panel input[type=number]").on("input", function () {
        let name = $(this).attr("id").split("-")
        let value = parseFloat($(this).val());

        if (name[0] === "rotation") {
            if (value > 180) {
                value = 180;
                $(this).val(value)
            } else if (value < -180) {
                value = -180;
                $(this).val(value)
            }
            // else if (isNaN(value)) {
            //     value = 0
            //     $(this).val(value)
            // }
        }

        switch (name[0]) {
            case "position":
                value = value * worldScales;
                break;
            case "rotation":
                value = degrees_to_radians(value)
                break;
            case "scale":
                if (name[1])
                    $("#scale").val(((Number($("#scale-x").val()) + Number($("#scale-y").val()) + Number($("#scale-z").val())) / 3).toFixed(6))
                break;
        }
        if (!isNaN(value))
            myEventEmitter.emit("modelTransformFromPanel", {type: name[0], direction: name[1], value});
    });

    $("#scale").on("input", function () {
        let value = Number($(this).val());
        $("#scale-x").val(value)
        $("#scale-y").val(value)
        $("#scale-z").val(value)
    });

    $("#videoType-wrapper-close").on("click", function () {
        $("#videoType-wrapper").hide()
        $("#videoType-wrapper video").attr("src", '')
    })

    $(".import-object-add-logo").on("click", function () {
        let type = $(this).attr("id").split("-")[1];
        let accept = null
        selectedFileType = type;
        chromaKey = null;
        switch (type) {
            case "image":
                accept = ".jpg,.jpeg,.png";
                break;
            case "video":
                accept = ".mp4,.mov";
                break;
            case "model":
                // accept = ".glb,.fbx,.usdz,.json";
                accept = ".glb";
                break;
            case "audio":
                accept = ".mp3";
                break;
        }
        $("#import-file").attr("accept", accept)
        if (type === "box")
            myEventEmitter.emit("addingObject", {type: selectedFileType});
        else
            $("#import-file").trigger("click");
    })

    $(document).on("change", "#import-file", function () {
        if (this.files[0]) {
            let data = {type: selectedFileType, file: this.files[0]}
            if (selectedFileType === "video") {
                openVideoTypeModal(data)
            } else
                myEventEmitter.emit("addingObject", data);
        }
    });

    $(".form-check-input").on("change", function () {
        let field = $(this).attr("id").split("-")[0];
        let checked = $(this).is(":checked")
        videoSettings[field] = checked;
        if (field === "chromakey") {
            $(".video-settings-sec #color-part").css({display: checked ? "flex" : "none"})
            if (checked)
                videoSettings["color"] = $("#color-video").val()
            else
                delete videoSettings["color"]
        } else if (field === "color")
            videoSettings[field] = $(this).val()
    });

    $("#insertVideo").on('click', function () {
        insertVideo()
    })
    //=======================================================
})