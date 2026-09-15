/**
 * Resume Intelligence API client
 */

import { apiClient } from './client';

export interface PipelineStatus {
  parse_status: string;
  analysis_status: string;
  embedding_status: string;
}

export interface ResumeSection {
  name: string;
  detected: boolean;
  quality: 'good' | 'needs_improvement' | 'missing';
  notes: string;
}

export interface SkillExtracted {
  name: string;
  normalized_key: string;
  evidence: string;
  source_section: string;
}

export interface Recommendations {
  critical: string[];
  recommended: string[];
  optional: string[];
}

export interface ResumeAnalysis {
  summary: string;
  detected_role: string | null;
  sections_detected: ResumeSection[];
  education_summary: string;
  experience_summary: string;
  skills: SkillExtracted[];
  certifications: string[];
  strengths: string[];
  weak_sections: string[];
  recommendations: Recommendations;
  has_contact_info: boolean;
  has_education: boolean;
  has_experience: boolean;
  has_projects: boolean;
  has_certifications: boolean;
  has_skills_section: boolean;
  has_quantified_achievements: boolean;
  bullet_structure_quality: 'good' | 'partial' | 'poor';
  role_keywords_found: string[];
  role_keywords_missing: string[];
  error?: string;
}

export interface ScoreBreakdown {
  parseability: number;
  contact_completeness: number;
  education_present: number;
  experience_clarity: number;
  quantified_impact: number;
  skill_evidence_coverage: number;
  certifications_strength: number;
  role_keyword_coverage: number;
  total: number;
}

export interface ResumeUploadResponse {
  resume_id: string;
  original_filename: string;
  file_size_bytes: number;
  version: number;
  is_duplicate: boolean;
  pipeline: PipelineStatus;
  analysis: ResumeAnalysis | null;
  resume_quality_score: number | null;
  score_version: string | null;
  score_breakdown: ScoreBreakdown | null;
  extracted_skills: SkillExtracted[];
  status_message: string;
  created_at: string;
  updated_at: string;
}

export interface ResumeListItem {
  id: string;
  original_filename: string;
  file_size_bytes: number;
  version: number;
  parse_status: string;
  analysis_status: string;
  embedding_status: string;
  resume_quality_score: number | null;
  is_archived: boolean;
  created_at: string;
}

export const resumesApi = {
  /**
   * Upload and analyze a resume PDF
   */
  async uploadResume(
    accessToken: string,
    file: File,
    targetRole?: string
  ): Promise<ResumeUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    if (targetRole) {
      formData.append('target_role', targetRole);
    }

    return apiClient.request<ResumeUploadResponse>('/resumes/upload-resume', {
      method: 'POST',
      body: formData,
      accessToken,
      timeoutMs: 60_000,
    });
  },

  /**
   * Get the latest persisted resume analysis without re-running
   */
  async getLatestResume(accessToken: string): Promise<ResumeUploadResponse | null> {
    try {
      const result = await apiClient.request<ResumeUploadResponse | null>('/resumes/latest', {
        method: 'GET',
        accessToken,
      });
      return result ?? null;
    } catch {
      return null;
    }
  },

  /**
   * List all non-archived resumes
   */
  async listResumes(accessToken: string): Promise<ResumeListItem[]> {
    return apiClient.request<ResumeListItem[]>('/resumes', {
      method: 'GET',
      accessToken,
    });
  },

  /**
   * Soft-delete a resume
   */
  async deleteResume(accessToken: string, id: string): Promise<void> {
    return apiClient.request<void>(`/resumes/${id}`, {
      method: 'DELETE',
      accessToken,
    });
  },

  /**
   * Re-run analysis on an existing resume
   */
  async reanalyzeResume(
    accessToken: string,
    id: string,
    targetRole?: string
  ): Promise<ResumeUploadResponse> {
    const formData = new FormData();
    if (targetRole) {
      formData.append('target_role', targetRole);
    }

    return apiClient.request<ResumeUploadResponse>(`/resumes/${id}/reanalyze`, {
      method: 'POST',
      body: formData,
      accessToken,
      timeoutMs: 60_000,
    });
  },
};
