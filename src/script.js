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

/**
 * Anchored models
 * Each model is wrapped in a pivot group that is centered on its bounding box
 * and normalized to a max dimension of 1 world unit. Position and size are
 * then driven every frame from the DOM section it is anchored to (see tick),
 * so the 3D scene follows the page layout at any screen size.
 */
const makePivot = (model) => {
  const box = new THREE.Box3().setFromObject(model);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  model.position.sub(center);

  const pivot = new THREE.Group();
  pivot.add(model);
  pivot.userData.unit = 1 / Math.max(size.x, size.y, size.z);
  return pivot;
};

// anchor: id of the section the model sits beside
// scale: size relative to the anchor's base size
// phase: if set, the model orbits around the anchor centre (hero pair)
const models = [
  { pivot: makePivot(mesh1), anchor: "emmaherms", scale: 0.6, phase: 0 },
  { pivot: makePivot(mesh0), anchor: "emmaherms", scale: 0.5, phase: Math.PI },
  { pivot: makePivot(mesh2), anchor: "publications", scale: 1 },
  { pivot: makePivot(mesh3), anchor: "ongoingProjects", scale: 1 },
  { pivot: makePivot(mesh4), anchor: "scienceCommunication", scale: 1.1 },
];

const sectionMeshes = models.map((m) => m.pivot);
scene.add(...sectionMeshes);

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
const particlesCount = 12000;
const positions = new Float32Array(particlesCount * 3);

for (let i = 0; i < particlesCount; i++) {
  positions[i * 3 + 0] = (Math.random() - 0.5) * 30;
  // Centered on the (now static) camera; the whole field scrolls in tick()
  positions[i * 3 + 1] = (Math.random() - 0.5) * objectsDistance * 7;
  positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
}

// Mostly tiny dots with a few larger, softer ones (cubed random is skewed small)
const dotSizes = new Float32Array(particlesCount);
for (let i = 0; i < particlesCount; i++) {
  dotSizes[i] = 0.015 + Math.pow(Math.random(), 3) * 0.07;
}

const particlesGeometry = new THREE.BufferGeometry();
particlesGeometry.setAttribute(
  "position",
  new THREE.BufferAttribute(positions, 3)
);
particlesGeometry.setAttribute("aSize", new THREE.BufferAttribute(dotSizes, 1));

// Material
// World units the field shifts per viewport of scroll. The shift is the same
// for every dot, so near dots sweep past quickly and far dots barely move,
// which is what gives the field its depth.
const PARTICLE_SCROLL = 2.0;
// Idle drift: sway speed (radians/s) and distance (world units)
const DRIFT_SPEED = 0.25;
const DRIFT_AMOUNT = 0.25;
const PARTICLE_FIELD_HEIGHT = objectsDistance * 7; // dots wrap within this

const particlesMaterial = new THREE.ShaderMaterial({
  transparent: true,
  depthWrite: false,
  uniforms: {
    uColor: { value: new THREE.Color(parameters.materialColor) },
    uScroll: { value: 0 }, // scrollY in viewports
    uTime: { value: 0 }, // seconds, drives the idle drift
    uScale: {
      value: window.innerHeight * 0.5 * Math.min(window.devicePixelRatio, 2),
    },
  },
  vertexShader: /* glsl */ `
    uniform float uScroll;
    uniform float uTime;
    uniform float uScale;
    attribute float aSize;
    varying float vAlpha;

    void main() {
      vec3 pos = position;

      // Idle drift: a slow looping sway, phase-shifted by position so
      // neighbouring dots move slightly out of step
      pos.x += sin(uTime * ${DRIFT_SPEED.toFixed(2)} + position.y * 0.7 + position.z * 0.5) * ${DRIFT_AMOUNT.toFixed(2)};
      pos.y += cos(uTime * ${DRIFT_SPEED.toFixed(2)} * 0.8 + position.x * 0.5 + position.z * 0.6) * ${DRIFT_AMOUNT.toFixed(2)} * 0.6;

      // Scroll parallax, wrapped so the field never runs out
      float h = ${PARTICLE_FIELD_HEIGHT.toFixed(1)};
      pos.y = mod(pos.y + uScroll * ${PARTICLE_SCROLL.toFixed(2)} + h * 0.5, h) - h * 0.5;

      vec4 mv = modelViewMatrix * vec4(pos, 1.0);
      float dist = -mv.z;

      // Perspective size, same formula PointsMaterial uses
      gl_PointSize = aSize * uScale / dist;
      gl_Position = projectionMatrix * mv;

      // Depth fade: far dots melt into the background, very near ones
      // fade out instead of popping as big blobs
      vAlpha = mix(0.9, 0.12, smoothstep(5.0, 11.0, dist))
             * smoothstep(0.5, 2.0, dist);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform vec3 uColor;
    varying float vAlpha;

    void main() {
      // Round, soft-edged dot
      float d = length(gl_PointCoord - 0.5);
      float edge = 1.0 - smoothstep(0.25, 0.5, d);
      gl_FragColor = vec4(uColor, vAlpha * edge);
    }
  `,
});

// Points
const particles = new THREE.Points(particlesGeometry, particlesMaterial);
particles.frustumCulled = false; // the shader moves the dots
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
  
  particlesMaterial.uniforms.uScale.value =
    sizes.height * 0.5 * Math.min(window.devicePixelRatio, 2);
  // Update scroller position after resize
  setTimeout(refreshScroller, 100); // Small delay to ensure layout is updated

  measureLayout();
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

// Layout reads are cached: measuring on every scroll event forces a reflow
const SCROLLER_SECTIONS = ["emmaherms", "publications", "ongoingProjects", "scienceCommunication"];
const scrollerCache = { tops: [], dots: [] };
let scrollerIndex = -1;

const measureScroller = () => {
  const sy = window.scrollY;
  const navLinks = document.querySelectorAll(".navigator-link-container .caption");
  const navEl = document.querySelector(".navigator");
  if (!navEl || navLinks.length === 0) return;

  const navTop = navEl.getBoundingClientRect().top;
  scrollerCache.dots = Array.from(navLinks).map((link) => {
    const r = link.getBoundingClientRect();
    return r.top - navTop + r.height / 2 - 8; // Centre dot on text
  });
  scrollerCache.tops = SCROLLER_SECTIONS.map((id) => {
    const el = document.getElementById(id);
    return el ? el.getBoundingClientRect().top + sy : Infinity;
  });
};

const updateScroller = () => {
  const scroller = document.getElementById("dot");
  if (!scroller) return;
  if (scrollerCache.tops.length === 0) measureScroller();
  const { tops, dots } = scrollerCache;
  if (tops.length === 0) return;

  // Which section is the middle of the viewport in?
  let index = 0;
  const viewportMiddle = window.scrollY + window.innerHeight / 2;
  for (let i = tops.length - 1; i >= 0; i--) {
    if (viewportMiddle >= tops[i]) {
      index = i;
      break;
    }
  }

  // Only animate when the active section actually changes
  if (index === scrollerIndex) return;
  scrollerIndex = index;

  gsap.to(scroller, {
    top: dots[index] + "px",
    duration: 0.4,
    ease: "power2.out",
    overwrite: true,
  });
};

// Re-measure, then force the dot to re-evaluate
const refreshScroller = () => {
  measureScroller();
  scrollerIndex = -1;
  updateScroller();
};

window.addEventListener("scroll", () => {
  scrollY = window.scrollY;
  updateScroller();
  hoverDirty = true; // models moved under a still cursor

  const newSection = Math.round(scrollY / sizes.height);

  if (newSection != currentSection) {
    currentSection = newSection;
  }
}, { passive: true });

// Update scroller on resize as well since nav positions might change

// Set initial scroller position after page load
window.addEventListener("load", () => {
  setTimeout(refreshScroller, 100);
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

// The hover raycast is the expensive part, so mousemove only records the
// pointer and tick() does the raycast at most once per frame
let hoverDirty = false;
let hovering = false;

window.addEventListener("mousemove", (event) => {
  cursor.x = event.clientX / sizes.width - 0.5;
  cursor.y = event.clientY / sizes.height - 0.5;
  mouse.x = (event.clientX / sizes.width) * 2 - 1;
  mouse.y = -(event.clientY / sizes.height) * 2 + 1;
  hoverDirty = true;
}, { passive: true });

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

/**
 * Layout: where each anchor section leaves room for a model
 */
const NARROW_BREAKPOINT = 700; // matches the CSS text-width breakpoint
const TEXT_WIDTH_FRACTION = 0.7; // .section p / h6 width on wide screens

const ORBIT_TILT = THREE.MathUtils.degToRad(20); // hero orbit angle

const layout = {};

const measureLayout = () => {
  const sy = window.scrollY;
  const narrow = sizes.width < NARROW_BREAKPOINT;

  new Set(models.map((m) => m.anchor)).forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const style = getComputedStyle(el);
    const padLeft = parseFloat(style.paddingLeft);
    const padRight = parseFloat(style.paddingRight);
    const contentWidth = rect.width - padLeft - padRight;

    let centerX, sizePx, anchorY, orbitPx;
    const heading = id === "emmaherms" && el.querySelector("h1");
    if (heading) {
      // Hero: the text block is vertically centred, which leaves a large empty
      // band above it. Orbit the pair in the middle of that band.
      const space = Math.max(heading.getBoundingClientRect().top - rect.top, 0);
      centerX = rect.left + padLeft + contentWidth * 0.62; // nudged right of centre
      sizePx = Math.min(space * 0.8, sizes.height * 0.4);
      anchorY = space / 2; // relative to the section top, so it scrolls away
      orbitPx = Math.min(contentWidth * 0.2, sizePx * 1.2);
    } else if (narrow) {
      // Text spans the full width: park a smaller model behind it
      centerX = sizes.width * 0.72;
      sizePx = Math.min(sizes.width * 0.45, sizes.height * 0.3);
    } else {
      // Centre the model in the empty space right of the text column
      const freeLeft = rect.left + padLeft + contentWidth * TEXT_WIDTH_FRACTION;
      const freeRight = sizes.width - sizes.width * 0.03;
      const freeWidth = Math.max(freeRight - freeLeft, 0);
      centerX = freeLeft + freeWidth / 2;
      sizePx = Math.min(freeWidth * 0.9, sizes.height * 0.5);
    }

    layout[id] = {
      top: rect.top + sy, // document-space, so it survives scrolling
      height: rect.height,
      centerX,
      sizePx,
      anchorY,
      orbitPx,
    };
  });
};

// Section heights change with text reflow and font loading
new ResizeObserver(() => {
  measureLayout();
  refreshScroller();
}).observe(
  document.getElementById("mainContainer")
);
measureLayout();

// Pixel (viewport) position -> world position on the plane at depth z
const camDist = camera.position.z;
const tanHalfFov = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
const pxToWorld = (px, py, z) => {
  const halfH = tanHalfFov * (camDist - z);
  const halfW = halfH * camera.aspect;
  return {
    x: (px / sizes.width * 2 - 1) * halfW,
    y: (1 - py / sizes.height * 2) * halfH,
  };
};

/**
 * Animate
 */
const clock = new THREE.Clock();
let previousTime = 0;

const tick = () => {
  const elapsedTime = clock.getElapsedTime();
  const deltaTime = elapsedTime - previousTime;
  previousTime = elapsedTime;

  // The camera stays put and the page scrolls normally; the particle field
  // shifts with scroll in the vertex shader (depth-based parallax)
  const sy = window.scrollY;
  particlesMaterial.uniforms.uScroll.value = sy / sizes.height;
  particlesMaterial.uniforms.uTime.value = elapsedTime;

  const parallaxX = cursor.x * 0.25;
  const parallaxY = -cursor.y * 0.25;
  cameraGroup.position.x +=
    (parallaxX - cameraGroup.position.x) * 5 * deltaTime;
  cameraGroup.position.y +=
    (parallaxY - cameraGroup.position.y) * 5 * deltaTime;

  // Spin models
  sectionMeshes.forEach((mesh) => {
    mesh.rotation.y += deltaTime * 0.2;
  });

  // World units per pixel on the z = 0 plane
  const perPx = (2 * tanHalfFov * camDist) / sizes.height;

  // Pin each model to its anchor section
  models.forEach(({ pivot, anchor, scale, phase }) => {
    const L = layout[anchor];
    if (!L) return;

    const sizePx = L.sizePx * scale;

    // Stay centred in the viewport while the section is on screen, but never
    // leave the section's own vertical bounds
    const top = L.top - sy;
    let cy;
    if (L.anchorY !== undefined) {
      cy = top + L.anchorY;
    } else {
      const minY = top + sizePx / 2;
      const maxY = Math.max(minY, top + L.height - sizePx / 2);
      cy = Math.min(Math.max(sizes.height / 2, minY), maxY);
    }

    let dxPx = 0;
    let dyPx = 0;
    let z = 0;
    if (phase !== undefined) {
      const angle = elapsedTime * 0.3 + phase;
      // Tilt the orbit so it rises to the right instead of lying flat
      const sweep = Math.cos(angle) * L.orbitPx;
      dxPx = sweep * Math.cos(ORBIT_TILT);
      dyPx = -sweep * Math.sin(ORBIT_TILT); // screen y grows downward
      z = Math.sin(angle) * L.orbitPx * perPx;
    }

    const p = pxToWorld(L.centerX + dxPx, cy + dyPx, z);
    pivot.position.set(p.x, p.y, z);
    pivot.scale.setScalar(sizePx * perPx * pivot.userData.unit);
  });


  // Hover cursor: one raycast per frame, and only if something changed
  if (hoverDirty) {
    hoverDirty = false;
    raycaster.setFromCamera(mouse, camera);
    const hit = raycaster.intersectObjects(sectionMeshes, true).length > 0;
    if (hit !== hovering) {
      hovering = hit;
      document.body.style.cursor = hit ? "pointer" : "default";
    }
  }

  // Render
  renderer.render(scene, camera);

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();
