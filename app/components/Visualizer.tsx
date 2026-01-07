"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";

// --- HELPER: Hex to RGB ---
function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16) / 255,
        g: parseInt(result[2], 16) / 255,
        b: parseInt(result[3], 16) / 255,
      }
    : { r: 1, g: 1, b: 1 };
}

// --- SHADERS ---
const vertexShader = `
  uniform float u_time;
  uniform float u_treble;
  uniform float u_bass;

  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x*34.0)+10.0)*x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
  vec3 fade(vec3 t) { return t*t*t*(t*(t*6.0-15.0)+10.0); }
  float pnoise(vec3 P, vec3 rep) {
    vec3 Pi0 = mod(floor(P), rep);
    vec3 Pi1 = mod(Pi0 + vec3(1.0), rep);
    Pi0 = mod289(Pi0);
    Pi1 = mod289(Pi1);
    vec3 Pf0 = fract(P);
    vec3 Pf1 = Pf0 - vec3(1.0);
    vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
    vec4 iy = vec4(Pi0.yy, Pi1.yy);
    vec4 iz0 = Pi0.zzzz;
    vec4 iz1 = Pi1.zzzz;
    vec4 ixy = permute(permute(ix) + iy);
    vec4 ixy0 = permute(ixy + iz0);
    vec4 ixy1 = permute(ixy + iz1);
    vec4 gx0 = ixy0 * (1.0 / 7.0);
    vec4 gy0 = fract(floor(gx0) * (1.0 / 7.0)) - 0.5;
    gx0 = fract(gx0);
    vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
    vec4 sz0 = step(gz0, vec4(0.0));
    gx0 -= sz0 * (step(0.0, gx0) - 0.5);
    gy0 -= sz0 * (step(0.0, gy0) - 0.5);
    vec4 gx1 = ixy1 * (1.0 / 7.0);
    vec4 gy1 = fract(floor(gx1) * (1.0 / 7.0)) - 0.5;
    gx1 = fract(gx1);
    vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
    vec4 sz1 = step(gz1, vec4(0.0));
    gx1 -= sz1 * (step(0.0, gx1) - 0.5);
    gy1 -= sz1 * (step(0.0, gy1) - 0.5);
    vec3 g000 = vec3(gx0.x,gy0.x,gz0.x);
    vec3 g100 = vec3(gx0.y,gy0.y,gz0.y);
    vec3 g010 = vec3(gx0.z,gy0.z,gz0.z);
    vec3 g110 = vec3(gx0.w,gy0.w,gz0.w);
    vec3 g001 = vec3(gx1.x,gy1.x,gz1.x);
    vec3 g101 = vec3(gx1.y,gy1.y,gz1.y);
    vec3 g011 = vec3(gx1.z,gy1.z,gz1.z);
    vec3 g111 = vec3(gx1.w,gy1.w,gz1.w);
    vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
    g000 *= norm0.x; g010 *= norm0.y; g100 *= norm0.z; g110 *= norm0.w;
    vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
    g001 *= norm1.x; g011 *= norm1.y; g101 *= norm1.z; g111 *= norm1.w;
    float n000 = dot(g000, Pf0);
    float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
    float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
    float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
    float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
    float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
    float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
    float n111 = dot(g111, Pf1);
    vec3 fade_xyz = fade(Pf0);
    vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
    vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
    float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x); 
    return 2.2 * n_xyz;
  }

  void main() {
    float speed = 1.0 + (u_bass / 50.0); 
    float noise = 2.0 * pnoise(position + u_time * speed, vec3(10.0));
    float spikeHeight = (u_treble / 400.0) * (noise * 0.5);
    vec3 newPosition = position + normal * spikeHeight;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
  }
`;

const fragmentShader = `
  uniform float u_red;
  uniform float u_blue;
  uniform float u_green;
  uniform float u_opacity; // New Opacity Control
  
  void main() {
      gl_FragColor = vec4(vec3(u_red, u_green, u_blue), u_opacity);
  }
`;

interface VisualizerProps {
  audioRef: React.RefObject<HTMLAudioElement | null>;
  isPlaying: boolean;
  color: string;
  yOffset?: number;
}

export default function Visualizer({
  audioRef,
  isPlaying,
  color,
  yOffset = 0,
}: VisualizerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const requestRef = useRef<number | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);

  const colorRef = useRef(color);
  const yOffsetRef = useRef(yOffset);

  // Create a GROUP ref to rotate both meshes together
  const groupRef = useRef<THREE.Group | null>(null);

  useEffect(() => {
    colorRef.current = color;
  }, [color]);
  useEffect(() => {
    yOffsetRef.current = yOffset;
  }, [yOffset]);

  useEffect(() => {
    if (
      isPlaying &&
      sourceRef.current &&
      sourceRef.current.context.state === "suspended"
    ) {
      (sourceRef.current.context as AudioContext).resume();
    }
  }, [isPlaying]);

  useEffect(() => {
    if (!containerRef.current || !audioRef.current) return;

    while (containerRef.current.firstChild) {
      containerRef.current.removeChild(containerRef.current.firstChild);
    }

    // --- SCENE ---
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 16);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // --- BLOOM (Slightly reduced strength to handle filled mesh) ---
    const renderScene = new RenderPass(scene, camera);
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      0.5,
      0.4,
      0.1
    );

    const composer = new EffectComposer(renderer);
    composer.addPass(renderScene);
    composer.addPass(bloomPass);
    composer.addPass(new OutputPass());

    // --- MESH SETUP (Dual Layer) ---
    const initialRgb = hexToRgb(colorRef.current);

    // We use ONE uniforms object for BOTH meshes so they stay perfectly synced
    const uniforms = {
      u_time: { value: 0.0 },
      u_treble: { value: 0.0 },
      u_bass: { value: 0.0 },
      u_red: { value: initialRgb.r },
      u_green: { value: initialRgb.g },
      u_blue: { value: initialRgb.b },
      u_opacity: { value: 1.0 }, // Dynamic opacity per mesh
    };

    const geometry = new THREE.IcosahedronGeometry(2, 5);

    // 1. THE FILL MESH (Inner Core)
    // We clone uniforms to set a different opacity
    const fillUniforms = THREE.UniformsUtils.clone(uniforms);
    fillUniforms.u_opacity.value = 0.12; // 30% Opacity for the fill

    const fillMaterial = new THREE.ShaderMaterial({
      uniforms: fillUniforms,
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      wireframe: false,
      transparent: true,
      blending: THREE.AdditiveBlending, // Makes the core glow nicely
      depthWrite: false, // Prevents z-fighting with the wireframe
    });
    const fillMesh = new THREE.Mesh(geometry, fillMaterial);

    // 2. THE WIREFRAME MESH (Outer Cage)
    const wireUniforms = THREE.UniformsUtils.clone(uniforms);
    wireUniforms.u_opacity.value = 1.0; // 100% Opacity for lines

    const wireMaterial = new THREE.ShaderMaterial({
      uniforms: wireUniforms,
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      wireframe: true,
      transparent: true,
    });
    const wireMesh = new THREE.Mesh(geometry, wireMaterial);

    // Scale wireframe slightly up to prevent glitching on top of fill
    wireMesh.scale.setScalar(1.001);

    // Group them so they rotate together
    const group = new THREE.Group();
    group.add(fillMesh);
    group.add(wireMesh);
    group.position.y = yOffsetRef.current;

    scene.add(group);
    groupRef.current = group;

    // --- AUDIO ---
    if (!analyserRef.current) {
      const AudioContext =
        window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioContext();

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 1024;
      analyser.smoothingTimeConstant = 0.85;
      analyserRef.current = analyser;

      if (!sourceRef.current) {
        try {
          const source = audioCtx.createMediaElementSource(audioRef.current);
          source.connect(analyser);
          analyser.connect(audioCtx.destination);
          sourceRef.current = source;
        } catch (e) {
          console.log("Audio source connected");
        }
      }
    }

    const analyser = analyserRef.current;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    // --- LOOP ---
    const clock = new THREE.Clock();

    const animate = () => {
      requestRef.current = requestAnimationFrame(animate);
      analyser.getByteFrequencyData(dataArray);

      // Audio Math
      let bassSum = 0;
      for (let i = 0; i < 10; i++) {
        bassSum += dataArray[i];
      }
      const avgBass = bassSum / 10;

      let trebleSum = 0;
      for (let i = 50; i < 150; i++) {
        trebleSum += dataArray[i];
      }
      const avgTreble = trebleSum / 100;

      // Color Updates
      const targetRgb = hexToRgb(colorRef.current);

      // Update BOTH materials
      [fillMaterial, wireMaterial].forEach((mat) => {
        mat.uniforms.u_red.value +=
          (targetRgb.r - mat.uniforms.u_red.value) * 0.05;
        mat.uniforms.u_green.value +=
          (targetRgb.g - mat.uniforms.u_green.value) * 0.05;
        mat.uniforms.u_blue.value +=
          (targetRgb.b - mat.uniforms.u_blue.value) * 0.05;

        mat.uniforms.u_time.value = clock.getElapsedTime();
        mat.uniforms.u_treble.value = THREE.MathUtils.lerp(
          mat.uniforms.u_treble.value,
          avgTreble,
          0.08
        );
        mat.uniforms.u_bass.value = THREE.MathUtils.lerp(
          mat.uniforms.u_bass.value,
          avgBass,
          0.2
        );
      });

      // Position Group
      if (groupRef.current) {
        groupRef.current.position.y +=
          (yOffsetRef.current - groupRef.current.position.y) * 0.1;

        // Physics Scale
        const scaleEffect = 0.8 + Math.pow(avgBass / 255, 2.5) * 0.9;
        groupRef.current.scale.setScalar(scaleEffect);

        // Rotation
        const rotSpeed = 0.002 + (avgTreble / 255) * 0.05;
        groupRef.current.rotation.y += rotSpeed;
        groupRef.current.rotation.x += rotSpeed * 0.5;
      }

      composer.render();
    };

    animate();

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      composer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      window.removeEventListener("resize", handleResize);
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
      geometry.dispose();
      fillMaterial.dispose(); // Cleanup both materials
      wireMaterial.dispose();
    };
  }, []);

  return (
    <div ref={containerRef} className="fixed inset-0 w-full h-full -z-10" />
  );
}
