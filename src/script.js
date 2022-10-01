import "./style.css";
import * as THREE from "three";
import * as dat from "lil-gui";
import gsap from "gsap";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

/**
 * Debug
 */
const gui = new dat.GUI();

const parameters = {
  materialColor: "#EFDECD",
};

gui.addColor(parameters, "materialColor").onChange(() => {
  material.color.set(parameters.materialColor);
  particlesMaterial.color.set(parameters.materialColor);
});

/**
 * Base
 */
// Canvas
const canvas = document.querySelector("canvas.webgl");

// Scene
const scene = new THREE.Scene();

/**
 * Objects
 */
// Texture
const textureLoader = new THREE.TextureLoader();
const gradientTexture = textureLoader.load("textures/gradients/3.jpg");
gradientTexture.magFilter = THREE.NearestFilter;

// Material
const material = new THREE.MeshToonMaterial({
  color: parameters.materialColor,
  gradientMap: gradientTexture,
});

/**
 * Models
 */
const gltfLoader = new GLTFLoader();

const brain = await gltfLoader.loadAsync("/models/brain/scene.gltf");
brain.scene.children[0].scale.set(0.01, 0.01, 0.01);
brain.scene.traverse((o) => {
  console.log(o);
  if (o.isMesh) {
    console.log("Updating material");
    o.material = material;
  }
});
const mesh1 = brain.scene;

// Objects
const objectsDistance = 4;
// const mesh1 = new THREE.Mesh(
//     new THREE.TorusGeometry(1, 0.4, 16, 60),
//     material
// )
// const mesh2 = new THREE.Mesh(
//     new THREE.ConeGeometry(1, 2, 32),
//     material
// )
// const mesh3 = new THREE.Mesh(
//     new THREE.TorusKnotGeometry(0.8, 0.35, 100, 16),
//     material
// )

const book = await gltfLoader.loadAsync("/models/book/scene.gltf");
book.scene.children[0].scale.set(0.01, 0.01, 0.01);
book.scene.traverse((o) => {
  console.log(o);
  if (o.isMesh && o.name === "Cube_Cover_0") {
    console.log("Updating material");
    o.material = material;
  }
});
const mesh2 = book.scene;

const pen = await gltfLoader.loadAsync("/models/simple_pen/scene.gltf");
pen.scene.children[0].scale.set(0.2, 0.2, 0.2);
pen.scene.traverse((o) => {
  console.log(o);
  if (o.isMesh) {
    console.log("Updating material");
    o.material = material;
  }
});
const mesh3 = pen.scene;
mesh3.rotateX((1 / 12) * Math.PI);

mesh1.position.x = 2;
mesh2.position.x = -1.5;
mesh3.position.x = 2;

mesh1.position.y = -objectsDistance * 0;
mesh2.position.y = -objectsDistance * 0.9;
mesh3.position.y = -objectsDistance * 2.5;

scene.add(mesh1, mesh2, mesh3);

const sectionMeshes = [mesh1, mesh2, mesh3];

const axesHelper = new THREE.AxesHelper(5);
// scene.add( axesHelper );

/**
 * Lights
 */
const directionalLight = new THREE.DirectionalLight("#ffffff", 0.95);
directionalLight.position.set(2, 2, 2);
scene.add(directionalLight);

/**
 * Particles
 */
// Geometry
const particlesCount = 1000;
const positions = new Float32Array(particlesCount * 3);

for (let i = 0; i < particlesCount; i++) {
  positions[i * 3 + 0] = (Math.random() - 0.5) * 30;
  positions[i * 3 + 1] =
    objectsDistance * 0.5 -
    Math.random() * objectsDistance * sectionMeshes.length;
  positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
}

const particlesGeometry = new THREE.BufferGeometry();
particlesGeometry.setAttribute(
  "position",
  new THREE.BufferAttribute(positions, 3)
);

// Material
const particlesMaterial = new THREE.PointsMaterial({
  color: parameters.materialColor,
  sizeAttenuation: textureLoader,
  size: 0.03,
});

// Points
const particles = new THREE.Points(particlesGeometry, particlesMaterial);
// scene.add(particles)

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

window.addEventListener("resize", () => {
  // Update sizes
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  // Update camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

/**
 * Camera
 */
// Group
const cameraGroup = new THREE.Group();
scene.add(cameraGroup);

// Base camera
const camera = new THREE.PerspectiveCamera(
  35,
  sizes.width / sizes.height,
  0.1,
  100
);
camera.position.z = 6;
cameraGroup.add(camera);

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  alpha: true,
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

/**
 * Scroll
 */
let scrollY = window.scrollY;
let currentSection = 0;

function getScrollPercent() {
  var h = document.documentElement,
    b = document.body,
    st = "scrollTop",
    sh = "scrollHeight";
  return ((h[st] || b[st]) / ((h[sh] || b[sh]) - h.clientHeight)) * 100;
}

const topScroll = 65;
const bottomScroll = 232;
const updateScroller = () => {
  const perc = getScrollPercent();
  console.log(perc);

  const scroller = document.getElementById("dot");
  console.log(scroller);
  if (perc === 0) {
    scroller.style.top = topScroll + "px";
  } else {
    scroller.style.top =
      (bottomScroll - topScroll) * (perc / 100) + topScroll + "px";
  }
};

window.addEventListener("scroll", () => {
  updateScroller();
  scrollY = window.scrollY;
  const newSection = Math.round(scrollY / sizes.height);

  if (newSection != currentSection) {
    currentSection = newSection;

    if (currentSection === 0 || currentSection === 1 || currentSection === 2) {
      gsap.to(sectionMeshes[currentSection].rotation, {
        duration: 1.5,
        ease: "power2.inOut",
        y: "+=4",
      });
    } else {
      gsap.to(sectionMeshes[currentSection].rotation, {
        duration: 1.5,
        ease: "power2.inOut",
        x: "+=6",
        y: "+=3",
        z: "+=1.5",
      });
    }
  }
});

/**
 * Cursor
 */
const cursor = {};
cursor.x = 0;
cursor.y = 0;

window.addEventListener("mousemove", (event) => {
  cursor.x = event.clientX / sizes.width - 0.5;
  cursor.y = event.clientY / sizes.height - 0.5;
});

/**
 * Animate
 */
const clock = new THREE.Clock();
let previousTime = 0;

const tick = () => {
  const elapsedTime = clock.getElapsedTime();
  const deltaTime = elapsedTime - previousTime;
  previousTime = elapsedTime;

  // Animate camera
  camera.position.y = (-scrollY / sizes.height) * objectsDistance;

  const parallaxX = cursor.x * 0.5;
  const parallaxY = -cursor.y * 0.5;
  cameraGroup.position.x +=
    (parallaxX - cameraGroup.position.x) * 5 * deltaTime;
  cameraGroup.position.y +=
    (parallaxY - cameraGroup.position.y) * 5 * deltaTime;

  // Animate meshes
  sectionMeshes.forEach((mesh, i) => {
    if (i === 0 || i === 2) {
      mesh.rotation.y += deltaTime * 0.2;
    } else {
      mesh.rotation.x += deltaTime * 0.1;
      mesh.rotation.y += deltaTime * 0.12;
    }
  });

  // Render
  renderer.render(scene, camera);

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();
