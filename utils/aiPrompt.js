function buildResumePrompt({ role, experience, resume }) {
  return `
You are an experienced technical recruiter.

Analyze the following resume for the role of ${role}.
Candidate experience level: ${experience}.

Resume:
${resume}

IMPORTANT:
- Give a Resume Score out of 100 in this exact format:
  Resume Score: <number>/100

Then provide:
- Strengths
- Weaknesses
- Missing Skills
- Suggestions
`;
}

module.exports = buildResumePrompt;
