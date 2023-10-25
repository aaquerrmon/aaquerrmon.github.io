/*
    Seminario #3: Pintar una escena básica con transformaciones
    modelos importados en 4 vistas diferentes
*/



// Módulos necesarios

import * as THREE from "../lib/three.module.js"
import {GLTFLoader} from "../lib/GLTFLoader.module.js"
import {OrbitControls} from "../lib/OrbitControls.module.js"

// Variables de consenso
let renderer, scene, camera;

// Otras globales
let esferaCubo;
let angulo = 0;

// Controlador de cámara
let cameraControls;

// Cámaras adicionales
let planta, alzado, perfil;
const L = 5;//lado de las miniventanas

// Acciones
init();
loadScene();
render();


function init()
{
    // Motor de render
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById("container").appendChild(renderer.domElement);
    renderer.autoClear = false;

    // Escena
    scene = new THREE.Scene();
    //scene.background = new THREE.Color(0.7, 0.9, 0.9);

    // Camara
    const ar = window.innerWidth/window.innerHeight;
    setOrtographicCameras(ar);

    camera = new THREE.PerspectiveCamera(75, ar, 0.1, 1000);
    camera.position.set(0.5, 2, 7);
    cameraControls = new OrbitControls(camera, renderer.domElement);
    cameraControls.target.set(0, 1, 0);
    camera.lookAt(0,1,0);

    // Eventos
    window.addEventListener("resize", updateAspectRatio);
    window.addEventListener("dblclick", rotateElement);
}

function setOrtographicCameras(ar)
{
    let camaraOrtografica;

    if (ar > 1)
    {
        camaraOrtografica = new THREE.OrthographicCamera(-L * ar, L * ar, L, -L, -100, 100);
    }
    else
    {
        camaraOrtografica = new THREE.OrthographicCamera(-L, L, L / ar, -L / ar, -100, 100);
    }

    alzado = camaraOrtografica.clone();
    alzado.position.set(0, 0, L);
    alzado.lookAt(0, 1, 0);

    perfil = camaraOrtografica.clone();
    perfil.position.set(L, 0, 0);
    perfil.lookAt(0, 1, 0);

    planta = camaraOrtografica.clone();
    planta.position.set(0, L, 0);
    planta.lookAt(0, 1, 0); 
    planta.up = new THREE.Vector3(0, 0, -1);
}

function loadScene()
{
    const material = new THREE.MeshBasicMaterial({color : 'yellow', wireframe : true});

    const geoCubo = new THREE.BoxGeometry(2, 2, 2);
    const geoEsfera = new THREE.SphereGeometry(1, 20, 20);

    const cubo = new THREE.Mesh(geoCubo, material);
    const esfera = new THREE.Mesh(geoEsfera, material);

    esferaCubo = new THREE.Object3D();
    esferaCubo.name = 'grupoEC';

    cubo.position.set(1, 0, 0); //Se aplica matriz de traslacion
    esfera.position.set(-1, 0, 0);
    
    esferaCubo.position.set(0, 1, 0);

    esferaCubo.add(cubo);
    esferaCubo.add(esfera);
    scene.add(esferaCubo);

    // Suelo
    const suelo = new THREE.Mesh(new THREE.PlaneGeometry(10, 10, 10, 10), material);

    suelo.rotation.x = -Math.PI/2;

    // Importar un modelo JSON  
    const loader = new THREE.ObjectLoader();
    loader.load("models/soldado/soldado.json",
                function(objeto){
                    cubo.add(objeto);//Lo coloca en el centro del cubo
                    objeto.position.set(0, 1, 0);
                }
    )

    // Importar modelo en GLTF
    const gltfloader = new GLTFLoader();
    gltfloader.load('models/robota/scene.gltf',
                    function(gltf){
                        gltf.scene.position.y = 1;
                        gltf.scene.rotation.y = Math.PI/2;
                        //gltf.scene.scale.set(0.1, 0.1, 0.1) Reducir o aumentar tamaño
                        esfera.add(gltf.scene);
                    }
    )

    scene.add(suelo);
    scene.add(new THREE.AxisHelper(2));
}

function rotateElement(event)
{
    // Capturo la posición del click (sistema de referencia top-left)
    let x = event.clientX;
    let y = event.clientY;

    // Cambia al sistema de referencia "cuadrado 2x2"
    x = (x / window.innerWidth) * 2 - 1;
    y = - (y / window.innerHeight) * 2 + 1;

    // Rayo y intersección
    const rayo = new THREE.Raycaster();
    rayo.setFromCamera(new THREE.Vector2(x, y), camera);

    const intersecciones = rayo.intersectObjects(scene.getObjectByName('grupoEC').children, false);
    if(intersecciones.length > 0)
    {
        intersecciones[0].object.rotation.y += Math.PI / 8;
    }

}

function updateAspectRatio()
{
    renderer.setSize(window.innerWidth, window.innerHeight);
    const ar = window.innerWidth / window.innerHeight;

    camera.aspect = ar;
    camera.updateProjectionMatrix();

    if(ar > 1)
    {
        alzado.left = planta.left = perfil.left = -L * ar;
        alzado.right = planta.right = perfil.right = L * ar;
        alzado.top = planta.top = perfil.top = L;
        alzado.bottom = planta.bottom = perfil.bottom = -L;
    }
    else    
    {
        alzado.left = planta.left = perfil.left = -L;
        alzado.right = planta.right = perfil.right = L;
        alzado.top = planta.top = perfil.top = L / ar;
        alzado.bottom = planta.bottom = perfil.bottom = -L / ar;
    }

    alzado.updateProjectionMatrix();
    perfil.updateProjectionMatrix();
    planta.updateProjectionMatrix();

}

function update()
{
    angulo += 0.01;
    //esferaCubo.rotation.y = angulo;
}

function render()
{
    requestAnimationFrame(render);
    update();

    renderer.clear();

    // El origen del viewport es bottom-left


    // Planta
    renderer.setViewport(0, 0, window.innerWidth / 2, window.innerHeight / 2);
    renderer.render(scene, planta);

    // Alzado
    renderer.setViewport(0, window.innerHeight / 2, window.innerWidth / 2, window.innerHeight / 2);
    renderer.render(scene, alzado);

    // Perfil
    renderer.setViewport(window.innerWidth / 2, window.innerHeight / 2, window.innerWidth / 2, window.innerHeight / 2);
    renderer.render(scene, perfil);

    // Perspectiva
    renderer.setViewport(window.innerWidth / 2, 0, window.innerWidth / 2, window.innerHeight / 2);
    renderer.render(scene, camera);
}