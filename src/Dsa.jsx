import React,{useEffect,useState,useMemo} from 'react';
import ProfolioLoader from './ProfolioLoader.jsx';
import {dateRangeOptions,indiaDateISO,matchesDateRange} from './dateFilters.js';
import {Link,useParams} from 'react-router-dom';
import {Button,Chip,TextField,MenuItem,Alert,Collapse,IconButton,InputAdornment} from '@mui/material';
import {ArrowBack,ContentCopy,CheckCircleOutline,Code,Search,Tune,ExpandMore,ExpandLess,Close} from '@mui/icons-material';
const storageKey='careerboard-dsa-solved-v1';
function loadSolved(){try{return JSON.parse(localStorage.getItem(storageKey)||'{}')}catch{return {}}}
const humanDate=x=>{if(!x)return 'Unknown';const d=new Date(x+'T12:00:00');return d.toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})};
function useProblems(){const [state,setState]=useState({problems:[],loading:true,error:''});useEffect(()=>{let alive=true;fetch(import.meta.env.BASE_URL+'data/dsa.json?ts='+Date.now(),{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('HTTP '+r.status);return r.json()}).then(data=>{if(alive)setState({problems:data.problems||[],loading:false,error:''})}).catch(e=>{if(alive)setState({problems:[],loading:false,error:e.message})});return()=>{alive=false}},[]);return state}
export default function Dsa(){const {problems,loading,error}=useProblems();const [solved,setSolved]=useState(loadSolved);useEffect(()=>{localStorage.setItem(storageKey,JSON.stringify(solved))},[solved]);const toggle=id=>setSolved(prev=>({...prev,[id]:!prev[id]}));const {id}=useParams();if(error)return <Alert severity="error">Could not load DSA questions: {error}</Alert>;if(loading)return <ProfolioLoader label="Loading DSA practice"/>;if(id){const problem=problems.find(p=>p.id===id||p.slug===id);return problem?<ProblemDetail p={problem} solved={!!solved[problem.id]} toggle={()=>toggle(problem.id)}/>:<section className="panel"><p>Problem not found.</p><Link to="/dsa">Back to practice</Link></section>}return <DsaList problems={problems} solved={solved} toggle={toggle}/>}
function DsaList({problems,solved,toggle}){
const [search,setSearch]=useState(''),[difficulty,setDifficulty]=useState('All'),[topic,setTopic]=useState('All'),[progress,setProgress]=useState('All'),[moreFilters,setMoreFilters]=useState(false),[dateRange,setDateRange]=useState('all');
const topics=[...new Set(problems.map(p=>p.topic).filter(Boolean))].sort();
const today=indiaDateISO();
const list=useMemo(()=>problems.filter(p=>(p.title+' '+p.topic).toLowerCase().includes(search.toLowerCase())&&(difficulty==='All'||p.difficulty===difficulty)&&(topic==='All'||p.topic===topic)&&(progress==='All'||(progress==='Solved'?!!solved[p.id]:!solved[p.id]))&&matchesDateRange(p.dateAdded,dateRange,today)).sort((a,b)=>b.dateAdded.localeCompare(a.dateAdded)||b.id.localeCompare(a.id)),[problems,solved,search,difficulty,topic,progress,dateRange,today]);
const solvedCount=problems.filter(p=>solved[p.id]).length;
const latestDate=problems.length?problems.map(p=>p.dateAdded).sort().at(-1):null;
const latestCount=problems.filter(p=>p.dateAdded===latestDate).length;
const activeExtra=[topic!=='All',progress!=='All',dateRange!=='all'].filter(Boolean).length;
const reset=()=>{setSearch('');setDifficulty('All');setTopic('All');setProgress('All');setDateRange('all')};
const makeSelect=(label,value,setter,options)=><TextField select size="small" label={label} value={value} onChange={e=>setter(e.target.value)}>{options.map(option=><MenuItem key={option} value={option}>{option}</MenuItem>)}</TextField>;
return <div className="dsa-list-page">
<header className="dsa-page-heading"><h1>DSA practice</h1><p>Interview-ready Java problems. Practice, track and improve.</p></header>
<section className="dsa-summary" aria-label="Practice progress">
<div className="dsa-summary-item"><span>Total</span><strong>{problems.length}</strong></div>
<div className="dsa-summary-item"><span>Solved</span><strong>{solvedCount}</strong></div>
<div className="dsa-summary-item"><span>Remaining</span><strong>{problems.length-solvedCount}</strong></div>
<div className="dsa-summary-item"><span>Latest batch</span><strong>{latestCount}</strong><small>{humanDate(latestDate)}</small></div>
</section>
<div className="dsa-progress-track" role="progressbar" aria-label="Problems solved" aria-valuemin={0} aria-valuemax={problems.length||1} aria-valuenow={solvedCount}><div style={{width:(problems.length?solvedCount/problems.length*100:0)+'%'}}/></div>
<section className="panel dsa-search-panel" aria-label="Search and filter DSA problems">
<TextField fullWidth size="small" placeholder="Search problems or topics" aria-label="Search DSA problems" value={search} onChange={e=>setSearch(e.target.value)} InputProps={{startAdornment:<InputAdornment position="start"><Search fontSize="small"/></InputAdornment>,endAdornment:search?<InputAdornment position="end"><IconButton size="small" onClick={()=>setSearch('')} aria-label="Clear search"><Close fontSize="small"/></IconButton></InputAdornment>:null}}/>
<div className="dsa-quick-filters" role="group" aria-label="Difficulty">
{['All','Easy','Medium','Hard'].map(value=><button key={value} type="button" className={'jobs-filter-chip '+(difficulty===value?'selected':'')} aria-pressed={difficulty===value} onClick={()=>setDifficulty(value)}>{value==='All'?'All levels':value}</button>)}
</div>
<div className="dsa-filter-actions"><Button size="small" variant={moreFilters?'contained':'outlined'} startIcon={<Tune fontSize="small"/>} endIcon={moreFilters?<ExpandLess fontSize="small"/>:<ExpandMore fontSize="small"/>} onClick={()=>setMoreFilters(open=>!open)} aria-expanded={moreFilters} aria-controls="dsa-extra-filters">More filters{activeExtra?' ('+activeExtra+')':''}</Button>
{(search||difficulty!=='All'||topic!=='All'||progress!=='All'||dateRange!=='all')&&<Button size="small" onClick={reset}>Reset</Button>}
</div>
<Collapse in={moreFilters} timeout={140}><div className="dsa-extra-filters" id="dsa-extra-filters">{makeSelect('Topic',topic,setTopic,['All',...topics])}{makeSelect('Progress',progress,setProgress,['All','Solved','Unsolved'])}{<TextField select size="small" label="Date added" value={dateRange} onChange={e=>setDateRange(e.target.value)}>{dateRangeOptions.map(([value,label])=><MenuItem key={value} value={value}>{label}</MenuItem>)}</TextField>}</div></Collapse>
</section>
<div className="dsa-results-line"><strong>{list.length} {list.length===1?'problem':'problems'}</strong><span>{progress==='Solved'?'Completed practice':progress==='Unsolved'?'Ready to practice':dateRange==='all'?'Newest first':dateRangeOptions.find(([value])=>value===dateRange)?.[1]}</span></div>
<div className="dsa-problem-list">{list.map(p=><article className="panel dsa-card" key={p.id}>
<div className="dsa-body"><div className="dsa-card-topline"><span className="dsa-topic-pill">{p.topic}</span><Chip size="small" label={p.difficulty} color={p.difficulty==='Easy'?'success':p.difficulty==='Medium'?'warning':'error'} variant="outlined"/>{solved[p.id]&&<Chip size="small" color="success" label="Solved" icon={<CheckCircleOutline/>}/>}</div>
<Link to={'/dsa/'+p.slug}><h3>{p.title}</h3></Link><p className="dsa-card-meta">Added {humanDate(p.dateAdded)} · ~{p.estimatedMinutes} min</p></div>
<div className="dsa-actions"><Button component={Link} to={'/dsa/'+p.slug} variant="outlined" size="small">Practice</Button><Button onClick={()=>toggle(p.id)} size="small" color={solved[p.id]?'success':'primary'}>{solved[p.id]?'Mark unsolved':'Mark solved'}</Button></div>
</article>)}</div>
{!list.length&&<p className="panel home-empty">No matching problems. Try another difficulty or reset the filters.</p>}
<p className="jobs-privacy-note">Your solved progress stays in this browser.</p>
</div>}
function ProblemDetail({p,solved,toggle}){const [show,setShow]=useState(false),[copied,setCopied]=useState(false);const copy=async()=>{try{await navigator.clipboard.writeText(p.javaCode);setCopied(true)}catch{setCopied(false)}};return <div className="detail-page dsa-detail"><Link className="back" to="/dsa"><ArrowBack fontSize="small"/> Back to DSA practice</Link><section className="panel"><p className="micro">{p.id} • {p.topic} • Added {humanDate(p.dateAdded)}</p><div className="head-row"><h1>{p.title}</h1><Button onClick={toggle} variant={solved?'contained':'outlined'} startIcon={<CheckCircleOutline/>}>{solved?'Solved':'Mark solved'}</Button></div><div className="dsa-tags"><Chip label={p.difficulty} color={p.difficulty==='Easy'?'success':'warning'} size="small"/><Chip label={p.topic} variant="outlined" size="small"/><span className="sub">~{p.estimatedMinutes} minutes</span></div></section><section className="panel"><h2>Problem</h2><p className="description">{p.statement}</p><h3>Example</h3><div className="example"><div><span>Input</span><code>{p.example?.input}</code></div><div><span>Output</span><code>{p.example?.output}</code></div><p>{p.example?.explanation}</p></div>{p.constraints?.length>0&&<><h3>Constraints</h3><ul className="dsa-steps">{p.constraints.map((c,i)=><li key={i}>{c}</li>)}</ul></>}</section><section className="panel"><div className="head-row"><div><h2>Java solution & explanation</h2><p className="sub">Try it yourself before revealing the answer.</p></div><Button onClick={()=>setShow(v=>!v)} variant="contained">{show?'Hide solution':'Reveal solution'}</Button></div>{show&&<><h3>{p.approach}</h3><h3>Step-by-step approach</h3><ol className="dsa-steps">{p.steps.map((step,i)=><li key={i}>{step}</li>)}</ol><div className="head-row"><h3><Code fontSize="small"/> Java implementation</h3><Button size="small" variant="outlined" startIcon={<ContentCopy/>} onClick={copy}>{copied?'Copied':'Copy code'}</Button></div><pre className="java-code"><code>{p.javaCode}</code></pre><div className="complexities"><span><b>Time:</b> {p.timeComplexity}</span><span><b>Space:</b> {p.spaceComplexity}</span></div><div className="interview-note"><b>Interview tip</b><p>{p.interviewTip}</p></div></>}</section></div>}
