"use strict";

var gl;
var canvas;

var printDay;

var mvpMatrix, mvMatrix;
var program;

// common modelview projection matrix
var commonMVPMatrix;

// common modelview matrix
var commonMVMatrix;

// matrix stack
var stack = [];

var a_positionLoc;
//var u_colorLoc;

var u_mvpMatrixLoc;

// Last time that this function was called
var g_last = Date.now();
var elapsed = 0;
var mspf = 1000/30.0;  // ms per frame

// scale factors
var rSunMult = 45;      // keep sun's size manageable
var rPlanetMult = 2000;  // scale planet sizes to be more visible

// surface radii (km)
var rSun = 696000;
var rMercury = 2440;
var rVenus = 6052;
var rEarth = 6371;
var rMoon = 1737;

// orbital radii (km)
var orMercury = 57909050;
var orVenus = 108208000;
var orEarth = 149598261;
var orMoon = 384399;

// orbital periods (Earth days)
var pMercury = 88;
var pVenus = 225;
var pEarth = 365;
var pMoon = 27;

// time
var currentDay;
var daysPerFrame;

var globalScale;

// vertices
var circleVertexPositionData = []; // for orbit
var sphereVertexPositionData = []; // for planet
var sphereVertexIndexData = []; // for planet

var circleVertexPositionBuffer;
var sphereVertexPositionBuffer;
var sphereVertexIndexBuffer;

var animate;
var m_inc;
var m_curquat;
var m_mousex = 1;
var m_mousey = 1;
var trackballMove = false;

var angleOffset
var orMoonNew;

var normalsArray = [];
var a_vNormalLoc;
var nBuffer;
var nMatrix, u_nMatrixLoc, u_useLightingLoc, u_mvLoc;

// Lighting
var lightPosition = vec4(0.0, 0.0, 1.0, 0.0 );

var red = 1.0;
var green = 1.0;
var blue = 1.0;

var lightAmbient = vec4(0.2, 0.2, 0.2, 1.0 );
var lightDiffuse = vec4( red, green, blue, 1.0 );
var lightSpecular = vec4( red, green, blue, 1.0 );

var materialShininess = 20.0;

// Texture
var texCoordsArray = [];
var a_vTextureCoordLoc;
var tBuffer;
var earthImg, moonImg, sunImg, mercuryImg, venusImg;
var u_textureSamplerLoc;
var sunTexture, earthTexture, venusTexture, mercTexture, moonTexture;


function mouseMotion( x,  y)
{
        var lastquat;
        if (m_mousex != x || m_mousey != y)
        {
            lastquat = trackball(
                  (2.0*m_mousex - canvas.width) / canvas.width,
                  (canvas.height - 2.0*m_mousey) / canvas.height,
                  (2.0*x - canvas.width) / canvas.width,
                  (canvas.height - 2.0*y) / canvas.height);
            m_curquat = add_quats(lastquat, m_curquat);
            m_mousex = x;
            m_mousey = y;
        }
}

function configureTexture( image ) {
    var texture = gl.createTexture();
    gl.bindTexture( gl.TEXTURE_2D, texture );
    
    //Flips the source data along its vertical axis when texImage2D or texSubImage2D are called when param is true. The initial value for param is false.
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    
    gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGB,
         gl.RGB, gl.UNSIGNED_BYTE, image );
    gl.generateMipmap( gl.TEXTURE_2D );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_LINEAR );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST );

    return texture;
}

window.onload = function init()
{
    canvas = document.getElementById( "gl-canvas" );
    printDay = document.getElementById("printDay");
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }
    
    //
    //  Configure WebGL
    //
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.85, 0.85, 0.85, 1.0 );
    
    gl.enable(gl.DEPTH_TEST);

    m_curquat = trackball(0, 0, 0, 0);
 
    currentDay = 0;
    daysPerFrame = 0.0625;
    
    // global scaling for the entire orrery
    globalScale = 50.0 / ( orEarth + orMoon + ( rEarth + 2 * rMoon ) * rPlanetMult );
    
    setupCircle();

    setupSphere();
    
    //  Load shaders and initialize attribute buffers
    
    program = initShaders( gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    
    // Load the data into the GPU
    
    circleVertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, circleVertexPositionBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(circleVertexPositionData), gl.STATIC_DRAW );

    sphereVertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, sphereVertexPositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sphereVertexPositionData), gl.STATIC_DRAW);
    
    sphereVertexIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sphereVertexIndexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(sphereVertexIndexData), gl.STATIC_DRAW);

    // load images and textures

    sunImg = new Image();
    sunImg.onload = function() {
        sunTexture =configureTexture( sunImg );
    }
    sunImg.src = "sun.jpg";

    venusImg = new Image();
    venusImg.onload = function() {
        venusTexture = configureTexture( venusImg );
    }
    venusImg.src = "venus.jpg";

    mercuryImg = new Image();
    mercuryImg.onload = function() {
        mercTexture = configureTexture( mercuryImg );
    }
    mercuryImg.src = "mercury.jpg";

    earthImg = new Image();
    earthImg.onload = function() {
        earthTexture = configureTexture( earthImg );
    }
    earthImg.src = "earth.jpg";

    moonImg = new Image();
    moonImg.onload = function() {
        moonTexture = configureTexture( moonImg );
    }
    moonImg.src = "moon.jpg";

    tBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, tBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(texCoordsArray), gl.STATIC_DRAW );
    
    a_vTextureCoordLoc = gl.getAttribLocation( program, "a_vTextureCoord" );
    gl.vertexAttribPointer( a_vTextureCoordLoc, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( a_vTextureCoordLoc );

    // Associate out shader variables with our data buffer
    
    a_positionLoc = gl.getAttribLocation( program, "a_vPosition" );

    u_mvpMatrixLoc = gl.getUniformLocation( program, "u_mvpMatrix" );
    u_mvLoc = gl.getUniformLocation( program, "u_modelViewMatrix" );

    u_useLightingLoc = gl.getUniformLocation(program, "u_UseLighting");

    u_nMatrixLoc = gl.getUniformLocation( program, "u_nMatrix" );

    var increaseDPF = document.getElementById("increase-DPF");
    increaseDPF.onclick = function() {
    	daysPerFrame = daysPerFrame*2;
    }

    var decreaseDPF = document.getElementById("decrease-DPF");
    decreaseDPF.onclick = function() {
    	daysPerFrame = daysPerFrame*0.5;
    }

    if (document.getElementById("animon").checked == true){
    	animate = true;
    }

    canvas.addEventListener("mousedown", function(event){
        m_mousex = event.clientX - event.target.getBoundingClientRect().left;
        m_mousey = event.clientY - event.target.getBoundingClientRect().top;
        trackballMove = true;
    });


    // for trackball
    canvas.addEventListener("mouseup", function(event){
        trackballMove = false;
    });

    // for trackball
    canvas.addEventListener("mousemove", function(event){
      if (trackballMove) {
        var x = event.clientX - event.target.getBoundingClientRect().left;
        var y = event.clientY - event.target.getBoundingClientRect().top;
        mouseMotion(x, y);
      }
    });

    gl.uniform1f( gl.getUniformLocation(program,
       "u_shininess"),materialShininess );

    document.getElementById("rSlider").onchange = function(event) {
        red = event.target.value;
    };

    document.getElementById("gSlider").onchange = function(event) {
        green = event.target.value;
    };

    document.getElementById("bSlider").onchange = function(event) {
        blue = event.target.value;
    };
    
    render();
    
};

function setupCircle() {
    var increment = 0.1;
    for (var theta=0.0; theta < Math.PI*2; theta+=increment) {
        circleVertexPositionData.push(vec3(Math.cos(theta+increment), 0.0, Math.sin(theta+increment)));
    }
}

function setupSphere() {
    var latitudeBands = 50;
    var longitudeBands = 50;
    var radius = 1.0;
    
    // compute sampled vertex positions
    for (var latNumber=0; latNumber <= latitudeBands; latNumber++) {
        var theta = latNumber * Math.PI / latitudeBands;
        var sinTheta = Math.sin(theta);
        var cosTheta = Math.cos(theta);
        
        for (var longNumber=0; longNumber <= longitudeBands; longNumber++) {
            var phi = longNumber * 2 * Math.PI / longitudeBands;
            var sinPhi = Math.sin(phi);
            var cosPhi = Math.cos(phi);
            
            var x = cosPhi * sinTheta;
            var y = cosTheta;
            var z = sinPhi * sinTheta;
            
            sphereVertexPositionData.push(radius * x);
            sphereVertexPositionData.push(radius * y);
            sphereVertexPositionData.push(radius * z);

            // normal vectors
            normalsArray.push(x);
            normalsArray.push(y);
            normalsArray.push(z);

            // texture array
            var u = 1 - (longNumber / longitudeBands);
            var v = 1 - (latNumber / latitudeBands);

            texCoordsArray.push(u);
            texCoordsArray.push(v);
        }
    }
    
    // create the actual mesh, each quad is represented by two triangles
    for (var latNumber=0; latNumber < latitudeBands; latNumber++) {
        for (var longNumber=0; longNumber < longitudeBands; longNumber++) {
            var first = (latNumber * (longitudeBands + 1)) + longNumber;
            var second = first + longitudeBands + 1;
            // the three vertices of the 1st triangle
            sphereVertexIndexData.push(first);
            sphereVertexIndexData.push(second);
            sphereVertexIndexData.push(first + 1);
            // the three vertices of the 2nd triangle
            sphereVertexIndexData.push(second);
            sphereVertexIndexData.push(second + 1);
            sphereVertexIndexData.push(first + 1);
        }
    }
}

function drawCircle(color, size) {
    // set uniforms
    gl.uniform1i(u_useLightingLoc, false);
    
    var topm = stack[stack.length-1]; // get the matrix at the top of stack
    mvpMatrix = mult(topm, scalem(size, size, size));
    mvpMatrix = mult(commonMVPMatrix, mvpMatrix);
    gl.uniformMatrix4fv(u_mvpMatrixLoc, false, flatten(mvpMatrix) );
    
    gl.enableVertexAttribArray( a_positionLoc );
    gl.bindBuffer(gl.ARRAY_BUFFER, circleVertexPositionBuffer);
    gl.vertexAttribPointer( a_positionLoc, 3, gl.FLOAT, false, 0, 0 );
    gl.drawArrays( gl.LINE_LOOP, 0, circleVertexPositionData.length );
}

function drawSphere(color, size, texture) {
    // set uniforms

    var materialAmbient = vec4( 0.2, 0.2, 0.2, 1.0 );
    //var materialDiffuse = vec4(red, green, blue, 1.0); //vec4( color[0], color[1], color[2], 1.0 );
    //var materialSpecular = vec4(red, green, blue, 1.0); //vec4( color[0], color[1], color[2], 1.0 );

    lightDiffuse = vec4( red, green, blue, 1.0 );
    lightSpecular = vec4( red, green, blue, 1.0 );
   
    var ambientProduct = mult(lightAmbient, materialAmbient);
    var diffuseProduct = lightDiffuse; //mult(lightDiffuse, materialDiffuse);
    var specularProduct = lightSpecular; //mult(lightSpecular, materialSpecular);
  
     gl.uniform4fv( gl.getUniformLocation(program,
       "u_ambientProduct"),flatten(ambientProduct) );
    gl.uniform4fv( gl.getUniformLocation(program,
       "u_diffuseProduct"),flatten(diffuseProduct) );
    gl.uniform4fv( gl.getUniformLocation(program,
       "u_specularProduct"),flatten(specularProduct) );
    gl.uniform4fv( gl.getUniformLocation(program,
       "u_lightPosition"),flatten(lightPosition) );

  
    gl.uniform1i(u_useLightingLoc, true);
    
    var topm = stack[stack.length-1]; // get the matrix at the top of stack
    mvpMatrix = mult(topm, scalem(size, size, size));
    mvMatrix = mult(topm, scalem(size, size, size));

    mvpMatrix = mult(commonMVPMatrix, mvpMatrix);

    mvMatrix =  mult(commonMVMatrix, mvMatrix);
    gl.uniformMatrix4fv(u_mvpMatrixLoc, false, flatten(mvpMatrix) );

    nMatrix = normalMatrix(mvMatrix, true);
    gl.uniformMatrix3fv(u_nMatrixLoc, false, flatten(nMatrix) );
    gl.uniformMatrix4fv(u_mvLoc, false, flatten(mvMatrix) );
    

    nBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(normalsArray), gl.STATIC_DRAW);
    
    a_vNormalLoc = gl.getAttribLocation( program, "a_vNormal");
    gl.vertexAttribPointer(a_vNormalLoc, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_vNormalLoc);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    u_textureSamplerLoc = gl.getUniformLocation(program, "u_textureSampler");
    gl.uniform1i(u_textureSamplerLoc, 0);

    gl.enableVertexAttribArray( a_positionLoc );
    gl.bindBuffer(gl.ARRAY_BUFFER, sphereVertexPositionBuffer);
    gl.vertexAttribPointer(a_positionLoc, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sphereVertexIndexBuffer);
    gl.drawElements(gl.TRIANGLES, sphereVertexIndexData.length, gl.UNSIGNED_SHORT, 0);


}

function drawOrbits() {
    var gray = vec3( 0.2, 0.2, 0.2 );
    
    // Venus
    stack.push(mat4());
    drawCircle( gray, orVenus );
    stack.pop();

    // Mercury
    stack.push(mat4());
    drawCircle( gray, orMercury );
    stack.pop();

    // Earth
    stack.push(mat4());
    drawCircle( gray, orEarth);

    // Moon
    orMoonNew = Math.max(orMoon,(rEarth+rMoon)* rPlanetMult);
    var m = mult(rotateY(angleOffset/pEarth), mult(translate(orEarth, 0.0, 0.0), rotateZ(23.5)));
    stack.push(m);
    drawCircle( gray, orMoonNew);
    stack.pop();


}

function drawBodies() {
    var size;
    angleOffset = currentDay * 360.0;  // days * degrees
     
    // Sun
    size = rSun * rSunMult;
    stack.push(mat4());
    drawSphere( vec3( 1.0, 1.0, 0.0 ), size, sunTexture);
    stack.pop();

    // Venus
    size = rVenus * rPlanetMult;
    stack.push(mult(rotateY(angleOffset/pVenus), translate(orVenus, 0.0, 0.0)));
    drawSphere( vec3( 0.5, 1.0, 0.5 ), size, venusTexture );
    stack.pop();

    // Mercury
    size = rMercury * rPlanetMult;
    stack.push(mult(rotateY(angleOffset/pMercury), translate(orMercury, 0.0, 0.0)));
    drawSphere( vec3( 1.0, 0.5, 0.5 ), size, mercTexture );
    stack.pop();

    // Earth
    size = rEarth * rPlanetMult;
    stack.push(mult(rotateY(angleOffset/pEarth), mult(translate(orEarth, 0.0, 0.0), rotateZ(23.5))));
    stack.push(mult(rotateY(angleOffset/pEarth), mult(translate(orEarth, 0.0, 0.0), rotateY(angleOffset), rotateZ(23.5))));
    drawSphere( vec3( 0.5, 0.5, 1.0 ), size, earthTexture);
    
    // Moon
    size = rMoon * rPlanetMult;
    orMoonNew = Math.max(orMoon,(rEarth+rMoon)* rPlanetMult);
    var m = mult(rotateY(angleOffset/pMoon), translate(orMoonNew, 0.0, 0.0));
    var topm = stack[stack.length-2];
    stack[stack.length-1] = mult(topm, m);
    drawSphere( vec3( 1.0, 1.0, 1.0 ), size, moonTexture);
    stack.pop();

    
}

function drawDay() {
    var string = 'Day ' + currentDay.toString();
    printDay.innerHTML = string;
}

function drawAll()
{
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );
    
    // all planets and orbits will take the following transformation
    
    // global scaling
    commonMVPMatrix = scalem(globalScale, globalScale, globalScale);

    // tilt along x axis
    commonMVPMatrix = mult(rotateX(15), commonMVPMatrix);

    // trackball matrix
    m_inc = build_rotmatrix(m_curquat);

    commonMVPMatrix = mult(m_inc, commonMVPMatrix);
    
    // viewing matrix
    commonMVPMatrix = mult(lookAt(vec3(0.0, 0.0, 100.0),
                                  vec3(0.0, 0.0, 0.0),
                                  vec3(0.0, 1.0, 0.0)),
                           commonMVPMatrix);

    // modelview matrix
    commonMVMatrix = commonMVPMatrix;
    
    // projection matrix
    commonMVPMatrix = mult(perspective(30, 2.0, 0.1, 1000.0),
                           commonMVPMatrix);

    if (document.getElementById("orbon").checked == true) {
        drawOrbits();
    }
    
    drawBodies();

    if (document.getElementById("dayon").checked == true){
        drawDay();
    }
    else {
    	printDay.innerHTML = "";
    }
    
}

var render = function() {
    // Calculate the elapsed time
    
    if (document.getElementById("animon").checked == true){
	    var now = Date.now(); // time in ms
	    elapsed += now - g_last;
	    g_last = now;
	    if (elapsed >= mspf) {
	        currentDay += daysPerFrame;
	        elapsed = 0;
	    }
	}
	requestAnimFrame(render);
	drawAll();
};
