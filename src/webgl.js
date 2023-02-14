const glsetup = () => {
    const canvas = document.querySelector('canvas#background');
    const gl = canvas.getContext("webgl");

    const vertexShaderSource = `
    attribute vec3 aPosition;
    varying   vec3 vPosition;
    void main() {
       gl_Position = vec4(aPosition, 1.0);
       vPosition = aPosition;
    }`

    const fragmentShaderSource = `
    precision mediump float;
    uniform float uTime;
    uniform float translationIntensity;

    varying vec3 vPosition;

    /* discontinuous pseudorandom uniformly distributed in [-0.5, +0.5]^3 */
vec3 random3(vec3 c) {
	float j = 4096.0*sin(dot(c,vec3(17.0, 59.4, 15.0)));
	vec3 r;
	r.z = fract(512.0*j);
	j *= .125;
	r.x = fract(512.0*j);
	j *= .125;
	r.y = fract(512.0*j);
	return r-0.5;
}



    const float F3 =  0.3333333;
const float G3 =  0.1666667;


/* 3d simplex noise */
float simplex3d(vec3 p) {
	 /* 1. find current tetrahedron T and it's four vertices */
	 /* s, s+i1, s+i2, s+1.0 - absolute skewed (integer) coordinates of T vertices */
	 /* x, x1, x2, x3 - unskewed coordinates of p relative to each of T vertices*/
	 
	 /* calculate s and x */
	 vec3 s = floor(p + dot(p, vec3(F3)));
	 vec3 x = p - s + dot(s, vec3(G3));
	 
	 /* calculate i1 and i2 */
	 vec3 e = step(vec3(0.0), x - x.yzx);
	 vec3 i1 = e*(1.0 - e.zxy);
	 vec3 i2 = 1.0 - e.zxy*(1.0 - e);
	 	
	 /* x1, x2, x3 */
	 vec3 x1 = x - i1 + G3;
	 vec3 x2 = x - i2 + 2.0*G3;
	 vec3 x3 = x - 1.0 + 3.0*G3;
	 
	 /* 2. find four surflets and store them in d */
	 vec4 w, d;
	 
	 /* calculate surflet weights */
	 w.x = dot(x, x);
	 w.y = dot(x1, x1);
	 w.z = dot(x2, x2);
	 w.w = dot(x3, x3);
	 
	 /* w fades from 0.6 at the center of the surflet to 0.0 at the margin */
	 w = max(0.6 - w, 0.0);
	 
	 /* calculate surflet components */
	 d.x = dot(random3(s), x);
	 d.y = dot(random3(s + i1), x1);
	 d.z = dot(random3(s + i2), x2);
	 d.w = dot(random3(s + 1.0), x3);
	 
	 /* multiply d by w^4 */
	 w *= w;
	 w *= w;
	 d *= w;
	 
	 /* 3. return the sum of the four surflets */
	 return dot(d, vec4(52.0));
}


/* const matrices for 3d rotation */
const mat3 rot1 = mat3(-0.37, 0.36, 0.85,-0.14,-0.93, 0.34,0.92, 0.01,0.4);
const mat3 rot2 = mat3(-0.55,-0.39, 0.74, 0.33,-0.91,-0.24,0.77, 0.12,0.63);
const mat3 rot3 = mat3(-0.71, 0.52,-0.47,-0.08,-0.72,-0.68,-0.7,-0.45,0.56);


    /* directional artifacts can be reduced by rotating each octave */
    float simplex3d_fractal(vec3 m) {
        return   0.5333333*simplex3d(m*rot1)
                +0.2666667*simplex3d(2.0*m*rot2)
                +0.1333333*simplex3d(4.0*m*rot3)
                +0.0666667*simplex3d(8.0*m);
    }

    void main() {          



        vec2 p = vPosition.xy;


        
        vec3 p3 = vec3(vec3(vPosition.x/2.0 + uTime*2.0 * translationIntensity,vPosition.y/2.0 + uTime * translationIntensity,uTime*0.025));
        
     float   value = simplex3d_fractal(p3*8.0+8.0);
	
	
	value = 0.5 + 0.5*value;
	// value *= smoothstep(0.0, 0.005, abs(0.6-p.x));
    gl_FragColor = vec4(vec3(value),1.0) + vec4(0.0,0.0,0.05,0.0);
               }

`

    function addshader(gl, program, type, src) {
        var shader = gl.createShader(type);
        gl.shaderSource(shader, src);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            throw "Cannot compile shader:\n\n" + gl.getShaderInfoLog(shader);
        }
        gl.attachShader(program, shader);
    }

    function init() {
        var program = gl.createProgram();
        var buffer = gl.createBuffer();
        addshader(gl, program, gl.VERTEX_SHADER, vertexShaderSource);
        addshader(gl, program, gl.FRAGMENT_SHADER, fragmentShaderSource);
        gl.linkProgram(program);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS))
            throw "Could not link the shader program!";
        gl.useProgram(program);

        // Create a square as a strip of two triangles.
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array([
                -1, 1,
                0, 1,
                1, 0,
                -1, -1,
                0, 1,
                -1, 0]),
            gl.STATIC_DRAW
        );

        gl.aPosition = gl.getAttribLocation(program, "aPosition");
        gl.enableVertexAttribArray(gl.aPosition);
        gl.vertexAttribPointer(gl.aPosition, 3, gl.FLOAT, false, 0, 0);
        gl.uTime = gl.getUniformLocation(program, "uTime");
        gl.translationIntensity = gl.getUniformLocation(program, "translationIntensity");

    }

    const time0 = performance.now() / 1000;

    function update(time) {
        gl.uniform1f(gl.translationIntensity, window.innerWidth < 200 ? 0.05 : 0.02);
        gl.uniform1f(gl.uTime, (time / 1000 - time0) * 0.4);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        // Start the next frame
        window.requestAnimationFrame(update);
    }

    init();
    update();
}

glsetup();
