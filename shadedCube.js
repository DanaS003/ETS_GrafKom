"use strict";

var shadedCube = function () {
  var canvas;
  var gl;

  var numPositions = 36;

  var positionsArray = [];
  var normalsArray = [];
  var colorsArray = [];

  var vertices = [vec4(-0.5, -0.5, 0.5, 1.0), vec4(-0.5, 0.5, 0.5, 1.0), vec4(0.5, 0.5, 0.5, 1.0), vec4(0.5, -0.5, 0.5, 1.0), vec4(-0.5, -0.5, -0.5, 1.0), vec4(-0.5, 0.5, -0.5, 1.0), vec4(0.5, 0.5, -0.5, 1.0), vec4(0.5, -0.5, -0.5, 1.0)];

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

  var mode = "bouncing"; // Default mode is bouncing

  var xAxis = 0;
  var yAxis = 1;
  var zAxis = 2;
  var axis = 0;
  var theta = vec3(0, 0, 0);

  var thetaLoc;

  var flag = false;
  var position = vec3(-2.8, -0.5, -1.0);
  var velocity = vec3(0.0, 0.0, 0.0);
  var acceleration = vec3(0.0, 0.0, 0.0);
  var mass = 1.0;
  var gravity = vec3(0.0, -9.8, 0.0);
  var restitution = 0.8;

  // Variabel untuk gerak parabola
  var initialVelocity = 0.0;
  var elevationAngle = 0.0;
  var distanceX = 0.0;
  var time = 2.0;
  var parabolicMotion = false;

  // Variabel untuk mencatat nilai maksimum posisi X, Y, dan Z
  var maxPosition = vec3(-Infinity, -Infinity, -Infinity);

  init();

  function Dodecahedron() {
    const A = (1 + Math.sqrt(5)) / 2; // The golden ratio
    const B = 1 / A;

    var vertices = [
      vec4(1, 1, 1, 1.0),
      vec4(1, 1, -1, 1.0),
      vec4(1, -1, 1, 1.0),
      vec4(1, -1, -1, 1.0),
      vec4(-1, 1, 1, 1.0),
      vec4(-1, 1, -1, 1.0),
      vec4(-1, -1, 1, 1.0),
      vec4(-1, -1, -1, 1.0),
      vec4(0, B, A, 1.0),
      vec4(0, B, -A, 1.0),
      vec4(0, -B, A, 1.0),
      vec4(0, -B, -A, 1.0),
      vec4(B, A, 0, 1.0),
      vec4(B, -A, 0, 1.0),
      vec4(-B, A, 0, 1.0),
      vec4(-B, -A, 0, 1.0),
      vec4(A, 0, B, 1.0),
      vec4(A, 0, -B, 1.0),
      vec4(-A, 0, B, 1.0),
      vec4(-A, 0, -B, 1.0),
    ];

    var faces = [
      [0, 16, 2, 10, 8],
      [0, 8, 4, 14, 12],
      [16, 17, 1, 12, 0],
      [1, 9, 11, 3, 17],
      [1, 12, 14, 5, 9],
      [2, 13, 15, 6, 10],
      [13, 3, 17, 16, 2],
      [3, 11, 7, 15, 13],
      [4, 8, 10, 6, 18],
      [14, 5, 19, 18, 4],
      [5, 19, 7, 11, 9],
      [15, 7, 19, 18, 6],
    ];

    var faceColors = [
      vec4(1.0, 0.0, 0.0, 1.0),
      vec4(0.0, 1.0, 0.0, 1.0),
      vec4(0.0, 0.0, 1.0, 1.0),
      vec4(1.0, 1.0, 0.0, 1.0),
      vec4(1.0, 0.0, 1.0, 1.0),
      vec4(0.0, 1.0, 1.0, 1.0),
      vec4(0.5, 0.5, 0.5, 1.0),
      vec4(1.0, 0.5, 0.0, 1.0),
      vec4(0.5, 0.0, 0.5, 1.0),
      vec4(0.0, 0.5, 0.5, 1.0),
      vec4(0.5, 0.5, 0.0, 1.0),
      vec4(0.0, 0.0, 0.0, 1.0),
    ];

    for (var i = 0; i < faces.length; i++) {
      var face = faces[i];
      var faceColor = faceColors[i];

      for (var j = 1; j < face.length - 1; j++) {
        // Triangle vertices
        var v0 = vertices[face[0]];
        var v1 = vertices[face[j]];
        var v2 = vertices[face[j + 1]];

        // Add triangle vertices to positions array
        positionsArray.push(v0);
        positionsArray.push(v1);
        positionsArray.push(v2);

        // Add colors
        colorsArray.push(faceColor);
        colorsArray.push(faceColor);
        colorsArray.push(faceColor);

        // Compute the normal for the triangle using cross product of edges
        var normal = computeNormal(v0, v1, v2);

        // Add normals for each vertex
        normalsArray.push(normal);
        normalsArray.push(normal);
        normalsArray.push(normal);
      }
    }
  }

  // Compute normal using cross product of two edges
  function computeNormal(v0, v1, v2) {
    var edge1 = subtract(v1, v0);
    var edge2 = subtract(v2, v0);
    var normal = normalize(cross(edge1, edge2));
    return normal;
  }

  function init() {
    canvas = document.getElementById("gl-canvas");

    gl = canvas.getContext("webgl2");
    if (!gl) alert("WebGL 2.0 isn't available");

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.0, 0.0, 0.1, 1.0);

    gl.enable(gl.DEPTH_TEST);

    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    // colorCube();
    Dodecahedron();

    var nBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(normalsArray), gl.STATIC_DRAW);

    var normalLoc = gl.getAttribLocation(program, "aNormal");
    gl.vertexAttribPointer(normalLoc, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(normalLoc);

    var nBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(colorsArray), gl.STATIC_DRAW);

    var colorLoc = gl.getAttribLocation(program, "aColor");
    gl.vertexAttribPointer(colorLoc, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(colorLoc);

    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(positionsArray), gl.STATIC_DRAW);

    var positionLoc = gl.getAttribLocation(program, "aPosition");
    gl.vertexAttribPointer(positionLoc, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(positionLoc);

    thetaLoc = gl.getUniformLocation(program, "theta");

    viewerPos = vec3(0.0, 0.0, -20.0);

    var aspect = canvas.width / canvas.height;
    projectionMatrix = ortho(-aspect, aspect, -1, 1, -100, 100);

    document.getElementById("ButtonX").onclick = function () {
      axis = xAxis;
    };
    document.getElementById("ButtonY").onclick = function () {
      axis = yAxis;
    };
    document.getElementById("ButtonZ").onclick = function () {
      axis = zAxis;
    };
    document.getElementById("ButtonT").onclick = function () {
      flag = !flag;
    };

    // Add event listener for Bouncing Mode
    document.getElementById("bouncingMode").addEventListener("click", function () {
      mode = "bouncing";
      console.log("Switched to Bouncing Mode");
    });

    // Add event listener for Through Mode
    document.getElementById("throughMode").addEventListener("click", function () {
      mode = "through";
      console.log("Switched to Through Mode");
    });

    // Add event listener for Bouncing Mode
    document.getElementById("bouncingMode").addEventListener("click", function () {
      mode = "bouncing";
      document.getElementById("modeDisplay").textContent = "Mode: Bouncing"; // Update the mode display
      console.log("Switched to Bouncing Mode");
    });

    // Add event listener for Through Mode
    document.getElementById("throughMode").addEventListener("click", function () {
      mode = "through";
      document.getElementById("modeDisplay").textContent = "Mode: Through"; // Update the mode display
      console.log("Switched to Through Mode");
    });

    // Input untuk percepatan
    document.getElementById("applyAcceleration").addEventListener("click", function () {
      acceleration[0] = parseFloat(document.getElementById("accelerationX").value);
      acceleration[1] = parseFloat(document.getElementById("accelerationY").value);
      acceleration[2] = parseFloat(document.getElementById("accelerationZ").value);
      console.log("Applied Acceleration: ", acceleration);
    });

    document.getElementById("applyVelocity").addEventListener("click", function () {
      velocity[0] = parseFloat(document.getElementById("velocityX").value);
      velocity[1] = parseFloat(document.getElementById("velocityY").value);
      velocity[2] = parseFloat(document.getElementById("velocityZ").value);
      console.log("Applied Velocity: ", velocity);
    });

    document.getElementById("applyParabola").addEventListener("click", function () {
      initialVelocity = parseFloat(document.getElementById("initialVelocity").value);
      elevationAngle = parseFloat(document.getElementById("elevationAngle").value) * (Math.PI / 180);
      time = 0.0;
      parabolicMotion = true;
    });

    // Input untuk massa
    document.getElementById("applyMass").addEventListener("click", function () {
      mass = parseFloat(document.getElementById("mass").value);
    });

    // Input untuk gravitasi
    document.getElementById("applyGravity").addEventListener("click", function () {
      gravity[1] = parseFloat(document.getElementById("gravity").value);
    });

    // Tombol reset untuk mengatur ulang semua nilai ke kondisi awal
    document.getElementById("resetValues").addEventListener("click", function () {
      document.getElementById("accelerationX").value = 0;
      document.getElementById("accelerationY").value = 0;
      document.getElementById("velocityX").value = 0;
      document.getElementById("velocityY").value = 0;
      document.getElementById("mass").value = 1;
      document.getElementById("gravity").value = -9.8;

      acceleration = vec3(0.0, 0.0, 0.0);
      velocity = vec3(0.0, 0.0, 0.0);
      mass = 1.0;
      gravity = vec3(0.0, -9.8, 0.0);
      position = vec3(-2.8, -0.5, -1.0);
      initialVelocity = 0.0;
      elevationAngle = 0.0;
      distanceX = 0.0;
      time = 0.0;
      parabolicMotion = false;

      // Reset nilai maksimum posisi
      maxPosition = vec3(-Infinity, -Infinity, -Infinity);
      document.getElementById("maxPositionCounter").textContent = `Max Position: X=${maxPosition[0]}, Y=${maxPosition[1]}, Z=${maxPosition[2]}`;
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

  function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    if (flag) theta[axis] += 2.0;


    // Parabolic motion
    if (parabolicMotion) {

      time += 0.01;

      // Update position using parabolic motion equations
      position[0] = position[0] + initialVelocity * Math.cos(elevationAngle) * time;
      position[1] = position[1] + (initialVelocity * Math.sin(elevationAngle) * time + 0.5 * gravity[1] * time * time);

      if (position[1] - 0.1 <= -1.0) {
        parabolicMotion = false;
      }

    } else {
      // Update physics: velocity and position
      var gravityEffect = scale(1.0 / mass, gravity); // Effect of gravity based on mass
      var totalAcceleration = add(acceleration, gravityEffect); // Total acceleration = acceleration + gravity
      velocity = add(velocity, scale(0.01, totalAcceleration)); // velocity = velocity + totalAcceleration * deltaTime
      position = add(position, scale(0.01, velocity)); // position = position + velocity * deltaTime
    }

    var cubeHalfSize = 0.1;

    // Apply collision detection only in Bouncing Mode
    if (mode === "bouncing") {
      // Floor collision (y = -1.0) with bounce
      if (position[1] - cubeHalfSize <= -1.0) {
        position[1] = -1.0 + cubeHalfSize;
        velocity[1] = -velocity[1] * restitution;
      }

      // Ceiling collision
      if (position[1] + cubeHalfSize >= 1.0) {
        position[1] = 1.0 - cubeHalfSize;
        velocity[1] = -velocity[1] * restitution;
      }

      // Left wall collision
      if (position[0] - cubeHalfSize <= -3.05) {
        position[0] = -3.05 + cubeHalfSize;
        velocity[0] = -velocity[0] * restitution;
      }

      // Right wall collision
      if (position[0] + cubeHalfSize >= 3.05) {
        position[0] = 3.05 - cubeHalfSize;
        velocity[0] = -velocity[0] * restitution;
      }

      // Front and back wall collisions (optional if you have 3D depth)
      if (position[2] - cubeHalfSize <= -3.05) {
        position[2] = -3.05 + cubeHalfSize;
        velocity[2] = -velocity[2] * restitution;
      }
      if (position[2] + cubeHalfSize >= 3.05) {
        position[2] = 3.05 - cubeHalfSize;
        velocity[2] = -velocity[2] * restitution;
      }
    } else if (mode === "through") {
      // In Through Mode, only bottom boundary has a limit (gravity still acts)
      if (position[1] - cubeHalfSize <= -1.0) {
        position[1] = -1.0 + cubeHalfSize;
        velocity[1] = -velocity[1] * restitution;
      }

      // No collision detection for other walls
    }

    // Periksa dan catat nilai maksimum dari posisi X, Y, Z
    if (position[0] > maxPosition[0]) maxPosition[0] = position[0];
    if (position[1] > maxPosition[1]) maxPosition[1] = position[1];
    if (position[2] > maxPosition[2]) maxPosition[2] = position[2];

    // Update counter untuk menampilkan posisi kubus
    document.getElementById("positionCounter").textContent = `Position: X=${position[0].toFixed(2)}, Y=${position[1].toFixed(2)}, Z=${position[2].toFixed(2)}`;

    // Update max counter untuk menampilkan nilai maksimum X, Y, Z
    document.getElementById("maxPositionCounter").textContent = `Max Position: X=${maxPosition[0].toFixed(2)}, Y=${maxPosition[1].toFixed(2)}, Z=${maxPosition[2].toFixed(2)}`;

    // Update and render the model view matrix
    modelViewMatrix = mat4();
    modelViewMatrix = mult(modelViewMatrix, translate(position[0], position[1], position[2]));
    modelViewMatrix = mult(modelViewMatrix, scale(0.07, 0.07, 0.07));
    modelViewMatrix = mult(modelViewMatrix, rotate(theta[xAxis], vec3(1, 0, 0)));
    modelViewMatrix = mult(modelViewMatrix, rotate(theta[yAxis], vec3(0, 1, 0)));
    modelViewMatrix = mult(modelViewMatrix, rotate(theta[zAxis], vec3(0, 0, 1)));

    gl.uniformMatrix4fv(gl.getUniformLocation(program, "uModelViewMatrix"), false, flatten(modelViewMatrix));

    gl.drawArrays(gl.TRIANGLES, 0, colorsArray.length);

    requestAnimationFrame(render);
  }
};

shadedCube();
