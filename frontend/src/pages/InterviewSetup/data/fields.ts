import {
  Code,
  Cpu,
  Database,
  Cloud,
  Shield,
  Briefcase,
  Palette,
  CheckCircle,
  Smartphone,
  Gamepad2,
  HardDrive,
  TrendingUp,
  Megaphone,
  Layers,
  type LucideIcon,
} from 'lucide-react';

import aiMlImg from '@/assets/images/fields/AIML.webp';
import cloudImg from '@/assets/images/fields/Cloud.webp';
import securityImg from '@/assets/images/fields/Security.webp';
import productImg from '@/assets/images/fields/Product.webp';
import designImg from '@/assets/images/fields/Design.webp';
import qaImg from '@/assets/images/fields/QA.webp';


export type InterviewField = {
  id: string;
  name: string;
  shortName: string;
  code: string;
  description: string;
  roleCount: number;
  icon: LucideIcon;
  image: string;
  tags: string[];
};

export const INTERVIEW_FIELDS: InterviewField[] = [
  {
    id: 'software-engineering',
    name: 'Software Engineering',
    shortName: 'Software',
    code: 'FLD-01',
    description: 'Core backend, frontend, full-stack systems & architecture.',
    roleCount: 8,
    icon: Code,
    image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=1000&auto=format&fit=crop',
    tags: ['Backend', 'Frontend', 'Distributed Systems'],
  },
  {
    id: 'ai-ml',
    name: 'AI & Machine Learning',
    shortName: 'AI & ML',
    code: 'FLD-02',
    description: 'LLMs, computer vision, MLOps, deep learning & Neural Nets.',
    roleCount: 6,
    icon: Cpu,
    image: aiMlImg,
    tags: ['LLMs', 'MLOps', 'PyTorch'],
  },
  {
    id: 'data-analytics',
    name: 'Data & Analytics',
    shortName: 'Data',
    code: 'FLD-03',
    description: 'Data engineering, analytics, pipelines & BI intelligence.',
    roleCount: 5,
    icon: Database,
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1000&auto=format&fit=crop',
    tags: ['ETL', 'SQL', 'Spark'],
  },
  {
    id: 'cloud-devops',
    name: 'Cloud & DevOps',
    shortName: 'Cloud',
    code: 'FLD-04',
    description: 'Infrastructure as Code, Kubernetes, CI/CD & AWS/Azure.',
    roleCount: 6,
    icon: Cloud,
    image: cloudImg,
    tags: ['Kubernetes', 'Terraform', 'AWS'],
  },
  {
    id: 'cybersecurity',
    name: 'Cybersecurity',
    shortName: 'Security',
    code: 'FLD-05',
    description: 'SecOps, penetration testing, cryptography & IAM architecture.',
    roleCount: 4,
    icon: Shield,
    image: securityImg,
    tags: ['AppSec', 'PenTesting', 'ZeroTrust'],
  },
  {
    id: 'product-management',
    name: 'Product & Management',
    shortName: 'Product',
    code: 'FLD-06',
    description: 'Product strategy, roadmap execution & technical leadership.',
    roleCount: 5,
    icon: Briefcase,
    image: productImg,
    tags: ['Strategy', 'Roadmap', 'Scrum'],
  },
  {
    id: 'design',
    name: 'Design & UX',
    shortName: 'Design',
    code: 'FLD-07',
    description: 'Product design, design systems, UX research & micro-interactions.',
    roleCount: 4,
    icon: Palette,
    image: designImg,
    tags: ['UI/UX', 'Figma', 'Design Systems'],
  },
  {
    id: 'quality-engineering',
    name: 'Quality Engineering',
    shortName: 'QA',
    code: 'FLD-08',
    description: 'Automation frameworks, SDET, performance & chaos testing.',
    roleCount: 4,
    icon: CheckCircle,
    image: qaImg,
    tags: ['SDET', 'Cypress', 'Playwright'],
  },
  {
    id: 'mobile-dev',
    name: 'Mobile Development',
    shortName: 'Mobile',
    code: 'FLD-09',
    description: 'iOS Swift, Android Kotlin, React Native & Flutter applications.',
    roleCount: 4,
    icon: Smartphone,
    image: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?q=80&w=1000&auto=format&fit=crop',
    tags: ['iOS', 'Android', 'React Native'],
  },
  {
    id: 'game-dev',
    name: 'Game Development',
    shortName: 'Games',
    code: 'FLD-10',
    description: 'Unreal Engine, Unity, graphics shaders & game physics.',
    roleCount: 3,
    icon: Gamepad2,
    image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=1000&auto=format&fit=crop',
    tags: ['Unreal', 'C++', 'Unity'],
  },
  {
    id: 'embedded-hardware',
    name: 'Embedded & Hardware',
    shortName: 'Hardware',
    code: 'FLD-11',
    description: 'RTOS, C/C++ firmware, IoT systems & microcontrollers.',
    roleCount: 3,
    icon: HardDrive,
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1000&auto=format&fit=crop',
    tags: ['Firmware', 'RTOS', 'C/C++'],
  },
  {
    id: 'finance',
    name: 'FinTech & Quant',
    shortName: 'Finance',
    code: 'FLD-12',
    description: 'Quantitative modeling, algorithmic trading & financial engineering.',
    roleCount: 4,
    icon: TrendingUp,
    image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?q=80&w=1000&auto=format&fit=crop',
    tags: ['Quant', 'Algorithmic', 'Risk'],
  },
  {
    id: 'marketing',
    name: 'Growth & Marketing',
    shortName: 'Growth',
    code: 'FLD-13',
    description: 'Growth engineering, SEO analytics, acquisition & funnels.',
    roleCount: 3,
    icon: Megaphone,
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=1000&auto=format&fit=crop',
    tags: ['Analytics', 'Growth', 'Funnels'],
  },
  {
    id: 'operations',
    name: 'Tech Operations',
    shortName: 'Ops',
    code: 'FLD-14',
    description: 'IT Operations, enterprise strategy & systems administration.',
    roleCount: 3,
    icon: Layers,
    image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?q=80&w=1000&auto=format&fit=crop',
    tags: ['ITIL', 'Enterprise', 'Systems'],
  },
];
