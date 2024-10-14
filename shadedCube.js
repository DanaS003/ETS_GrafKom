"use strict";

var shadedCube = function() {

var canvas;
var gl;

var numPositions = 36;

var positionsArray = [];
var normalsArray = [];

var vertices = [
        vec4(-0.5, -0.5,  0.5, 1.0),
        vec4(-0.5,  0.5,  0.5, 1.0),
        vec4(0.5,  0.5,  0.5, 1.0),
        vec4(0.5, -0.5,  0.5, 1.0),
        vec4(-0.5, -0.5, -0.5, 1.0),
        vec4(-0.5,  0.5, -0.5, 1.0),
        vec4(0.5,  0.5, -0.5, 1.0),
        vec4(0.5, -0.5, -0.5, 1.0)
    ];

var lightPosition = vec4(1.0, 1.0, 1.0, 0.0);
var lightAmbient = vec4(0.5, 0.5, 0.5, 1.0);
var lightDiffuse = vec4(1.0, 1.0, 1.0, 1.0);
var lightSpecular = vec4(1.0, 1.0, 1.0, 1.0);

var materialAmbient = vec4(1.0, 0.0, 1.0, 1.0);
var materialDiffuse = vec4(1.0, 0.8, 0.0, 1.0);
var materialSpecular = vec4(1.0, 0.8, 0.0, 1.0);
var materialShininess = 20.0;

var ctm;
var ambientColor, diffuseColor, specularColor;
var modelViewMatrix, projectionMatrix;
var viewerPos;
var program;

var xAxis = 0;
var yAxis = 1;
var zAxis = 2;
var axis = 0;
var theta = vec3(0, 0, 0);

var thetaLoc;

var flag = false;
var position = vec3(-0.8, -0.5, -1.0);
var velocity = vec3(0.0, 0.0, 0.0);
var acceleration = vec3(0.0, 0.0, 0.0);
var mass = 1.0;
var gravity = vec3(0.0, -9.8, 0.0);
var restitution = 0.8;

init();

function quad(a, b, c, d) {

     var t1 = subtract(vertices[b], vertices[a]);
     var t2 = subtract(vertices[c], vertices[b]);
     var normal = cross(t1, t2);
     normal = vec3(normal);

     positionsArray.push(vertices[a]);
     normalsArray.push(normal);
     positionsArray.push(vertices[b]);
     normalsArray.push(normal);
     positionsArray.push(vertices[c]);
     normalsArray.push(normal);
     positionsArray.push(vertices[a]);
     normalsArray.push(normal);
     positionsArray.push(vertices[c]);
     normalsArray.push(normal);
     positionsArray.push(vertices[d]);
     normalsArray.push(normal);
}

function colorCube()
{
    quad(1, 0, 3, 2);
    quad(2, 3, 7, 6);
    quad(3, 0, 4, 7);
    quad(6, 5, 1, 2);
    quad(4, 5, 6, 7);
    quad(5, 4, 0, 1);
}

function init() {
    canvas = document.getElementById("gl-canvas");

    gl = canvas.getContext('webgl2');
    if (!gl) alert( "WebGL 2.0 isn't available");

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(1.0, 0.0, 1.0, 1.0);

    gl.enable(gl.DEPTH_TEST);

    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    colorCube();

    var nBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(normalsArray), gl.STATIC_DRAW);

    var normalLoc = gl.getAttribLocation(program, "aNormal");
    gl.vertexAttribPointer(normalLoc, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(normalLoc);

    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(positionsArray), gl.STATIC_DRAW);

    var positionLoc = gl.getAttribLocation(program, "aPosition");
    gl.vertexAttribPointer(positionLoc, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(positionLoc);

    thetaLoc = gl.getUniformLocation(program, "theta");

    viewerPos = vec3(0.0, 0.0, -20.0);

    projectionMatrix = ortho(-1, 1, -1, 1, -100, 100);

    document.getElementById("ButtonX").onclick = function(){axis = xAxis;};
    document.getElementById("ButtonY").onclick = function(){axis = yAxis;};
    document.getElementById("ButtonZ").onclick = function(){axis = zAxis;};
    document.getElementById("ButtonT").onclick = function(){flag = !flag;};

    // Input untuk percepatan
    document.getElementById("accelerationX").addEventListener("input", function(event) {
        acceleration[0] = parseFloat(event.target.value);
    });
    document.getElementById("accelerationY").addEventListener("input", function(event) {
        acceleration[1] = parseFloat(event.target.value);
    });
    document.getElementById("accelerationZ").addEventListener("input", function(event) {
        acceleration[2] = parseFloat(event.target.value);
    });

    // Input untuk kecepatan awal
    document.getElementById("velocityX").addEventListener("input", function(event) {
        velocity[0] = parseFloat(event.target.value);
    });
    document.getElementById("velocityY").addEventListener("input", function(event) {
        velocity[1] = parseFloat(event.target.value);
    });
    document.getElementById("velocityZ").addEventListener("input", function(event) {
        velocity[2] = parseFloat(event.target.value);
    });

    // Input untuk massa
    document.getElementById("mass").addEventListener("input", function(event) {
        mass = parseFloat(event.target.value);
    });

    // Input untuk gravitasi
    document.getElementById("gravity").addEventListener("input", function(event) {
        gravity[1] = parseFloat(event.target.value);
    });

    updateLightColors();
    updateLightPosition();
    updateMaterialColors();

    document.getElementById("ambientColor").addEventListener("input", updateLightColors);
    document.getElementById("diffuseColor").addEventListener("input", updateLightColors);
    document.getElementById("specularColor").addEventListener("input", updateLightColors);

    document.getElementById("lightX").addEventListener("input", updateLightPosition);
    document.getElementById("lightY").addEventListener("input", updateLightPosition);
    document.getElementById("lightZ").addEventListener("input", updateLightPosition);

    document.getElementById("materialAmbient").addEventListener("input", updateMaterialColors);
    document.getElementById("materialDiffuse").addEventListener("input", updateMaterialColors);
    document.getElementById("materialSpecular").addEventListener("input", updateMaterialColors);

    render();
}

function updateLightColors() {
    var ambientColor = hexToVec4(document.getElementById("ambientColor").value);
    var diffuseColor = hexToVec4(document.getElementById("diffuseColor").value);
    var specularColor = hexToVec4(document.getElementById("specularColor").value);

    var ambientProduct = mult(ambientColor, materialAmbient);
    var diffuseProduct = mult(diffuseColor, materialDiffuse);
    var specularProduct = mult(specularColor, materialSpecular);

    gl.uniform4fv(gl.getUniformLocation(program, "uAmbientProduct"), ambientProduct);
    gl.uniform4fv(gl.getUniformLocation(program, "uDiffuseProduct"), diffuseProduct);
    gl.uniform4fv(gl.getUniformLocation(program, "uSpecularProduct"), specularProduct);
    gl.uniform1f(gl.getUniformLocation(program, "uShininess"), materialShininess);
    gl.uniformMatrix4fv(gl.getUniformLocation(program, "uProjectionMatrix"), false, flatten(projectionMatrix));
}

function updateMaterialColors() {
    materialAmbient = hexToVec4(document.getElementById("materialAmbient").value);
    materialDiffuse = hexToVec4(document.getElementById("materialDiffuse").value);
    materialSpecular = hexToVec4(document.getElementById("materialSpecular").value);

    updateLightColors(); // Perbarui produk pencahayaan dengan warna material baru
}

function updateLightPosition() {
    var x = parseFloat(document.getElementById("lightX").value);
    var y = parseFloat(document.getElementById("lightY").value);
    var z = parseFloat(document.getElementById("lightZ").value);
    
    lightPosition = vec4(x, y, z, 0.0);
    gl.uniform4fv(gl.getUniformLocation(program, "uLightPosition"), flatten(lightPosition));
}

function hexToVec4(hex) {
    var bigint = parseInt(hex.slice(1), 16);
    var r = ((bigint >> 16) & 255) / 255;
    var g = ((bigint >> 8) & 255) / 255;
    var b = (bigint & 255) / 255;
    return vec4(r, g, b, 1.0);
}

function render(){
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    if(flag) theta[axis] += 2.0;

    // Update fisika: kecepatan dan posisi
    var gravityEffect = scale(1.0 / mass, gravity); // Efek gravitasi tergantung pada massa
    var totalAcceleration = add(acceleration, gravityEffect); // Total percepatan = percepatan + gravitasi
    velocity = add(velocity, scale(0.01, totalAcceleration)); // velocity = velocity + totalAcceleration * deltaTime
    position = add(position, scale(0.01, velocity));     // position = position + velocity * deltaTime

        // Deteksi tabrakan dengan lantai (y = -1.0) dan pemantulan
        if (position[1] <= -1.0) {
            position[1] = -1.0;
            velocity[1] = -velocity[1] * restitution; // Pantulan dengan koefisien restitusi
        }
    

    modelViewMatrix = mat4();
    modelViewMatrix = mult(modelViewMatrix, translate(position[0], position[1], position[2]));
    modelViewMatrix = mult(modelViewMatrix, scale(0.04, 0.1, 0.1));
    modelViewMatrix = mult(modelViewMatrix, rotate(theta[xAxis], vec3(1, 0, 0)));
    modelViewMatrix = mult(modelViewMatrix, rotate(theta[yAxis], vec3(0, 1, 0)));
    modelViewMatrix = mult(modelViewMatrix, rotate(theta[zAxis], vec3(0, 0, 1)));

    gl.uniformMatrix4fv(gl.getUniformLocation(program, "uModelViewMatrix"), false, flatten(modelViewMatrix));

    gl.drawArrays(gl.TRIANGLES, 0, numPositions);

    requestAnimationFrame(render);
}

}

shadedCube();