/*
    Práctica #2
*/


// Módulos necesarios

import * as THREE from "../lib/three.module.js"
import {GLTFLoader} from "../lib/GLTFLoader.module.js"

// Variables de consenso
let renderer, scene, camera;

// Otras globales
let robot, base, brazo, antebrazo, mano;
let angulo = 0;

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

    // Escena
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0.7, 0.9, 0.9);

    // Camara
    camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
    camera.position.set(60, 330, 150);
    camera.lookAt(1,1,0);
}

function loadScene()
{
    const materialRobot = new THREE.MeshBasicMaterial({color : 'red', wireframe : true, side: THREE.DoubleSide});
    const materialSuelo = new THREE.MeshBasicMaterial({color : 'blue', wireframe : false});

    // Robot
    robot = new THREE.Object3D();
    robot.position.set(0, 0, 0);

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

    const pinzaDerecha = new THREE.Mesh(geoPinza, materialRobot);
    const pinzaIzquierda = new THREE.Mesh(geoPinza, materialRobot);

    pinzaIzquierda.position.set(0, 0, -10);
    pinzaDerecha.position.set(0, 0, 10);
    pinzaDerecha.rotation.x = Math.PI;

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


function render()
{
    requestAnimationFrame(render);
    renderer.render(scene, camera);
}