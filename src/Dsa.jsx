import React, {useEffect,useMemo,useState} from 'react';
import {Link,useParams} from 'react-router-dom';
import {Alert,Button,TextField,MenuItem,InputAdornment,IconButton,Collapse} from '@mui/material';
import {ArrowBack,CheckCircleOutline,ContentCopy,Search,ExpandMore,ExpandLess,OpenInNew,AccountTree,Code,Terminal,Tune,Close} from '@mui/icons-material';
import ProfolioLoader from './ProfolioLoader.jsx';
import './dsa-roadmap.css';

const progressKey='careerboard-dsa-progress-v2';
const oldKey='careerboard-dsa-solved-v1';
const base=import.meta.env.BASE_URL;
const readProgress=()=>{try{return JSON.parse(localStorage.getItem(progressKey)||'{}')||{}}catch{return {}}};
const safeSave=state=>{try{localStorage.setItem(progressKey,JSON.stringify(state))}catch{/* private browsing may block storage */}};
const softSort=(a,b)=>['Easy','Medium','Hard'].indexOf(a)-['Easy','Medium','Hard'].indexOf(b);
const urlFor=p=>'\/dsa\/'+p.slug;
const stageNumber=s=>s?.number||'--';

function useRoadmap(){
 const [state,setState]=useState({loading:true,error:'',stages:[],problems:[],concepts:[],method:[]});
 useEffect(()=>{
  let active=true;
  const json=async path=>{const res=await fetch(base+'data/'+path,{cache:'no-store'});if(!res.ok)throw Error(path+': HTTP '+res.status);return res.json()};
  Promise.all(['dsa.json','dsa-roadmap.json','dsa-solutions-a.json','dsa-solutions-b.json','dsa-solutions-c.json','dsa-solutions-d.json','dsa-solutions-e.json','dsa-concepts.json'].map(json))
  .then(([old,road,a,b,c,d,e,lessonData])=>{
   const solved=[...(old.problems||[]),...(a.solutions||[]),...(b.solutions||[]),...(c.solutions||[]),...(d.solutions||[]),...(e.solutions||[])];
   const bySlug=new Map((road.practice||[]).map(p=>[p.slug,p]));
   for(const p of solved){const guide=bySlug.get(p.slug)||{};bySlug.set(p.slug,{...guide,...p,companyEvidence:(p.companyEvidence?.length?p.companyEvidence:guide.companyEvidence)||[],practiceUrl:guide.practiceUrl,format:'worked'})}
   const ordered=[];const found=new Set();
   for(const s of road.stages||[]){for(const slug of s.problemSlugs||[]){const p=bySlug.get(slug);if(p&&!found.has(slug)){found.add(slug);ordered.push({...p,stageId:s.id,order:ordered.length+1})}}}
   const orphan=solved.filter(p=>!found.has(p.slug)).map(p=>({...p,order:ordered.length+1}));
   if(active)setState({loading:false,error:'',stages:road.stages||[],problems:[...ordered,...orphan],concepts:lessonData.concepts||[],method:road.studyMethod||[]});
  }).catch(e=>{if(active)setState(v=>({...v,loading:false,error:e.message}))});
  return()=>{active=false};
 },[]);
 return state;
}
function CompanyTags({p,compact=false}){const all=p.companyEvidence||[];const shown=compact?all.slice(0,2):all;return shown.length?<div className="learning-company-row">{shown.map((item,i)=>compact?<span className="learning-company-tag" key={item.company+i} title="Open the problem details for supporting interview reports">{item.company}</span>:<a className="learning-company-tag" href={item.url} key={item.company+i} target="_blank" rel="noreferrer" title={item.label||'Third-party interview report'}>{item.company} <span aria-hidden="true">↗</span></a>)}{compact&&all.length>2&&<span className="learning-company-extra" title="Other third-party interview references">+{all.length-2} sources</span>}</div>:null}
function Difficulty({value}){return <span className={'learning-difficulty level-'+(value||'easy').toLowerCase()}>{value||'Easy'}</span>}
function LearningTypePill({type}){const Icon=type==='Data structure'?AccountTree:type==='Algorithm'?Terminal:Code;const cls=type==='Data structure'?'structure':type==='Algorithm'?'algorithm':'problem';return <span className={'learning-kind-pill kind-'+cls} title={type} role="img" aria-label={type}><Icon aria-hidden="true" fontSize="inherit"/></span>}
function Solved({slug,progress,toggle,compact=false}){const done=!!progress[slug];return <button type="button" className={'learning-check '+(done?'is-done':'')+(compact?' compact-check':'')} onClick={e=>{e.stopPropagation();toggle(slug)}} aria-pressed={done} aria-label={(done?'Mark unsolved: ':'Mark solved: ')+slug} title={done?'Mark unsolved':'Mark solved'}><CheckCircleOutline fontSize="small"/>{!compact&&<span>{done?'Solved':'Mark solved'}</span>}</button>}
function Dsa(){const {id}=useParams();const {loading,error,stages,problems,concepts,method}=useRoadmap();const [progress,setProgress]=useState(readProgress);
 useEffect(()=>{if(loading||!problems.length)return;try{const old=JSON.parse(localStorage.getItem(oldKey)||'{}');setProgress(prev=>{const next={...prev};let changed=false;for(const p of problems)if(old[p.id]&&!Object.prototype.hasOwnProperty.call(next,p.slug)){next[p.slug]=true;changed=true}return changed?next:prev})}catch{/* nothing to migrate */}},[loading,problems]);
 useEffect(()=>safeSave(progress),[progress]);
 const toggle=slug=>setProgress(v=>({...v,[slug]:!v[slug]}));
 if(loading)return <ProfolioLoader label="Loading DSA learning roadmap"/>;
 if(error)return <Alert severity="error">Could not load the DSA roadmap: {error}. Reload the page after the latest deployment.</Alert>;
 if(id){const p=problems.find(item=>item.slug===id||item.id===id);if(!p)return <section className="panel"><p>Problem not found.</p><Link to="/dsa">Back to roadmap</Link></section>;return <ProblemDetail p={p} stage={stages.find(s=>s.id===p.stageId)} progress={progress} toggle={toggle}/>;}
 return <RoadmapHome stages={stages} problems={problems} concepts={concepts} method={method} progress={progress} toggle={toggle}/>;
}
function RoadmapHome({stages,problems,concepts,method,progress,toggle}){
 const [mode,setMode]=useState('roadmap'),[expanded,setExpanded]=useState('fundamentals');
 const [search,setSearch]=useState(''),[typeFilter,setTypeFilter]=useState('All'),[difficulty,setDifficulty]=useState('All'),[stageFilter,setStageFilter]=useState('All'),[status,setStatus]=useState('All'),[advancedOpen,setAdvancedOpen]=useState(false);
 const solved=problems.filter(p=>progress[p.slug]).length;
 const worked=problems.filter(p=>p.format==='worked').length;
 const completedStages=stages.filter(s=>s.problemSlugs?.every(slug=>progress[slug])).length;
 const next=problems.find(p=>!progress[p.slug])||problems[0];
 const entriesByStage=useMemo(()=>{
  const bySlug=new Map(problems.map(p=>[p.slug,p]));
  const lessonsByStage=new Map(stages.map(s=>[s.id,concepts.filter(c=>c.stageId===s.id)]));
  return new Map(stages.map(s=>{
   const lessons=lessonsByStage.get(s.id)||[];
   const structure=lessons.filter(c=>c.kind==='Data structure').map(lesson=>({key:'lesson-'+s.id+'-'+lesson.id,type:'Data structure',stageId:s.id,lesson}));
   const algorithms=lessons.filter(c=>c.kind==='Algorithm').map(lesson=>({key:'lesson-'+s.id+'-'+lesson.id,type:'Algorithm',stageId:s.id,lesson}));
   const exercises=(s.problemSlugs||[]).map(slug=>bySlug.get(slug)).filter(Boolean).map(p=>({key:'problem-'+p.slug,type:'Problem',stageId:s.id,p}));
   return [s.id,[...structure,...algorithms,...exercises]];
  }));
 },[stages,concepts,problems]);
 const allEntries=stages.flatMap(s=>entriesByStage.get(s.id)||[]);
 const matches=entry=>{
  const isProblem=entry.type==='Problem';
  const p=entry.p;
  const lesson=entry.lesson;
  const stage=stages.find(s=>s.id===entry.stageId);
  const words=(isProblem?[p.title,p.slug,p.topic,p.skills]:[lesson.title,lesson.overview,lesson.kind,lesson.mentalModel,lesson.whenToUse]);
  const searchable=[...words,stage?.title].filter(Boolean).join(' ').toLowerCase();
  return (!search.trim()||searchable.includes(search.trim().toLowerCase()))
   &&(typeFilter==='All'||entry.type===typeFilter)
   &&(difficulty==='All'||(isProblem&&p.difficulty===difficulty))
   &&(stageFilter==='All'||entry.stageId===stageFilter)
   &&(status==='All'||(status==='Solved'&&isProblem&&!!progress[p.slug])
      ||(status==='Unsolved'&&isProblem&&!progress[p.slug])
      ||(status==='With Java'&&!!(isProblem?p.javaCode:lesson.javaCode)));
 };
 const filtered=allEntries.filter(matches);
 const byStage=new Map(stages.map(s=>[s.id,(entriesByStage.get(s.id)||[]).filter(matches)]));
 const problemCount=filtered.filter(item=>item.type==='Problem').length;
 const typeOptions=[{value:'All',label:'All',count:allEntries.length},{value:'Data structure',label:'Structures',count:concepts.filter(c=>c.kind==='Data structure').length},{value:'Algorithm',label:'Algorithms',count:concepts.filter(c=>c.kind==='Algorithm').length},{value:'Problem',label:'Problems',count:problems.length}];
 const extraCount=[difficulty!=='All',stageFilter!=='All',status!=='All'].filter(Boolean).length;
 const hasFilters=Boolean(search.trim()||typeFilter!=='All'||extraCount);

 const reset=()=>{setSearch('');setTypeFilter('All');setDifficulty('All');setStageFilter('All');setStatus('All')};
 useEffect(()=>{
  if(!search.trim()&&typeFilter==='All'&&difficulty==='All'&&stageFilter==='All'&&status==='All')return;
  const nextStage=stages.find(stage=>(entriesByStage.get(stage.id)||[]).some(entry=>{
   const p=entry.p,lesson=entry.lesson,isProblem=entry.type==='Problem';
   const words=[stage.title,isProblem?p.title:lesson.title,isProblem?p.slug:lesson.overview,isProblem?p.topic:lesson.kind,isProblem?p.skills:lesson.mentalModel,lesson?.whenToUse].filter(Boolean).join(' ').toLowerCase();
   return (!search.trim()||words.includes(search.trim().toLowerCase()))&&
    (typeFilter==='All'||entry.type===typeFilter)&&
    (difficulty==='All'||(isProblem&&p.difficulty===difficulty))&&
    (stageFilter==='All'||entry.stageId===stageFilter)&&
    (status==='All'||(isProblem&&(status==='Solved'?!!progress[p.slug]:!progress[p.slug])));
  }));
  if(nextStage)setExpanded(previous=>previous===nextStage.id?previous:nextStage.id);
 },[search,typeFilter,difficulty,stageFilter,status,stages,entriesByStage,progress]);
 return <div className="dsa-v2">
  <div className="learning-hero">
   <div className="learning-hero-copy"><p className="learning-eyebrow">JAVA · INTERVIEW PREP · BEGINNER TO ADVANCED</p><h1>DSA learning roadmap</h1><p>Learn the data structure, understand the algorithm, solve the pattern, then revisit it. Built for SDE interviews, not random daily question spam.</p></div>
   <div className="learning-hero-stats" aria-label="Your learning progress">
    <div><strong>{stages.length}</strong><span>Learning stages</span></div>
    <div><strong>{allEntries.length}</strong><span>Learning items</span></div>
    <div><strong>{worked}</strong><span>Java problems</span></div>
    <div><strong>{solved}</strong><span>Marked solved</span></div>
   </div>
  </div>
  <div className="learning-progress" role="progressbar" aria-label="Roadmap completion" aria-valuenow={solved} aria-valuemin={0} aria-valuemax={problems.length||1}><span style={{width:(problems.length?100*solved/problems.length:0)+'%'}}/></div>
  <div className="learning-intro"><div><strong>{completedStages}/{stages.length} stages completed</strong><p>Progress is saved in this browser. A problem counts only after you mark it solved.</p></div>{next&&<Link to={urlFor(next)} className="learning-next">Next: {next.title} <span>→</span></Link>}</div>
  <section className="panel learning-controls" aria-label="Roadmap filters">
   <div className="learning-control-top">
    <div className="learning-mode" role="group" aria-label="View mode"><button type="button" className={mode==='roadmap'?'active':''} onClick={()=>setMode('roadmap')} aria-pressed={mode==='roadmap'}>Learning path</button><button type="button" className={mode==='all'?'active':''} onClick={()=>setMode('all')} aria-pressed={mode==='all'}>All items</button></div>
    <span className="learning-count">{filtered.length} of {allEntries.length} items</span>
   </div>
   <div className="learning-search"><TextField size="small" fullWidth placeholder="Search topics or questions" value={search} onChange={e=>setSearch(e.target.value)} inputProps={{'aria-label':'Search DSA roadmap'}} InputProps={{startAdornment:<InputAdornment position="start"><Search fontSize="small"/></InputAdornment>,endAdornment:search?<InputAdornment position="end"><IconButton size="small" aria-label="Clear DSA search" onClick={()=>setSearch('')}><Close fontSize="small"/></IconButton></InputAdornment>:null}}/></div>
   <div className="learning-type-filters" role="group" aria-label="Filter learning item type">
    {typeOptions.map(item=><button type="button" key={item.value} aria-pressed={typeFilter===item.value} className={'learning-type-filter '+(typeFilter===item.value?'active':'')} onClick={()=>{setTypeFilter(item.value);if(item.value==='Data structure'||item.value==='Algorithm'){setDifficulty('All');setStatus('All')}}}>{item.value!=='All'&&<LearningTypePill type={item.value}/>}<span>{item.label}</span><small>{item.count}</small></button>)}
   </div>
   <div className="learning-filter-actionbar">
    <Button variant={advancedOpen?'contained':'outlined'} size="small" startIcon={<Tune fontSize="small"/>} endIcon={advancedOpen?<ExpandLess fontSize="small"/>:<ExpandMore fontSize="small"/>} aria-expanded={advancedOpen} aria-controls="learning-extra-filters" onClick={()=>setAdvancedOpen(v=>!v)}>More filters{extraCount?' · '+extraCount:''}</Button>
    {hasFilters&&<Button size="small" onClick={reset}>Clear all</Button>}
    <span className="learning-filter-result">{problemCount} problems in results</span>
   </div>
   <Collapse in={advancedOpen} timeout={180}><div id="learning-extra-filters" className="learning-filter-grid">
    <TextField select size="small" label="Stage" value={stageFilter} onChange={e=>{setStageFilter(e.target.value);if(e.target.value!=='All')setExpanded(e.target.value)}}><MenuItem value="All">All 21 stages</MenuItem>{stages.map(s=><MenuItem key={s.id} value={s.id}>{s.number}. {s.title}</MenuItem>)}</TextField>
    <TextField select size="small" label="Difficulty" value={difficulty} onChange={e=>{setDifficulty(e.target.value);if(e.target.value!=='All')setTypeFilter('Problem')}}><MenuItem value="All">Any difficulty</MenuItem>{['Easy','Medium','Hard'].map(x=><MenuItem key={x} value={x}>{x}</MenuItem>)}</TextField>
    <TextField select size="small" label="Progress" value={status} onChange={e=>{setStatus(e.target.value);if(e.target.value==='Solved'||e.target.value==='Unsolved')setTypeFilter('Problem')}}>{['All','Solved','Unsolved'].map(x=><MenuItem key={x} value={x}>{x==='All'?'Any progress':x}</MenuItem>)}</TextField>
   </div></Collapse>
  </section>
  {mode==='roadmap'?<div className="learning-stage-list">
   {stages.map(s=>{const items=byStage.get(s.id)||[];const ps=items.filter(item=>item.type==='Problem');const isOpen=expanded===s.id;const done=(s.problemSlugs||[]).filter(slug=>progress[slug]).length;const total=s.problemSlugs?.length||0;const hasFilter=!!(search||typeFilter!=='All'||difficulty!=='All'||stageFilter!=='All'||status!=='All');if(hasFilter&&!items.length)return null;
   return <section className={'learning-stage '+(isOpen?'open':'')} key={s.id}>
    <button type="button" className="learning-stage-toggle" aria-expanded={isOpen} onClick={()=>setExpanded(isOpen?'':s.id)}>
     <div className="learning-stage-n"><span>{s.number}</span></div><div className="learning-stage-heading"><span className="learning-stage-level">{s.level} · {total} exercises</span><h2>{s.title}</h2><p>{s.summary}</p><div className="learning-stage-meter"><span style={{width:(total?100*done/total:0)+'%'}}/></div><small>{done} of {total} solved</small></div>{isOpen?<ExpandLess/>:<ExpandMore/>}
    </button>
    {isOpen&&<div className="learning-stage-content">
     {s.prerequisites?.length>0&&<p className="learning-prerequisite"><b>Prerequisite:</b> {s.prerequisites.map(id=>stages.find(x=>x.id===id)?.title||id).join(', ')}</p>}
     <div className="learning-exercises-head"><h3>Learn & solve in this order</h3><small>{items.filter(item=>item.type==='Data structure').length} data structure · {items.filter(item=>item.type==='Algorithm').length} algorithms · {ps.length} problems</small></div>
     <div className="learning-exercises learning-sequence" role="list">{items.map(item=><div role="listitem" key={item.key}>{item.type==='Problem'?<ProblemRow p={item.p} progress={progress} toggle={toggle}/>:<TopicRow lesson={item.lesson} type={item.type}/>}</div>)}</div>
     <p className="learning-checkpoint"><b>Before moving forward:</b> {s.checkpoint}</p>
    </div>}
   </section>})}
  </div>:<div className="learning-all-list" role="list">{filtered.map(item=><div role="listitem" key={item.key}>{item.type==='Problem'?<ProblemRow p={item.p} progress={progress} toggle={toggle} compact/>:<TopicRow lesson={item.lesson} type={item.type} compact/>}</div>)}</div>}
  {!filtered.length&&<div className="panel"><p>No learning items match. Clear the filters to see the whole roadmap.</p><Button onClick={reset}>Clear filters</Button></div>}
  <section className="panel learning-method"><h2>How to practice without fooling yourself</h2><ol>{method.map((s,i)=><li key={i}>{s}</li>)}</ol><p><b>Company tags:</b> Only shown when a linked third-party report associates the exercise with a company. They are not verified employer question banks or guarantees of repeat appearances.</p><p><b>Full learning material:</b> Each of the {worked} worked exercises includes Java code, complexity comparisons, tests and a dry run. The {concepts.length} data-structure and algorithm lessons have separate explanations and Java examples. Baseline approaches do not always include a second full code listing.</p></section>
 </div>;
}
function TopicRow({lesson,type,compact=false}){const isAlgorithm=type==='Algorithm';return <article className={'learning-problem learning-topic-row'+(compact?' compact':'')}>
 <Link to={'/dsa/learn/'+lesson.stageId+'/'+lesson.id} className="learning-problem-link" aria-label={type+': '+lesson.title}>
  <LearningTypePill type={type}/>
  <div className="learning-problem-title"><strong>{lesson.title}</strong><p className="learning-item-summary">{lesson.overview}</p>
   <div className="learning-problem-meta"><span>{isAlgorithm?lesson.timeComplexity:'Concept & operations'}</span><span>Java example</span></div>
  </div><span className="learning-problem-arrow" aria-hidden="true">›</span>
 </Link>
 </article>}
function ProblemRow({p,progress,toggle,compact=false}){const done=!!progress[p.slug];return <article className={'learning-problem learning-question-row '+(done?'finished':'')+(compact?' compact':'')}>
 <Link to={urlFor(p)} className="learning-problem-link" aria-label={'Problem: '+p.title}>
  <LearningTypePill type="Problem"/>
  <div className="learning-problem-title"><strong>{p.title}</strong>
   <div className="learning-problem-meta"><Difficulty value={p.difficulty}/><span>~{p.estimatedMinutes||25} min</span><span>#{String(p.order).padStart(3,'0')}</span></div>
   <CompanyTags p={p} compact/>
  </div><span className="learning-problem-arrow" aria-hidden="true">›</span>
 </Link><Solved slug={p.slug} progress={progress} toggle={toggle} compact/>
 </article>}
function ProblemDetail({p,stage,progress,toggle}){
 const worked=p.format==='worked';const choices=worked?(p.variants?.length?p.variants:[{name:p.approach||'Optimal solution',type:'Optimized',javaCode:p.javaCode,timeComplexity:p.timeComplexity,spaceComplexity:p.spaceComplexity}]):[];
 const [show,setShow]=useState(false),[selected,setSelected]=useState(Math.max(0,choices.findIndex(v=>v.type==='Optimized'))),[copied,setCopied]=useState(false);
 const choice=choices[selected]||choices[0];const code=choice?.javaCode||'';
 const copy=async()=>{if(!code)return;try{await navigator.clipboard.writeText(code);setCopied(true)}catch{setCopied(false)}};
 useEffect(()=>{setCopied(false)},[selected,p.slug]);
 return <div className="dsa-v2 learning-detail">
 <Link className="back learning-back" to="/dsa"><ArrowBack fontSize="small"/> Back to learning roadmap</Link>
 <section className="panel learning-detail-hero"><p className="learning-eyebrow">STAGE {stageNumber(stage)} · {stage?.title||p.topic}</p><h1>{p.title}</h1><div className="learning-detail-tags"><Difficulty value={p.difficulty}/><span>{worked?'Worked Java lesson':'External guided practice'}</span><span>~{p.estimatedMinutes||25} min</span><span>#{p.order}</span></div><CompanyTags p={p}/><Solved slug={p.slug} progress={progress} toggle={toggle}/></section>
 {!worked?<section className="panel learning-external"><h2>Practice this exercise</h2><p>This is a curated follow-up exercise in the right learning sequence. It does not yet have an authored local Java solution, so this page won't pretend that it does.</p><p><b>Before attempting:</b> Read the data structure and algorithms in Stage {stageNumber(stage)}, write a brute-force approach, justify an improved bound, then test extreme inputs.</p>{p.practiceUrl&&<a className="learning-primary-link" href={p.practiceUrl} rel="noreferrer" target="_blank">Open original practice problem <OpenInNew fontSize="small"/></a>}</section>:<>
 <section className="panel learning-problem-statement"><h2>Problem statement</h2><p>{p.statement}</p>
 {p.example&&<div className="learning-example"><div><b>Input</b><pre>{p.example.input}</pre></div><div><b>Expected output</b><pre>{p.example.output}</pre></div>{p.example.explanation&&<p>{p.example.explanation}</p>}</div>}
 {p.constraints?.length>0&&<><h3>Constraints / assumptions</h3><ul>{p.constraints.map((c,i)=><li key={i}>{c}</li>)}</ul></>}
 <div className="learning-tip"><strong>Interview habit</strong><p>{p.interviewTip}</p></div></section>
 <section className="panel learning-solution"><div className="learning-detail-head"><div><h2>Approaches & Java solutions</h2><p>Try to solve the problem first. Compare baseline versus optimized complexity afterward.</p></div><Button variant={show?'outlined':'contained'} onClick={()=>setShow(!show)}>{show?'Hide answers':'Reveal approaches'}</Button></div>
 {show&&<><div className="learning-approach-tabs" role="group" aria-label="Choose an approach">{choices.map((v,i)=><button key={i} type="button" className={selected===i?'selected':''} onClick={()=>setSelected(i)} aria-pressed={selected===i}>{v.name}<small>{v.type}</small></button>)}</div>
 <div className="learning-complexity"><div><span>Time complexity</span><strong>{choice?.timeComplexity||'Not provided'}</strong></div><div><span>Auxiliary space</span><strong>{choice?.spaceComplexity||'Not provided'}</strong></div></div><p className="learning-approach-text">{choice?.explanation}</p>
 {code?<><div className="learning-code-heading"><h3>Java implementation</h3><Button size="small" variant="outlined" startIcon={<ContentCopy fontSize="small"/>} onClick={copy}>{copied?'Copied':'Copy code'}</Button></div><pre className="learning-java"><code>{code}</code></pre></>:<p className="learning-no-code">This baseline is an algorithmic comparison, not a second pasted implementation. Select the optimized tab for complete Java code.</p>}
 <div className="learning-tip"><strong>Explain the reasoning</strong><ol>{p.steps?.map((s,i)=><li key={i}>{s}</li>)}</ol></div>
 </>}</section>
 <section className="panel learning-trace"><h2>Step-by-step dry run</h2><p>Trace the example before checking the expected output.</p><ol>{(p.dryRun||p.steps||[]).map((s,i)=><li key={i}>{s}</li>)}</ol></section>
 <section className="panel learning-tests"><h2>Test cases & edge conditions</h2><p>These are expected input/output cases for self-checking, not evidence of automatically executed Java tests.</p><div className="learning-tests-list">{(p.testCases||[]).map((t,i)=><article key={i}><div><strong>Case {i+1}</strong><span>{t.reason}</span></div><div><b>Input</b><pre>{t.input}</pre></div><div><b>Expected</b><pre>{t.expected}</pre></div></article>)}</div></section></>}
 {p.practiceUrl&&<section className="panel learning-origin"><h2>Continue practicing</h2><p>Try the comparable platform exercise after completing the worked example. Platform requirements or method signatures may differ from this standalone formulation.</p><a href={p.practiceUrl} target="_blank" rel="noreferrer" className="learning-primary-link">Open related LeetCode exercise <OpenInNew fontSize="small"/></a></section>}
 {stage&&<Link className="learning-stage-return" to="/dsa">← Review Stage {stage.number}: {stage.title}</Link>}
 </div>;
}

export function DsaLesson(){
 const {stageId,conceptId}=useParams();
 const {loading,error,stages,concepts}=useRoadmap();
 const [reveal,setReveal]=useState(false),[copied,setCopied]=useState(false);
 const stage=stages.find(item=>item.id===stageId);
 const lesson=concepts.find(item=>item.stageId===stageId&&item.id===conceptId);
 const stageLessons=concepts.filter(item=>item.stageId===stageId);
 const index=stageLessons.findIndex(item=>item.id===conceptId);
 const copy=async()=>{if(!lesson?.javaCode)return;try{await navigator.clipboard.writeText(lesson.javaCode);setCopied(true)}catch{setCopied(false)}};
 useEffect(()=>{setReveal(false);setCopied(false);window.scrollTo?.({top:0,behavior:'instant'});},[stageId,conceptId]);
 if(loading)return <ProfolioLoader label="Loading Java learning lesson"/>;
 if(error)return <Alert severity="error">Could not load the lesson: {error}</Alert>;
 if(!lesson||!stage)return <div className="panel"><p>Learning topic not found.</p><Link to="/dsa">Back to roadmap</Link></div>;
 const next=stageLessons[index+1],prev=stageLessons[index-1];
 const href=item=>'/dsa/learn/'+stageId+'/'+item.id;
 return <div className="dsa-v2 learning-detail learning-topic-detail">
  <Link className="back learning-back" to="/dsa"><ArrowBack fontSize="small"/> Back to DSA roadmap</Link>
  <section className="panel learning-detail-hero">
   <p className="learning-eyebrow">STAGE {stage.number} · {lesson.kind.toUpperCase()} · LESSON {index+1}/{stageLessons.length}</p>
   <h1>{lesson.title}</h1>
   <p>{stage.title}</p>
   <div className="learning-detail-tags"><span>{lesson.kind}</span><span>Java explanation & example</span></div>
  </section>
  <section className="panel learning-topic-section">
   <h2>Understand the concept</h2><p>{lesson.overview}</p>
   <h3>Core mental model & why it works</h3><p>{lesson.mentalModel}</p>
   <div className="learning-topic-grid">
    <article><h3>When to use it</h3><p>{lesson.whenToUse}</p></article>
    <article><h3>Real-world applications</h3><p>{lesson.realWorld}</p></article>
    <article><h3>Tradeoffs & alternatives</h3><p>{lesson.tradeoffs}</p></article>
    <article><h3>Common interview mistakes</h3><p>{lesson.commonMistakes}</p></article>
   </div>
  </section>
  <section className="panel learning-topic-section">
   <h2>Complexity & operations</h2>
   <div className="learning-complexity"><div><span>{lesson.kind==='Data structure'?'Typical operations':'Algorithm complexity'}</span><strong>{lesson.timeComplexity}</strong></div><div><span>Example auxiliary space</span><strong>{lesson.spaceComplexity}</strong></div></div>
   <p>Complexity depends on input constraints and the exact implementation. State your assumptions explicitly during interviews.</p>
  </section>
  <section className="panel learning-topic-section">
   <div className="learning-detail-head"><div><h2>Java implementation</h2><p>{lesson.codeLabel}</p></div><Button variant={reveal?'outlined':'contained'} onClick={()=>setReveal(value=>!value)}>{reveal?'Hide code':'Reveal Java code'}</Button></div>
   {reveal&&<><div className="learning-code-heading"><strong>Implementation</strong><Button size="small" variant="outlined" startIcon={<ContentCopy fontSize="small"/>} onClick={copy}>{copied?'Copied':'Copy code'}</Button></div><pre className="learning-java"><code>{lesson.javaCode}</code></pre><p className="learning-code-note">This example is focused on the topic; linked challenge platforms may provide their own class signatures or node definitions.</p></>}
  </section>
  <section className="panel learning-topic-section">
   <h2>Worked example and dry run</h2>
   {lesson.example&&<p className="learning-intuition"><b>Intuition:</b> {lesson.example}</p>}
   {lesson.exampleDetail&&<div className="learning-example"><div><b>Input</b><pre>{lesson.exampleDetail.input}</pre></div><div><b>Expected result</b><pre>{lesson.exampleDetail.output}</pre></div><p>{lesson.exampleDetail.explanation}</p></div>}
   <ol className="learning-lesson-steps">{(lesson.dryRun||lesson.steps||[]).map((step,i)=><li key={i}>{step}</li>)}</ol>
   <p className="learning-code-note">The trace comes from the related worked exercise when the implementation is demonstrated through a practice problem.</p>
  </section>
  {lesson.testCases?.length>0&&<section className="panel learning-topic-section"><h2>Practice tests & edge cases</h2><div className="learning-tests-list">{lesson.testCases.map((item,i)=><article key={i}><div><strong>Case {i+1}</strong><span>{item.reason}</span></div><div><b>Input</b><pre>{item.input}</pre></div><div><b>Expected</b><pre>{item.expected}</pre></div></article>)}</div></section>}
  <section className="panel learning-topic-section"><h2>Apply it in a problem</h2><p>Use this example to practise the invariant and complexity reasoning, then solve an unseen variant without checking the implementation.</p>{lesson.practiceUrl?.startsWith('https://')?<a className="learning-topic-link" href={lesson.practiceUrl} target="_blank" rel="noreferrer">{lesson.practiceLabel||'Practise this algorithm'} <OpenInNew fontSize="small"/></a>:<Link className="learning-topic-link" to={lesson.practiceUrl}>Practice: {lesson.linkedTitle} <span aria-hidden="true">→</span></Link>}</section>
  <nav className="learning-topic-pagination" aria-label="Lesson navigation">
   {prev?<Link to={href(prev)}>← {prev.title}</Link>:<span/>}
   {next?<Link to={href(next)}>{next.title} →</Link>:<Link to="/dsa">Return to roadmap →</Link>}
  </nav>
 </div>;
}

export default Dsa;
