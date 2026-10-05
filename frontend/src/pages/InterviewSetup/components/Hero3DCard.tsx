import React, { useRef, useMemo, useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';
import { Briefcase, FileText, CheckCircle2 } from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';

export interface Hero3DCardProps {
  mode: 'role' | 'resume';
  originRect: DOMRect | null;
  onImpactPhase?: () => void;
  onFlightComplete?: () => void;
}

export const Hero3DCard: React.FC<Hero3DCardProps> = ({
  mode,
  originRect,
  onImpactPhase,
  onFlightComplete,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const materialRef = useRef<THREE.MeshPhysicalMaterial>(null);
  const { camera } = useThree();
  const theme = useUIStore((state) => state.theme);
  const isDark = theme === 'dark';

  // Screen-to-World coordinate unprojection
  const { startX, startY } = useMemo(() => {
    if (!originRect || typeof window === 'undefined') {
      return { startX: 0, startY: 0 };
    }
    const cardCenterX = originRect.left + originRect.width / 2;
    const cardCenterY = originRect.top + originRect.height / 2;

    const normX = (cardCenterX / window.innerWidth) * 2 - 1;
    const normY = -(cardCenterY / window.innerHeight) * 2 + 1;

    const vec = new THREE.Vector3(normX, normY, 0.5);
    vec.unproject(camera);
    const dir = vec.sub(camera.position).normalize();
    const distance = -camera.position.z / dir.z;
    const pos = camera.position.clone().add(dir.multiplyScalar(distance));

    return { startX: pos.x, startY: pos.y };
  }, [originRect, camera]);

  // Rounded Claymorphic/Neumorphic Extruded Geometry (pillowy 0.05 bevel, 8 segments)
  const cardGeometry = useMemo(() => {
    const shape = new THREE.Shape();
    const width = 3.2;
    const height = 2.2;
    const radius = 0.28;

    const x = -width / 2;
    const y = -height / 2;

    shape.moveTo(x, y + radius);
    shape.lineTo(x, y + height - radius);
    shape.quadraticCurveTo(x, y + height, x + radius, y + height);
    shape.lineTo(x + width - radius, y + height);
    shape.quadraticCurveTo(x + width, y + height, x + width, y + height - radius);
    shape.lineTo(x + width, y + radius);
    shape.quadraticCurveTo(x + width, y, x + width - radius, y);
    shape.lineTo(x + radius, y);
    shape.quadraticCurveTo(x, y, x, y + radius);

    const extrudeSettings = {
      depth: 0.12,
      bevelEnabled: true,
      bevelSegments: 8,
      steps: 1,
      bevelSize: 0.05,
      bevelThickness: 0.05,
    };

    return new THREE.ExtrudeGeometry(shape, extrudeSettings);
  }, []);

  const isRole = mode === 'role';

  // Light Mode palette: warm ivory clay base #EADBC8, zero navy/blue tint on surface!
  // Dark Mode palette: slate navy clay #1E293B.
  const clayColor = isDark ? '#1E293B' : '#EADBC8';

  // GSAP 3D Throw & Instantaneous Paste-Vanish Timeline
  useEffect(() => {
    if (!groupRef.current) return;

    const group = groupRef.current;
    group.position.set(startX, startY, 0);
    group.rotation.set(0, 0, 0);

    const tl = gsap.timeline();

    // 1. ANTICIPATION (0 - 200ms): Tiny recoil z: -0.20
    tl.to(group.position, {
      x: startX * 0.9,
      y: startY * 0.9,
      z: -0.2,
      duration: 0.2,
      ease: 'power1.out',
    }, 0);

    tl.to(group.rotation, {
      x: 0.2,
      y: isRole ? -0.15 : 0.15,
      z: isRole ? -0.08 : 0.08,
      duration: 0.2,
      ease: 'power1.out',
    }, 0);

    // 2. THROW & TUMBLE (200 - 850ms): Forward launch, Y 3-flip with edge-on beat
    tl.to(group.position, {
      x: startX * 0.35,
      y: startY * 0.35,
      z: 1.2,
      duration: 0.65,
      ease: 'power2.inOut',
    }, 0.2);

    const yRotationTarget = isRole ? -Math.PI * 3.5 : Math.PI * 3.5;
    tl.to(group.rotation, {
      y: yRotationTarget,
      duration: 0.65,
      ease: 'power3.inOut',
    }, 0.2);

    tl.to(group.rotation, {
      x: -0.55,
      duration: 0.4,
      ease: 'sine.inOut',
    }, 0.2);
    tl.to(group.rotation, {
      x: 0.15,
      duration: 0.3,
      ease: 'sine.out',
    }, 0.6);

    tl.to(group.rotation, {
      z: isRole ? 0.32 : -0.32,
      duration: 0.35,
      ease: 'power2.out',
    }, 0.2);
    tl.to(group.rotation, {
      z: isRole ? -0.12 : 0.12,
      duration: 0.3,
      ease: 'sine.inOut',
    }, 0.55);

    // 3. CONTINUED APPROACH & RECOVERY (850 - 1250ms)
    tl.to(group.position, {
      x: startX * 0.1,
      y: startY * 0.1,
      z: 2.5,
      duration: 0.4,
      ease: 'power2.in',
    }, 0.85);

    tl.to(group.rotation, {
      y: isRole ? -Math.PI * 4 : Math.PI * 4,
      x: -0.1,
      z: isRole ? 0.05 : -0.05,
      duration: 0.4,
      ease: 'power2.out',
    }, 0.85);

    // 4. RAPID CAMERA RUSH (1250 - 1550ms): Near-camera screen impact
    tl.to(group.position, {
      x: 0,
      y: 0,
      z: 3.85,
      duration: 0.3,
      ease: 'power3.in',
    }, 1.25);

    tl.to(group.rotation, {
      x: 0,
      y: isRole ? -Math.PI * 4 : Math.PI * 4,
      z: 0,
      duration: 0.3,
      ease: 'back.out(1.2)',
    }, 1.25);

    // 5. ULTRA-FAST IMPACT, PASTE & IMMEDIATE VANISH (~45ms total)
    // 1550ms: Impact moment (destination UI mounts underneath)
    tl.add(() => {
      onImpactPhase?.();
    }, 1.55);

    // 1550 - 1568ms (18ms): Micro-impact contact vibration
    tl.to(group.position, {
      x: '+=0.008',
      y: '-=0.005',
      duration: 0.018,
      ease: 'power1.inOut',
    }, 1.55);

    // 1568 - 1595ms (27ms): Instant contact paste & vanish
    tl.to(group.scale, {
      x: 0.6,
      y: 0.6,
      z: 0.6,
      duration: 0.027,
      ease: 'power3.in',
    }, 1.568);

    tl.to(group.position, {
      z: 4.2,
      duration: 0.027,
      ease: 'power3.in',
    }, 1.568);

    // 1595ms: Instantaneous unmount of 3D WebGL mesh!
    tl.add(() => {
      onFlightComplete?.();
    }, 1.595);

    return () => {
      tl.kill();
    };
  }, [startX, startY, isRole, onImpactPhase, onFlightComplete]);

  return (
    <group ref={groupRef}>
      {/* Soft Tactile Claymorphic Material */}
      <mesh geometry={cardGeometry}>
        <meshPhysicalMaterial
          ref={materialRef}
          color={clayColor}
          roughness={0.65}
          metalness={0.0}
          clearcoat={0.0}
          clearcoatRoughness={0.2}
          reflectivity={0.2}
        />
      </mesh>

      {/* HTML Overlay with Theme-Aware Typography & Raised Highlights */}
      <Html
        position={[0, 0, 0.12]}
        transform
        distanceFactor={3.2}
        className="pointer-events-none select-none"
      >
        <div
          className={`w-[320px] h-[220px] p-6 flex flex-col justify-between text-left select-none ${
            isDark ? 'text-slate-100' : 'text-[#102C57]'
          }`}
        >
          <div className="flex items-start justify-between">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center border ${
                isDark
                  ? 'bg-slate-800/80 border-slate-700 text-slate-100'
                  : 'bg-[#F8F0E5]/90 border-[#DAC0A3] text-[#102C57]'
              }`}
            >
              {isRole ? (
                <Briefcase className="w-6 h-6 stroke-[1.75]" />
              ) : (
                <FileText className="w-6 h-6 stroke-[1.75]" />
              )}
            </div>
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full font-mono text-[10px] font-bold tracking-widest uppercase border ${
                isDark
                  ? 'bg-slate-800/80 border-slate-700 text-slate-200'
                  : 'bg-[#F8F0E5]/90 border-[#DAC0A3] text-[#102C57]'
              }`}
            >
              <span>ACTIVE HERO</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-500" />
            </div>
          </div>

          <div>
            <h3 className="text-xl font-stardom uppercase tracking-tight font-normal">
              {isRole ? 'Role-Based Screening' : 'Resume-Based Screening'}
            </h3>
            <p
              className={`text-xs font-sans mt-1 leading-snug ${
                isDark ? 'text-slate-300' : 'text-[#102C57]/80'
              }`}
            >
              {isRole
                ? 'Practice for a specific role and interview profile.'
                : 'Let your resume drive the interview.'}
            </p>
          </div>
        </div>
      </Html>
    </group>
  );
};
