import "./style.css";
import * as THREE from "three";
import * as dat from "lil-gui";
import gsap from "gsap";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

/**
 * Debug
 */
// const gui = new dat.GUI();

const parameters = {
  materialColor: "#A0A795",
};

// gui.addColor(parameters, "materialColor").onChange(() => {
//   material.color.set(parameters.materialColor);
//   particlesMaterial.color.set(parameters.materialColor);
// });

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
const gradientTexture = textureLoader.load("textures/gradients/5.jpg");
gradientTexture.magFilter = THREE.NearestFilter;

// Material
const material = new THREE.MeshToonMaterial({
  color: parameters.materialColor,
  gradientMap: gradientTexture,
});

// Objects
const objectsDistance = 4;

/**
 * Models
 */
const gltfLoader = new GLTFLoader();

const brain = await gltfLoader.loadAsync("/models/brain/scene.gltf");
brain.scene.children[0].scale.set(0.004, 0.004, 0.004);
brain.scene.traverse((o) => {
  if (o.isMesh) {
    o.material = material;
  }
});
const mesh1 = brain.scene;

// const pen = await gltfLoader.loadAsync("/models/simple_pen/scene.gltf");
// pen.scene.children[0].scale.set(0.15, 0.15, 0.15);
// pen.scene.traverse((o) => {
//   if (o.isMesh) {
//     o.material = material;
//   }
// });
// const mesh2 = pen.scene;
// mesh2.rotateZ(-(1 / 12) * Math.PI);

// const lightBulb = await gltfLoader.loadAsync("/models/lightBulb/scene.gltf");
// lightBulb.scene.children[0].scale.set(10, 10, 10);
// lightBulb.scene.traverse((o) => {
//   if (o.isMesh) {
//     o.material = material;
//   }
// });
// const mesh3 = lightBulb.scene;
// mesh3.rotateX((1 / 12) * Math.PI);
// mesh3.rotateZ((1 / 12) * Math.PI);

// const keyboard = await gltfLoader.loadAsync("/models/keyboard/scene.gltf");
// keyboard.scene.children[0].scale.set(6, 6, 6);
// // keyboard.scene.traverse((o) => {
// //   if (o.isMesh) {
// //     o.material.gradientMap = gradientTexture;
// //   }

// //   if (o.isMesh && o.name === "Object_40") {
// //     // if (o.isMesh) {
// //     console.log(o);
// //     console.log("Updating material");
// //     o.material.gradientMap = gradientTexture;
// //   }
// // });
// const mesh4 = keyboard.scene;
// mesh4.rotateX((2 / 12) * Math.PI);

mesh1.position.x = 2;
// mesh2.position.x = 2;
// mesh3.position.x = 2;
// mesh4.position.x = 2;

mesh1.position.y = -objectsDistance * 0;
// mesh2.position.y = -objectsDistance * 0.9;
// mesh3.position.y = -objectsDistance * 1.9;
// mesh4.position.y = -objectsDistance * 2.85;

// scene.add(mesh1, mesh2, mesh3, mesh4);

// const sectionMeshes = [mesh1, mesh2, mesh3, mesh4];

scene.add(mesh1);

const sectionMeshes = [mesh1];

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
  console.log(h, b);
  // console.log(((h[st] || b[st]) / ((h[sh] || b[sh]) - h.clientHeight)) * 100);
  return ((h[st] || b[st]) / ((h[sh] || b[sh]) - h.clientHeight)) * 100;
}

const topScroll = 65;
const bottomScroll = 440;
const updateScroller = () => {
  const perc = getScrollPercent();
  const scroller = document.getElementById("dot");

  if (perc === 0) {
    scroller.style.top = topScroll + "px";
  } else {
    scroller.style.top =
      (bottomScroll - topScroll) * (perc / 100) + topScroll - 5 + "px";
  }
};

window.addEventListener("scroll", () => {
  console.log("Updating");
  updateScroller();
  scrollY = window.scrollY;

  const newSection = Math.round(scrollY / sizes.height);

  if (newSection != currentSection) {
    currentSection = newSection;

    if (currentSection === 0) {
      //} || currentSection === 1 || currentSection === 2) {
      gsap.to(sectionMeshes[currentSection].rotation, {
        duration: 1.5,
        ease: "power2.inOut",
        y: "+=4",
      });
      // } else {
      //   gsap.to(sectionMeshes[currentSection].rotation, {
      //     duration: 1.5,
      //     ease: "power2.inOut",
      //     x: "+=6",
      //     y: "+=3",
      //     z: "+=1.5",
      //   });
      // }
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

const mediaQuery = "(max-width: 1000px)";
const mediaQueryList = window.matchMedia(mediaQuery);

const handleChange = (event) => {
  console.log(window.innerWidth);
  if (event.matches) {
    console.log("The window is now 1000px or under");
    mesh1.position.x = 0.5;
    mesh1.position.y = -objectsDistance * -0.3;
    brain.scene.children[0].scale.set(0.005, 0.005, 0.005);
  } else {
    console.log("The window is now over 1000px");
    mesh1.position.x = 2;
    mesh1.position.y = -objectsDistance * -0;
    brain.scene.children[0].scale.set(0.004, 0.004, 0.004);
  }
};

mediaQueryList.addEventListener("change", handleChange);
handleChange(mediaQueryList);

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
    // if (i !== 2) {
    mesh.rotation.y += deltaTime * 0.2;
    // } else {
    //   mesh.rotation.x += deltaTime * 0.1;
    //   mesh.rotation.y += deltaTime * 0.12;
    // }
  });

  // Render
  renderer.render(scene, camera);

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();
