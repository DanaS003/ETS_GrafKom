"use strict";

// Fungsi utama untuk merender dodecahedron 3D menggunakan WebGL
var perspectiveExample = function () {
    var canvas;
    var gl;

    var numPositions = 60; // Disesuaikan untuk dodecahedron
    var positionsArray = [];
    var colorsArray = [];

    // Vertices dan faces dodecahedron
    var vert = [];
    var faces = [];

    // Rasio emas untuk geometri dodecahedron
    const A = (1 + Math.sqrt(5)) / 2;
    const B = 1 / A;

    // Mendefinisikan vertices untuk dodecahedron
    function defineVertices() {
        vert.push(vec4(1, 1, 1, 1.0));
        vert.push(vec4(1, 1, -1, 1.0));
        vert.push(vec4(1, -1, 1, 1.0));
        vert.push(vec4(1, -1, -1, 1.0));
        vert.push(vec4(-1, 1, 1, 1.0));
        vert.push(vec4(-1, 1, -1, 1.0));
        vert.push(vec4(-1, -1, 1, 1.0));
        vert.push(vec4(-1, -1, -1, 1.0));
        vert.push(vec4(0, B, A, 1.0));
        vert.push(vec4(0, B, -A, 1.0));
        vert.push(vec4(0, -B, A, 1.0));
        vert.push(vec4(0, -B, -A, 1.0));
        vert.push(vec4(B, A, 0, 1.0));
        vert.push(vec4(B, -A, 0, 1.0));
        vert.push(vec4(-B, A, 0, 1.0));
        vert.push(vec4(-B, -A, 0, 1.0));
        vert.push(vec4(A, 0, B, 1.0));
        vert.push(vec4(A, 0, -B, 1.0));
        vert.push(vec4(-A, 0, B, 1.0));
        vert.push(vec4(-A, 0, -B, 1.0));
    }

    // Mendefinisikan faces untuk dodecahedron (menggabungkan vertices)
    function defineFaces() {
        faces.push([0, 16, 2, 10, 8]);
        faces.push([0, 8, 4, 14, 12]);
        faces.push([16, 17, 1, 12, 0]);
        faces.push([1, 9, 11, 3, 17]);
        faces.push([1, 12, 14, 5, 9]);
        faces.push([2, 13, 15, 6, 10]);
        faces.push([13, 3, 17, 16, 2]);
        faces.push([3, 11, 7, 15, 13]);
        faces.push([4, 8, 10, 6, 18]);
        faces.push([14, 5, 19, 18, 4]);
        faces.push([5, 19, 7, 11, 9]);
        faces.push([15, 7, 19, 18, 6]);
    }

    // Warna vertices untuk dodecahedron
    var vertexColors = [
        vec4(0.0, 0.0, 0.0, 1.0),  // hitam
        vec4(1.0, 0.0, 0.0, 1.0),  // merah
        vec4(0.0, 1.0, 0.0, 1.0),  // hijau
        vec4(0.0, 0.0, 1.0, 1.0),  // biru
        vec4(1.0, 1.0, 0.0, 1.0),  // kuning
        vec4(1.0, 0.0, 1.0, 1.0),  // magenta
        vec4(0.0, 1.0, 1.0, 1.0),  // cyan
        vec4(1.0, 0.5, 0.0, 1.0),  // oranye
        vec4(0.5, 0.0, 0.5, 1.0),  // ungu
        vec4(0.5, 0.5, 0.5, 1.0),  // abu-abu
        vec4(1.0, 0.5, 0.5, 1.0),  // pink
        vec4(0.0, 0.5, 0.5, 1.0),  // teal
    ];

    // Parameter kamera dan tampilan
    var near = 1.0;
    var far = 3.0;
    var radius = 3.0;
    var theta = 1.0;
    var phi = 1.0;
    var dr = 5.0 * Math.PI / 180.0;
    var fovy = 80.0;  // Sudut Field-of-view di arah Y (dalam derajat)
    var aspect;       // Rasio aspek viewport

    // Parameter pencahayaan
var lightPosition = vec3(2.0, 2.0, 2.0);
var lightColor = vec3(1.0, 1.0, 1.0);
var ambientLight = vec3(0.2, 0.2, 0.2);

// Uniform untuk pencahayaan
var lightPositionLoc = gl.getUniformLocation(program, "uLightPosition");
var lightColorLoc = gl.getUniformLocation(program, "uLightColor");
var ambientLightLoc = gl.getUniformLocation(program, "uAmbientLight");

gl.uniform3fv(lightPositionLoc, flatten(lightPosition));
gl.uniform3fv(lightColorLoc, flatten(lightColor));
gl.uniform3fv(ambientLightLoc, flatten(ambientLight));

    
    var modelViewMatrixLoc, projectionMatrixLoc;
    var modelViewMatrix, projectionMatrix;
    var eye;
    const at = vec3(0.0, 0.0, 0.0);
    const up = vec3(0.0, 1.0, 0.0);

    // Menghasilkan posisi dan warna dodecahedron
    function createDodecahedron() {
        for (var i = 0; i < faces.length; i++) {
            var face = faces[i];
            for (var j = 0; j < face.length - 2; j++) {
                positionsArray.push(vert[face[0]]);
                colorsArray.push(vertexColors[i % vertexColors.length]);
                positionsArray.push(vert[face[j + 1]]);
                colorsArray.push(vertexColors[i % vertexColors.length]);
                positionsArray.push(vert[face[j + 2]]);
                colorsArray.push(vertexColors[i % vertexColors.length]);
            }
        }
    }

    // Inisialisasi canvas WebGL, shader, dan buffer
    function init() {
        canvas = document.getElementById("gl-canvas");
        gl = canvas.getContext('webgl2');
        if (!gl) alert("WebGL 2.0 tidak tersedia");

        gl.viewport(0, 0, canvas.width, canvas.height);
        aspect = canvas.width / canvas.height;
        gl.clearColor(1.0, 1.0, 1.0, 1.0);
        gl.enable(gl.DEPTH_TEST);

        // Memuat shader dan inisialisasi buffer atribut
        var program = initShaders(gl, "vertex-shader", "fragment-shader");
        gl.useProgram(program);

        // Mendefinisikan vertices dan faces
        defineVertices();
        defineFaces();
        createDodecahedron();

        // Mengatur buffer warna
        var cBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(colorsArray), gl.STATIC_DRAW);
        var colorLoc = gl.getAttribLocation(program, "aColor");
        gl.vertexAttribPointer(colorLoc, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(colorLoc);

        // Mengatur buffer posisi
        var vBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(positionsArray), gl.STATIC_DRAW);
        var positionLoc = gl.getAttribLocation(program, "aPosition");
        gl.vertexAttribPointer(positionLoc, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(positionLoc);

        modelViewMatrixLoc = gl.getUniformLocation(program, "uModelViewMatrix");
        projectionMatrixLoc = gl.getUniformLocation(program, "uProjectionMatrix");

        // Tombol untuk menyesuaikan parameter tampilan
        document.getElementById("Button1").onclick = function () { near *= 1.1; far *= 1.1; };
        document.getElementById("Button2").onclick = function () { near *= 0.9; far *= 0.9; };
        document.getElementById("Button3").onclick = function () { radius *= 2.0; };
        document.getElementById("Button4").onclick = function () { radius *= 0.5; };
        document.getElementById("Button5").onclick = function () { theta += dr; };
        document.getElementById("Button6").onclick = function () { theta -= dr; };
        document.getElementById("Button7").onclick = function () { phi += dr; };
        document.getElementById("Button8").onclick = function () { phi -= dr; };

        render();
    }

    // Fungsi render untuk menggambar dodecahedron
    function render() {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        eye = vec3(radius * Math.sin(theta) * Math.cos(phi),
            radius * Math.sin(theta) * Math.sin(phi), radius * Math.cos(theta));
        modelViewMatrix = lookAt(eye, at, up);
        projectionMatrix = perspective(fovy, aspect, near, far);

        gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
        gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));

        gl.drawArrays(gl.TRIANGLES, 0, positionsArray.length);
        requestAnimationFrame(render);
    }

    // Memanggil fungsi init untuk memulai proses rendering
    init();
}

// Menjalankan fungsi utama
perspectiveExample();       