import "./style.css";
import * as THREE from "three";
import * as dat from "lil-gui";
import gsap from "gsap";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';

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
const objectsDistance = 3;

/**
 * Models
 */
const gltfLoader = new GLTFLoader();
const stlLoader = new STLLoader();

const brain = await gltfLoader.loadAsync("/models/brain/scene.gltf");
brain.scene.children[0].scale.set(0.004, 0.004, 0.004);
brain.scene.traverse((o) => {
  if (o.isMesh) {
    o.material = material;
  }
});
const mesh1 = brain.scene;

const heartGeometry = await stlLoader.loadAsync("/models/heart/heart.stl");
// Center the geometry
heartGeometry.center();
// Smooth the normals for a softer appearance
heartGeometry.computeVertexNormals();

// Use a smoother material for the heart
const heartMaterial = new THREE.MeshStandardMaterial({
  color: parameters.materialColor,
});

const heartMesh = new THREE.Mesh(heartGeometry, heartMaterial);
heartMesh.scale.set(0.006, 0.006, 0.006);
// Apply final rotation values found interactively
heartMesh.rotation.x = -8.4;
heartMesh.rotation.y = -0.7;
heartMesh.rotation.z = 0;

// Create a group for the heart so we can rotate it as a unit
const mesh0 = new THREE.Group();
mesh0.add(heartMesh);

const pen = await gltfLoader.loadAsync("/models/simple_pen/scene.gltf");
pen.scene.children[0].scale.set(0.15, 0.15, 0.15);
pen.scene.traverse((o) => {
  if (o.isMesh) {
    o.material = material;
  }
});
const mesh2 = pen.scene;
mesh2.rotateZ(-(1 / 12) * Math.PI);

const lightBulb = await gltfLoader.loadAsync("/models/lightBulb/scene.gltf");
lightBulb.scene.children[0].scale.set(10, 10, 10);
lightBulb.scene.traverse((o) => {
  if (o.isMesh) {
    o.material = material;
  }
});
const mesh3 = lightBulb.scene;
mesh3.rotateX((1 / 12) * Math.PI);
mesh3.rotateZ((1 / 12) * Math.PI);

const keyboard = await gltfLoader.loadAsync("/models/keyboard/scene.gltf");
keyboard.scene.children[0].scale.set(6, 6, 6);
// keyboard.scene.traverse((o) => {
//   if (o.isMesh) {
//     o.material.gradientMap = gradientTexture;
//   }

//   if (o.isMesh && o.name === "Object_40") {
//     // if (o.isMesh) {
//     console.log(o);
//     console.log("Updating material");
//     o.material.gradientMap = gradientTexture;
//   }
// });
const mesh4 = keyboard.scene;
mesh4.rotateX((2 / 12) * Math.PI);

const brainX = 1;
mesh1.position.x = brainX;
const heartX = 0
mesh0.position.x = heartX;
mesh2.position.x = 2;
mesh3.position.x = 2;
mesh4.position.x = 2;

const brainY = 1;
mesh1.position.y = brainY;
const heartY = objectsDistance * .25;
mesh0.position.y = heartY;
mesh2.position.y = -objectsDistance * 1.25;
mesh3.position.y = -objectsDistance * 2.7;
mesh4.position.y = -objectsDistance * 3.5;

scene.add(mesh1, mesh0, mesh2, mesh3, mesh4);

const sectionMeshes = [mesh1, mesh0, mesh2, mesh3, mesh4];

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
const particlesCount = 5000;
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
scene.add(particles)

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
  
  // Update scroller position after resize
  setTimeout(updateScroller, 100); // Small delay to ensure layout is updated
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

const updateScroller = () => {
  const scroller = document.getElementById("dot");
  if (!scroller) return;
  
  // Get all navigation links to calculate their positions
  const navLinks = document.querySelectorAll('.navigator-link-container .caption');
  if (navLinks.length === 0) return;
  
  // Get all section elements to calculate their positions
  const sections = ['emmaherms', 'publications', 'ongoingProjects', 'scienceCommunication'];
  const sectionElements = sections.map(id => document.getElementById(id)).filter(el => el !== null);
  
  if (sectionElements.length === 0) return;
  
  // Calculate the actual top positions of sections relative to document
  const sectionTops = sectionElements.map(element => {
    return element.offsetTop;
  });
  
  // Calculate navigation link positions dynamically
  const navPositions = Array.from(navLinks).map(link => {
    const linkRect = link.getBoundingClientRect();
    const navRect = document.querySelector('.navigator').getBoundingClientRect();
    return linkRect.top - navRect.top + linkRect.height / 2 - 8; // Center dot on text
  });
  
  // Find which section we're currently in - simple approach
  let currentSectionIndex = 0;
  const viewportMiddle = scrollY + window.innerHeight / 2;
  
  for (let i = sectionTops.length - 1; i >= 0; i--) {
    if (viewportMiddle >= sectionTops[i]) {
      currentSectionIndex = i;
      break;
    }
  }
  
  // Simply jump to the correct navigation position - with smooth animation
  const dotPosition = navPositions[currentSectionIndex];
  
  // Use GSAP for smooth animation
  gsap.to(scroller, {
    top: dotPosition + "px",
    duration: 0.4,
    ease: "power2.out"
  });
};

window.addEventListener("scroll", () => {
  scrollY = window.scrollY;
  updateScroller();

  const newSection = Math.round(scrollY / sizes.height);

  if (newSection != currentSection) {
    currentSection = newSection;
  }
});

// Update scroller on resize as well since nav positions might change

// Set initial scroller position after page load
window.addEventListener("load", () => {
  setTimeout(updateScroller, 100);
});

// Set initial scroller position immediately
updateScroller();

/**
 * Cursor
 */
const cursor = {};
cursor.x = 0;
cursor.y = 0;

// Raycasting for click detection
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

window.addEventListener("mousemove", (event) => {
  cursor.x = event.clientX / sizes.width - 0.5;
  cursor.y = event.clientY / sizes.height - 0.5;
  
  // Check if hovering over 3D objects
  mouse.x = (event.clientX / sizes.width) * 2 - 1;
  mouse.y = -(event.clientY / sizes.height) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(sectionMeshes, true);
  
  // Change cursor when hovering over 3D objects
  document.body.style.cursor = intersects.length > 0 ? "pointer" : "default";
});

// Color cycle for clicked meshes
const colors = [
  { r: 1.0, g: 0.812, b: 0.569 },   // #ffcf91
  { r: 0.918, g: 0.596, b: 0.365 },  // #ea985d
  { r: 0.682, g: 0.396, b: 0.173 },  // #ae652c
  { r: 0.627, g: 0.655, b: 0.584 }, // #a0a795
];

const meshColorIndex = {}; // Track current color index for each mesh

// Click on 3D objects to rotate them
window.addEventListener("click", (event) => {
  // Calculate mouse position in normalized device coordinates
  mouse.x = (event.clientX / sizes.width) * 2 - 1;
  mouse.y = -(event.clientY / sizes.height) * 2 + 1;
  
  // Update raycasting
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(sectionMeshes, true);
  
  if (intersects.length > 0) {
    const clickedMesh = intersects[0].object;
    // Find which section mesh was clicked
    const meshIndex = sectionMeshes.findIndex(mesh => {
      if (mesh === clickedMesh || mesh.children.includes(clickedMesh)) {
        return true;
      }
      // Also check nested children
      let found = false;
      mesh.traverse((child) => {
        if (child === clickedMesh) found = true;
      });
      return found;
    });
    
    if (meshIndex !== -1) {
      // Rotate the clicked mesh
      gsap.to(sectionMeshes[meshIndex].rotation, {
        duration: 1.5,
        ease: "power2.inOut",
        y: "+=4",
      });
      
      // Change color of the clicked mesh to next color in cycle
      const clickedMesh = sectionMeshes[meshIndex];
      
      // Initialize color index if not set
      if (!meshColorIndex[meshIndex]) {
        meshColorIndex[meshIndex] = 0;
      }
      
      // Get next color
      const currentColorIndex = meshColorIndex[meshIndex];
      const nextColor = colors[currentColorIndex];
      
      clickedMesh.traverse((child) => {
        if (child.isMesh && child.material) {
          // Create a new material instance if it's shared
          if (child.material === material || child.material === heartMaterial) {
            // Clone the material to avoid affecting other meshes
            child.material = child.material.clone();
          }
          
          // Change to next color in cycle
          gsap.to(child.material.color, {
            r: nextColor.r,
            g: nextColor.g,
            b: nextColor.b,
            duration: 0.3,
            ease: "power2.out",
          });
        }
      });
      
      // Move to next color for next click
      meshColorIndex[meshIndex] = (currentColorIndex + 1) % colors.length;
    }
  }
});

const mediaQuery = "(max-width: 1000px)";
const mediaQueryList = window.matchMedia(mediaQuery);

const handleChange = (event) => {
  if (event.matches) {
    // console.log("The window is now 1000px or under");
    mesh1.position.x = 0.5;
    mesh1.position.y = -objectsDistance * -0.3;
    brain.scene.children[0].scale.set(0.005, 0.005, 0.005);
  } else {
    // console.log("The window is now over 1000px");
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
    mesh.rotation.y += deltaTime * 0.2;
  });

  // Animate brain and heart with orbital motion
  const orbitRadius = 1;
  const orbitSpeed = 0.3;
  
  // Brain orbits horizontally
  const newBrainX = brainX + Math.cos(elapsedTime * orbitSpeed) * orbitRadius;
  const newBrainZ = Math.sin(elapsedTime * orbitSpeed) * orbitRadius;
  mesh1.position.set(newBrainX, brainY, newBrainZ);

  
  // Heart orbits horizontally
  const newHeartX = heartX + Math.cos(elapsedTime * orbitSpeed + Math.PI) * orbitRadius;
  const newHeartZ = Math.sin(elapsedTime * orbitSpeed + Math.PI) * orbitRadius;
  mesh0.position.set(newHeartX, heartY, newHeartZ)

  // Render
  renderer.render(scene, camera);

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();
