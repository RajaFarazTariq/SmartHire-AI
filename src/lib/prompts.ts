export const EXTRACTION_PROMPT = `You are an expert resume parser.
Extract structured information from the resume below.

Return ONLY valid JSON matching this schema (no markdown, no commentary):
{
  "fullName": string | null,
  "email": string | null,
  "phone": string | null,
  "currentTitle": string | null,
  "skills": string[],
  "yearsExperience": number,
  "educationLevel": "Bachelor's" | "Master's" | "PhD" | "High School" | null,
  "workHistory": [
    { "company": string, "title": string, "yearsAtRole": number }
  ]
}

Rules:
- Normalize skill names: "Postgres" -> "PostgreSQL", "JS" -> "JavaScript", "React.js" -> "React"
- Include both technical skills (languages, frameworks, tools) and named soft skills (e.g., "Team Leadership")
- For yearsExperience, sum total professional experience across all jobs, excluding internships
- Return [] for any list field with no data; null for missing single values

Resume:
{resumeText}`;

// Richer extraction used to auto-fill a job-seeker's PROFILE (not the matching
// pipeline). Pulls the full set of profile fields; everything is optional and
// must be left null/empty when not confidently found in the resume.
export const PROFILE_EXTRACTION_PROMPT = `You are an expert resume parser helping a job seeker fill in their profile.
Extract structured information from the resume below.

Return ONLY valid JSON matching this schema (no markdown, no commentary):
{
  "fullName": string | null,
  "email": string | null,
  "phone": string | null,
  "location": string | null,
  "headline": string | null,
  "summary": string | null,
  "skills": string[],
  "experience": [
    { "title": string, "company": string, "period": string, "description": string }
  ],
  "education": [
    { "school": string, "degree": string, "period": string }
  ],
  "certifications": string[],
  "linkedinUrl": string | null,
  "githubUrl": string | null,
  "portfolioUrl": string | null,
  "websiteUrl": string | null
}

Rules:
- Only include information that is clearly present. If a field is missing or you are not confident, use null (for single values) or [] (for lists). NEVER guess or invent data.
- "headline": the candidate's current/most-recent job title or a concise professional headline (e.g. "Senior Frontend Engineer").
- "summary": a professional summary/objective in the candidate's own words if present, condensed to 1-3 sentences. Do not fabricate one.
- "location": city and/or country only (e.g. "Berlin, Germany"). Omit street addresses.
- "skills": normalize names ("Postgres" -> "PostgreSQL", "JS" -> "JavaScript", "React.js" -> "React"). Include technical and named soft skills. No duplicates.
- "experience": most recent first. "period" is the raw date range as written (e.g. "2021 - Present"). "description" is a short 1-2 sentence summary of the role; use "" if none.
- "education": most recent first. "period" is the raw date range; use "" if absent.
- "certifications": names of certifications/licenses only; [] if none.
- URL fields: return the full URL if present (add https:// if the resume shows a bare domain), else null. Do not put a LinkedIn URL in githubUrl, etc.

Resume:
{resumeText}`;

export const SUMMARY_PROMPT = `You are a recruiting assistant. Assess this candidate's fit for the role.

Job: {jobTitle}
Required skills: {requiredSkills}
Required experience: {minExperience}+ years

Candidate: {candidateName}
Current title: {currentTitle}
Years of experience: {yearsExperience}
Skills: {candidateSkills}
Matched skills: {matchedSkills}
Missing required skills: {missingSkills}

Return ONLY valid JSON (no markdown, no asterisks, no commentary) matching this schema:
{
  "overview": string,
  "strengths": string[],
  "gaps": string[]
}

Guidelines:
- "overview": one balanced sentence summarizing overall fit.
- "strengths": 2-4 concrete, specific strengths (short phrases). Reference real skills/experience.
- "gaps": 0-3 concrete gaps or missing requirements; use [] if there are none.
- Be specific and concrete; avoid generic phrases like "strong candidate".
- Do not invent information not provided above.`;

export const INTERVIEW_QUESTIONS_PROMPT = `You are an expert technical interviewer preparing for a "{interviewType}" interview.

Role: {jobTitle}
Required skills: {requiredSkills}
Candidate: {candidateName} ({currentTitle})
Candidate skills: {candidateSkills}
Skills the candidate may be missing: {missingSkills}

Generate a focused, tailored question set for this interview.

Return ONLY valid JSON (no markdown, no commentary) matching this schema:
[
  { "category": string, "questions": string[] }
]

Guidelines:
- Group questions into 3-4 categories appropriate to a "{interviewType}" interview (e.g. Technical Depth, Problem Solving, Behavioral, Role-Specific).
- 2-4 specific questions per category.
- Tailor to the candidate's actual skills; probe the possible gaps without being hostile.
- Make questions concrete and answerable in an interview; avoid generic filler.`;

export const PANEL_SUMMARY_PROMPT = `You are a hiring coordinator summarizing interview panel feedback.

Candidate: {candidateName}
Role: {jobTitle}

Panel feedback (one block per interviewer):
{feedback}

Return ONLY valid JSON (no markdown, no commentary) matching this schema:
{
  "recommendation": "Strong Yes" | "Yes" | "No" | "Strong No",
  "summary": string,
  "strengths": string[],
  "concerns": string[]
}

Guidelines:
- "recommendation": the overall panel consensus based on the feedback provided.
- "summary": 1-2 balanced sentences synthesizing the panel's view.
- "strengths" / "concerns": 2-4 concise, concrete points each; use [] if none.
- Base everything strictly on the feedback above; do not invent details.`;
