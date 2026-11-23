import fs from 'node:fs';
const jobs=JSON.parse(fs.readFileSync('public/data/jobs.json','utf8'));
if(!Array.isArray(jobs.jobs))throw Error('jobs must be an array');
const jobIds=new Set();
for(const j of jobs.jobs){if(!j.id||!j.title||!j.company)throw Error('Invalid job '+j.id);if(jobIds.has(j.id))throw Error('Duplicate job '+j.id);jobIds.add(j.id)}

// Salary provenance is optional, but any estimate shown to users must be traceable.
for(const job of jobs.jobs) {
  const known = Boolean(job.salary && job.salary !== 'Not disclosed');
  const e = job.salaryEvidence;
  if(e) {
    if(!known) throw Error('Salary evidence without salary: '+job.id);
    if(!['third_party_estimate','employer_disclosed'].includes(e.type)) throw Error('Invalid salary source type: '+job.id);
    if(!e.sourceName || !/^https:\/\//.test(e.sourceUrl||'') || !e.scope || !/^\d{4}-\d{2}-\d{2}$/.test(e.checkedAt||'')) throw Error('Incomplete salary source evidence: '+job.id);
    if(e.type==='third_party_estimate'&&!job.salary.startsWith('Est. ')) throw Error('Third-party amount not labelled estimated: '+job.id);
  }
  if(job.salaryMinLpa!==undefined || job.salaryMaxLpa!==undefined) {
    if(!e || !e.sourceUrl || !Number.isFinite(job.salaryMinLpa) || !Number.isFinite(job.salaryMaxLpa) || job.salaryMinLpa<0 || job.salaryMaxLpa<job.salaryMinLpa)
      throw Error('Invalid estimated salary range: '+job.id);
  }
}
const data=JSON.parse(fs.readFileSync('public/data/dsa.json','utf8'));
if(!Array.isArray(data.problems))throw Error('problems must be an array');
const ids=new Set(),slugs=new Set();
for(const p of data.problems){
 if(!p.id||!p.slug||!p.title||!['Easy','Medium'].includes(p.difficulty)||!p.topic||!p.dateAdded||!p.statement||!p.javaCode||!p.steps?.length||!p.example?.input||!p.example?.output||!p.timeComplexity||!p.spaceComplexity)throw Error('Invalid DSA problem '+p.id);
 if(ids.has(p.id)||slugs.has(p.slug))throw Error('Duplicate DSA problem '+p.id);
 ids.add(p.id);slugs.add(p.slug);
}
console.log('Valid jobs:',jobIds.size,'Valid DSA problems:',ids.size);
