"use strict";

var gl;
var vertices;
var xVelocity, yVelocity;
var xCenter, yCenter;
var radius = 0.05;
var u_vCenterLoc;
var u_ColorLoc;
var colors;
var program;

window.onload = function init()
{
    var canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }
    
    setup();

    //
    //  Configure WebGL
    //
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.8, 0.8, 0.8, 1.0 );
    colors = vec3(0.4, 0.4, 1.0);

    
    //  Load shaders and initialize attribute buffers
    
    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
    
    // Load the data into the GPU
    
    var vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW );

    // Associate out shader variables with our data buffer
    
    var a_vPositionLoc = gl.getAttribLocation( program, "a_vPosition" );
    gl.vertexAttribPointer( a_vPositionLoc, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( a_vPositionLoc );
    
    // associate the center with uniform shader variable
    // write your code here

    u_vCenterLoc = gl.getUniformLocation (program, "u_vCenter");
    u_ColorLoc = gl.getUniformLocation(program, "u_Color");
    
    render();
    
};

function setup() {
    vertices = [];

    xCenter = randomPosNegOne();
    yCenter = randomPosNegOne();
    for (var i = 0; i < 36; i++) {
   		var x = radius*Math.cos(i * 10 *(Math.PI)/180);
   		var y = radius*Math.sin(i * 10 *(Math.PI)/180);
   		vertices.push(vec2(x, y));

    }
    vertices.push(vec2(0, -512), vec2(0, -511.95), vec2(0.1, -511.95), vec2(0.1, -512));


    // check if xCenter/yCenter is out of bound (use extend),
    // if yes, keep it in bound
    // write your code here


    xVelocity = randomPosNegOne() * 0.025;
    yVelocity = randomPosNegOne() * 0.025;
    
}

function randomPosNegOne()
{
    return Math.random() > 0.5 ? Math.random() : -Math.random();
}

function animate () {
    
    // increment xCenter and yCenter
    // write your code here
    xCenter += xVelocity;
    yCenter += yVelocity;
    
    // check if xCenter/yCenter is out of bound (use extend),
    // if yes, keep it in bound and reverse the xVelocity/yVelocity
    // write your code here

    if (xCenter + radius >= 1){
    	xVelocity = xVelocity*-1;
    	xCenter += xVelocity;

    }

    if (xCenter - radius <= -1){
    	xVelocity = xVelocity*-1;
    	xCenter += xVelocity;

    }

    if (yCenter + radius >= 1) {
    	yVelocity = yVelocity*-1;
    	yCenter += yVelocity;
    }

    if (yCenter - radius <= -1) {
    	yVelocity = yVelocity*-1;
    	yCenter += yVelocity;
    }
    
}

function render() {
    gl.clear( gl.COLOR_BUFFER_BIT );

    animate();

    var a_vPositionLoc = gl.getAttribLocation( program, "a_vPosition" );
    gl.vertexAttribPointer( a_vPositionLoc, 2, gl.FLOAT, false, 0, 0);
    // update xCenter/yCenter as uniform to shader
    // write your code here
    gl.uniform3fv(u_ColorLoc, colors);
    gl.uniform2fv (u_vCenterLoc, vec2(xCenter, yCenter));
    gl.drawArrays( gl.TRIANGLE_FAN, 0, (vertices.length - 4));
    //console.log(vertices.length);

    gl.vertexAttribPointer( a_vPositionLoc, 2, gl.FLOAT, false, 0, 72);
    gl.uniform3fv(u_ColorLoc, colors);
    gl.uniform2fv (u_vCenterLoc, vec2(0.5, -512));
    gl.drawArrays( gl.TRIANGLE_FAN, 36, 4);

    requestAnimFrame(render);

}
