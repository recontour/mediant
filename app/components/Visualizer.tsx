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

// --- SHADERS (Mellow Treble / Deep Bass) ---
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
    
    // Treble creates subtle texture spikes (Dampened to 400.0)
    float spikeHeight = (u_treble / 400.0) * (noise * 0.5);
    
    vec3 newPosition = position + normal * spikeHeight;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
  }
`;

const fragmentShader = `
  uniform float u_red;
  uniform float u_blue;
  uniform float u_green;
  void main() {
      gl_FragColor = vec4(vec3(u_red, u_green, u_blue), 1.0);
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

    const renderScene = new RenderPass(scene, camera);
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      0.6,
      0.4,
      0.1
    );

    const composer = new EffectComposer(renderer);
    composer.addPass(renderScene);
    composer.addPass(bloomPass);
    composer.addPass(new OutputPass());

    // --- MESH ---
    const initialRgb = hexToRgb(colorRef.current);

    const uniforms = {
      u_time: { value: 0.0 },
      u_treble: { value: 0.0 },
      u_bass: { value: 0.0 },
      u_red: { value: initialRgb.r },
      u_green: { value: initialRgb.g },
      u_blue: { value: initialRgb.b },
    };

    const geometry = new THREE.IcosahedronGeometry(2, 5);
    const material = new THREE.ShaderMaterial({
      uniforms: uniforms,
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      wireframe: true,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.y = yOffsetRef.current;
    scene.add(mesh);

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
          console.log("Audio source already connected, reusing.");
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

      // Bass
      let bassSum = 0;
      for (let i = 0; i < 10; i++) {
        bassSum += dataArray[i];
      }
      const avgBass = bassSum / 10;

      // Treble
      let trebleSum = 0;
      for (let i = 50; i < 150; i++) {
        trebleSum += dataArray[i];
      }
      const avgTreble = trebleSum / 100;

      // Color & Position
      const targetRgb = hexToRgb(colorRef.current);
      uniforms.u_red.value += (targetRgb.r - uniforms.u_red.value) * 0.05;
      uniforms.u_green.value += (targetRgb.g - uniforms.u_green.value) * 0.05;
      uniforms.u_blue.value += (targetRgb.b - uniforms.u_blue.value) * 0.05;
      mesh.position.y += (yOffsetRef.current - mesh.position.y) * 0.1;

      // --- PHYSICS UPDATE (The "Drama" Tweak) ---
      // Base scale: 0.8 (Reduced from 1.0)
      // Expansion: Multiplied by 0.9 (Increased from 0.6)
      // Power: 2.5 (More exponential, requires actual bass beat to trigger)
      const scaleEffect = 0.8 + Math.pow(avgBass / 255, 2.5) * 0.9;
      mesh.scale.setScalar(scaleEffect);

      uniforms.u_time.value = clock.getElapsedTime();

      // Smooth Treble / Bass LERP
      uniforms.u_treble.value = THREE.MathUtils.lerp(
        uniforms.u_treble.value,
        avgTreble,
        0.08
      );
      uniforms.u_bass.value = THREE.MathUtils.lerp(
        uniforms.u_bass.value,
        avgBass,
        0.2
      );

      const rotSpeed = 0.002 + (avgTreble / 255) * 0.05;
      mesh.rotation.y += rotSpeed;
      mesh.rotation.x += rotSpeed * 0.5;

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
      material.dispose();
    };
  }, []);

  return (
    <div ref={containerRef} className="fixed inset-0 w-full h-full -z-10" />
  );
}
