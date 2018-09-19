"use strict";

var gl;
var vertices;
var xVelocity, yVelocity, bVelocity;
var xCenter, yCenter, xBase, yBase, xBullet, yBullet;
var radius = 0.05;
var bRadius = 0.025;
var u_vCenterLoc;
var u_ColorLoc;
var colors;
var program;
var bullets;
var bulletShot = false;

window.onload = function init()
{
    var canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }
    
    setup();

    //  Configure WebGL

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

    u_vCenterLoc = gl.getUniformLocation (program, "u_vCenter");
    u_ColorLoc = gl.getUniformLocation(program, "u_Color");

    var moveBaseRight = document.getElementById("base-right");
	moveBaseRight.onclick = function() {
		if (xBase + 0.05 < 1) {
			xBase += 0.1;
		}
		
	};
	var moveBaseLeft = document.getElementById("base-left");
	moveBaseLeft.onclick = function() {
		if (xBase - 0.05 > -1) {
			xBase -= 0.1;
		}
	};

	var increaseSpeed = document.getElementById("increase-speed");
	increaseSpeed.onclick = function() {
		if (xVelocity > 0) {
			xVelocity += 0.01;
		}
		else {
			xVelocity -= 0.01;
		}
		if (yVelocity > 0) {
			yVelocity += 0.01;
		}
		else {
			yVelocity -= 0.01;
		}
	}

	var decreaseSpeed = document.getElementById("decrease-speed");
	decreaseSpeed.onclick = function() {
		if ((xVelocity > 0) && (xVelocity - 0.01 > 0)) {
			xVelocity -= 0.01;
		}
		else if (xVelocity + 0.01 < 0){
			xVelocity += 0.01;
		}
		if ((yVelocity > 0) && (yVelocity - 0.01 > 0))  {
			yVelocity -= 0.01;
		}
		else if (yVelocity + 0.01 < 0) {
			yVelocity += 0.01;
		}
	}

	var shootButton = document.getElementById("shoot");
	shootButton.onclick = function() {
		bullets -= 1;
		document.getElementById("bulltesnum").innerHTML = "Number of bullets: " + bullets;
		if (bullets == 0) {
			alert("Game Over");
    		location.reload();
		}
		bulletShot = true;
		xBullet = xBase;
		yBullet = yBase;
	}
    
    render();
    
};

function setup() {
	bullets = 100;
    vertices = [];

    xBase = 0;
    yBase = -1;

    xCenter = 0.8;
    yCenter = 0.9;
    for (var i = 0; i < 36; i++) {	// Invader Coordinates
   		var x = radius*Math.cos(i * 10 *(Math.PI)/180);
   		var y = radius*Math.sin(i * 10 *(Math.PI)/180);
   		vertices.push(vec2(x, y));

    }

    vertices.push(vec2(-0.05, 0), vec2(-0.05, 0.05), vec2(0.05, 0.05), vec2(0.05, 0)); // Base Coordinates

    xVelocity = 0.005; 
    yVelocity = -0.005; 


    xBullet = xBase;
    yBullet = yBase

    bVelocity = 0.05;

    for (var i = 0; i < 36; i++) {	// Bullet Coordinates
   		var x = bRadius*Math.cos(i * 10 *(Math.PI)/180);
   		var y = bRadius*Math.sin(i * 10 *(Math.PI)/180);
   		vertices.push(vec2(x, y));

    }

    
}

function animate () {
    
    xCenter += xVelocity;
    yCenter += yVelocity;
    
    // check if xCenter/yCenter is out of bound 

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

    if ((yCenter - radius) < (yBase + 0.05)) {
    	if (((xCenter + radius) >= (xBase - 0.05)) && ((xCenter + radius) <= (xBase + 0.05))) {
    		alert("Game Over");
    		location.reload();
    	}
    	if (((xCenter - radius) >= (xBase - 0.05)) && ((xCenter - radius) <= (xBase + 0.05))) {
    		alert("Game Over");
    		location.reload();
    	}
    	
    }

    if (bulletShot) {
		yBullet += bVelocity;

		if (yBullet + radius > 1) {
			xBullet = xBase;
    		yBullet = yBase
			bulletShot = false;
		}

		if ((yBullet + bRadius >= yCenter - radius) && (yBullet + bRadius <= yCenter + radius)) {
			if ((xBullet + bRadius >= xCenter - radius) && (xBullet + bRadius <= xCenter + radius)) {
				alert("Congratulations! You won!");
				location.reload();
			}

			if ((xBullet - bRadius >= xCenter - radius) && (xBullet - bRadius <= xCenter + radius)) {
				alert("Congratulations! You won!");
				location.reload();
			}
		}
    }
 }    

function render() {
    gl.clear( gl.COLOR_BUFFER_BIT );

    
    gl.uniform3fv(u_ColorLoc, colors);
    gl.uniform2fv (u_vCenterLoc, vec2(xCenter, yCenter));
    gl.drawArrays( gl.TRIANGLE_FAN, 0, vertices.length - 40);	// Render invader

    animate();

    gl.uniform3fv(u_ColorLoc, vec3(1.0, 0.4, 0.4));
    gl.uniform2fv (u_vCenterLoc, vec2(xBase, yBase));
    gl.drawArrays( gl.TRIANGLE_FAN, 36, 4);		// Render base

    if (bulletShot) {
    	gl.uniform3fv(u_ColorLoc, vec3(0.2, 0.2, 0.2));
    	gl.uniform2fv (u_vCenterLoc, vec2(xBullet, yBullet));
    	gl.drawArrays( gl.TRIANGLE_FAN, 40, 36);		// Render base
    }

    requestAnimFrame(render);

}
