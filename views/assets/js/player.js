import * as THREE from "./libs/three.module.js";
import {OrbitControls} from "./libs/OrbitControls.js";
import {GLTFLoader} from "./libs/GLTFLoader.js";
import {RoughnessMipmapper} from "./libs/RoughnessMipmapper.js";
import TWEEN from "./libs/tween.esm.js";


let orbitControls;
let camera, cameraPersp, scene, renderer;
let mouse, raycaster, pmremGenerator, roughnessMipMapper;
let worldScale = 20;
let loadManager = new LoadManager()
let manager = new THREE.LoadingManager();
manager.onStart = loadManager.onStart;
manager.onLoad = loadManager.onLoad;
manager.onProgress = loadManager.onProgress;
manager.onError = loadManager.onError;

let gltfLoader = new GLTFLoader(manager);

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

    // let gridHelper = new THREE.GridHelper(10 * worldScale, 100, 0x000000, 0x444444)
    // gridHelper.position.y = 0;
    // gridHelper.showType = 'managePanel'
    // scene.add(gridHelper);


    let ambientLight = new THREE.AmbientLight(0xffffff, 1);
    ambientLight.position.set(0, 0, 0)
    let directionalLight = new THREE.DirectionalLight(0xFFFFFF, 1.0);
    directionalLight.position.set(3, 3, 0)
    const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x444444);
    scene.add(hemisphereLight);
    scene.add(ambientLight);
    scene.add(directionalLight);

    myEventEmitter.emit("playerLoaded", true);

    animated();

    window.addEventListener("resize", onWindowResize, false);
}

function onWindowResize() {
    camera.aspect = innerWidth() / innerHeight();
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth(), innerHeight());
}

function render() {
    renderer.render(scene, camera);
    orbitControls.update();
}

function animated() {
    requestAnimationFrame(animated);
    TWEEN.update();
    render()
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

        console.log(ratio)

        if (scale)
            obj.scale.set(scale.x * ratio, scale.y * ratio, scale.z * ratio)

        if (position)
            obj.position.set(position.x, position.y, position.z)

        if (rotation)
            obj.rotation.set(rotation._x, rotation._y, rotation._z)

        scene.add(obj)
    }, loadManager.onDownload, function (error) {
        console.log("An error happened");
        console.log(error)
    });
}


//=========================

myEventEmitter.on("dataLoaded", (obj) => {
    switch (obj.type) {
        case 'glb':
            addGLBModel(obj.url, obj.name, true, true, obj.scale, obj.position, obj.rotation)
            break;

    }
})
//=========================
init()
//=========================