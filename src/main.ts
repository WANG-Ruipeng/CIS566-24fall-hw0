import {vec3, vec4} from 'gl-matrix';
const Stats = require('stats-js');
import * as DAT from 'dat.gui';
import Icosphere from './geometry/Icosphere';
import Square from './geometry/Square';
import OpenGLRenderer from './rendering/gl/OpenGLRenderer';
import Camera from './Camera';
import {setGL} from './globals';
import ShaderProgram, {Shader} from './rendering/gl/ShaderProgram';

import Cube from './geometry/Cube'

// Define an object with application parameters and button callbacks
// This will be referred to by dat.GUI's functions that add GUI elements.
const controls = {
  tesselations: 5,
  noiseColor: [255, 0, 0],
  baseColor: [255, 153, 0],
  noiseScaleX: 1.0,  
  noiseScaleY: 1.0,
  noiseScaleZ: 1.0,
  lightIntensity: 0.5,  
  'Load Scene': loadScene, 
};



let icosphere: Icosphere;
let square: Square;
let cube: Cube;
let prevTesselations: number = 5;
let time = 0.0;

function loadScene() {
  icosphere = new Icosphere(vec3.fromValues(0, 0, 0), 1, controls.tesselations);
  icosphere.create();
  square = new Square(vec3.fromValues(0, 0, 0));
  square.create();

  cube = new Cube(vec3.fromValues(0, 0, 0)); 
  cube.create();
}

function main() {
  // Initial display for framerate
  const stats = Stats();
  stats.setMode(0);
  stats.domElement.style.position = 'absolute';
  stats.domElement.style.left = '0px';
  stats.domElement.style.top = '0px';
  document.body.appendChild(stats.domElement);

  // Add controls to the gui
  const gui = new DAT.GUI();
  gui.add(controls, 'tesselations', 0, 8).step(1);
  gui.add(controls, 'Load Scene');
  gui.addColor(controls, 'noiseColor');
  gui.addColor(controls, 'baseColor'); 
  gui.add(controls, 'noiseScaleX', 0.1, 5.0).step(0.1); 
  gui.add(controls, 'noiseScaleY', 0.1, 5.0).step(0.1);
  gui.add(controls, 'noiseScaleZ', 0.1, 5.0).step(0.1);
  gui.add(controls, 'lightIntensity', 0.0, 1.0).step(0.01);

  // get canvas and webgl context
  const canvas = <HTMLCanvasElement> document.getElementById('canvas');
  const gl = <WebGL2RenderingContext> canvas.getContext('webgl2');
  if (!gl) {
    alert('WebGL 2 not supported!');
  }
  // `setGL` is a function imported above which sets the value of `gl` in the `globals.ts` module.
  // Later, we can import `gl` from `globals.ts` to access it
  setGL(gl);

  // Initial call to load scene
  loadScene();

  const camera = new Camera(vec3.fromValues(0, 0, 5), vec3.fromValues(0, 0, 0));

  const renderer = new OpenGLRenderer(canvas);
  renderer.setClearColor(0.2, 0.2, 0.2, 1);
  gl.enable(gl.DEPTH_TEST);

  const lambert = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/lambert-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/lambert-frag.glsl')),
  ]);

  // This function will be called every frame
  function tick() {
    time += 0.01;
    camera.update();
    stats.begin();
    gl.viewport(0, 0, window.innerWidth, window.innerHeight);
    renderer.clear();
    if(controls.tesselations != prevTesselations)
    {
      prevTesselations = controls.tesselations;
      icosphere = new Icosphere(vec3.fromValues(0, 0, 0), 1, prevTesselations);
      icosphere.create();
    }

    const colorVec = new Float32Array([
      controls.noiseColor[0] / 255.0,
      controls.noiseColor[1] / 255.0,
      controls.noiseColor[2] / 255.0,
      1.0  
    ]);
    const baseColorVec = new Float32Array([
      controls.baseColor[0] / 255.0,
      controls.baseColor[1] / 255.0,
      controls.baseColor[2] / 255.0,
      1.0
  ]);

    const noiseScale = new Float32Array([
      controls.noiseScaleX,
      controls.noiseScaleY,
      controls.noiseScaleZ
  ]);

    lambert.setUniform1f('u_Time', time);
    lambert.setUniform3fv('u_NoiseScale', noiseScale);
    lambert.setUniform1f('u_AmbientTerm', controls.lightIntensity);
    lambert.setUniform4fv('u_BaseColor', baseColorVec); 


    renderer.render(camera, lambert, [
      //icosphere,
      cube,
      //square,
      ],
      colorVec
    );
    stats.end();

    // Tell the browser to call `tick` again whenever it renders a new frame
    requestAnimationFrame(tick);
  }

  window.addEventListener('resize', function() {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.setAspectRatio(window.innerWidth / window.innerHeight);
    camera.updateProjectionMatrix();
  }, false);

  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.setAspectRatio(window.innerWidth / window.innerHeight);
  camera.updateProjectionMatrix();

  // Start the render loop
  tick();
}

main();
