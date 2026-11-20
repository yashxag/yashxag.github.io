import React,{useMemo,useState} from 'react';
import {Button,Tabs,Tab} from '@mui/material';
import {ContentCopy,CheckCircleOutline,DescriptionOutlined,MailOutline,PsychologyOutlined,ExpandMore,ExpandLess} from '@mui/icons-material';

const valueOrUnknown=(value)=>typeof value==='string'&&value.trim()?value.trim():'Not provided';
const context=(job)=>`TARGET JOB (from the listing dataset; check the official page for anything more recent):
Company: ${valueOrUnknown(job.company)}
Role: ${valueOrUnknown(job.title)}
Job ID: ${valueOrUnknown(job.requisitionId||job.id)}
Location: ${valueOrUnknown(job.location)}
Work arrangement: ${valueOrUnknown(job.workMode)}
Experience requested: ${valueOrUnknown(job.experience)}
Required/relevant skills: ${valueOrUnknown(job.skills)}
Pay: ${valueOrUnknown(job.salary)}
Status and last check: ${valueOrUnknown(job.vacancyStatus)} | ${valueOrUnknown(job.lastChecked)}
Official job URL: ${valueOrUnknown(job.url)}
Job description available in dataset:
${valueOrUnknown(job.description)}

Treat these as provided listing details, not independently verified current facts. If the job description is incomplete, ask me to paste the full JD or consult the official URL if you have browsing access. Do not invent requirements or assume the vacancy is still open.`;

const resumePrompt=(job)=>`Act as a practical India-focused technical recruiter and resume writer. Help me produce BOTH a concise ATS-friendly resume tailored to the job below and an expanded CV only if the role/application needs one.

${context(job)}

PHASE 1 — ASK BEFORE WRITING
First ask one focused batch of questions about:
- My current resume (ask me to paste or upload it), total experience, current role/company, responsibilities, and technology I have actually used.
- 2–4 strongest work or personal projects: my contributions, tech stack, scale, outcomes, and defensible numbers.
- Education, certifications, portfolio/GitHub/LinkedIn, achievements, location preference, and anything the job specifically requires.
- Missing evidence for this job's important skills. Distinguish professional experience from coursework, personal projects, and skills I am still learning.
Ask only what is missing and let me answer in stages. Do not produce the final resume/CV until I respond.

PHASE 2 — FIT & SKILL ADVICE
Briefly map job requirements to my verified experience: strong matches, honest gaps, and 3–5 worthwhile skills/topics to improve. Ask whether I want to include any optional skills I genuinely possess. Never insert a recommended or unlearned skill into my resume as if I already have it.

PHASE 3 — DELIVERABLES
1) A one-page ATS-friendly resume (two pages only if justified), with a strong role-specific summary, skills, impact-oriented experience, projects, and education. Plain headings, no tables/graphics, no keyword stuffing.
2) A more detailed CV where useful, clearly separate from the resume.
3) A short list of what changed for this role, keywords grounded in the JD, and unresolved factual gaps.
Use clear Indian English and truthful, quantified bullets where evidence exists. Never invent experience, dates, employers, metrics, qualifications, certifications, or tools. Preserve my correct contact details and ask for them if missing. Return copy-ready text after questions are answered.`;

const outreachPrompt=(job)=>`Act as a job-search outreach strategist and professional technical recruiter. I want a realistic, respectful approach to applying and contacting relevant people for the exact role below.

${context(job)}

STEP 1 — ASK ME FIRST
Ask whether I already applied, my current/target location, notice period, relevant achievements, LinkedIn/portfolio links, any existing contacts/referrals, and whether I prefer email or LinkedIn. Ask for my resume or 3–4 bullet highlights. Do not draft personalized claims until I answer.

STEP 2 — WHO TO CONTACT & HOW
Give an ordered plan: (1) apply via the official listing where available; (2) seek an authentic employee referral or reach the recruiting team; (3) contact a relevant hiring manager only if identifiable. If you can browse, research employer careers/official public professional profiles and provide each person's verifiable role, source link, and a suitable channel. If you cannot verify a person's identity, workplace or publicly provided professional email address, say so and use role-based targets rather than inventing names or emails. Do not guess email formats or recommend mass unsolicited emailing. Flag if the role appears closed or location eligibility is unclear.

STEP 3 — DRAFTS, AFTER MY REPLIES
Produce concise, usable drafts tailored to my real background:
- Application follow-up email to a verified recruiter (subject + body)
- Referral request to an employee (email/LinkedIn)
- Short LinkedIn connection note (under 300 characters) and follow-up DM
- Hiring-manager approach only when appropriate
- One polite follow-up after about 5–7 business days, with a stop point
For each, specify recipient ROLE (and actual name/contact only if verified), channel, timing and purpose. Use placeholders for unknown contacts, never fictitious addresses. Avoid pushy language and fake referrals. Include a small actionable contact/order checklist; do not claim any message was sent.`;

const interviewPrompt=(job)=>`Act as an experienced interviewer for an early-career backend/software engineering role. Create job-specific interview preparation that fits the vacancy below and my REAL experience, not a generic question dump.

${context(job)}

BEFORE GENERATING QUESTIONS
Ask me a short batch of questions: my actual years of experience, hands-on proficiency with the listed technologies, current project responsibilities, interview date/stage if known, weak areas, and time available to prepare. Ask for the complete JD if the provided description is limited. Wait for my response before creating a tailored question set.

THEN BUILD A PRACTICAL PREPARATION PACK
1) Summarize the likely interview rounds and rank skills by this role's actual JD. Explain what is confirmed versus your general interview expectation.
2) Create a prioritized collection of role-specific questions across relevant areas only: Java fundamentals/concurrency, Spring Boot/REST/microservices, SQL/PostgreSQL, AWS/cloud, testing/debugging, system design at roughly 1–4 YOE, and DSA (arrays, strings, maps, trees, graphs, etc.). Include Python or Liferay only if relevant to the job or my background.
3) For each question provide a direct plain-English answer, why it matters, common follow-up(s), and one practical example where useful. For DSA give a clear approach, complexity, and clean Java solution after I attempt it or request the solution.
4) Include a few realistic behavioral/project deep-dives derived only from achievements I actually confirm, plus 2–3 good questions I can ask the interviewer.
5) Offer a short mock interview, one question at a time, with feedback and a targeted revision plan.

Do not assert that specific questions were asked at this employer without reliable evidence; label estimates clearly. Start with your clarification questions, not the completed pack.`;

const tools=[
  {key:'resume',label:'Resume & CV',icon:DescriptionOutlined,description:'Tailored ATS resume and optional extended CV; asks about your experience before writing.',builder:resumePrompt},
  {key:'outreach',label:'Outreach',icon:MailOutline,description:'A realistic contact plan, recruiter/referral targeting and ready-to-send drafts.',builder:outreachPrompt},
  {key:'interview',label:'Interview prep',icon:PsychologyOutlined,description:'Role-specific questions, simple explanations and an optional mock interview.',builder:interviewPrompt}
];

export default function JobToolkit({job}){
  const [selected,setSelected]=useState(0);
  const [expanded,setExpanded]=useState(false);
  const [feedback,setFeedback]=useState('');
  const current=tools[selected];
  const prompt=useMemo(()=>current.builder(job),[current,job]);
  const handleTab=(_,next)=>{setSelected(next);setExpanded(false);setFeedback('')};
  const copy=async()=>{
    try{await navigator.clipboard.writeText(prompt);setFeedback('Copied. Paste into your preferred AI chat.')}
    catch{setFeedback('Clipboard unavailable in this browser. Expand the prompt and copy it manually.');setExpanded(true)}
  };
  return <section className="panel job-toolkit" aria-label="Job-specific AI prompts">
    <div className="toolkit-heading"><div><p className="micro">PREPARE FOR THIS ROLE</p><h2>AI application toolkit</h2><p className="sub">Three tailored prompts for this exact job. No account or AI integration needed.</p></div></div>
    <Tabs value={selected} onChange={handleTab} variant="scrollable" scrollButtons="auto" aria-label="AI prompt categories" className="toolkit-tabs">
      {tools.map(({key,label,icon:Icon})=><Tab key={key} label={label} icon={<Icon fontSize="small"/>} iconPosition="start" id={'toolkit-tab-'+key} aria-controls="toolkit-panel"/>)}
    </Tabs>
    <div className="toolkit-content" id="toolkit-panel" role="tabpanel" aria-labelledby={'toolkit-tab-'+current.key}>
      <h3>{current.label} prompt</h3>
      <p className="sub">{current.description}</p>
      <p className="toolkit-note"><CheckCircleOutline fontSize="small"/> The AI must ask for missing details before producing personalized content.</p>
      <div className={'toolkit-prompt '+(expanded?'expanded':'collapsed')}><pre>{prompt}</pre></div>
      <div className="toolkit-actions">
        <Button variant="contained" onClick={copy} startIcon={<ContentCopy/>}>Copy {current.label} prompt</Button>
        <Button variant="outlined" onClick={()=>setExpanded(!expanded)} endIcon={expanded?<ExpandLess/>:<ExpandMore/>}>{expanded?'Show less':'Preview full prompt'}</Button>
      </div>
      {feedback&&<p className="toolkit-feedback" role="status">{feedback}</p>}
    </div>
  </section>
}
