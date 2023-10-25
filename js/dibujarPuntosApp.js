/*
    Seminario #1: Dibujar puntos con VBOs
*/

// Shader de vertices
const VSHADER_SOURCE = `
    attribute vec3 posicion;
    void main(){
        gl_Position = vec4(posicion,1.0);
        gl_PointSize = 10.0;
    }
`

// Shader de fragmentos
const FSHADER_SOURCE = `
    uniform highp vec3 color;
    void main(){
        gl_FragColor = vec4(color,1.0);
    }
`
// Globales
const clicks = [];
let colorFragmento;

function main()
{
    // Recupera el lienzo
    const canvas = document.getElementById("canvas");
    const gl = getWebGLContext( canvas );

    // Cargo shaders en programa de GPU
    if(!initShaders(gl,VSHADER_SOURCE,FSHADER_SOURCE)){
        console.log("La cosa no va bien");
    }

    // Color de borrado del lienzo
    gl.clearColor(0.0, 0.0, 0.3, 1.0);

    // Localiza el att del shader posicion
    const coordenadas = gl.getAttribLocation( gl.program, 'posicion');

    // Crea buffer, etc ...
    const bufferVertices = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, bufferVertices );
    gl.vertexAttribPointer( coordenadas, 3, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( coordenadas );

    // Asignar el mismo color a todos los puntos
    colorFragmento = gl.getUniformLocation( gl.program, 'color' );

    // Registrar la call-back del click del raton
    canvas.onmousedown = function(evento){ click(evento,gl,canvas); };

    // Dibujar
    render( gl );
    
}

function click( evento, gl, canvas )
{
    // Recuperar la posicion del click
    // El click devuelve la x,y en el sistema de referencia
    // del documento. Los puntos que se pasan al shader deben
    // de estar en el cuadrado de lado dos centrado en el canvas

    let x = evento.clientX;
    let y = evento.clientY;
    const rect = evento.target.getBoundingClientRect();

    // Conversion de coordenadas al sistema webgl por defecto
    x = ((x-rect.left)-canvas.width/2) * 2/canvas.width;
    y = ( canvas.height/2 - (y-rect.top)) * 2/canvas.height;

	
	// Guardar las coordenadas y copia el array
	clicks.push(x); clicks.push(y); clicks.push(0.0);

	// Redibujar con cada click
	render( gl );
}

function render(gl) {
    // Borra el canvas con el color de fondo
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Calcula el color en función de la distancia al centro
    const centerX = 0;
    const centerY = 0;
    const maxDistance = Math.sqrt(2);

    for (let i = 0; i < clicks.length; i += 3) {
        const x = clicks[i];
        const y = clicks[i + 1];
        const distance = Math.sqrt((x - centerX) * (x - centerX) + (y - centerY) * (y - centerY));
        const normalizedDistance = distance / maxDistance;
        const color = [1.0 - normalizedDistance, normalizedDistance, 0.0];

        // Establece el color en función de la distancia al centro
        gl.uniform3fv(colorFragmento, color);

        // console.log(maxDistance);

        // Dibuja el punto actual
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(clicks.slice(i, i + 3)), gl.STATIC_DRAW);
        gl.drawArrays(gl.POINTS, 0, 1);
        if (i!=0){
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(clicks.slice(i-3, i + 3)), gl.STATIC_DRAW);
            gl.drawArrays(gl.LINE_STRIP, 0, 2);
        }
        
    }
}

