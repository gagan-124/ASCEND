import React, { useEffect, useRef } from 'react';
import { Renderer, Program, Mesh, Triangle } from 'ogl';
import { cn } from '@/lib/utils';
import type { InterviewState } from '@/config/interviewConfig';

export interface VoicePoweredOrbProps {
  voiceLevel?: number; // 0 to 100
  isSpeaking?: boolean;
  state?: InterviewState | 'idle' | 'speaking' | 'thinking' | 'paused';
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
  uniform float uState; // 0: idle, 1: speaking, 2: thinking, 3: paused
  uniform vec2 uResolution;

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
      val += amp * snoise(p + time * 0.55);
      p = p * 2.0 + shift;
      amp *= 0.5;
    }
    return val;
  }

  void main() {
    vec2 st = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
    float dist = length(st);

    float ringRadius = 0.32 + uAudioLevel * 0.06;
    float thickness = 0.025 + uAudioLevel * 0.015;

    // Organic fluid noise distortion on ring perimeter
    float n = fbm(st * 3.8, uTime * 0.55);
    float distortedDist = dist - n * (0.035 + uAudioLevel * 0.04);

    float ringDist = abs(distortedDist - ringRadius);

    // Luminous organic perimeter line + soft atmospheric halo glow
    float ringLine = smoothstep(thickness + 0.025, thickness, ringDist);
    float haloGlow = smoothstep(thickness + 0.16, thickness, ringDist) * 0.45;

    // Palette: Soft Sky Blue -> Electric Cyan -> Violet/Purple on Thinking
    vec3 coreColor = vec3(0.12, 0.65, 0.95);    // Soft Sky Blue
    vec3 glowColor = vec3(0.55, 0.25, 0.95);    // Violet / Purple glow
    vec3 highlightColor = vec3(0.90, 0.96, 1.0); // Bright Ice Highlight

    if (uState == 2.0) { // THINKING / EVALUATING
      coreColor = vec3(0.68, 0.22, 0.98);
      glowColor = vec3(0.92, 0.42, 0.98);
    } else if (uState == 3.0) { // PAUSED / MEDIA_PAUSED
      coreColor = vec3(0.85, 0.55, 0.15);
      glowColor = vec3(0.65, 0.35, 0.10);
    }

    vec3 color = mix(coreColor, glowColor, n * 0.5 + 0.5);
    color = mix(color, highlightColor, ringLine * 0.7);

    // Audio reactive glow intensity
    color += glowColor * uAudioLevel * 0.6 * haloGlow;
    color += highlightColor * uAudioLevel * 0.3 * ringLine;

    // Center is 100% TRANSPARENT; only perimeter ring & halo glow light up!
    float finalAlpha = clamp(ringLine * 0.95 + haloGlow * 0.5, 0.0, 1.0);

    gl_FragColor = vec4(color * finalAlpha, finalAlpha);
  }
`;

export const VoicePoweredOrb: React.FC<VoicePoweredOrbProps> = ({
  voiceLevel = 0,
  isSpeaking = false,
  state = 'idle',
  className,
  size = 96,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const uniformsRef = useRef<{
    uTime: { value: number };
    uAudioLevel: { value: number };
    uState: { value: number };
    uResolution: { value: [number, number] };
  }>({
    uTime: { value: 0 },
    uAudioLevel: { value: 0 },
    uState: { value: 0 },
    uResolution: { value: [size, size] },
  });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Initialize OGL Renderer with transparent background
    const renderer = new Renderer({
      alpha: true,
      antialias: true,
      dpr: Math.min(window.devicePixelRatio, 2),
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

    const render = (now: number) => {
      const elapsed = (now - startTime) * 0.001;
      uniformsRef.current.uTime.value = elapsed;

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

  // Update uniforms when props change
  useEffect(() => {
    const normalizedLevel = Math.min(1.0, Math.max(0.0, voiceLevel / 100));
    uniformsRef.current.uAudioLevel.value = isSpeaking ? Math.max(0.2, normalizedLevel) : normalizedLevel * 0.4;

    let stateVal = 0; // idle / listening
    if (state === 'EVALUATING' || state === 'thinking') {
      stateVal = 2;
    } else if (state === 'MEDIA_PAUSED' || state === 'paused') {
      stateVal = 3;
    } else if (isSpeaking || state === 'speaking') {
      stateVal = 1;
    }
    uniformsRef.current.uState.value = stateVal;
  }, [voiceLevel, isSpeaking, state]);

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative flex items-center justify-center select-none pointer-events-none',
        className
      )}
      style={{ width: `${size}px`, height: `${size}px` }}
    />
  );
};
