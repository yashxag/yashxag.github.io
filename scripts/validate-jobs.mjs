import fs from 'node:fs';
const jobs=JSON.parse(fs.readFileSync('public/data/jobs.json','utf8'));
if(!Array.isArray(jobs.jobs))throw Error('jobs must be an array');
const jobIds=new Set();
for(const j of jobs.jobs){if(!j.id||!j.title||!j.company)throw Error('Invalid job '+j.id);if(jobIds.has(j.id))throw Error('Duplicate job '+j.id);jobIds.add(j.id)}
const data=JSON.parse(fs.readFileSync('public/data/dsa.json','utf8'));
if(!Array.isArray(data.problems))throw Error('problems must be an array');
const ids=new Set(),slugs=new Set();
for(const p of data.problems){
 if(!p.id||!p.slug||!p.title||!['Easy','Medium'].includes(p.difficulty)||!p.topic||!p.dateAdded||!p.statement||!p.javaCode||!p.steps?.length||!p.example?.input||!p.example?.output||!p.timeComplexity||!p.spaceComplexity)throw Error('Invalid DSA problem '+p.id);
 if(ids.has(p.id)||slugs.has(p.slug))throw Error('Duplicate DSA problem '+p.id);
 ids.add(p.id);slugs.add(p.slug);
}
console.log('Valid jobs:',jobIds.size,'Valid DSA problems:',ids.size);
