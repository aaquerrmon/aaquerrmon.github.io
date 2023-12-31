/*
    Práctica #4
*/


// Módulos necesarios

import * as THREE from "../lib/three.module.js"
import {GLTFLoader} from "../lib/GLTFLoader.module.js"
import {OrbitControls} from "../lib/OrbitControls.module.js"
import {TWEEN} from "../lib/tween.module.min.js"
import Stats from "../lib/stats.module.js"
import {GUI} from "../lib/lil-gui.module.min.js"

// Variables de consenso
let renderer, scene, camera;

// Otras globales
let robot, base, brazo, antebrazo, mano, pinzaDerecha, pinzaIzquierda;
let pinzaX, pinzaY, pinzaDerechaZ, pinzaIzquierdaZ;
let materialSuelo, materialRobot;
materialRobot = new THREE.MeshNormalMaterial({wireframe : false, flatShading: true, side: THREE.DoubleSide});
materialSuelo = new THREE.MeshBasicMaterial({color : 'blue', wireframe : false});

// Variables globales para rastrear el movimiento
let robotPosition = new THREE.Vector3(0, 0, 0);  // Inicialmente, el robot se encuentra en el centro del plano
const movementSpeed = 10;  // Velocidad de movimiento del robot


// Interfaz
let effectController;

// Controlador de cámara
let cameraControls;


// Cámara cenital
let cameraCenital;
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
    camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
    camera.position.set(60, 330, 150);
    cameraControls = new OrbitControls(camera, renderer.domElement);
    cameraControls.target.set(0, 1, 0);
    camera.lookAt(0,100,0);

    // Cámara cenital
    const ar = window.innerWidth/window.innerHeight;
    setOrtographicCameras(ar);

    // Eventos
    window.addEventListener("resize", updateAspectRatio);
    document.addEventListener('keydown', handleKeyDown);
}

function handleKeyDown(event) {
    switch (event.key) {
        case 'ArrowUp':
            // Mover hacia adelante
            robotPosition.z -= movementSpeed;
            break;
        case 'ArrowDown':
            // Mover hacia atrás
            robotPosition.z += movementSpeed;
            break;
        case 'ArrowLeft':
            // Mover a la izquierda
            robotPosition.x -= movementSpeed;
            break;
        case 'ArrowRight':
            // Mover a la derecha
            robotPosition.x += movementSpeed;
            break;
    }

    // Actualiza la posición del robot
    robot.position.set(robotPosition.x, robotPosition.y, robotPosition.z);
}


function setOrtographicCameras(ar)
{
    let camaraOrtografica;

    if (ar > 1)
    {
        camaraOrtografica = new THREE.OrthographicCamera(-L, L, L, -L, -220, 350);
    }
    else
    {
        camaraOrtografica = new THREE.OrthographicCamera(-L, L, L, -L, -220, 350);
    }

    cameraCenital = camaraOrtografica.clone();
    cameraCenital.position.set(0, L, 0);
    cameraCenital.lookAt(0, 0, 0);
    cameraCenital.rotation.z = -Math.PI/2;
    cameraCenital.up = new THREE.Vector3(0,0,-1);
}

function loadScene()
{
    // Robot
    robot = new THREE.Object3D();
    robot.name = "ManoRobot";
    robot.position.set(0, 0, 0);
    robot.add(cameraCenital);

    // Base
    base = new THREE.Object3D();
    const geoBaseRobot = new THREE.CylinderGeometry(50, 50, 15, 50);
    const baseRobot = new THREE.Mesh(geoBaseRobot, materialRobot);
    base.position.set(0, 7.5, 0);

    base.add(baseRobot)
    robot.add(base);
    
    // Brazo
    brazo = new THREE.Object3D();
    brazo.position.set(0, 7.5, 0);
    const geoEje = new THREE.CylinderGeometry(20, 20, 18, 20);
    const geoEsparrago = new THREE.BoxGeometry(18, 120, 12);
    const geoRotula = new THREE.SphereGeometry(20, 10);

    const eje = new THREE.Mesh(geoEje, materialRobot);
    const esparrago = new THREE.Mesh(geoEsparrago, materialRobot);
    const rotula = new THREE.Mesh(geoRotula, materialRobot);

    eje.position.set(0, 12.5, 0);
    eje.rotation.x = -Math.PI/2;
    esparrago.position.set(0, 12.5 + 60, 0);
    rotula.position.set(0, 12.5 + 120, 0);

    brazo.add(eje);
    brazo.add(esparrago);
    brazo.add(rotula);
    base.add(brazo);

    // Antebrazo
    antebrazo = new THREE.Object3D();
    antebrazo.position.set(0, 132.5, 0);
    const geoDisco = new THREE.CylinderGeometry(22, 22, 6, 50);
    const geoNervio1 = new THREE.BoxGeometry(4, 80, 4);
    const geoNervio2 = new THREE.BoxGeometry(4, 80, 4);
    const geoNervio3 = new THREE.BoxGeometry(4, 80, 4);
    const geoNervio4 = new THREE.BoxGeometry(4, 80, 4);
    const geoMuneca = new THREE.CylinderGeometry(15, 15, 40, 50);

    const disco = new THREE.Mesh(geoDisco, materialRobot);
    const nervio1 = new THREE.Mesh(geoNervio1, materialRobot);
    const nervio2 = new THREE.Mesh(geoNervio2, materialRobot);
    const nervio3 = new THREE.Mesh(geoNervio3, materialRobot);
    const nervio4 = new THREE.Mesh(geoNervio4, materialRobot);
    const muneca = new THREE.Mesh(geoMuneca, materialRobot);

    disco.position.set(0, 0, 0);
    nervio1.position.set(10, 40, 10);
    nervio2.position.set(-10, 40, 10);
    nervio3.position.set(10, 40, -10);
    nervio4.position.set(-10, 40, -10);
    muneca.position.set(0, 80, 0);
    muneca.rotation.x = -Math.PI/2;


    antebrazo.add(nervio1);
    antebrazo.add(nervio2);
    antebrazo.add(nervio3);
    antebrazo.add(nervio4);
    antebrazo.add(disco);
    antebrazo.add(muneca);
    brazo.add(antebrazo);

    // Mano
    mano = new THREE.Object3D();
    mano.position.set(0, 80, 0);
    const geoPinza = new THREE.BufferGeometry();
    const Vertices = new Float32Array([
        // Parte cubo
        -9.5, -10, -2,
        -9.5, -10, 2,
        -9.5, 10, -2,
        -9.5, 10, 2,
        9.5, -10, -2,
        9.5, -10, 2,
        9.5, 10, -2,
        9.5, 10, 2,
        // Parte irregular
        28.5, -7, 0,
        28.5, -7, 2,
        28.5, 7, 0,
        28.5, 7, 2
    ]
    )
    const indices = [
        // Dibujar cubo
        1, 0, 3,  3, 0, 2,  0, 4, 6,  6, 0, 2,
        0, 4, 5,  0, 1, 5,  1, 5, 7,  7, 1, 3,
        3, 2, 7,  7, 2, 6,  6, 7, 4,  4, 7, 5,
        // Dibujar parte irregular
        5, 9, 11,  7, 5, 11,  6, 10, 11,  7, 11, 6, 
        6, 10, 4,  4, 10, 8,  9, 8, 10,  11, 9, 10,
        5, 9, 4,  4, 8, 9
    ]
    
    geoPinza.setIndex(indices);
    geoPinza.setAttribute("position", new THREE.BufferAttribute(Vertices, 3));

    pinzaDerecha = new THREE.Mesh(geoPinza, materialRobot);
    pinzaIzquierda = new THREE.Mesh(geoPinza, materialRobot);

    pinzaIzquierda.position.set(0, 0, -10);
    pinzaDerecha.position.set(0, 0, 10);
    pinzaDerecha.rotation.x = Math.PI;

    pinzaX = pinzaIzquierda.position.x;
    pinzaY = pinzaIzquierda.position.y;
    pinzaIzquierdaZ = pinzaIzquierda.position.z;
    pinzaDerechaZ = pinzaDerecha.position.z;

    mano.add(pinzaDerecha);
    mano.add(pinzaIzquierda);
    antebrazo.add(mano);

    scene.add(robot);

    // Suelo
    const suelo = new THREE.Mesh(new THREE.PlaneGeometry(1000, 1000, 1000, 1000), materialSuelo);

    suelo.rotation.x = -Math.PI/2;

    scene.add(suelo);
    scene.add(new THREE.AxisHelper(2));
}

function setupGUI()
{
    // Definición del objeto controlador
    effectController = {
        giroBase: 0.0,
        giroBrazo: 0.0,
        giroAntebrazoY: 0.0,
        giroAntebrazoZ: 0.0,
        giroPinza: 0.0,
        separacionPinza: 10.0,
        alambres: false
    }

    // Crear la GUI
    const gui = new GUI();

    // Construir el menú de widgets
    const h = gui.addFolder('Control Robot');
    h.add(effectController, "giroBase", -180.0, 180.0, 0.025).name("Giro Base").listen();
    h.add(effectController, "giroBrazo", -45.0, 45.0, 0.025).name("Giro Brazo").listen();
    h.add(effectController, "giroAntebrazoY", -180.0, 180.0, 0.025).name("Giro Antebrazo Y").listen();
    h.add(effectController, "giroAntebrazoZ", -90.0, 90.0, 0.025).name("Giro Antebrazo Z").listen();
    h.add(effectController, "giroPinza", -40.0, 220.0, 0.025).name("Giro Pinza").listen();
    h.add(effectController, "separacionPinza", 0.0, 15.0, 0.025).name("Separacion Pinza").listen();
    h.add(effectController, "alambres").name("alambres");

    h.add({ animate: animate }, 'animate').name('Anima'); 
}


function updateAspectRatio()
{
    renderer.setSize(window.innerWidth, window.innerHeight);
    const ar = window.innerWidth / window.innerHeight;

    camera.aspect = ar;
    camera.updateProjectionMatrix();

    if(ar > 1)
    {
        cameraCenital.left = -L;
        cameraCenital.right = L;
        cameraCenital.top = L;
        cameraCenital.bottom = -L;
    }
    else    
    {
        cameraCenital.left = -L;
        cameraCenital.right = L;
        cameraCenital.top = L;
        cameraCenital.bottom = -L;
    }

    cameraCenital.updateProjectionMatrix();
}



function update()
{
    robot.position.set(robotPosition.x, robotPosition.y, robotPosition.z);
    base.rotation.y = effectController.giroBase * Math.PI / 180;
    brazo.rotation.z = effectController.giroBrazo * Math.PI / 180;
    antebrazo.rotation.y = effectController.giroAntebrazoY * Math.PI / 180;
    antebrazo.rotation.z = effectController.giroAntebrazoZ * Math.PI / 180;
    mano.rotation.z = effectController.giroPinza * Math.PI / 180;

    pinzaIzquierda.position.set(pinzaX, pinzaY, pinzaIzquierdaZ - effectController.separacionPinza + 10);
    pinzaDerecha.position.set(pinzaX, pinzaY, pinzaDerechaZ + effectController.separacionPinza - 10);



    if (effectController.alambres === true){
        materialRobot.wireframe = true;
    }
    else{
        materialRobot.wireframe = false;
    }
    
}

function animate() {
    new TWEEN.Tween(robot.position)
        .to({x : [0, 0], y : [100, 0], z : [0, 0]}, 5000)
        .interpolation(TWEEN.Interpolation.Bezier)
        .easing(TWEEN.Easing.Bounce.Out)
        .start();
    
    new TWEEN.Tween(antebrazo.rotation)
        .to({x : [0, 0], y : [0, 0], z : [-Math.PI / 2, 0]}, 5000)
        .interpolation(TWEEN.Interpolation.Linear)
        .easing(TWEEN.Easing.Exponential.InOut)
        .start();

    new TWEEN.Tween(brazo.rotation)
        .to({x : [-Math.PI / 2, 0, Math.PI / 2, 0], y : [0, 0], z : [0, 0]}, 5000)
        .interpolation(TWEEN.Interpolation.Linear)
        .easing(TWEEN.Easing.Exponential.InOut)
        .start();
}

function render()
{
    requestAnimationFrame(render);
    update();
    TWEEN.update();
    renderer.clear();

    // Renderiza la cámara normal
    renderer.setViewport(0,0, window.innerWidth, window.innerHeight);
    renderer.render(scene, camera);


    // Renderiza la vista miniatura
    const ar = window.innerWidth/window.innerHeight;
    if (ar > 1){
        renderer.setViewport(0, window.innerHeight-window.innerHeight/4, window.innerHeight/4, window.innerHeight/4);
    }
    else{
        renderer.setViewport(0, window.innerHeight-window.innerWidth/4, window.innerWidth/4, window.innerWidth/4);
    }
    renderer.render(scene, cameraCenital);

}