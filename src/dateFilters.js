export const dateRangeOptions=[
  ['all','All dates'],
  ['today','Today'],
  ['2d','2 days'],
  ['1w','1 week'],
  ['1m','1 month'],
  ['6m','6 months'],
  ['1y','1 year']
];

export function indiaDateISO(now=new Date()){
  const parts=new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);
  const fields=Object.fromEntries(parts.filter(part=>part.type!=='literal').map(part=>[part.type,part.value]));
  return fields.year+'-'+fields.month+'-'+fields.day;
}

function startDateISO(range,today){
  const d=new Date(today+'T00:00:00Z');
  if(range==='today')return today;
  if(range==='2d'||range==='1w'){
    d.setUTCDate(d.getUTCDate()-(range==='2d'?1:6));
    return d.toISOString().slice(0,10);
  }
  const months={'1m':1,'6m':6,'1y':12}[range];
  if(!months)return null;
  const targetDay=d.getUTCDate();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth()-months);
  const lastDay=new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+1,0)).getUTCDate();
  d.setUTCDate(Math.min(targetDay,lastDay));
  return d.toISOString().slice(0,10);
}

export function matchesDateRange(value,range,today=indiaDateISO()){
  if(range==='all')return true;
  if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;
  const cutoff=startDateISO(range,today);
  return cutoff!==null&&value>=cutoff&&value<=today;
}
