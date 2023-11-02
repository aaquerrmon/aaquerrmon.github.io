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
let focal, focal2, ambiental;

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
let coche, velocidad = 0;
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
    renderer.setClearColor(new THREE.Color(0xAABBCC));
    document.getElementById("container").appendChild(renderer.domElement);
    renderer.autoClear = false;
    renderer.antialias = true;
    renderer.shadowMap.enabled = true;

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
    
    focal = new THREE.SpotLight(0xFFFFFF, 0.7);
    focal.position.set(370, 90, -110);
    focal.target.position.set(cochePosicion.x, cochePosicion.y, cochePosicion.z);
    focal.angle = Math.PI / 3;
    focal.penumbra = 0.3;
    focal.castShadow = true;
    scene.add(focal);
    scene.add(focal.target);
    scene.add(new THREE.CameraHelper(focal.shadow.camera));

    focal2 = new THREE.SpotLight(0xFFFFFF, 0.7);
    focal2.position.set(370, 90, 110);
    focal2.target.position.set(cochePosicion.x, cochePosicion.y, cochePosicion.z);
    focal2.angle = Math.PI / 3;
    focal2.penumbra = 0.3;
    focal2.castShadow = true;
    scene.add(focal2);
    scene.add(focal2.target);
    scene.add(new THREE.CameraHelper(focal2.shadow.camera));
    

    // Eventos
    window.addEventListener("resize", updateAspectRatio);
    document.addEventListener('keydown', handleKeyDown);

}

function handleKeyDown(event) {
    const movementSpeed = 0.001, velocidad_max = 0.01, velocidad_min = -0.01;
    const rotationSpeed = Math.PI / 32;

    switch (event.key) {
        case 'ArrowUp':
            // Mover hacia adelante
            if (velocidad <= velocidad_max){
                velocidad += movementSpeed;
            }
            break;
        case 'ArrowDown':
            // Mover hacia atrás
            if (velocidad >= velocidad_min){
                velocidad -= movementSpeed;
            }
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
    const texCesped = new THREE.TextureLoader().load("./images/cesped.jpg", function ( texture ) {
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        texture.offset.set(0, 0);
        texture.repeat.set(5, 5);
    });
    const materialCesped = new THREE.MeshBasicMaterial({color : 'green', wireframe : false, map : texCesped});
    const cesped = new THREE.Mesh(new THREE.PlaneGeometry(1000, 1000, 1000, 1000), materialCesped);
    cesped.receiveShadow = true;
    cesped.position.set(0, -0.5, 0);
    cesped.rotation.x = -Math.PI/2;

    // Circuito
    const circuito = new THREE.Object3D();
    const texCircuito = new THREE.TextureLoader().load("./images/circuito.jpeg");
    const materialCircuito = new THREE.MeshBasicMaterial({color : 'gray', wireframe : false, map : texCircuito});
    const carretera1 = new THREE.Mesh(new THREE.PlaneGeometry(50, 400, 1000, 1000), materialCircuito);
    carretera1.receiveShadow = true;
    const carretera2 = new THREE.Mesh(new THREE.PlaneGeometry(50, 400, 1000, 1000), materialCircuito);
    carretera2.receiveShadow = true;
    const carretera3 = new THREE.Mesh(new THREE.PlaneGeometry(50, 350, 1000, 1000), materialCircuito);
    carretera3.receiveShadow = true;
    const carretera4 = new THREE.Mesh(new THREE.PlaneGeometry(50, 350, 1000, 1000), materialCircuito);
    carretera4.receiveShadow = true;

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
                    gltf.scene.name = 'gradas';
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

    //Focos de la pista
    gltfloader.load('models/stadium_light/scene.gltf',
                function(gltf){
                    gltf.scene.position.x = 370;
                    gltf.scene.position.y = -10;
                    gltf.scene.position.z = -110;
                    gltf.scene.name = 'foco1';
                    gltf.scene.rotation.y = -Math.PI;
                    gltf.scene.scale.set(0.03, 0.04, 0.03);
                    circuito.add(gltf.scene);
                    gltf.scene.traverse(ob=>{
                        if (ob.isObject3D) ob.castShadow = ob.receiveShadow = true;
                    })
                }
    );
    gltfloader.load('models/stadium_light/scene.gltf',
    function(gltf){
        gltf.scene.position.x = 370;
        gltf.scene.position.y = -10;
        gltf.scene.position.z = 110;
        gltf.scene.name = 'foco2';
        gltf.scene.rotation.y = -Math.PI;
        gltf.scene.scale.set(0.03, 0.04, 0.03);
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

    // Habitación cúbica
    const paredes = [];
    paredes.push(new THREE.MeshBasicMaterial({side : THREE.BackSide, map : new THREE.TextureLoader().load("./images/Footballfield/posx.jpg")}));
    paredes.push(new THREE.MeshBasicMaterial({side : THREE.BackSide, map : new THREE.TextureLoader().load("./images/Footballfield/negx.jpg")}));
    paredes.push(new THREE.MeshBasicMaterial({side : THREE.BackSide, map : new THREE.TextureLoader().load("./images/Footballfield/posy.jpg")}));
    paredes.push(new THREE.MeshBasicMaterial({side : THREE.BackSide, map : new THREE.TextureLoader().load("./images/Footballfield/negy.jpg")}));
    paredes.push(new THREE.MeshBasicMaterial({side : THREE.BackSide, map : new THREE.TextureLoader().load("./images/Footballfield/posz.jpg")}));
    paredes.push(new THREE.MeshBasicMaterial({side : THREE.BackSide, map : new THREE.TextureLoader().load("./images/Footballfield/negz.jpg")}));

    const geoHabitacion = new THREE.BoxGeometry(1000, 1000, 1000);
    const habitacion = new THREE.Mesh(geoHabitacion, paredes);
    scene.add(habitacion);

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

function updateCar(){
    requestAnimationFrame(updateCar);
    let newX = cochePosicion.x;
    let newZ = cochePosicion.z;
    if (velocidad != 0){
        if (velocidad > 0){
            newZ += Math.cos(coche.rotation.y) * velocidad;
            newX += Math.sin(coche.rotation.y) * velocidad;
        }
        else{
            newZ -= Math.cos(coche.rotation.y) * velocidad;
            newX -= Math.sin(coche.rotation.y) * velocidad;
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
        }
    }
}

function render()
{
    requestAnimationFrame(render);
    renderer.clear();
    updateCar();

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