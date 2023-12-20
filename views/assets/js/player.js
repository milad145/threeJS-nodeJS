import * as THREE from "./libs/three.module.js";
import {OrbitControls} from "./libs/OrbitControls.js";
import {TransformControls} from "./libs/TransformControls.js";
import {GLTFLoader} from "./libs/GLTFLoader.js";
import {FBXLoader} from "./libs/FBXLoader.js";
import {USDZLoader} from "./libs/USDZLoader.js";
import {RoughnessMipmapper} from "./libs/RoughnessMipmapper.js";
import TWEEN from "./libs/tween.esm.js";


let orbitControls, transformControls;
let camera, cameraPersp, scene, renderer;
let mouse, raycaster, pmremGenerator, roughnessMipMapper, sceneMeshes = [];
let worldScale = 20;
let loadManager = new LoadManager()
let manager = new THREE.LoadingManager();
manager.onStart = loadManager.onStart;
manager.onLoad = loadManager.onLoad;
manager.onProgress = loadManager.onProgress;
manager.onError = loadManager.onError;

let textureLoader = new THREE.TextureLoader(manager);
let gltfLoader = new GLTFLoader(manager);
let fbxLoader = new FBXLoader(manager);
let usdzLoader = new USDZLoader(manager);
let jsonLoader = new THREE.ObjectLoader(manager);


let videos = {};

function innerWidth() {
    return document.getElementById("scene").offsetWidth
}

function innerHeight() {
    return document.getElementById("scene").offsetHeight
}


function init() {
    const aspect = innerWidth() / innerHeight();
    cameraPersp = new THREE.PerspectiveCamera(50, aspect, 0.01, 30000);
    camera = cameraPersp;
    camera.position.set(0, 5 * worldScale, 5 * worldScale);
    camera.lookAt(0, 20 * worldScale, 0);

    scene = new THREE.Scene();
    mouse = new THREE.Vector2();
    raycaster = new THREE.Raycaster();
    renderer = new THREE.WebGLRenderer({alpha: true, antialias: true}); // required

    scene.background = new THREE.Color(0xffffff)

    renderer.setClearColor(0x000000, 0); // the default
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(innerWidth(), innerHeight());
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.8;
    renderer.outputEncoding = THREE.sRGBEncoding;

    document.getElementById("scene").innerHTML = '';
    document.getElementById("scene").appendChild(renderer.domElement);

    roughnessMipMapper = new RoughnessMipmapper(renderer);

    pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();

    orbitControls = new OrbitControls(camera, renderer.domElement);
    orbitControls.update();

    transformControls = new TransformControls(camera, renderer.domElement);
    scene.add(transformControls);

    let gridHelper = new THREE.GridHelper(10 * worldScale, 100, 0x000000, 0x444444)
    gridHelper.position.y = 0;
    gridHelper.showType = 'managePanel'
    scene.add(gridHelper);


    let ambientLight = new THREE.AmbientLight(0xffffff, 1);
    ambientLight.position.set(0, 0, 0)
    let directionalLight = new THREE.DirectionalLight(0xFFFFFF, 1.0);
    directionalLight.position.set(3, 3, 0)
    const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x444444);
    scene.add(hemisphereLight);
    scene.add(ambientLight);
    scene.add(directionalLight);

    loadData(null);

    animated();

    prepareTransformControlsModePanel("manage-transform", [
        {
            iconRotate: 0,
            icon: 'fa-mouse-pointer',
            text: 'Move',
            id: 'translate',
            onclick: changeTransformControlsMode
        },
        {
            iconRotate: -45,
            icon: 'fa-refresh',
            text: 'Rotate',
            id: 'rotate',
            onclick: changeTransformControlsMode
        },
        {
            iconRotate: -45,
            icon: 'fa-arrows-h',
            text: 'Scale',
            id: 'scale',
            onclick: changeTransformControlsMode
        },
        {
            iconRotate: 0,
            icon: 'fa-save',
            text: 'Publish',
            id: 'publish',
            onclick: saveData
        }
    ]);

    window.addEventListener("resize", onWindowResize, false);
    window.addEventListener("keydown", keydown, false);
    renderer.domElement.addEventListener("mouseup", onClick, false);
    renderer.domElement.addEventListener("touchend", onTouchEnd, false);
    renderer.domElement.addEventListener("mousemove", onDocumentMouseMove, false);
    transformControls.addEventListener("dragging-changed", draggingChanged, false);
}

function prepareTransformControlsModePanel(id, modes) {
    let panelBox = document.createElement("div");
    panelBox.id = id
    panelBox.classList = "pt-3";
    for (let mode of modes) {
        let div = document.createElement("div");
        div.classList = "d-flex flex-column align-items-center mb-3";
        div.id = "transform-" + mode.id;

        let btn = document.createElement("button");
        btn.classList = "btn btn-light";
        btn.onclick = () => mode.onclick(mode.id);

        let icon = document.createElement("i")
        icon.classList = "fa " + mode.icon
        icon.style.transform = "rotate(" + mode.iconRotate + "deg)";

        btn.appendChild(icon)

        let span = document.createElement("span");
        span.classList = id + "-name";
        span.innerText = mode.text

        div.appendChild(btn);
        div.appendChild(span);

        panelBox.appendChild(div);
    }
    document.getElementById("scene").appendChild(panelBox);
}

function changeTransformControlsMode(mode) {
    transformControls.setMode(mode)
}

/**
 *
 * @param object {Object}f
 * @param customData {Object}
 * @param x {Number}
 * @param y {Number}
 * @param z {Number}
 */
function createModelBox(object, customData, x, y, z) {
    let geometry = new THREE.BoxGeometry(x, y, z);
    let edges = new THREE.EdgesGeometry(geometry);
    let modelBox = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({color: 0xffff00, linewidth: 20}));
    modelBox.add(object)
    addObject(modelBox, customData)
}

function addObject(object, customData) {
    object.customData = customData
    object.callback = () => clickOnObject(object)
    scene.add(object)
    // sceneMeshes.push(object)
    myEventEmitter.emit("objectAdded", {
        uuid: object.uuid, visible: object.visible, name: customData.name, type: customData.type
    });
    clickOnObject(object)
}

function clickOnObject(modelBox) {
    if (transformControls.object) {
        transformControls.object.material.color.setHex("0xffff00")
    }
    detachObjectFromTransformControls()
    modelBox.material.color.setHex(0xff0000)
    attachObjectToTransformControls(modelBox);
}

function attachObjectToTransformControls(object) {
    document.getElementById("manage-transform").style.display = "block"
    transformControls.attach(object);
    let {uuid, position, rotation, scale, name} = object;
    myEventEmitter.emit("selectObject", {uuid, position, rotation, scale, name});
}

function detachObjectFromTransformControls() {
    document.getElementById("manage-transform").style.display = "none"
    transformControls.detach();
    myEventEmitter.emit("detachObject");
}

function keydown(event) {

    switch (event.keyCode) {
        case 87: // W
            changeTransformControlsMode("translate");
            break;

        case 69: // E
            changeTransformControlsMode("rotate");
            break;

        case 82: // R
            changeTransformControlsMode("scale");
            break;

        case 88: // X
            transformControls.showX = !transformControls.showX;
            break;

        case 89: // Y
            transformControls.showY = !transformControls.showY;
            break;

        case 90: // Z
            transformControls.showZ = !transformControls.showZ;
            break;

        case 27: // Esc
            transformControls.reset();
            break;


        // case 81: // Q
        //     transformControls.setSpace(transformControls.space === 'local' ? 'world' : 'local');
        //     break;

        // case 187:
        // case 107: // +, =, num+
        //     transformControls.setSize(transformControls.size + 0.1);
        //     break;

        // case 189:
        // case 109: // -, _, num-
        //     transformControls.setSize(Math.max(transformControls.size - 0.1, 0.1));
        //     break;

        // case 32: // Spacebar
        //     transformControls.enabled = !transformControls.enabled;
        //     break;

        // case 8: // backSpace
        //     // transformControls.showX = false;
        //     // transformControls.showY = false;
        //     // transformControls.showZ = false;
        //     detachObjectFromTransformControls()
        //     break;

        // case 13: // enter
        //     transformControls.showX = true;
        //     transformControls.showY = true;
        //     transformControls.showZ = true;
        //     break;

    }
}

function draggingChanged(event) {
    orbitControls.enabled = !event.value;
    if (!event.value) {
        let object = transformControls.object;


        let {position, rotation, scale} = object

        myEventEmitter.emit("modelTransform", {position, rotation, scale});
    }
}

function onDocumentMouseMove(event) {
    event.preventDefault();
    mouse = new THREE.Vector2();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    var intersects = raycaster.intersectObjects(scene.children);

    if (intersects.length > 0 && intersects[0].object && intersects[0].object.callback) {
        $("html,body").css("cursor", "pointer");
    } else {
        $("html,body").css("cursor", "default");
    }

}

function onClick(event) {
    event.preventDefault();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    clickOnObjects()
}

function onTouchEnd(event) {
    event.preventDefault();
    mouse.x = (event.changedTouches["0"].clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.changedTouches["0"].clientY / window.innerHeight) * 2 + 1;
    clickOnObjects()
}

function clickOnObjects() {
    raycaster.setFromCamera(mouse, camera);
    var intersects = raycaster.intersectObjects(scene.children);
    if (intersects.length > 0) {
        if (intersects[0].object.callback) {
            intersects[0].object.callback();
        }
    }
}

function onWindowResize() {
    camera.aspect = innerWidth() / innerHeight();
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth(), innerHeight());
}

function render() {
    for (let key of Object.keys(videos)) {
        let {video, videoTexture, chromaKey, isFirstFrameRendered} = videos[key]
        if (videoTexture && chromaKey && !isFirstFrameRendered && video.readyState >= video.HAVE_CURRENT_DATA) {
            videoTexture.needsUpdate = true;
            isFirstFrameRendered = true;
        }
        if (video && chromaKey && videoTexture && !video.paused) videoTexture.update();
    }
    renderer.render(scene, camera);
    orbitControls.update();
}

function animated() {
    requestAnimationFrame(animated);
    TWEEN.update();
    render()
}

function showCameraPosition() {
    console.log(camera.position)
}

function addImage(image, name, isUrl, lock, scale, position, rotation) {
    image = isUrl ? image : URL.createObjectURL(image)
    textureLoader.load(image, function (tex) {
        tex.encoding = THREE.sRGBEncoding
        let img = new THREE.MeshBasicMaterial({
            map: tex,
            side: THREE.DoubleSide,
            transparent: true
        });
        let {width, height} = tex.image

        if (width >= height) {
            height = (worldScale * height) / width
            width = worldScale;
        } else {
            width = (worldScale * width) / height
            height = worldScale
        }

        img.map.needsUpdate = true;
        let obj = new THREE.Mesh(new THREE.PlaneGeometry(width, height), img);
        obj.transparent = true
        let ratio = 100 / worldScale
        obj.scale.set(ratio, ratio, ratio)
        width *= ratio
        height *= ratio;

        if (scale) {
            obj.scale.set(scale.x * ratio, scale.y * ratio, scale.z * ratio)
        }
        if (position) {
            obj.position.set(position.x, position.y, position.z)
        }
        if (rotation) {
            obj.rotation.set(rotation._x, rotation._y, rotation._z)
        }

        if (lock) {
            obj.name = name;
            scene.add(obj)
        } else
            createModelBox(obj, {url: image, type: 'image', name}, width, height, 0)

    }, loadManager.onDownload);
}

/**
 *
 * @param name {String}
 */
function addBox(name) {
    const geometry = new THREE.BoxGeometry(worldScale, worldScale, worldScale);
    const material = new THREE.MeshBasicMaterial({color: 0x00ff00});
    const cube = new THREE.Mesh(geometry, material);
    createModelBox(cube, {type: "box", name}, worldScale, worldScale, worldScale)
}

function addGLBModel(model, name, isUrl, lock, scale, position, rotation) {
    model = isUrl ? model : URL.createObjectURL(model)
    gltfLoader.load(model, function (gltf) {
        let obj = gltf.scene;
        obj.traverse(function (child) {
            if (child.isMesh) {
                // sceneMeshes.push(child);
                roughnessMipMapper.generateMipmaps(child.material);
            }
        });
        roughnessMipMapper.dispose();
        let boundingBox = new THREE.Box3().setFromObject(obj);
        let ratio = 0;
        for (let k of Object.keys(boundingBox.getSize())) {
            let newScale = (100 / boundingBox.getSize()[k]);
            if (!ratio || newScale < ratio)
                ratio = newScale
        }
        obj.scale.set(ratio, ratio, ratio);
        let {x, y, z} = boundingBox.getSize()
        x *= ratio;
        y *= ratio;
        z *= ratio

        if (scale) {
            obj.scale.set(scale.x * ratio, scale.y * ratio, scale.z * ratio)
            x *= scale;
            y *= scale;
            z *= scale
        }
        if (position) {
            obj.position.set(position.x, position.y, position.z)
        }
        if (rotation) {
            obj.rotation.set(rotation._x, rotation._y, rotation._z)
        }

        if (lock) {
            scene.add(obj)
        } else
            createModelBox(obj, {type: "model", model: 'glb', name, url: model}, x, y, z)
    }, loadManager.onDownload, function (error) {
        console.log("An error happened");
        console.log(error)
    });
}

function addFBXModel(model, name, isUrl, lock, scale, position, rotation) {
    model = isUrl ? model : URL.createObjectURL(model)
    fbxLoader.load(model, (object) => {
        let obj = object;
        obj.traverse(function (child) {
            if (child.isMesh) roughnessMipMapper.generateMipmaps(child.material);
        });
        roughnessMipMapper.dispose();
        let boundingBox = new THREE.Box3().setFromObject(obj);
        let ratio = 0;
        for (let k of Object.keys(boundingBox.getSize())) {
            let newScale = (100 / boundingBox.getSize()[k]);
            if (!ratio || newScale < ratio)
                ratio = newScale
        }
        obj.scale.set(ratio, ratio, ratio);
        let {x, y, z} = boundingBox.getSize()
        x *= ratio;
        y *= ratio;
        z *= ratio

        if (scale) {
            obj.scale.set(scale.x * ratio, scale.y * ratio, scale.z * ratio)
            x *= scale;
            y *= scale;
            z *= scale
        }
        if (position) {
            obj.position.set(position.x, position.y, position.z)
        }
        if (rotation) {
            obj.rotation.set(rotation._x, rotation._y, rotation._z)
        }

        if (lock) {
            scene.add(obj)
        } else
            createModelBox(obj, {type: 'model', model: 'fbx', name, url: model}, x, y, z)
    }, loadManager.onDownload, (error) => {
        console.log(error)
    })
}

function addJSONModel(model, name, isUrl, lock, scale, position, rotation) {
    model = isUrl ? model : URL.createObjectURL(model)
    jsonLoader.load(model, (object) => {
        let obj = object;
        obj.traverse(function (child) {
            if (child.isMesh) roughnessMipMapper.generateMipmaps(child.material);
        });
        roughnessMipMapper.dispose();
        let boundingBox = new THREE.Box3().setFromObject(obj);
        let ratio = 0;
        for (let k of Object.keys(boundingBox.getSize())) {
            let newScale = (100 / boundingBox.getSize()[k]);
            if (!ratio || newScale < ratio)
                ratio = newScale
        }
        obj.scale.set(ratio, ratio, ratio);
        let {x, y, z} = boundingBox.getSize()
        x *= ratio;
        y *= ratio;
        z *= ratio

        if (scale) {
            obj.scale.set(scale.x * ratio, scale.y * ratio, scale.z * ratio)
            x *= scale;
            y *= scale;
            z *= scale
        }
        if (position) {
            obj.position.set(position.x, position.y, position.z)
        }
        if (rotation) {
            obj.rotation.set(rotation._x, rotation._y, rotation._z)
        }

        if (lock) {
            scene.add(obj)
        } else
            createModelBox(obj, {type: 'model', model: 'json', name, url: model}, x, y, z)
    }, loadManager.onDownload, (error) => {
        console.log(error)
    })
}

function addUSDZModel(model, name, isUrl, lock, scale, position, rotation) {
    model = isUrl ? model : URL.createObjectURL(model)
    usdzLoader.load(model, (object) => {
        let obj = object;
        obj.traverse(function (child) {
            if (child.isMesh) roughnessMipMapper.generateMipmaps(child.material);
        });
        roughnessMipMapper.dispose();
        let boundingBox = new THREE.Box3().setFromObject(obj);
        let ratio = 0;
        for (let k of Object.keys(boundingBox.getSize())) {
            let newScale = (100 / boundingBox.getSize()[k]);
            if (!ratio || newScale < ratio)
                ratio = newScale
        }
        obj.scale.set(ratio, ratio, ratio);
        let {x, y, z} = boundingBox.getSize()
        x *= ratio;
        y *= ratio;
        z *= ratio

        if (scale) {
            obj.scale.set(scale.x * ratio, scale.y * ratio, scale.z * ratio)
            x *= scale;
            y *= scale;
            z *= scale
        }
        if (position) {
            obj.position.set(position.x, position.y, position.z)
        }
        if (rotation) {
            obj.rotation.set(rotation._x, rotation._y, rotation._z)
        }

        if (lock) {
            scene.add(obj)
        } else
            createModelBox(obj, {type: 'model', model: 'usdz', name, url: model}, x, y, z)
    }, loadManager.onDownload, (error) => {
        console.log(error)
    })
}

function addVideo(video, name, isUrl, lock, scale, position, rotation, autoplay, loop, muted, chromaKey, color) {
    video = isUrl ? video : URL.createObjectURL(video)
    if (chromaKey)
        color = color.replace("#", "0x")
    let key = new Date().getTime()
    videos[key] = {}
    videos[key].video = document.createElement("video");
    videos[key].video.src = video;
    videos[key].video.load();
    videos[key].isFirstFrameRendered = false
    videos[key].chromaKey = chromaKey

    if (autoplay)
        videos[key].video.play();

    if (muted)
        videos[key].video.muted = true;

    if (typeof videos[key].video.loop == "boolean") { // loop supported
        videos[key].video.loop = !!loop;
    } else { // loop property not supported
        videos[key].video.addEventListener("ended", function () {
            if (loop) {
                this.currentTime = 0;
                this.play();
            }
        }, false);
    }

    videos[key].video.addEventListener("loadedmetadata", function (e) {
        let width = this.videoWidth,
            height = this.videoHeight;
        this.currentTime = 0.1;
        if (width >= height) {
            height = (worldScale * height) / width
            width = worldScale;
        } else {
            width = (worldScale * width) / height
            height = worldScale
        }
        let obj = chromaKey ? makeChromaKeyVideo(this, width, height, color) : makeSampleVideo(this, width, height)
        obj.name = key;

        let ratio = 100 / worldScale
        obj.scale.set(ratio, ratio, ratio)
        width *= ratio
        height *= ratio;

        if (scale) {
            obj.scale.set(scale.x * ratio, scale.y * ratio, scale.z * ratio)
        }
        if (position) {
            obj.position.set(position.x, position.y, position.z)
        }
        if (rotation) {
            obj.rotation.set(rotation._x, rotation._y, rotation._z)
        }

        if (lock) {
            obj.name = name;
            scene.add(obj)
        } else
            createModelBox(obj, {
                type: "video",
                name,
                url: video,
                video: {autoplay, loop, muted, chromaKey, color}
            }, width, height, 0)
    }, false);

    function makeSampleVideo(video, width, height) {
        let video_texture = new THREE.VideoTexture(video);
        video_texture.needsUpdate = true;
        video_texture.minFilter = video_texture.magFilter = THREE.LinearFilter;
        // video_texture.minFilter = video_texture.magFilter = THREE.NearestFilter;
        video_texture.format = THREE.RGBFormat;
        video_texture.encoding = THREE.sRGBEncoding; // XXX s.yaglov to prevent extra light gamma

        const movie_screen_material = new THREE.MeshBasicMaterial({
            map: video_texture,
            side: THREE.DoubleSide
        });

        /* the geometry on which the movie will be displayed;
            // 		movie image will be scaled to fit these dimensions. */
        const movie_screen_geometry = new THREE.PlaneGeometry(width, height, 4, 4);
        return new THREE.Mesh(movie_screen_geometry, movie_screen_material);
    }

    function makeChromaKeyVideo(video, width, height, color) {
        const key_color_integer = parseInt(color ?? "0x00FF00")
        const key_color_xyz = {
            x: ((key_color_integer >> 16) & 0xFF) / 255,
            y: ((key_color_integer >> 8) & 0xFF) / 255,
            z: (key_color_integer & 0xFF) / 255
        };
        let video_texture = new THREE.VideoTexture(video);

        video_texture.minFilter = video_texture.magFilter = THREE.LinearFilter;
        videos[key].videoTexture = video_texture;
        let movie_screen_material = new THREE.ShaderMaterial({
            uniforms: {
                external_texture: {type: "t", value: null},
                color: {type: "vec3", value: key_color_xyz}
            },
            vertexShader: `
                varying vec2 vUv;

                void main(void)
                {
                    vUv = uv;
                    vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                uniform sampler2D external_texture;
                uniform vec3 color;
                varying vec2 vUv;

                void main(void)
                {
                    vec3 tColor = texture2D(external_texture, vUv).rgb;
					float a = (length(tColor - color) - 0.5) * 7.0;
                    gl_FragColor = vec4(tColor, a);
                }
            `
        });

        movie_screen_material.uniforms.external_texture.value = video_texture;
        movie_screen_material.side = THREE.DoubleSide;
        movie_screen_material.transparent = true;

        let movie_screen_geometry = new THREE.PlaneGeometry(width, height, 4, 4);
        return new THREE.Mesh(movie_screen_geometry, movie_screen_material);
    }
}

function loadData(objects) {
    // console.log(JSON.stringify(objects))
    if (objects)
        for (let obj of objects) {
            switch (obj.type) {
                case 'image':
                    addImage(obj.url, obj.name, true, true, obj.scale, obj.position, obj.rotation)
                    break;
                case 'video':
                    addVideo(obj.url, obj.name, true, true, obj.scale, obj.position, obj.rotation, obj.video.autoplay, obj.video.loop, obj.video.muted, obj.video.chromaKey, obj.video.color)
                    break;
                case 'model':
                    switch (obj.model) {
                        case "glb":
                            addGLBModel(obj.url, obj.name, true, true, obj.scale, obj.position, obj.rotation)
                            break;
                        case "fbx":
                            addFBXModel(obj.url, obj.name, true, true, obj.scale, obj.position, obj.rotation)
                            break;
                    }
                    break;
            }
        }

}

function deleteObjectFromScene(uuid) {
    if (transformControls.object && transformControls.object.uuid === uuid) {
        detachObjectFromTransformControls()
    }
    let object = scene.children.find(item => item.uuid === uuid)
    if (object.customData && object.customData.type === "video") {
        let key = object.children[0].name
        if (videos[key]) {
            videos[key].video.pause();
            delete videos[key]
        }
    }
    scene.remove(object)
    myEventEmitter.emit("objectDeleted", uuid);
}

function saveData() {
    let objects = scene.children.filter(item => item.customData).map(item => {
        let {uuid, visible, customData, clonedUuid, scale, rotation, position} = item
        return {uuid, visible, ...customData, clonedUuid, scale, rotation, position}
    });
    objects.map(o => deleteObjectFromScene(o.uuid));

    for (let o of scene.children.filter(item => item.showType === 'managePanel')) {
        deleteObjectFromScene(o.uuid)
    }

    document.getElementById('manage-transform').remove()
    myEventEmitter.emit("publishScene", objects);

    setTimeout(() => {
        onWindowResize();
        setTimeout(() => loadData(objects), 1000)
    }, 100)
}

myEventEmitter.on("modelTransformFromPanel", (data) => {
    let object = transformControls.object
    if (data.direction)
        object[data.type][data.direction] = data.value
    else
        object[data.type].set(data.value, data.value, data.value)
})

myEventEmitter.on("addingObject", (data) => {
    if (data.type === "image")
        addImage(data.file, data.file.name)
    if (data.type === "box")
        addBox(new Date().getTime())
    else if (data.type === "model" && data.file && (data.file.type === "model/gltf+json" || (/\.glb$/i.test(data.file.name) && !data.file.type)))
        addGLBModel(data.file, data.file.name)
    else if (data.type === "model" && data.file && (data.file.type === "model/fbx" || (/\.fbx$/i.test(data.file.name) && !data.file.type)))
        addFBXModel(data.file, data.file.name)
    else if (data.type === "model" && data.file && data.file.type === "application/json")
        addJSONModel(data.file, data.file.name)
    else if (data.type === "model" && data.file && data.file.type === "model/vnd.usdz+zip")
        addUSDZModel(data.file, data.file.name)
    else if (data.type === "video")
        addVideo(data.file, data.file.name, false, false, null, null, null, data.autoplay, data.loop, data.muted, data.chromakey, data.color)
})

myEventEmitter.on("toggleObjectVisibility", (uuid) => {
    let object = scene.children.find(item => item.uuid === uuid)
    object.visible = !object.visible
    myEventEmitter.emit("objectVisibilityToggled", {uuid, visible: object.visible});
})

myEventEmitter.on("deleteObjectFromScene", (uuid) => deleteObjectFromScene(uuid))

myEventEmitter.on("attachObject", (uuid) => {
    let object = scene.children.find(item => item.uuid === uuid)
    clickOnObject(object)
})

myEventEmitter.on("cloneObject", (uuid) => {
    let object = scene.children.find(item => item.uuid === uuid)
    if (object) {
        let newObject = object.clone()
        newObject.material = object.material.clone();
        newObject.geometry = object.geometry.clone();
        newObject.position.x = object.position.x + 10
        newObject.clonedUuid = uuid
        addObject(newObject, object.customData)
    }
})

//=========================
init();
