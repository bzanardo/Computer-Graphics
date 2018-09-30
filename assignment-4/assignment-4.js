"use strict";

var canvas;
var gl;

var theta = 0.0;
var u_baseColorLoc;
var u_cMatrixLoc;
var vertices = [];
var radius = 0.8


window.onload = function init()
{
    canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    //
    //  Configure WebGL
    //
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.9, 0.9, 0.9, 1.0 );

    //  Load shaders and initialize attribute buffers
    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
    

    for (var i = 0; i < 36; i++) {  // Circle
        var x = radius*Math.cos(i * 10 *(Math.PI)/180);
        var y = radius*Math.sin(i * 10 *(Math.PI)/180);
        vertices.push(vec3(x, y, 0));

    }

    var vertices1 = [[-0.622973333333,0.828643333333], // 0
                [-0.266306666667,0.828643333333],
                [-0.06964,0.51531],
                [0.407026666667,0.51531],
                [0.407026666667,0.591976666667],
                [0.277026666667,0.59531],
                [0.277026666667,0.828643333333],
                [0.777026666667,0.828643333333],
                [0.777026666667,0.59531],
                [0.64036,0.594133333333],
                [0.64036,0.517466666667],
                [0.767026666667,0.508643333333],
                [0.943693333333,0.32531],
                [0.95036,-0.28469],
                [0.76036,-0.478023333333],
                [0.637026666667,-0.481356666667],
                [0.637026666667,-0.81469],
                [0.40036,-0.818023333333],
                [0.20036,-0.481356666667],
                [-0.262973333333,-0.478023333333],
                [-0.262973333333,-0.601356666667],
                [-0.142973333333,-0.608023333333],
                [-0.142973333333,-0.81469],
                [-0.622973333333,-0.818023333333],
                [-0.622973333333,-0.608023333333],
                [-0.472973333333,-0.60018],
                [-0.472973333333,-0.48018],
                [-0.926306666667,-0.478023333333],
                [-0.926306666667,-0.281356666667],
                [-0.80964,-0.27469],
                [-0.80964,0.301976666667],
                [-0.926306666667,0.308643333333],
                [-0.926306666667,0.50531],
                [-0.46964,0.51531],
                [-0.46964,0.591976666667],
                [-0.622973333333,0.591976666667],
                [-0.58964,0.30531],
                [-0.47616,0.30531],
                [-0.47616,-0.278023333333],
                [-0.58964,-0.271356666667],
                [-0.259493333333,0.301976666667],
                [0.0805066666667,-0.278023333333],
                [-0.259493333333,-0.27469],
                [0.0570266666667,0.301976666667],
                [0.407173333333,0.301976666667],
                [0.407173333333,-0.27469],
                [0.637173333333,0.30531],
                [0.70036,0.30531],
                [0.76036,0.23531],
                [0.757026666667,-0.218023333333],
                [0.70036,-0.281356666667],
                [0.63384,-0.27469] // 51
                ];

    var index = [[0, 1, 34],
                [0, 34, 35],
                [1, 2, 34],
                [2, 34, 33],
                [32, 11, 47],
                [3, 4, 10],
                [4, 9, 10],
                [5, 6, 8],
                [8, 7, 6],
                [31, 32, 47],
                [32, 11, 47],
                [47, 11, 48],
                [48, 11, 12],
                [48, 12, 13],
                [48, 49, 13],
                [49, 13, 14],
                [49, 50, 14],
                [50, 27, 14],
                [27, 28, 50],
                [46, 51, 44],
                [44, 45, 51],
                [45, 43, 41],
                [41, 43, 40],
                [40, 42, 37],
                [42, 37, 38],
                [36, 39, 30],
                [30, 29, 39],
                [26, 19, 20],
                [20, 25, 26],
                [24, 21, 22],
                [22, 23, 24],
                [18, 15, 17],
                [17, 18, 15],
                [15, 16, 17]];

    for (var i = 0; i < index.length; i++) {    // ND Logo coordinates
        for (var j = 0; j < 3; j++) {
            var x = vertices1[index[i][j]];
            x.push(0.0);
            vertices.push(vec3(x[0], x[1], x[2]));
        }
    }

    vertices.push(vec3(-0.05, 0, 0), vec3(-0.05, 0.05, 0), vec3(0.05, 0.05,0), vec3(0.05, 0, 0));

    
    // Load the data into the GPU
    var vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW );

    // Associate out shader variables with our data buffer
    var a_vPositionLoc = gl.getAttribLocation( program, "a_vPosition" );
    gl.vertexAttribPointer( a_vPositionLoc, 3, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( a_vPositionLoc );
    
    u_baseColorLoc = gl.getUniformLocation( program, "u_baseColor" );
    u_cMatrixLoc = gl.getUniformLocation( program, "u_cMatrix" );

    render();
};


function render() {
    
    gl.clear( gl.COLOR_BUFFER_BIT );
    
    var scaling_c = 0.95;   // scale white circle
    var scaling_l = 0.30;   // scale logo
    var scaling_s = 0.03;   // scale small gold circle
    var scaling_hm = 0.7;   // scale hour marks
    var scaling_mm = 0.4;   // scale minute marks
    var scaling_hourX = 0.3;    // scale hour hand
    var scaling_hourY = 7.0;
    var scaling_minuteX = 0.15;  // scale minute hand
    var scaling_minuteY = 10.0;
    var scaling_secondX = 0.07;
    var scaling_secondY = 12.0;

    var pm = ortho(-1, 1, -1, 1, -1, 1);    // projection matrix
    
    var tm, sm, rm; // translation, scaling, rotation
    var outerMat, innerMat, logoMat, centerMat, hourMat, minuteMat, hourHand, minuteHand, secondHand; // current transformation matrix

    // Gold circle
    outerMat = mat4();
    outerMat = mult(pm, outerMat);

    gl.uniform3fv( u_baseColorLoc, vec3( 0.85, 0.65, 0.125 ) );
    gl.uniformMatrix4fv(u_cMatrixLoc, false, flatten(outerMat));
    gl.drawArrays( gl.TRIANGLE_FAN, 0, 36);


    // White circle
    innerMat = mat4();
    sm = scalem(scaling_c, scaling_c, 1.0);
    innerMat = mult(sm, innerMat);
    innerMat = mult(pm, innerMat);

    gl.uniform3fv( u_baseColorLoc, vec3( 1.0, 1.0, 1.0 ) );
    gl.uniformMatrix4fv(u_cMatrixLoc, false, flatten(innerMat));
    gl.drawArrays( gl.TRIANGLE_FAN, 0, 36);


    // ND Logo

    logoMat = mat4();
    sm = scalem(scaling_l, scaling_l, 1.0);
    logoMat = mult(sm, logoMat);
    logoMat = mult(pm, logoMat);


    for (var i=0; i < 34; i++)
    {
        gl.uniform3fv(u_baseColorLoc, vec3( 0.0, 0.0, 0.8 ));
        gl.uniformMatrix4fv(u_cMatrixLoc, false, flatten(logoMat));
        gl.drawArrays( gl.TRIANGLES, 36+(i*3), 3);
    
    }

    // Small gold circle

    centerMat = mat4();
    sm = scalem(scaling_s, scaling_s, 1.0);
    centerMat = mult(sm, centerMat);
    centerMat = mult(pm, centerMat);

    gl.uniform3fv( u_baseColorLoc, vec3( 0.85, 0.65, 0.125 ) );
    gl.uniformMatrix4fv(u_cMatrixLoc, false, flatten(centerMat));
    gl.drawArrays( gl.TRIANGLE_FAN, 0, 36);

    // Hour markers
    hourMat = mat4();
    theta = 90;
    var hourMarkersMats = [];

    for (var i = 0; i < 12; i++) {
        hourMat = mat4();
        sm = scalem(scaling_hm, scaling_mm, 1.0);
        hourMat = mult(sm, hourMat);
        var xpos = ((radius*scaling_c*scaling_c)*Math.cos(theta*(Math.PI)/180)) ;
        var ypos = ((radius*scaling_c*scaling_c)*Math.sin(theta* (Math.PI)/180));
        theta += 30;

        rm = rotateZ(i*30 + 90);
        hourMat = mult(rm, hourMat);

        tm = translate(xpos, ypos, 0.0);
        hourMat = mult(tm, hourMat)
        hourMat = mult(pm, hourMat);

        hourMarkersMats[i] = hourMat;

    }

    for (var i = 0; i < 12; i++) {
        hourMat = hourMarkersMats[i];
        gl.uniform3fv(u_baseColorLoc, vec3( 0.0, 0.0, 0.8));
        gl.uniformMatrix4fv(u_cMatrixLoc, false, flatten(hourMat));
        gl.drawArrays( gl.TRIANGLE_FAN, vertices.length - 4, 4);
    }

    // Minute markers

    minuteMat = mat4();
    theta = 90;
    var minuteMarkersMats = [];

    for (var i = 0; i < 60; i++) {
        minuteMat = mat4();
        sm = scalem(scaling_mm, scaling_mm, 1.0);
        minuteMat = mult(sm, minuteMat);

        var xpos = ((radius*scaling_c*0.97)*Math.cos(theta*(Math.PI)/180)) ;
        var ypos = ((radius*scaling_c*0.97)*Math.sin(theta* (Math.PI)/180));
        theta += 6;

        rm = rotateZ(i*6 + 90);
        minuteMat = mult(rm, minuteMat);

        tm = translate(xpos, ypos, 0.0);
        minuteMat = mult(tm, minuteMat)
        minuteMat = mult(pm, minuteMat);

        minuteMarkersMats[i] = minuteMat;

    }
    
    for (var i = 0; i < 60; i++) {
        minuteMat = minuteMarkersMats[i];
        gl.uniform3fv(u_baseColorLoc, vec3( 0.0, 0.0, 0.8));
        gl.uniformMatrix4fv(u_cMatrixLoc, false, flatten(minuteMat));
        gl.drawArrays( gl.TRIANGLE_FAN, vertices.length - 4, 4);
    }

    // Hour hand

    var d = new Date();
    var hours = d.getHours();

    if (hours > 12) {
        hours = hours - 12;
    }


    hourHand = mat4();
    sm = scalem(scaling_hourX, scaling_hourY, 1.0);
    hourHand = mult(sm, hourHand);

    var hourTheta = hours * -30;

    rm = rotateZ(hourTheta);
    hourHand = mult(rm, hourHand);
    
    gl.uniform3fv(u_baseColorLoc, vec3( 0.85, 0.65, 0.125));
    gl.uniformMatrix4fv(u_cMatrixLoc, false, flatten(hourHand));
    gl.drawArrays( gl.TRIANGLE_FAN, vertices.length - 4, 4);

    // Minute hand

    var minutes = d.getMinutes();

    minuteHand = mat4();
    sm = scalem(scaling_minuteX, scaling_minuteY, 1.0);
    minuteHand = mult(sm, minuteHand);

    var minuteTheta = -6 * minutes;

    rm = rotateZ(minuteTheta);
    minuteHand = mult(rm, minuteHand);
    
    gl.uniform3fv(u_baseColorLoc, vec3( 0.85, 0.65, 0.125));
    gl.uniformMatrix4fv(u_cMatrixLoc, false, flatten(minuteHand));
    gl.drawArrays( gl.TRIANGLE_FAN, vertices.length - 4, 4);

     // Second hand

    var seconds = d.getSeconds();

    secondHand = mat4();
    sm = scalem(scaling_secondX, scaling_secondY, 1.0);
    secondHand = mult(sm, secondHand);

    var secondTheta = -6 * seconds;

    rm = rotateZ(secondTheta);
    secondHand = mult(rm, secondHand);
    
    gl.uniform3fv(u_baseColorLoc, vec3( 0.85, 0.65, 0.125));
    gl.uniformMatrix4fv(u_cMatrixLoc, false, flatten(secondHand));
    gl.drawArrays( gl.TRIANGLE_FAN, vertices.length - 4, 4);

    
    window.requestAnimFrame(render);
}
