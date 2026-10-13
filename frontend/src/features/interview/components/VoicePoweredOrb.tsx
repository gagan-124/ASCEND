import React, { useEffect, useRef } from 'react';
import { Renderer, Program, Mesh, Triangle } from 'ogl';
import { cn } from '@/lib/utils';
import type { InterviewState } from '@/config/interviewConfig';

export interface VoicePoweredOrbProps {
  voiceLevel?: number; // 0 to 100
  isSpeaking?: boolean; // AI interviewer speaking
  isCandidateSpeaking?: boolean; // Candidate speaking
  state?: InterviewState | 'idle' | 'speaking' | 'thinking' | 'paused' | 'listening';
  className?: string;
  size?: number; // Size in px
}

const vertShader = /* glsl */ `
  attribute vec2 uv;
  attribute vec2 position;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

const fragShader = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform float uAudioLevel;
  uniform float uState; // 0: idle, 1: ai speaking, 2: candidate speaking, 3: listening, 4: thinking, 5: paused
  uniform vec2 uResolution;
  uniform float uReducedMotion;

  varying vec2 vUv;

  // GLSL Simplex Noise helper
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                        -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy) );
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
        + i.x + vec3(0.0, i1.x, 1.0 ));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
    m = m*m;
    m = m*m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
    vec3 g;
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  float fbm(vec2 p, float time) {
    float val = 0.0;
    float amp = 0.5;
    vec2 shift = vec2(100.0);
    for (int i = 0; i < 4; i++) {
      val += amp * snoise(p + time);
      p = p * 2.0 + shift;
      amp *= 0.5;
    }
    return val;
  }

  void main() {
    vec2 st = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
    float dist = length(st);
    float angle = atan(st.y, st.x);

    float timeScale = uReducedMotion > 0.5 ? 0.2 : 1.0;
    float t = uTime * timeScale;

    // 1. Dynamic Core Radius according to State & Audio Reactivity
    float baseRadius = 0.22;
    float pulse = 0.0;
    float speed = 0.6;

    if (uState == 1.0) { // AI SPEAKING
      baseRadius = 0.24 + uAudioLevel * 0.12;
      pulse = sin(t * 7.0) * (0.015 + uAudioLevel * 0.02);
      speed = 1.3 + uAudioLevel * 1.5;
    } else if (uState == 2.0) { // CANDIDATE SPEAKING
      baseRadius = 0.23 + uAudioLevel * 0.14;
      pulse = sin(t * 6.0) * (0.015 + uAudioLevel * 0.025);
      speed = 1.2 + uAudioLevel * 1.6;
    } else if (uState == 3.0) { // LISTENING (calm rhythmic breathing)
      baseRadius = 0.21;
      pulse = sin(t * 2.2) * 0.018;
      speed = 0.7;
    } else if (uState == 4.0) { // THINKING / EVALUATING
      baseRadius = 0.22;
      pulse = sin(t * 4.0) * 0.02;
      speed = 1.6;
    } else if (uState == 5.0) { // PAUSED
      baseRadius = 0.20;
      pulse = sin(t * 1.0) * 0.008;
      speed = 0.3;
    } else { // IDLE
      baseRadius = 0.21;
      pulse = sin(t * 1.5) * 0.012;
      speed = 0.5;
    }

    float coreRadius = baseRadius + pulse;

    // 2. Organic fluid noise distortion on core perimeter
    float noiseDistortion = fbm(st * 3.8 + vec2(cos(angle), sin(angle)) * 0.25, t * speed);
    float distortAmount = (0.025 + uAudioLevel * 0.045);
    if (uReducedMotion > 0.5) distortAmount *= 0.2;
    float distortedDist = dist - noiseDistortion * distortAmount;

    // 3. Volumetric Core Fill & Surface Membrane
    float coreFill = smoothstep(coreRadius * 1.15, coreRadius * 0.1, dist);
    float membraneThickness = 0.022 + uAudioLevel * 0.012;
    float membrane = smoothstep(membraneThickness + 0.02, membraneThickness, abs(distortedDist - coreRadius));

    // 4. Outer Atmospheric Halo & Glow Aura
    float haloReach = coreRadius + 0.18 + uAudioLevel * 0.16;
    float halo = smoothstep(haloReach, coreRadius, dist) * (0.35 + uAudioLevel * 0.55);

    // 5. Specular Highlights for 3D Optical Sphere Appearance
    vec2 lightOffset = vec2(-0.06, 0.06);
    float specDist = length(st - lightOffset);
    float specular = smoothstep(coreRadius * 0.65, 0.0, specDist) * 0.45;

    // 6. State-Specific Energy Waves & Rings
    float waveEffect = 0.0;

    if (uState == 1.0 || uState == 2.0) { // SPEAKING: expanding sound ripple rings
      float rippleFreq = 2.4;
      float rippleSpeed = t * (1.8 + uAudioLevel * 1.4);
      float ripplePhase = fract(rippleSpeed - dist * rippleFreq);
      float rippleDist = abs(dist - (coreRadius + ripplePhase * 0.20));
      waveEffect = smoothstep(0.035, 0.005, rippleDist) * (1.0 - ripplePhase) * (0.3 + uAudioLevel * 0.7);
    } else if (uState == 3.0) { // LISTENING: calm sonar radar pulse communicating active listening
      float sonarPhase = fract(t * 0.6 - dist * 2.2);
      float sonarDist = abs(dist - (coreRadius + sonarPhase * 0.22));
      waveEffect = smoothstep(0.028, 0.004, sonarDist) * (1.0 - sonarPhase) * 0.45;
    } else if (uState == 4.0) { // THINKING: orbiting particle harmonic wave
      float orbitRing = smoothstep(0.025, 0.005, abs(dist - (coreRadius + 0.06)));
      float beads = sin(angle * 3.0 + t * 4.5) * 0.5 + 0.5;
      waveEffect = orbitRing * beads * 0.8;
    }

    // 7. Color Palettes by State
    vec3 coreColor;
    vec3 glowColor;
    vec3 highlightColor = vec3(0.92, 0.98, 1.0); // Bright crystalline highlight

    if (uState == 1.0) { // AI SPEAKING (Electric Cyan / Brilliant Sky Blue)
      coreColor = vec3(0.06, 0.82, 0.98);
      glowColor = vec3(0.18, 0.52, 0.98);
    } else if (uState == 2.0) { // CANDIDATE SPEAKING (Emerald / Radiant Teal)
      coreColor = vec3(0.08, 0.90, 0.68);
      glowColor = vec3(0.05, 0.70, 0.85);
    } else if (uState == 3.0) { // LISTENING (Calm Seafoam Cyan)
      coreColor = vec3(0.12, 0.72, 0.80);
      glowColor = vec3(0.08, 0.45, 0.65);
    } else if (uState == 4.0) { // THINKING (Electric Violet / Amethyst)
      coreColor = vec3(0.70, 0.26, 0.98);
      glowColor = vec3(0.90, 0.38, 0.95);
      highlightColor = vec3(1.0, 0.92, 0.98);
    } else if (uState == 5.0) { // PAUSED (Warm Amber / Bronze)
      coreColor = vec3(0.85, 0.55, 0.15);
      glowColor = vec3(0.65, 0.35, 0.10);
      highlightColor = vec3(1.0, 0.90, 0.70);
    } else { // IDLE (Oceanic Deep Cyan / Slate Azure)
      coreColor = vec3(0.10, 0.55, 0.75);
      glowColor = vec3(0.08, 0.32, 0.55);
    }

    // Compose Color
    vec3 finalColor = mix(coreColor, glowColor, noiseDistortion * 0.5 + 0.5);
    finalColor = mix(finalColor, highlightColor, membrane * 0.6 + specular);
    finalColor += glowColor * (halo + waveEffect);
    finalColor += highlightColor * waveEffect * 0.4;

    // Final Alpha with smooth boundaries
    float alpha = clamp(
      coreFill * 0.75 +
      membrane * 0.95 +
      halo * 0.55 +
      waveEffect * 0.75 +
      specular * 0.4,
      0.0,
      1.0
    );

    gl_FragColor = vec4(finalColor * alpha, alpha);
  }
`;

export const VoicePoweredOrb: React.FC<VoicePoweredOrbProps> = ({
  voiceLevel = 0,
  isSpeaking = false,
  isCandidateSpeaking = false,
  state = 'idle',
  className,
  size = 72,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const targetAudioRef = useRef(0);
  const smoothedAudioRef = useRef(0);

  const uniformsRef = useRef<{
    uTime: { value: number };
    uAudioLevel: { value: number };
    uState: { value: number };
    uResolution: { value: [number, number] };
    uReducedMotion: { value: number };
  }>({
    uTime: { value: 0 },
    uAudioLevel: { value: 0 },
    uState: { value: 0 },
    uResolution: { value: [size, size] },
    uReducedMotion: { value: 0 },
  });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Initialize OGL Renderer with transparent background
    const renderer = new Renderer({
      alpha: true,
      antialias: true,
      dpr: Math.min(typeof window !== 'undefined' ? window.devicePixelRatio : 1, 2),
    });

    const gl = renderer.gl;
    gl.clearColor(0, 0, 0, 0);

    const canvas = gl.canvas;
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.display = 'block';

    // Remove old canvas children
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    container.appendChild(canvas);

    // Fullscreen Triangle Geometry
    const geometry = new Triangle(gl);

    const program = new Program(gl, {
      vertex: vertShader,
      fragment: fragShader,
      uniforms: uniformsRef.current,
      transparent: true,
      depthTest: false,
    });

    const mesh = new Mesh(gl, { geometry, program });

    let animFrame: number;
    const startTime = performance.now();

    const resize = () => {
      const width = container.clientWidth || size;
      const height = container.clientHeight || size;
      renderer.setSize(width, height);
      uniformsRef.current.uResolution.value = [width, height];
    };

    resize();

    // Check prefers-reduced-motion once per mount
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    uniformsRef.current.uReducedMotion.value = prefersReducedMotion ? 1.0 : 0.0;

    const render = (now: number) => {
      const elapsed = (now - startTime) * 0.001;
      uniformsRef.current.uTime.value = elapsed;

      // Exponential moving average (DSP Attack & Decay filtering)
      const target = targetAudioRef.current;
      const current = smoothedAudioRef.current;
      // Fast attack (~60-80ms reaction to syllable onset) vs soft decay (~200ms graceful fade)
      const rate = target > current ? 0.28 : 0.09;
      const nextSmoothed = current + (target - current) * rate;
      smoothedAudioRef.current = nextSmoothed;
      uniformsRef.current.uAudioLevel.value = nextSmoothed;

      renderer.render({ scene: mesh });
      animFrame = requestAnimationFrame(render);
    };

    animFrame = requestAnimationFrame(render);

    const handleResize = () => resize();
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animFrame);
      window.removeEventListener('resize', handleResize);
      if (container.contains(canvas)) {
        container.removeChild(canvas);
      }
    };
  }, [size]);

  // Update uniforms and target audio when incoming props change
  useEffect(() => {
    // Noise gate: ignore baseline microphone hiss (< 6)
    const effectiveLevel = voiceLevel > 6 ? voiceLevel : 0;
    const normalizedLevel = Math.min(1.0, Math.max(0.0, effectiveLevel / 100));

    // When AI speaks, boost slightly for punchy visuals; candidate speech maps directly to input amplitude
    targetAudioRef.current = isSpeaking
      ? Math.max(0.25, normalizedLevel * 1.2)
      : normalizedLevel * 1.1;

    let stateVal = 0; // IDLE
    if (state === 'MEDIA_PAUSED' || state === 'PAUSED' || state === 'paused') {
      stateVal = 5;
    } else if (state === 'EVALUATING' || state === 'thinking') {
      stateVal = 4;
    } else if (isSpeaking || state === 'speaking') {
      stateVal = 1;
    } else if (
      isCandidateSpeaking ||
      (normalizedLevel > 0.06 && (state === 'LISTENING' || state === 'QUESTION' || state === 'FOLLOW_UP'))
    ) {
      stateVal = 2; // CANDIDATE SPEAKING
    } else if (state === 'LISTENING') {
      stateVal = 3; // LISTENING (attentive calm rhythm)
    }

    uniformsRef.current.uState.value = stateVal;
  }, [voiceLevel, isSpeaking, isCandidateSpeaking, state]);

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative flex items-center justify-center select-none pointer-events-none',
        className
      )}
      style={{ width: `${size}px`, height: `${size}px` }}
    >
      {/* Surrounding Ambient Light Layer */}
      <div
        className={cn(
          'absolute inset-0 rounded-full blur-xl transition-opacity duration-300 pointer-events-none',
          isSpeaking
            ? 'bg-cyan-500/30 opacity-100 scale-110'
            : isCandidateSpeaking
            ? 'bg-emerald-500/30 opacity-100 scale-110'
            : state === 'LISTENING'
            ? 'bg-cyan-500/15 opacity-70'
            : state === 'EVALUATING' || state === 'thinking'
            ? 'bg-purple-500/25 opacity-90'
            : 'bg-cyan-500/10 opacity-40'
        )}
      />
    </div>
  );
};
