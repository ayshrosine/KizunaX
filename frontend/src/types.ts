/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Document {
  id: string;
  title: string;
  date: string;
  category: string;
  size: string;
  iconType: 'paper' | 'cert' | 'draw' | 'receipt' | 'home' | 'medical' | 'flight' | 'security' | 'table' | 'image';
  bgImageUrl: string;
  altText: string;
}

export interface TimelineMilestone {
  id: string;
  title: string;
  date: string;
  category: 'Certification' | 'Leadership' | 'Experience' | 'Portfolio';
  description: string;
  source: string;
  badgeUrl: string;
  borderColor: string; // Tailwind class border-color, e.g. 'border-amber-500'
  colorTheme: 'amber' | 'teal' | 'purple' | 'blue';
}

export interface RecentUpload {
  id: string;
  title: string;
  date: string;
  category: string;
  type: 'cert' | 'project' | 'academics' | 'internship' | 'skill';
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  documents?: {
    title: string;
    size: string;
    date: string;
    iconType: 'paper' | 'pdf' | 'doc';
  }[];
}

export interface GraphNode {
  id: string;
  label: string;
  category: 'skills' | 'certifications' | 'projects' | 'internships' | 'document';
  iconType: 'terminal' | 'analytics' | 'verified' | 'architecture' | 'business_center';
  colorClass: string;
  bgClass: string;
  x?: number;
  y?: number;
}

export interface GraphLink {
  source: string;
  target: string;
}

export interface CareerPath {
  id: string;
  title: string;
  match: number;
  description: string;
  iconType: 'architecture' | 'database' | 'diversity';
  technicalSkills: number;
  leadershipExperience: number;
}
