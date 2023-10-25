
/*
    Seminario #5: Pintar escena con luces, materiales, sombras y vídeo
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
let esferaCubo, cubo, esfera, suelo;
let angulo = 0;
let stats;
let effectController;
let video;


// Controlador de cámara
let cameraControls;

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
    renderer.antialias = true;
    renderer.shadowMap.enabled = true;

    // Escena
    scene = new THREE.Scene();
    //scene.background = new THREE.Color(0.7, 0.9, 0.9);

    // Camara
    camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
    camera.position.set(0.5, 2, 7);
    cameraControls = new OrbitControls(camera, renderer.domElement);
    cameraControls.target.set(0, 1, 0);
    camera.lookAt(0,1,0);

    // Luces
    const ambiental = new THREE.AmbientLight(0x222222);
    scene.add(ambiental);

    const direccional = new THREE.DirectionalLight(0xFFFFFF, 0.5);
    direccional.position.set(-1, 1, -1); //de donde viene la luz
    direccional.castShadow = true;
    scene.add(direccional);

    const puntual =  new THREE.PointLight(0xFFFFFF, 0.4);
    puntual.position.set(2, 7, -4);
    scene.add(puntual);

    const focal = new THREE.SpotLight(0xFFFFFF, 0.3);
    focal.position.set(-2, 7, 4);
    focal.target.position.set(0, 0, 0);
    focal.angle = Math.PI / 7;
    focal.penumbra = 0.3; //degradado de la luz
    focal.castShadow = true; // permitir sombras
    scene.add(focal);
    scene.add(new THREE.CameraHelper(focal.shadow.camera));

    // Monitor
    stats = new Stats();
    stats.setMode(0);
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.bottom = '30px';
    stats.domElement.style.left = '0px';
    document.getElementById('container').appendChild(stats.domElement);

    // Eventos atendidos
    window.addEventListener('resize', updateAspectRatio);
    //window.addEventListener("dblclick", animate);
    renderer.domElement.addEventListener("dblclick", animate);
    
}

function loadScene()
{
    const material = new THREE.MeshBasicMaterial({color : 'yellow', wireframe : true});

    const texCubo = new THREE.TextureLoader().load('./images/wood512.jpg');
    const matCubo = new THREE.MeshLambertMaterial({color : 'red', map : texCubo});
    const entorno = ["./images/posx.jpg", "./images/negx.jpg",
                    "./images/posy.jpg", "./images/negy.jpg",
                    "./images/posz.jpg", "./images/negz.jpg"]
    const texEsfera = new THREE.CubeTextureLoader().load(entorno);
    const matEsfera = new THREE.MeshPhongMaterial({color : 'white', specular : 'gray', shininess: 30, envMap : texEsfera}); //especular es el color de los brillos
    const texSuelo = new THREE.TextureLoader().load("./images/wet_ground_512x512.jpg");
    const matSuelo = new THREE.MeshStandardMaterial({color : 'gray', map : texSuelo});

    const geoCubo = new THREE.BoxGeometry(2, 2, 2);
    const geoEsfera = new THREE.SphereGeometry(1, 20, 20);

    cubo = new THREE.Mesh(geoCubo, matCubo);
    cubo.castShadow = true;
    cubo.receiveShadow = true;
    esfera = new THREE.Mesh(geoEsfera, matEsfera);
    esfera.castShadow = true;
    esfera.receiveShadow = true;

    esferaCubo = new THREE.Object3D();

    cubo.position.set(1, 0, 0); //Se aplica matriz de traslacion
    esfera.position.set(-1, 0, 0);
    
    esferaCubo.position.set(0, 1, 0);

    esferaCubo.add(cubo);
    esferaCubo.add(esfera);
    scene.add(esferaCubo);

    // Suelo
    suelo = new THREE.Mesh(new THREE.PlaneGeometry(10, 10, 10, 10), matSuelo);
    suelo.receiveShadow = true;

    suelo.rotation.x = -Math.PI/2;

    // Importar un modelo JSON  
    const loader = new THREE.ObjectLoader();
    loader.load("models/soldado/soldado.json",
                function(objeto){
                    cubo.add(objeto);//Lo coloca en el centro del cubo
                    objeto.position.set(0, 1, 0);
                    objeto.rotation.y = Math.PI;
                    objeto.name = 'soldado';
                    objeto.castShadow = true;
                    objeto.receiveShadow = true;
                    objeto.material.setValues({map : new THREE.TextureLoader().load("models/soldado/soldado.png")})
                }
    )

    // Importar modelo en GLTF
    const gltfloader = new GLTFLoader();
    gltfloader.load('models/robota/scene.gltf',
                    function(gltf){
                        gltf.scene.position.y = 1;
                        gltf.scene.rotation.y = Math.PI/2;
                        gltf.scene.name = 'robot';
                        //gltf.scene.scale.set(0.1, 0.1, 0.1) Reducir o aumentar tamaño
                        esfera.add(gltf.scene);
                        gltf.scene.traverse(ob=>{
                            if (ob.isObject3D) ob.castShadow = ob.receiveShadow = true;
                        })
                    }
    );

    // Habitación
    const paredes = [];
    paredes.push(new THREE.MeshBasicMaterial({side : THREE.BackSide, map : new THREE.TextureLoader().load("./images/posx.jpg")}));
    paredes.push(new THREE.MeshBasicMaterial({side : THREE.BackSide, map : new THREE.TextureLoader().load("./images/negx.jpg")}));
    paredes.push(new THREE.MeshBasicMaterial({side : THREE.BackSide, map : new THREE.TextureLoader().load("./images/posy.jpg")}));
    paredes.push(new THREE.MeshBasicMaterial({side : THREE.BackSide, map : new THREE.TextureLoader().load("./images/negy.jpg")}));
    paredes.push(new THREE.MeshBasicMaterial({side : THREE.BackSide, map : new THREE.TextureLoader().load("./images/posz.jpg")}));
    paredes.push(new THREE.MeshBasicMaterial({side : THREE.BackSide, map : new THREE.TextureLoader().load("./images/negz.jpg")}));

    // Pantalla de cine
    video = document.createElement('video');
    video.src = './videos/Pixar.mp4';
    video.load();
    video.muted = true;
    const videoTextura = new THREE.VideoTexture(video);
    const matPantalla = new THREE.MeshBasicMaterial({map : videoTextura, side : THREE.DoubleSide});
    const pantalla = new THREE.Mesh(new THREE.PlaneGeometry(20, 6, 4, 4), matPantalla);
    pantalla.position.set(0, 3, -6);
    scene.add(pantalla);

    const geoHabitacion = new THREE.BoxGeometry(40, 40, 40);
    const habitacion = new THREE.Mesh(geoHabitacion, paredes);
    scene.add(habitacion);

    scene.add(suelo);
    scene.add(new THREE.AxisHelper(2));
}

function setupGUI()
{
    // Definición del objeto controlador
    effectController = {
        mensaje: "Soldado y Robot",
        giroY: 0.0,
        separacion: 0,
        coloralambres: 'rgb(150, 150, 150)',
        silencio : true,
        play : function(){video.play();},
        pause : function(){video.pause();}
    }

    // Crear la GUI
    const gui = new GUI();

    // Construir el menú de widgets
    const h = gui.addFolder('Controles');
    h.add(effectController, "mensaje").name("Aplicacion");
    h.add(effectController, "giroY", -180.0, 180.0, 0.025).name("Giro en Y").listen();
    h.add(effectController, "separacion", {"Ninguna": 0, "Media": 2, "Total": 5}).name("Separacion");
    h.addColor(effectController, "coloralambres").name("Color Alambres");
    const videoFolder = gui.addFolder("Video control");
    videoFolder.add(effectController, "silencio").onChange(v => {video.muted = v;}).name("Mutear");
    videoFolder.add(effectController, "play");
    videoFolder.add(effectController, "pause");

}

function updateAspectRatio()
{
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth/window.innerHeight;
    camera.updateProjectionMatrix();
}

function animate(event)
{
    // Capturar posición del click
    let x = event.clientX;
    let y = event.clientY;

    // Normalizar al cuadrado 2x2
    x = (x / window.innerWidth) * 2 - 1;
    y = -(y / window.innerHeight) * 2 + 1;

    // Construir el rayo
    const rayo = new THREE.Raycaster();
    rayo.setFromCamera(new THREE.Vector2(x, y), camera);

    // Intersecciones con soldado y robot
    const soldado = scene.getObjectByName('soldado');
    let intersecciones = rayo.intersectObject(soldado, false);
    if (intersecciones.length > 0){
        // Animación
        new TWEEN.Tween(soldado.position)
        .to({x : [0, 0], y : [3, 1], z : [0, 0]}, 2000)
        .interpolation(TWEEN.Interpolation.Bezier)
        .easing(TWEEN.Easing.Bounce.Out)
        .start();
    }

    const robot = scene.getObjectByName('robot');
    intersecciones = rayo.intersectObjects(robot.children, true);
    if (intersecciones.length > 0){
        // Animación
        new TWEEN.Tween(robot.rotation)
        .to({x : [0, 0], y : [-Math.PI, -Math.PI/2], z : [0, 0]}, 5000)
        .interpolation(TWEEN.Interpolation.Linear)
        .easing(TWEEN.Easing.Exponential.InOut)
        .start();
    }
}

function update(delta)
{
    //angulo += 0.01;
    //esferaCubo.rotation.y = angulo;
    stats.update();
    TWEEN.update(delta);
    cubo.position.set(1 + effectController.separacion / 2, 0, 0);
    esfera.position.set(-1 - effectController.separacion / 2, 0, 0);
        
    effectController.giroY += 0.1;
    esferaCubo.rotation.y = effectController.giroY * Math.PI / 180;
}

function render(delta)
{
    requestAnimationFrame(render);
    update(delta);
    renderer.render(scene, camera);
}