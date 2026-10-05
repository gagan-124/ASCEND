import aiEngineerImg from '@/assets/images/roles/ai-engineer.webp';
import softwareEngineerImg from '@/assets/images/roles/software-engineer.webp';
import dataScientistImg from '@/assets/images/roles/data-scientist.webp';
import cloudEngineerImg from '@/assets/images/roles/cloud-engineer.webp';
import cybersecurityEngineerImg from '@/assets/images/roles/cybersecurity-engineer.webp';
import productManagerImg from '@/assets/images/roles/product-manager.webp';
import gameDeveloperImg from '@/assets/images/roles/game-developer.webp';


export interface RoleArtworkConfig {
  scale?: number;
  fit?: 'contain' | 'cover';
  position?: string;
}

export interface RoleSlideConfig {
  id: string;
  role: string;
  image: string;
  description: string;
  artwork?: RoleArtworkConfig;
}

export const HERO_ROLES: RoleSlideConfig[] = [
  {
    id: 'ai-engineer',
    role: 'AI ENGINEER',
    image: aiEngineerImg,
    description: 'AI Engineer: Neural tensor architectures, model evaluation, and LLM systems.',
    artwork: {
      fit: 'contain',
      scale: 0.98,
      position: 'center',
    },
  },
  {
    id: 'software-engineer',
    role: 'SOFTWARE ENGINEER',
    image: softwareEngineerImg,
    description: 'Software Engineer: Full-stack architecture, distributed systems, and core software engineering.',
    artwork: {
      fit: 'contain',
      scale: 0.98,
      position: 'center',
    },
  },
  {
    id: 'data-scientist',
    role: 'DATA SCIENTIST',
    image: dataScientistImg,
    description: 'Data Scientist: Multidimensional statistical modeling and probabilistic manifolds.',
    artwork: {
      fit: 'contain',
      scale: 0.98,
      position: 'center',
    },
  },
  {
    id: 'cloud-engineer',
    role: 'CLOUD ENGINEER',
    image: cloudEngineerImg,
    description: 'Cloud Engineer: Cloud cluster telemetry, container orchestration, and continuous deployment.',
    artwork: {
      fit: 'contain',
      scale: 0.98,
      position: 'center',
    },
  },
  {
    id: 'cybersecurity-engineer',
    role: 'CYBERSECURITY ENGINEER',
    image: cybersecurityEngineerImg,
    description: 'Cybersecurity Engineer: Threat vectors, cryptographic boundaries, and security architecture.',
    artwork: {
      fit: 'contain',
      scale: 0.94,
      position: 'center',
    },
  },
  {
    id: 'product-manager',
    role: 'PRODUCT MANAGER',
    image: productManagerImg,
    description: 'Product Manager: Technical product strategy, user discovery, and roadmap execution.',
    artwork: {
      fit: 'contain',
      scale: 0.98,
      position: 'center',
    },
  },
  {
    id: 'game-developer',
    role: 'GAME DEVELOPER',
    image: gameDeveloperImg,
    description: 'Game Developer: Real-time rendering, physics engines, and graphics programming.',
    artwork: {
      fit: 'contain',
      scale: 0.98,
      position: 'center',
    },
  },
];
