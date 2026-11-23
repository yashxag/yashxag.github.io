import React, {useEffect,useMemo,useState} from 'react';
import {Link,useParams} from 'react-router-dom';
import {Alert,Button,Chip,TextField,MenuItem,InputAdornment} from '@mui/material';
import {ArrowBack,CheckCircleOutline,ContentCopy,Search,ExpandMore,ExpandLess,OpenInNew,School,Code} from '@mui/icons-material';
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
 const [state,setState]=useState({loading:true,error:'',stages:[],problems:[],method:[]});
 useEffect(()=>{
  let active=true;
  const json=async path=>{const res=await fetch(base+'data/'+path,{cache:'no-store'});if(!res.ok)throw Error(path+': HTTP '+res.status);return res.json()};
  Promise.all([json('dsa.json'),json('dsa-roadmap.json'),json('dsa-solutions-a.json').catch(()=>({solutions:[]})),json('dsa-solutions-b.json').catch(()=>({solutions:[]}))])
  .then(([old,road,a,b])=>{
   const solved=[...(old.problems||[]),...(a.solutions||[]),...(b.solutions||[])];
   const bySlug=new Map((road.practice||[]).map(p=>[p.slug,p]));
   for(const p of solved){const guide=bySlug.get(p.slug)||{};bySlug.set(p.slug,{...guide,...p,companyEvidence:(p.companyEvidence?.length?p.companyEvidence:guide.companyEvidence)||[],practiceUrl:guide.practiceUrl,format:'worked'})}
   const ordered=[];const found=new Set();
   for(const s of road.stages||[]){for(const slug of s.problemSlugs||[]){const p=bySlug.get(slug);if(p&&!found.has(slug)){found.add(slug);ordered.push({...p,stageId:s.id,order:ordered.length+1})}}}
   const orphan=solved.filter(p=>!found.has(p.slug)).map(p=>({...p,order:ordered.length+1}));
   if(active)setState({loading:false,error:'',stages:road.stages||[],problems:[...ordered,...orphan],method:road.studyMethod||[]});
  }).catch(e=>{if(active)setState(v=>({...v,loading:false,error:e.message}))});
  return()=>{active=false};
 },[]);
 return state;
}
function CompanyTags({p}){return p.companyEvidence?.length?<div className="learning-company-row">{p.companyEvidence.map((item,i)=><a className="learning-company-tag" href={item.url} key={item.company+i} target="_blank" rel="noreferrer" title={item.label||'Third-party interview report'}>{item.company} <span aria-hidden="true">↗</span></a>)}</div>:null}
function Difficulty({value}){return <span className={'learning-difficulty level-'+(value||'easy').toLowerCase()}>{value||'Easy'}</span>}
function Solved({slug,progress,toggle}){const done=!!progress[slug];return <button type="button" className={'learning-check '+(done?'is-done':'')} onClick={e=>{e.stopPropagation();toggle(slug)}} aria-pressed={done} aria-label={(done?'Mark unsolved: ':'Mark solved: ')+slug}><CheckCircleOutline fontSize="small"/><span>{done?'Solved':'Mark solved'}</span></button>}
function Dsa(){const {id}=useParams();const {loading,error,stages,problems,method}=useRoadmap();const [progress,setProgress]=useState(readProgress);
 useEffect(()=>{if(loading||!problems.length)return;try{const old=JSON.parse(localStorage.getItem(oldKey)||'{}');setProgress(prev=>{const next={...prev};let changed=false;for(const p of problems)if(old[p.id]&&!Object.prototype.hasOwnProperty.call(next,p.slug)){next[p.slug]=true;changed=true}return changed?next:prev})}catch{/* nothing to migrate */}},[loading,problems]);
 useEffect(()=>safeSave(progress),[progress]);
 const toggle=slug=>setProgress(v=>({...v,[slug]:!v[slug]}));
 if(loading)return <ProfolioLoader label="Loading DSA learning roadmap"/>;
 if(error)return <Alert severity="error">Could not load the DSA roadmap: {error}. Reload the page after the latest deployment.</Alert>;
 if(id){const p=problems.find(item=>item.slug===id||item.id===id);if(!p)return <section className="panel"><p>Problem not found.</p><Link to="/dsa">Back to roadmap</Link></section>;return <ProblemDetail p={p} stage={stages.find(s=>s.id===p.stageId)} progress={progress} toggle={toggle}/>;}
 return <RoadmapHome stages={stages} problems={problems} method={method} progress={progress} toggle={toggle}/>;
}
function RoadmapHome({stages,problems,method,progress,toggle}){
 const [mode,setMode]=useState('roadmap'),[expanded,setExpanded]=useState('fundamentals');
 const [search,setSearch]=useState(''),[difficulty,setDifficulty]=useState('All'),[stageFilter,setStageFilter]=useState('All'),[status,setStatus]=useState('All');
 const solved=problems.filter(p=>progress[p.slug]).length;
 const worked=problems.filter(p=>p.format==='worked').length;
 const completedStages=stages.filter(s=>s.problemSlugs?.every(slug=>progress[slug])).length;
 const next=problems.find(p=>!progress[p.slug])||problems[0];
 const matches=p=>{
  const stage=stages.find(s=>s.id===p.stageId);
  return (!search||(p.title+' '+p.slug+' '+stage?.title).toLowerCase().includes(search.toLowerCase()))
   &&(difficulty==='All'||p.difficulty===difficulty)
   &&(stageFilter==='All'||p.stageId===stageFilter)
   &&(status==='All'||(status==='Solved'?!!progress[p.slug]:status==='Unsolved'?!progress[p.slug]:status==='With Java'?(p.format==='worked'):(p.format!=='worked')));
 };
 const byStage=useMemo(()=>new Map(stages.map(s=>[s.id,problems.filter(p=>p.stageId===s.id&&matches(p))])),[stages,problems,search,difficulty,stageFilter,status,progress]);
 const filtered=problems.filter(matches);
 const reset=()=>{setSearch('');setDifficulty('All');setStageFilter('All');setStatus('All')};
 return <div className="dsa-v2">
  <div className="learning-hero">
   <div className="learning-hero-copy"><p className="learning-eyebrow">JAVA · INTERVIEW PREP · BEGINNER TO ADVANCED</p><h1>DSA learning roadmap</h1><p>Learn the data structure, understand the algorithm, solve the pattern, then revisit it. Built for SDE interviews, not random daily question spam.</p></div>
   <div className="learning-hero-stats" aria-label="Your learning progress">
    <div><strong>{stages.length}</strong><span>Learning stages</span></div>
    <div><strong>{problems.length}</strong><span>Curated exercises</span></div>
    <div><strong>{worked}</strong><span>Java walkthroughs</span></div>
    <div><strong>{solved}</strong><span>Marked solved</span></div>
   </div>
  </div>
  <div className="learning-progress" role="progressbar" aria-label="Roadmap completion" aria-valuenow={solved} aria-valuemin={0} aria-valuemax={problems.length||1}><span style={{width:(problems.length?100*solved/problems.length:0)+'%'}}/></div>
  <div className="learning-intro"><div><strong>{completedStages}/{stages.length} stages completed</strong><p>Progress is saved in this browser. A problem counts only after you mark it solved.</p></div>{next&&<Link to={urlFor(next)} className="learning-next">Next: {next.title} <span>→</span></Link>}</div>
  <section className="panel learning-controls" aria-label="Roadmap filters">
   <div className="learning-mode" role="group" aria-label="View mode"><button className={mode==='roadmap'?'active':''} onClick={()=>setMode('roadmap')} aria-pressed={mode==='roadmap'}>Learning path</button><button className={mode==='all'?'active':''} onClick={()=>setMode('all')} aria-pressed={mode==='all'}>All exercises</button></div>
   <TextField size="small" fullWidth placeholder="Search problems, stages or algorithms" value={search} onChange={e=>setSearch(e.target.value)} inputProps={{'aria-label':'Search roadmap'}} InputProps={{startAdornment:<InputAdornment position="start"><Search fontSize="small"/></InputAdornment>}}/>
   <div className="learning-filter-grid">
    <TextField select size="small" label="Level" value={difficulty} onChange={e=>setDifficulty(e.target.value)}>{['All','Easy','Medium','Hard'].map(x=><MenuItem key={x} value={x}>{x==='All'?'All levels':x}</MenuItem>)}</TextField>
    <TextField select size="small" label="Stage" value={stageFilter} onChange={e=>{setStageFilter(e.target.value);if(e.target.value!=='All')setExpanded(e.target.value)}}><MenuItem value="All">All stages</MenuItem>{stages.map(s=><MenuItem key={s.id} value={s.id}>{s.number}. {s.title}</MenuItem>)}</TextField>
    <TextField select size="small" label="Practice" value={status} onChange={e=>setStatus(e.target.value)}>{['All','Solved','Unsolved','With Java','External practice'].map(x=><MenuItem key={x} value={x}>{x}</MenuItem>)}</TextField>
   </div>
   <div className="learning-filter-footer"><span>{filtered.length} exercises in learning order</span><Button size="small" onClick={reset}>Reset filters</Button></div>
  </section>
  {mode==='roadmap'?<div className="learning-stage-list">
   {stages.map((s,i)=>{const ps=byStage.get(s.id)||[];const isOpen=expanded===s.id;const done=(s.problemSlugs||[]).filter(slug=>progress[slug]).length;const total=s.problemSlugs?.length||0;const hasFilter=!!(search||difficulty!=='All'||stageFilter!=='All'||status!=='All');if(hasFilter&&!ps.length)return null;
   return <section className={'learning-stage '+(isOpen?'open':'')} key={s.id}>
    <button type="button" className="learning-stage-toggle" aria-expanded={isOpen} onClick={()=>setExpanded(isOpen?'':s.id)}>
     <div className="learning-stage-n"><span>{s.number}</span></div><div className="learning-stage-heading"><span className="learning-stage-level">{s.level} · {total} exercises</span><h2>{s.title}</h2><p>{s.summary}</p><div className="learning-stage-meter"><span style={{width:(total?100*done/total:0)+'%'}}/></div><small>{done} of {total} solved</small></div>{isOpen?<ExpandLess/>:<ExpandMore/>}
    </button>
    {isOpen&&<div className="learning-stage-content">
     {s.prerequisites?.length>0&&<p className="learning-prerequisite"><b>Prerequisite:</b> {s.prerequisites.map(id=>stages.find(x=>x.id===id)?.title||id).join(', ')}</p>}
     <div className="learning-lesson">
      <div className="learning-lesson-title"><School fontSize="small"/><h3>Learn the data structure</h3></div>
      <h4>{s.dataStructure?.name}</h4><p>{s.dataStructure?.description}</p>
      <div className="learning-concept-grid"><div><b>Example</b><p>{s.dataStructure?.example}</p></div><div><b>Real-world use</b><p>{s.dataStructure?.realWorld}</p></div><div><b>Operations & complexity</b><p>{s.dataStructure?.operations}</p></div></div>
     </div>
     <div className="learning-lesson"><div className="learning-lesson-title"><Code fontSize="small"/><h3>Algorithms to learn now</h3></div><div className="learning-algos">{s.algorithms?.map(a=><article key={a.name}><div><strong>{a.name}</strong><span>{a.complexity}</span></div><p>{a.description}</p><small>Dry-run example: {a.example}</small></article>)}</div></div>
     <div className="learning-exercises-head"><h3>Practice in this order</h3><small>{ps.filter(p=>p.format==='worked').length} with local Java walkthroughs · {ps.length} shown</small></div>
     <div className="learning-exercises">{ps.map(p=><ProblemRow key={p.slug} p={p} progress={progress} toggle={toggle}/>)}</div>
     <p className="learning-checkpoint"><b>Before moving forward:</b> {s.checkpoint}</p>
    </div>}
   </section>})}
  </div>:<div className="learning-all-list">{filtered.map(p=><ProblemRow key={p.slug} p={p} progress={progress} toggle={toggle} compact/>)}</div>}
  {!filtered.length&&<div className="panel"><p>No exercises match. Clear the filters to see the whole roadmap.</p><Button onClick={reset}>Clear filters</Button></div>}
  <section className="panel learning-method"><h2>How to practice without fooling yourself</h2><ol>{method.map((s,i)=><li key={i}>{s}</li>)}</ol><p><b>Company tags:</b> Only shown when a linked third-party report associates the exercise with a company. They are not verified employer question banks or guarantees of repeat appearances.</p><p><b>Java walkthroughs vs external practice:</b> Both appear in the learning path, but only cards marked “Java walkthrough” currently include local code, tests and dry runs. External exercises link to their original practice page.</p></section>
 </div>;
}
function ProblemRow({p,progress,toggle,compact=false}){const done=!!progress[p.slug];return <article className={'learning-problem '+(done?'finished':'')+(compact?' compact':'')}>
 <Link to={urlFor(p)} className="learning-problem-link"><span className="learning-problem-index">{String(p.order).padStart(3,'0')}</span><div className="learning-problem-title"><strong>{p.title}</strong><div className="learning-problem-meta"><Difficulty value={p.difficulty}/><span>{p.format==='worked'?'Java walkthrough':'External practice'}</span><span>~{p.estimatedMinutes||25} min</span></div><CompanyTags p={p}/></div><span className="learning-problem-arrow" aria-hidden="true">›</span></Link>
 <Solved slug={p.slug} progress={progress} toggle={toggle}/>
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
export default Dsa;
