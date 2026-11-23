import React,{useState,useEffect,useMemo} from 'react';
import Dsa, {DsaLesson} from './Dsa.jsx';
import ProfolioLoader from './ProfolioLoader.jsx';
import {dateRangeOptions,indiaDateISO,matchesDateRange} from './dateFilters.js';
import JobToolkit from './JobToolkit.jsx';
import {motion,useReducedMotion} from 'framer-motion';
import {Link,NavLink,Routes,Route,useParams} from 'react-router-dom';
import {Box,Button,Paper,Chip,TextField,MenuItem,Typography,FormControl,Select,Alert,IconButton,Tooltip,Collapse,Menu,InputAdornment} from '@mui/material';
import {Search,ArrowBack,OpenInNew,Download,Upload,Refresh,WorkOutline,DashboardOutlined,CheckCircleOutline,HelpOutline,CancelOutlined,EventBusyOutlined,Tune,ExpandMore,ExpandLess,MoreVert,Close,DarkModeOutlined,LightModeOutlined} from '@mui/icons-material';
import {ResponsiveContainer,AreaChart,Area,XAxis,Tooltip as CT} from 'recharts';
const statusOptions=['Not applied','Saved','Applied','Assessment','Interview','Offer','Rejected'];
const key='careerboard-application-status-v1';
const getLocal=()=>{try{return JSON.parse(localStorage.getItem(key)||'{}')}catch{return {}}};
const slug=j=>(j.title||'job').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')+'-'+j.id.toLowerCase();
const date=d=>d?new Date(d).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}):'Unknown';
const statusIcon={Active:CheckCircleOutline,Closed:CancelOutlined,Expired:EventBusyOutlined,Recheck:HelpOutline,Unknown:HelpOutline};
const Status=({s})=>{const value=s||'Unknown';const Icon=statusIcon[value]||HelpOutline;return <span className={'vacancy-badge status-'+value.toLowerCase()}><Icon fontSize="inherit"/>{value}</span>};
const VerifiedTag=({status})=>{const verified=status==='Active';return <span className={'verification-badge '+(verified?'verified':'unverified')}>{verified?<CheckCircleOutline fontSize="inherit"/>:<HelpOutline fontSize="inherit"/>}{verified?'Verified':'Unverified'}</span>};
const companyPalette=['blue','purple','teal','amber','rose','slate'];
const CompanyPill=({name})=>{const company=name||'Unknown company';const color=companyPalette[[...company].reduce((sum,char)=>sum+char.charCodeAt(0),0)%companyPalette.length];return <span className={'company-pill company-'+color} title={company}>{company}</span>};
const briefFit=fit=>{const raw=(fit||'Not rated').trim();return raw.split(':')[0].trim().slice(0,36)};
const hasKnownSalary=j=>Boolean(j.salary&&j.salary.trim()&&j.salary!=='Not disclosed');
const SalaryPreview=({job,compact=false})=>hasKnownSalary(job)?<span className={'job-salary-preview'+(compact?' compact':'')} title={job.salaryEvidence?.scope||'Salary information from job dataset'}><span className="job-salary-amount">{job.salary}</span><span className="job-salary-type">{job.salaryEvidence?.type==='third_party_estimate'?'Third-party benchmark':job.salaryEvidence?.type==='employer_disclosed'?'Employer disclosed':'Pay stated in listing'}</span></span>:null;
const ranking=j=>{const p={High:3,Medium:2,Low:1}[j.priority]||0;const fit=(j.fit||'').toLowerCase();const match=/strong|high:|best|excellent/.test(fit)?4:/good/.test(fit)?3:/stretch/.test(fit)?1:0;return p*10+match};
const priorityRank={High:3,Medium:2,Low:1};
const fitRank=fit=>{const s=(fit||'').toLowerCase();return /strong|excellent|best|high:/.test(s)?4:/good/.test(s)?3:/stretch/.test(s)?2:/unclear/.test(s)?1:0};
const sortValue=(a,b,field)=>{if(field==='priority')return (priorityRank[b.priority]||0)-(priorityRank[a.priority]||0);if(field==='fit')return fitRank(b.fit)-fitRank(a.fit);if(field==='newest')return (b.dateFound||'').localeCompare(a.dateFound||'');if(field==='oldest')return (a.dateFound||'').localeCompare(b.dateFound||'');if(field==='company')return (a.company||'').localeCompare(b.company||'');if(field==='title')return (a.title||'').localeCompare(b.title||'');return 0};
const sortOptions=[['priority','Priority: High first'],['fit','Best fit first'],['newest','Newest first'],['oldest','Oldest first'],['company','Company A–Z'],['title','Title A–Z']];
const secondaryRules={priority:['fit','newest','oldest','company','title'],fit:['priority','newest','oldest','company','title'],newest:['priority','fit','company','title'],oldest:['priority','fit','company','title'],company:['priority','fit','newest','oldest','title'],title:['priority','fit','newest','oldest','company']};

function Picker({value,onChange}){return <FormControl size="small" sx={{minWidth:155}}><Select value={value||'Not applied'} onChange={e=>onChange(e.target.value)}>{statusOptions.map(s=><MenuItem key={s} value={s}>{s}</MenuItem>)}</Select></FormControl>}
function App({themeMode,toggleTheme}){const [navVisible,setNavVisible]=useState(true),[desktop,setDesktop]=useState(()=>window.matchMedia('(min-width:951px)').matches);const reduceMotion=useReducedMotion();
useEffect(()=>{const media=window.matchMedia('(min-width:951px)');const update=()=>setDesktop(media.matches);media.addEventListener('change',update);return()=>media.removeEventListener('change',update)},[]);
useEffect(()=>{let previous=window.scrollY;let frame=0;let idleTimer;const resetIdle=()=>{clearTimeout(idleTimer);idleTimer=setTimeout(()=>setNavVisible(false),30000)};const onScroll=()=>{resetIdle();if(frame)return;frame=requestAnimationFrame(()=>{frame=0;const current=window.scrollY;const delta=current-previous;if(current<60)setNavVisible(true);else if(Math.abs(delta)>5)setNavVisible(delta<0);previous=current})};resetIdle();window.addEventListener('scroll',onScroll,{passive:true});return()=>{window.removeEventListener('scroll',onScroll);cancelAnimationFrame(frame);clearTimeout(idleTimer)}},[]);
const [db,setDb]=useState({jobs:[],updatedAt:''}),[loading,setLoading]=useState(true),[error,setError]=useState(''),[mine,setMine]=useState(getLocal);
const reload=()=>{setLoading(true);fetch(import.meta.env.BASE_URL+'data/jobs.json?ts='+Date.now(),{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('HTTP '+r.status);return r.json()}).then(j=>{setDb(j);setError('')}).catch(e=>setError(e.message)).finally(()=>setLoading(false))};
useEffect(reload,[]);useEffect(()=>{localStorage.setItem(key,JSON.stringify(mine))},[mine]);
const change=(id,s)=>setMine(o=>({...o,[id]:s}));
const save=()=>{let url=URL.createObjectURL(new Blob([JSON.stringify({exportedAt:new Date().toISOString(),applications:mine},null,2)],{type:'application/json'}));let a=document.createElement('a');a.href=url;a.download='careerboard-statuses.json';a.click();URL.revokeObjectURL(url)};
const restore=async file=>{if(!file)return;try{let v=JSON.parse(await file.text());v=v.applications||v;if(!v||typeof v!=='object'||Array.isArray(v))throw Error('Invalid data');setMine(o=>({...o,...Object.fromEntries(Object.entries(v).filter(([id,s])=>typeof id==='string'&&statusOptions.includes(s)))}))}catch(e){alert('Import failed: '+e.message)}};
return <div className="shell"><aside className="sidebar"><Link className="brand" to="/">✦ Profolio<span>.</span></Link><p className="micro">JOB INTELLIGENCE</p><NavLink className={({isActive})=>isActive?'nav active':'nav'} end to="/"><DashboardOutlined/> Dashboard</NavLink><NavLink className={({isActive})=>isActive?'nav active':'nav'} to="/jobs"><WorkOutline/> Explore jobs</NavLink><NavLink className={({isActive})=>isActive?'nav active':'nav'} to="/dsa"><span aria-hidden="true">⌘</span> DSA roadmap</NavLink><p className="aside-footer">Public job listings<br/>Your application statuses stay in this browser.</p></aside><main id="main-content" className="main"><header className="topbar"><Link className="mobile-brand" to="/" aria-label="Profolio home">✦ Profolio<span>.</span></Link><span className="micro desktop-only">CURATED JOB INTELLIGENCE</span><div className="topbar-utilities"><span className="small topbar-update">Jobs updated: {date(db.updatedAt)}</span><Tooltip title={themeMode==='dark'?'Switch to light mode':'Switch to dark mode'}><IconButton className="theme-toggle" size="small" onClick={toggleTheme} aria-label={themeMode==='dark'?'Switch to light mode':'Switch to dark mode'} aria-pressed={themeMode==='dark'}>{themeMode==='dark'?<LightModeOutlined fontSize="small"/>:<DarkModeOutlined fontSize="small"/>}</IconButton></Tooltip></div></header>{error&&<Alert severity="error">Cannot load jobs: {error} <Button onClick={reload}>Retry</Button></Alert>}{loading&&<ProfolioLoader compact={db.jobs.length>0} label={db.jobs.length?'Refreshing jobs':'Loading opportunities'}/>}{(!loading||db.jobs.length>0)&&<Routes><Route path="/" element={<Dashboard jobs={db.jobs||[]} mine={mine}/>}/><Route path="/jobs" element={<Jobs jobs={db.jobs||[]} mine={mine} change={change} save={save} restore={restore} reload={reload}/>}/><Route path="/jobs/:slug" element={<Detail jobs={db.jobs||[]} mine={mine} change={change}/>}/><Route path="/dsa" element={<Dsa/>}/><Route path="/dsa/learn/:stageId/:conceptId" element={<DsaLesson/>}/><Route path="/dsa/:id" element={<Dsa/>}/><Route path="*" element={<p>Page not found. <Link to="/">Go home</Link></p>}/></Routes>}<footer>Profolio • Public JSON • Personal progress stays on this device</footer></main><motion.nav className="mobile-nav" aria-label="Primary navigation" initial={false} animate={{x:desktop?"-50%":0,y:navVisible?0:(desktop?-110:110),opacity:navVisible?1:0}} transition={{duration:reduceMotion?0:0.16,ease:"easeOut"}} style={{pointerEvents:navVisible?"auto":"none"}}><NavLink end to="/" className={({isActive})=>isActive?'mobile-nav-item active':'mobile-nav-item'}><DashboardOutlined fontSize="small"/><span>Overview</span></NavLink><NavLink to="/jobs" className={({isActive})=>isActive?'mobile-nav-item active':'mobile-nav-item'}><WorkOutline fontSize="small"/><span>Jobs</span></NavLink><NavLink to="/dsa" className={({isActive})=>isActive?'mobile-nav-item active':'mobile-nav-item'}><span aria-hidden="true" className="mobile-code-icon">⌘</span><span>DSA</span></NavLink></motion.nav></div>}
const indiaToday=indiaDateISO;
function Dashboard({jobs}){
const [dsa,setDsa]=useState({problems:[],loading:true,error:''});
useEffect(()=>{let active=true;Promise.all(['data/dsa-roadmap.json','data/dsa.json'].map(async f=>{const r=await fetch(import.meta.env.BASE_URL+f,{cache:'no-store'});if(!r.ok)throw Error('HTTP '+r.status);return r.json()})).then(([road,old])=>{const map=new Map([...(road.practice||[]),...(old.problems||[])].map(p=>[p.slug,p]));const ordered=(road.stages||[]).flatMap(stage=>(stage.problemSlugs||[]).map(slug=>{const p=map.get(slug);return p?{...p,stageTitle:stage.title}:null}).filter(Boolean));if(active)setDsa({problems:ordered,loading:false,error:''})}).catch(e=>{if(active)setDsa({problems:[],loading:false,error:e.message})});return()=>{active=false}},[]);
const today=indiaToday();
const todaysJobs=jobs.filter(j=>j.dateFound===today).sort((a,b)=>a.id.localeCompare(b.id));
const eligible=jobs.filter(j=>!['Closed','Expired'].includes(j.vacancyStatus));
const score=j=>{const p=j.priority==='High'?4:j.priority==='Medium'?2:0;const fit=(j.fit||'').toLowerCase();const match=/strong|high:|best|excellent/.test(fit)?5:/good/.test(fit)?3:/stretch/.test(fit)?1:0;return p+match+(j.vacancyStatus==='Active'?3:0)};
const featured=[...eligible].sort((a,b)=>score(b)-score(a)||(b.dateFound||'').localeCompare(a.dateFound||'')).slice(0,5);
const nextDsa=dsa.problems.slice(0,4);
return <div className="home-sections">
<section className="panel home-panel"><div className="head-row"><div><h2>Today's job listings</h2><p className="sub">{date(today)} · {todaysJobs.length} new {todaysJobs.length===1?'listing':'listings'}</p></div><Link to="/jobs">All jobs ↗</Link></div>
{todaysJobs.length?todaysJobs.map(j=><Link key={j.id} to={'/jobs/'+slug(j)} className="listing home-listing"><div><b>{j.title}</b><p className="home-company-line"><CompanyPill name={j.company}/><span>{j.location}</span></p><small>{j.priority} priority · {briefFit(j.fit)} fit</small><SalaryPreview job={j} compact/></div><Status s={j.vacancyStatus}/></Link>):<p className="home-empty">No new jobs have been added today. New listings will appear here when the job dataset is updated.</p>}
</section>
<section className="panel home-panel"><div className="head-row"><div><h2>Top 5 recommended jobs</h2><p className="sub">Recent opportunities ranked by priority, fit and verification</p></div><Link to="/jobs">Explore jobs ↗</Link></div>
{featured.map(j=><Link key={j.id} to={'/jobs/'+slug(j)} className="listing home-listing"><div><b>{j.title}</b><p className="home-company-line"><CompanyPill name={j.company}/><span>{j.location}</span></p><small>{j.priority} priority · {briefFit(j.fit)} fit · {date(j.dateFound)}</small><SalaryPreview job={j} compact/></div><VerifiedTag status={j.vacancyStatus}/></Link>)}
{!featured.length&&<p className="home-empty">No recommended jobs available yet.</p>}
</section>
<section className="panel home-panel"><div className="head-row"><div><h2>Your DSA learning path</h2><p className="sub">Start with fundamentals, move through 21 structured stages</p></div><Link to="/dsa">Open roadmap ↗</Link></div>
{dsa.loading?<ProfolioLoader compact label="Loading DSA roadmap"/>:dsa.error?<p className="home-empty">DSA roadmap could not be loaded right now.</p>:nextDsa.length?nextDsa.map((p,i)=><Link key={p.slug} to={'/dsa/'+p.slug} className="listing home-listing"><div><b>{i+1}. {p.title}</b><p>{p.stageTitle} · {p.difficulty} · ~{p.estimatedMinutes||25} min</p></div><span className="home-practice">Practice ↗</span></Link>):<p className="home-empty">Open the DSA roadmap to start learning.</p>}
</section>
</div>}
function Jobs({jobs,mine,change,save,restore,reload}){
const [q,setQ]=useState(''),[vac,setVac]=useState('Active'),[mode,setMode]=useState('All'),[priority,setPriority]=useState('All'),[primarySort,setPrimarySort]=useState('priority'),[secondarySort,setSecondarySort]=useState('newest'),[applied,setApplied]=useState('All'),[dateRange,setDateRange]=useState('all');
const [moreFilters,setMoreFilters]=useState(false),[actionsAnchor,setActionsAnchor]=useState(null);
const today=indiaDateISO();
const list=useMemo(()=>jobs.filter(j=>(j.title+' '+j.company+' '+j.location+' '+j.skills).toLowerCase().includes(q.toLowerCase())&&(vac==='All'||j.vacancyStatus===vac)&&(mode==='All'||(j.workMode||'').toLowerCase().includes(mode.toLowerCase()))&&(priority==='All'||priority===j.priority)&&(applied==='All'||(mine[j.id]||'Not applied')===applied)&&matchesDateRange(j.dateFound,dateRange,today)).sort((a,b)=>sortValue(a,b,primarySort)||sortValue(a,b,secondarySort)||a.id.localeCompare(b.id)),[jobs,mine,q,vac,mode,priority,primarySort,secondarySort,applied,dateRange,today]);
const activeExtra=[mode!=='All',priority!=='All',applied!=='All',dateRange!=='all'].filter(Boolean).length;
const reset=()=>{setQ('');setVac('Active');setMode('All');setPriority('All');setPrimarySort('priority');setSecondarySort('newest');setApplied('All');setDateRange('all')};
const allowedSecondary=secondaryRules[primarySort]||[];
const secondaryOptions=[['none','No additional sort'],...sortOptions.filter(([value])=>allowedSecondary.includes(value))];
const handlePrimarySort=value=>{setPrimarySort(value);setSecondarySort((secondaryRules[value]||[]).includes('newest')?'newest':(secondaryRules[value]||[])[0]||'none')};
const makeSelect=(label,value,setter,options)=><TextField key={label} select size="small" label={label} value={value} onChange={e=>setter(e.target.value)}>{options.map(item=><MenuItem key={Array.isArray(item)?item[0]:item} value={Array.isArray(item)?item[0]:item}>{Array.isArray(item)?item[1]:item}</MenuItem>)}</TextField>;
return <div className="jobs-page">
<header className="jobs-page-heading"><div className="jobs-page-title"><h1>Explore jobs</h1><p>Find relevant roles and track your applications.</p></div>
<div className="jobs-page-actions"><Tooltip title="Refresh listings"><IconButton size="small" aria-label="Refresh listings" onClick={reload}><Refresh fontSize="small"/></IconButton></Tooltip><Tooltip title="Import or export your statuses"><IconButton size="small" aria-label="More job actions" aria-controls={actionsAnchor?'jobs-actions-menu':undefined} aria-haspopup="true" onClick={e=>setActionsAnchor(e.currentTarget)}><MoreVert fontSize="small"/></IconButton></Tooltip>
<Menu id="jobs-actions-menu" anchorEl={actionsAnchor} open={Boolean(actionsAnchor)} onClose={()=>setActionsAnchor(null)}>
<MenuItem onClick={()=>{setActionsAnchor(null);save()}}><Download fontSize="small" sx={{mr:1.3}}/>Export application statuses</MenuItem>
<MenuItem component="label"><Upload fontSize="small" sx={{mr:1.3}}/>Import application statuses<input hidden type="file" accept=".json,application/json" onChange={e=>{restore(e.target.files?.[0]);e.target.value='';setActionsAnchor(null)}}/></MenuItem>
</Menu></div></header>
<section className="panel jobs-search-panel" aria-label="Search and filter jobs">
<div className="jobs-search-line"><TextField fullWidth size="small" placeholder="Search role, company, location or skill" aria-label="Search jobs" value={q} onChange={e=>setQ(e.target.value)} InputProps={{startAdornment:<InputAdornment position="start"><Search fontSize="small"/></InputAdornment>,endAdornment:q?<InputAdornment position="end"><IconButton size="small" aria-label="Clear search" onClick={()=>setQ('')}><Close fontSize="small"/></IconButton></InputAdornment>:null}}/></div>
<div className="jobs-quick-filters" role="group" aria-label="Vacancy status">
{[['Active','Active'],['All','All jobs'],['Recheck','Recheck'],['Unknown','Unknown'],['Closed','Closed'],['Expired','Expired']].map(([value,label])=><button type="button" key={value} className={'jobs-filter-chip '+(vac===value?'selected':'')} aria-pressed={vac===value} onClick={()=>setVac(value)}>{label}</button>)}
</div>
<div className="jobs-control-row"><div className="jobs-sort-pair"><div className="jobs-primary-sort">{makeSelect('Sort by',primarySort,handlePrimarySort,sortOptions)}</div><div className="jobs-secondary-sort">{makeSelect('Then by',secondarySort,setSecondarySort,secondaryOptions)}</div></div>
<Button variant={moreFilters?'contained':'outlined'} className="jobs-more-filter-button" size="small" startIcon={<Tune fontSize="small"/>} endIcon={moreFilters?<ExpandLess fontSize="small"/>:<ExpandMore fontSize="small"/>} onClick={()=>setMoreFilters(v=>!v)} aria-expanded={moreFilters} aria-controls="jobs-extra-filters">Filters{activeExtra?' ('+activeExtra+')':''}</Button>
{(q||vac!=='Active'||mode!=='All'||priority!=='All'||applied!=='All'||primarySort!=='priority'||secondarySort!=='newest'||dateRange!=='all')&&<Button size="small" className="jobs-reset" onClick={reset}>Reset</Button>}
</div>
<Collapse in={moreFilters} timeout={140}><div id="jobs-extra-filters" className="jobs-extra-filters">
{makeSelect('Work mode',mode,setMode,['All','Remote','Hybrid','Office','On-site'])}
{makeSelect('Priority',priority,setPriority,['All','High','Medium','Low'])}
{makeSelect('My application',applied,setApplied,['All',...statusOptions])}
{makeSelect('Date found',dateRange,setDateRange,dateRangeOptions)}
<p className="jobs-filter-help">Sorting is applied in order: primary first, then your selected tie-breaker.</p>
</div></Collapse>
</section>
<div className="jobs-results-line"><div><strong>{list.length} {list.length===1?'job':'jobs'}</strong><span>{vac==='Active'?'Verified open listings':vac==='All'?'All vacancy statuses':vac+' listings'}{dateRange!=='all'?' · '+dateRangeOptions.find(([value])=>value===dateRange)?.[1]:''}</span></div><span className="jobs-sort-summary">{sortOptions.find(([key])=>key===primarySort)?.[1]}{secondarySort!=='none'?' · '+sortOptions.find(([key])=>key===secondarySort)?.[1]:''}</span></div>
<div className="jobs-list">{list.map(j=><article className="panel job" key={j.id}>
<div className="job-content"><div className="job-topline"><CompanyPill name={j.company}/><Status s={j.vacancyStatus}/></div>
<Link to={'/jobs/'+slug(j)} className="job-title-link"><h3 title={j.title}>{j.title}</h3></Link>
<p className="job-location">{j.location}{j.workMode&&j.workMode!=='Unconfirmed'?' · '+j.workMode:''}</p><SalaryPreview job={j}/>
<div className="tags">{(j.skills||'').split(',').map(x=>x.trim()).filter(Boolean).slice(0,4).map((skill,i)=><span key={i} className="tag" title={skill}>{skill}</span>)}</div>
<p className="job-meta">{j.priority} priority · {briefFit(j.fit)} fit · Found {date(j.dateFound)}</p>
</div><div className="job-side"><label className="input-caption" htmlFor={'job-status-'+j.id}>Your application</label><div id={'job-status-'+j.id}><Picker value={mine[j.id]} onChange={value=>change(j.id,value)}/></div><Link className="job-detail-link" to={'/jobs/'+slug(j)}>View details ↗</Link></div></article>)}</div>
{!list.length&&<div className="panel home-empty">No results for these filters. Try All jobs or reset your search.</div>}
<p className="jobs-privacy-note">Application statuses are saved only on this device. Use the menu above to export or import them.</p>
</div>}
function Detail({jobs,mine,change}){
const {slug:route}=useParams();const j=jobs.find(x=>slug(x)===route);
if(!j)return <section className="panel"><p>Job not found, or data is still loading.</p><Link to="/jobs">Back to jobs</Link></section>;
const summary=[['Salary',j.salary||'Not disclosed'],['Fit',briefFit(j.fit)],['Priority',j.priority],['Found',date(j.dateFound)]];
const locationLine=[j.location,j.workMode&&j.workMode!=='Unconfirmed'&&j.workMode!=='Not specified'?j.workMode:null].filter(Boolean).join(' · ');
return <div className="detail-page job-detail">
<Link to="/jobs" className="back"><ArrowBack fontSize="small"/> Back to jobs</Link>
<section className="panel job-detail-hero">
<div className="job-detail-eyebrow"><CompanyPill name={j.company}/><span className="micro">{j.id}</span><Status s={j.vacancyStatus}/></div>
<h1>{j.title}</h1>
<p className="job-detail-location">{locationLine||'Location not specified'}</p>
<div className="job-detail-experience"><strong>Experience:</strong> {j.experience||'Not specified'}</div>
<div className="job-detail-actions"><Button href={j.url||undefined} disabled={!j.url} target="_blank" rel="noopener noreferrer" variant="contained" size="small" endIcon={<OpenInNew/>}>Official listing</Button></div>
<div className="detail-summary">{summary.map(([label,value])=><div className="detail-summary-item" key={label}><span className="micro">{label}</span><strong title={value||'Not specified'}>{value||'Not specified'}</strong></div>)}</div>
{j.fit&&briefFit(j.fit)!==j.fit.trim()&&<div className="job-fit-explanation"><strong>Fit assessment</strong><p>{j.fit}</p></div>}
</section>
<div className="two">
<div><section className="panel"><h2>Job description</h2><p className="description">{j.description||'The original dataset does not contain the full job description for this listing. Use the official application link for complete details.'}</p>{j.notes&&<p className="sub">{j.notes}</p>}</section>
{hasKnownSalary(j)&&<section className="panel job-salary-evidence"><h2>Salary information & source</h2><p className="job-salary-large">{j.salary}</p>{j.salaryEvidence?<><p><b>{j.salaryEvidence.type==='third_party_estimate'?'Third-party benchmark, not a job offer':'Employer-disclosed compensation'}</b></p><p>{j.salaryEvidence.scope}</p><p>{j.salaryEvidence.notes}</p><div className="job-salary-source"><span>Source: {j.salaryEvidence.sourceName} · Checked {date(j.salaryEvidence.checkedAt)} · Confidence: {j.salaryEvidence.confidence}</span><a href={j.salaryEvidence.sourceUrl} target="_blank" rel="noopener noreferrer">View salary source <OpenInNew fontSize="inherit"/></a></div></>:<p>The compensation figure was already included in the original listing dataset. Confirm the current pay and currency directly with the employer.</p>}</section>}<section className="panel"><h2>Skills & requirements</h2><div className="tags">{(j.skills||'').split(',').filter(Boolean).map((skill,i)=><span className="tag" key={i}>{skill.trim()}</span>)}</div></section>
<section className="panel"><h2>Verification history</h2><p className="sub">Last checked: {j.lastChecked||'Not recorded'}</p><p className="description">{j.verification||'No verification evidence recorded.'}</p></section></div>
<div><section className="panel"><h2>Your application</h2><p className="sub">Saved on this device only</p><Picker value={mine[j.id]} onChange={value=>change(j.id,value)}/></section>
<section className="panel"><h2>Role details</h2>{[['Company',j.company],['Experience',j.experience],['Work mode',j.workMode],['Vacancy',j.vacancyStatus],['Last checked',j.lastChecked]].map(([label,value])=><div className="breakdown" key={label}><span>{label}</span><b>{value||'Unknown'}</b></div>)}</section></div>
</div><JobToolkit job={j}/></div>}
export default App;