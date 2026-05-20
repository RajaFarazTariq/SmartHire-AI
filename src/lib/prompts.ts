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

export const SUMMARY_PROMPT = `Analyze this candidate's fit for the role.
Write a concise 2-3 sentence summary suitable for a recruiter dashboard.

Job: {jobTitle}
Required skills: {requiredSkills}
Required experience: {minExperience}+ years

Candidate: {candidateName}
Current title: {currentTitle}
Years of experience: {yearsExperience}
Skills: {candidateSkills}

Matched skills: {matchedSkills}
Missing required skills: {missingSkills}

Write a balanced assessment. Mention strengths first, then specific gaps. 
Avoid generic phrases like "strong candidate" - be concrete about what aligns and what doesn't. 
Do not invent information not provided above.`;
