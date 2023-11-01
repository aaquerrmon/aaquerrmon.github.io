/*
    Trabajo final: Circuito de F1
*/


// Módulos necesarios

import * as THREE from "../lib/three.module.js"
import {GLTFLoader} from "../lib/GLTFLoader.module.js"
import {OrbitControls} from "../lib/OrbitControls.module.js"
import {TWEEN} from "../lib/tween.module.min.js"
import Stats from "../lib/stats.module.js"
import {GUI} from "../lib/lil-gui.module.min.js"

// Variables de consenso
let renderer, scene, cameraTerceraPersona, cameraPrimeraPersona, cameraRetrovisor;

// Variables globales para rastrear el movimiento
let cochePosicion = new THREE.Vector3(150, 0.5, 0);  

// Luces
let focal, direccional, ambiental;

// Cronómetro
let cronometroElement = document.getElementById("cronometro");
let startTime;
let elapsedTime = 0;
let running = false;


// Interfaz
let stats;
let effectController;

// Controlador de cámara
let cameraControls, activeCamera, terceraPersonaActiva;


// Coche
let coche;
const L = 74;

// Acciones
init();
loadScene();
setupGUI();
render();


function init()
{
    // Motor de render
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(new THREE.Color(1, 1, 1));
    document.getElementById("container").appendChild(renderer.domElement);
    renderer.autoClear = false;

    // Escena
    scene = new THREE.Scene();

    // Camara
    cameraTerceraPersona = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    cameraPrimeraPersona = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    cameraRetrovisor = new THREE.OrthographicCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

    cameraControls = new OrbitControls(cameraTerceraPersona, renderer.domElement);
    cameraControls.target.set(cochePosicion.x, cochePosicion.y, cochePosicion.z);
    const ar = window.innerWidth/window.innerHeight;
    setCameras(ar);

    activeCamera = cameraTerceraPersona;
    terceraPersonaActiva = true;

    // Luces
    ambiental = new THREE.AmbientLight(0xFFFFFF, 1); // Color de la luz ambiental
    scene.add(ambiental);
    
    direccional = new THREE.DirectionalLight(0xFFFFFF, 0.7);
    direccional.position.set(450, 250, 200);
    direccional.castShadow = true;
    direccional.shadow.camera.left = -20;
    direccional.shadow.camera.right = 20;
    direccional.shadow.camera.top = 50;
    direccional.shadow.camera.bottom = -10;
    scene.add(direccional);
    //scene.add(new THREE.CameraHelper(direccional.shadow.camera));

    focal = new THREE.SpotLight(0xFFFFFF, 0.4);
    focal.position.set(cochePosicion.x + 200, cochePosicion.y + 100, cochePosicion.z);
    focal.target.position.set(cochePosicion.x, cochePosicion.y, cochePosicion.z);
    focal.angle = Math.PI / 3;
    focal.penumbra = 0.3;
    focal.castShadow = true;
    scene.add(focal);
    scene.add(focal.target);
    scene.add(new THREE.CameraHelper(focal.shadow.camera));
    

    // Eventos
    window.addEventListener("resize", updateAspectRatio);
    document.addEventListener('keydown', handleKeyDown);

}

function handleKeyDown(event) {
    let newX = cochePosicion.x;
    let newZ = cochePosicion.z;
    const movementSpeed = 3;
    const rotationSpeed = Math.PI / 32;

    switch (event.key) {
        case 'ArrowUp':
            // Mover hacia adelante
            newZ += Math.cos(coche.rotation.y) * movementSpeed;
            newX += Math.sin(coche.rotation.y) * movementSpeed;
            break;
        case 'ArrowDown':
            // Mover hacia atrás
            newZ -= Math.cos(coche.rotation.y) * movementSpeed;
            newX -= Math.sin(coche.rotation.y) * movementSpeed;
            break;
        case 'ArrowLeft':
            // Girar a la izquierda
            coche.rotation.y += rotationSpeed;
            break;
        case 'ArrowRight':
            // Girar a la derecha
            coche.rotation.y -= rotationSpeed;
            break;
    }


    // Limitar el movimiento dentro del área entre los dos rectángulos
    if ((newX > 125 && newX < 175 && newZ > -220 && newZ < 220) ||
        (newX < -125 && newX > -175 && newZ > -220 && newZ < 220) ||
        (newX > -175 && newX < 175 && newZ > 150 && newZ < 220) ||
        (newX > -175 && newX < 175 && newZ < -150 && newZ > -220))
    {
        cochePosicion.x = newX;
        console.log(newX)
        cochePosicion.z = newZ;
        console.log(newZ)

        coche = scene.getObjectByName('coche');
        coche.position.set(cochePosicion.x, cochePosicion.y, cochePosicion.z);
        cameraTerceraPersona.position.set(cochePosicion.x - 150 * Math.sin(coche.rotation.y), cochePosicion.y + 150, cochePosicion.z - 150 * Math.cos(coche.rotation.y));
        cameraTerceraPersona.lookAt(100, 0, 100);
        cameraPrimeraPersona.position.set(cochePosicion.x - 15 * Math.sin(coche.rotation.y), cochePosicion.y + 13, cochePosicion.z - 15 * Math.cos(coche.rotation.y));
        cameraPrimeraPersona.lookAt(100, 100, 100);
        cameraPrimeraPersona.rotateY(-Math.PI);
        cameraRetrovisor.position.set(cochePosicion.x + 5 * Math.sin(coche.rotation.y) , cochePosicion.y + 20  , cochePosicion.z + 5 * Math.cos(coche.rotation.y));
        cameraRetrovisor.lookAt(cochePosicion.x, cochePosicion.y + 15, cochePosicion.z - 15);
        cameraControls.target.set(cochePosicion.x, cochePosicion.y, cochePosicion.z);
        focal.target.updateMatrixWorld();
    }
}

function startCronometro() {
    startTime = Date.now() - elapsedTime;
    running = true;
    updateCronometro();
}

function stopCronometro() {
    if (running) {
        elapsedTime = Date.now() - startTime;
        running = false;
    }
}

function updateCronometro() {
    let currentTime = running ? Date.now() - startTime : elapsedTime;
    let minutes = Math.floor(currentTime / 60000);
    let seconds = Math.floor((currentTime % 60000) / 1000);
    let milliseconds = (currentTime % 1000).toString().slice(0, 2);

    let timeString = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${milliseconds}`;
    cronometroElement.textContent = timeString;
}


function setCameras(ar)
{
    cameraTerceraPersona = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    cameraTerceraPersona.position.set(0, cochePosicion.y + 150, cochePosicion.z - 150);
    cameraTerceraPersona.lookAt(cochePosicion.x, cochePosicion.y, cochePosicion.z);

    cameraPrimeraPersona = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    cameraPrimeraPersona.position.set(0, cochePosicion.y + 150, cochePosicion.z - 150);
    cameraPrimeraPersona.lookAt(cochePosicion.x, cochePosicion.y, cochePosicion.z + 20);
    
    cameraRetrovisor = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    cameraRetrovisor.position.set(0, 0, 10);
    cameraRetrovisor.lookAt(0, 0, 0);
    cameraRetrovisor.rotation.z = -Math.PI;
}

// Función para cambiar entre modos de cámara
function toggleCameraMode() {
    if (effectController.TerceraPersona) {
        activeCamera = cameraTerceraPersona;
        terceraPersonaActiva = true;
    } else {
        activeCamera = cameraPrimeraPersona;
        terceraPersonaActiva = false;
    }
}

function loadScene()
{

    // Cesped
    const texCesped = new THREE.TextureLoader().load("./images/cesped.jpg");
    const materialCesped = new THREE.MeshBasicMaterial({color : 'green', wireframe : false, map : texCesped});
    const cesped = new THREE.Mesh(new THREE.PlaneGeometry(1000, 1000, 1000, 1000), materialCesped);
    cesped.position.set(0, -0.5, 0);
    cesped.rotation.x = -Math.PI/2;

    // Circuito
    const circuito = new THREE.Object3D();
    const texCircuito = new THREE.TextureLoader().load("./images/circuito.jpeg");
    const materialCircuito = new THREE.MeshBasicMaterial({color : 'gray', wireframe : false, map : texCircuito});
    const carretera1 = new THREE.Mesh(new THREE.PlaneGeometry(50, 400, 1000, 1000), materialCircuito);
    const carretera2 = new THREE.Mesh(new THREE.PlaneGeometry(50, 400, 1000, 1000), materialCircuito);
    const carretera3 = new THREE.Mesh(new THREE.PlaneGeometry(50, 350, 1000, 1000), materialCircuito);
    const carretera4 = new THREE.Mesh(new THREE.PlaneGeometry(50, 350, 1000, 1000), materialCircuito);

    carretera1.position.set(150, 0, 0);
    carretera2.position.set(-150, 0, 0);
    carretera3.position.set(0, 0, 200);
    carretera4.position.set(0, 0, -200);

    carretera1.rotation.x = -Math.PI/2;
    carretera2.rotation.x = -Math.PI/2;
    carretera3.rotation.x = -Math.PI/2;
    carretera3.rotation.z = -Math.PI/2;
    carretera4.rotation.x = -Math.PI/2;
    carretera4.rotation.z = -Math.PI/2;

    circuito.add(carretera1);
    circuito.add(carretera2);
    circuito.add(carretera3);
    circuito.add(carretera4);

    ///Neumaticos
    // Número de pilas de neumáticos que deseas crear
    const numPilas = 14;

    // Espaciado entre las pilas de neumáticos
    const distanciaEntrePilas = 20;

    for (let i = 0; i < numPilas; i++) {
        const gltfloader = new GLTFLoader();
        gltfloader.load('models/pile_of_tires/scene.gltf', function (gltf) {
            const pilaNeumaticos = gltf.scene;
            pilaNeumaticos.position.set(120, 0.5, 130 - i * distanciaEntrePilas);
            pilaNeumaticos.rotation.y = Math.PI / 2;
            pilaNeumaticos.scale.set(0.1, 0.1, 0.1);

            // Añade la pila de neumáticos a la escena (circuito)
            circuito.add(pilaNeumaticos);

            // Configura las sombras para la pila de neumáticos
            pilaNeumaticos.traverse(ob => {
                if (ob.isObject3D) {
                    ob.castShadow = true;
                    ob.receiveShadow = true;
                }
            });
        });

        gltfloader.load('models/pile_of_tires/scene.gltf', function (gltf) {
            const pilaNeumaticos = gltf.scene;
            pilaNeumaticos.position.set(-120, 0.5, 130 - i * distanciaEntrePilas);
            pilaNeumaticos.rotation.y = Math.PI / 2;
            pilaNeumaticos.scale.set(0.1, 0.1, 0.1);

            // Añade la pila de neumáticos a la escena (circuito)
            circuito.add(pilaNeumaticos);

            // Configura las sombras para la pila de neumáticos
            pilaNeumaticos.traverse(ob => {
                if (ob.isObject3D) {
                    ob.castShadow = true;
                    ob.receiveShadow = true;
                }
            });
        });
    }

    //Gradas
    const gltfloader = new GLTFLoader();
    gltfloader.load('models/grada_fija_5x_2.30x_2.14/scene.gltf',
                function(gltf){
                    gltf.scene.position.x = 330;
                    gltf.scene.position.y = 0;
                    gltf.scene.rotation.y = -Math.PI/2;
                    gltf.scene.name = 'neumaticos';
                    gltf.scene.scale.set(1, 1, 1);
                    circuito.add(gltf.scene);
                    gltf.scene.traverse(ob=>{
                        if (ob.isObject3D) ob.castShadow = ob.receiveShadow = true;
                    })
                }
    );

    //Linea de salida
    gltfloader.load('models/starting_line/scene.gltf',
                function(gltf){
                    gltf.scene.position.x = 150;
                    gltf.scene.position.y = 5;
                    gltf.scene.name = 'linea_salida';
                    gltf.scene.scale.set(0.13, 0.18, 0.12);
                    circuito.add(gltf.scene);
                    gltf.scene.traverse(ob=>{
                        if (ob.isObject3D) ob.castShadow = ob.receiveShadow = true;
                    })
                }
    );
    //Coche
    coche = new THREE.Object3D();
    gltfloader.load('models/red_bull_racing/scene.gltf',
    function(gltf){
        gltf.scene.position.x = 150;
        gltf.scene.position.y = 0.5;
        gltf.scene.position.z = 0;
        gltf.scene.name = 'coche';
        gltf.scene.scale.set(0.13, 0.18, 0.12);
        coche.add(gltf.scene);
        gltf.scene.traverse(ob=>{
            if (ob.isObject3D) ob.castShadow = ob.receiveShadow = true;
        })
    }
);
    coche.add(cameraTerceraPersona);
    coche.add(cameraPrimeraPersona);
    coche.add(cameraRetrovisor);

    scene.add(coche);
    scene.add(cesped);
    scene.add(circuito);
    scene.add(new THREE.AxisHelper(100));
}

function setupGUI()
{
    // Definición del objeto controlador
    effectController = {
        TerceraPersona: true
    }

    // Crear la GUI
    const gui = new GUI();

    // Construir el menú de widgets
    const h = gui.addFolder('Control Coche');
    h.add(effectController, "TerceraPersona").name("TerceraPersona").onChange(toggleCameraMode);

}


function updateAspectRatio()
{
    renderer.setSize(window.innerWidth, window.innerHeight);
    const ar = window.innerWidth / window.innerHeight;

    cameraTerceraPersona.aspect = ar;
    cameraTerceraPersona.updateProjectionMatrix();
    cameraPrimeraPersona.aspect = ar;
    cameraPrimeraPersona.updateProjectionMatrix();

    if(ar > 1)
    {
        cameraRetrovisor.left = -L;
        cameraRetrovisor.right = L;
        cameraRetrovisor.top = L;
        cameraRetrovisor.bottom = -L;
    }
    else    
    {
        cameraRetrovisor.left = -L;
        cameraRetrovisor.right = L;
        cameraRetrovisor.top = L;
        cameraRetrovisor.bottom = -L;
    }

    cameraRetrovisor.updateProjectionMatrix();
}



function render()
{
    requestAnimationFrame(render);
    renderer.clear();
    console.log(focal.position);

    cameraControls.object = activeCamera;
    cameraControls.update();

    // Renderiza la cámara normal
    renderer.setViewport(0,0, window.innerWidth, window.innerHeight);
    renderer.render(scene, activeCamera);
    renderer.debug.checkShaderErrors = true;


    // Renderiza el retrovisor
    if (terceraPersonaActiva == false){
        const ar = window.innerWidth/window.innerHeight;
        if (ar > 1){
            renderer.setViewport(0, window.innerHeight-window.innerHeight/4, window.innerHeight/4, window.innerHeight/4);
        }
        else{
            renderer.setViewport(0, window.innerHeight-window.innerWidth/4, window.innerWidth/4, window.innerWidth/4);
        }
        renderer.render(scene, cameraRetrovisor);
    }
    updateCronometro();

    if (coche.position.x != cochePosicion.x || coche.position.y != cochePosicion.y || coche.position.z != cochePosicion.z){
        startCronometro();
    }


    if ((coche.position.x < 175) && (coche.position.x > 125) && ((coche.position.z < 0) && (coche.position.z > -6))){
        stopCronometro();
    }

}