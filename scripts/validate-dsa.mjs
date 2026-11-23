import fs from 'node:fs';

const load = file => JSON.parse(fs.readFileSync('public/data/' + file, 'utf8'));
const road = load('dsa-roadmap.json');
const original = load('dsa.json').problems || [];
const batches = ['a','b','c','d','e'].flatMap(letter => load('dsa-solutions-' + letter + '.json').solutions || []);
const problems = [...original, ...batches];
const concepts = load('dsa-concepts.json').concepts || [];
const fail = message => { throw new Error('DSA validation: ' + message); };
const required = (value, description) => { if (typeof value !== 'string' || !value.trim()) fail('Missing ' + description); };

if (!Array.isArray(road.stages) || road.stages.length !== 21) fail('Expected 21 stages');
if (problems.length !== 128) fail('Expected 128 fully worked problems, got ' + problems.length);
if (concepts.length !== 69) fail('Expected 69 algorithm/data-structure lessons, got ' + concepts.length);
const stages = new Map(road.stages.map(stage => [stage.id, stage]));
if (stages.size !== road.stages.length) fail('Duplicate stage id');
const bySlug = new Map();
for (const p of problems) {
  required(p.slug, 'slug');
  if (bySlug.has(p.slug)) fail('Duplicate problem ' + p.slug);
  bySlug.set(p.slug, p);
  for (const key of ['title','statement','javaCode','timeComplexity','spaceComplexity','interviewTip'])
    required(p[key], p.slug + '.' + key);
  if (!p.example || !p.example.input || !p.example.output) fail('Example incomplete: ' + p.slug);
  for (const key of ['steps','dryRun','testCases','variants'])
    if (!Array.isArray(p[key]) || p[key].length < 2) fail('Incomplete ' + key + ': ' + p.slug);
  if (!p.variants.some(v => v.javaCode && v.type === 'Optimized')) fail('Missing optimized Java variant: ' + p.slug);
  for (const tc of p.testCases)
    if (typeof tc.input !== 'string' || typeof tc.expected !== 'string') fail('Incomplete test: ' + p.slug);
}
const listed = new Set();
for (const stage of road.stages) {
  required(stage.title, 'stage title ' + stage.id);
  if (!stage.dataStructure?.name || !stage.dataStructure?.description || !stage.dataStructure?.realWorld)
    fail('Incomplete data structure introduction in ' + stage.id);
  if (!Array.isArray(stage.algorithms) || stage.algorithms.length < 1)
    fail('No algorithms in ' + stage.id);
  if (!stage.problemSlugs?.length) fail('No exercises in ' + stage.id);
  for (const pre of stage.prerequisites || [])
    if (!stages.has(pre)) fail('Unknown prerequisite ' + pre);
  for (const slug of stage.problemSlugs) {
    if (!bySlug.has(slug)) fail('Missing worked problem ' + slug);
    if (listed.has(slug)) fail('Duplicate problem placement ' + slug);
    listed.add(slug);
  }
}
if (listed.size !== problems.length) fail('Problems not present in ordered stages: ' + (problems.length - listed.size));
const conceptIds = new Set();
for (const concept of concepts) {
  const id = concept.stageId + '/' + concept.id;
  if (conceptIds.has(id)) fail('Duplicate concept ' + id);
  conceptIds.add(id);
  if (!stages.has(concept.stageId)) fail('Unknown concept stage ' + id);
  for (const key of ['kind','title','overview','mentalModel','whenToUse','tradeoffs','commonMistakes','realWorld','javaCode','codeLabel'])
    required(concept[key], id + '.' + key);
  if (!bySlug.has(concept.linkedSlug)) fail('Broken concept practice link ' + id);
  if (!concept.exampleDetail?.input || !concept.exampleDetail?.output) fail('Missing concept example ' + id);
  if (!concept.dryRun?.length || !concept.testCases?.length) fail('Missing concept dry run/tests ' + id);
}
for (const stage of road.stages) {
  for (const id of ['ds', ...stage.algorithms.map((_,i) => 'a' + i)])
    if (!conceptIds.has(stage.id + '/' + id)) fail('Missing lesson page ' + stage.id + '/' + id);
}
console.log('DSA content verified:',road.stages.length,'stages,',problems.length,'Java problem lessons,',concepts.length,'concept lessons');
