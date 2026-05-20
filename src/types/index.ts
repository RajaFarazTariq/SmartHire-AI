// User types
export interface User {
  id: string;
  email: string;
  createdAt: Date;
}

// Job types
export interface Job {
  id: string;
  userId: string;
  title: string;
  company?: string;
  description: string;
  requiredSkills: string[];
  preferredSkills?: string[];
  minExperience?: number;
  pineconeId?: string;
  createdAt: Date;
}

// Candidate types
export interface Candidate {
  id: string;
  userId: string;
  fullName?: string;
  email?: string;
  phone?: string;
  filename: string;
  fileUrl: string;
  fileType: 'pdf' | 'docx';
  rawText: string;
  extractedSkills: string[];
  yearsExperience?: number;
  educationLevel?: string;
  currentTitle?: string;
  pineconeId?: string;
  status: 'processing' | 'ready' | 'error';
  uploadedAt: Date;
}

// Extraction result types
export interface ExtractionResult {
  fullName: string | null;
  email: string | null;
  phone: string | null;
  currentTitle: string | null;
  skills: string[];
  yearsExperience: number;
  educationLevel: 'Bachelor\'s' | 'Master\'s' | 'PhD' | 'High School' | null;
  workHistory: Array<{
    company: string;
    title: string;
    yearsAtRole: number;
  }>;
}

// Scoring types
export interface Score {
  id: string;
  jobId: string;
  candidateId: string;
  semanticScore: number;
  skillMatchScore: number;
  experienceScore: number;
  overallScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  aiSummary?: string;
  computedAt: Date;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
