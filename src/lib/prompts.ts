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
