import React,{useEffect,useMemo,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {BrowserRouter} from 'react-router-dom';
import {ThemeProvider,createTheme,CssBaseline} from '@mui/material';
import App from './App.jsx';
import './style.css';

const themeKey='careerboard-theme-v1';
function readMode(){try{return localStorage.getItem(themeKey)==='dark'?'dark':'light';}catch{return 'light';}}

function Site(){
 const [mode,setMode]=useState(readMode);
 const theme=useMemo(()=>createTheme({
  palette:{
   mode,
   primary:{main:mode==='dark'?'#96b3ff':'#3153bb',contrastText:mode==='dark'?'#101a30':'#ffffff'},
   background:{default:mode==='dark'?'#0d1421':'#f4f6f9',paper:mode==='dark'?'#151f30':'#ffffff'},
   text:{primary:mode==='dark'?'#e8effa':'#182439',secondary:mode==='dark'?'#aebbd0':'#526078'},
   divider:mode==='dark'?'#2a3a52':'#e0e6ef'
  },
  shape:{borderRadius:12},
  typography:{fontFamily:'Inter,system-ui,sans-serif',button:{textTransform:'none'}}
 }),[mode]);
 useEffect(()=>{
  document.documentElement.dataset.theme=mode;
  document.documentElement.style.colorScheme=mode;
  const color=document.querySelector('meta[name="theme-color"]');
  if(color)color.setAttribute('content',mode==='dark'?'#0d1421':'#f4f6f9');
  try{localStorage.setItem(themeKey,mode)}catch{/* private browser storage blocked */}
 },[mode]);
 return <ThemeProvider theme={theme}><CssBaseline/><BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/,'')}><App themeMode={mode} toggleTheme={()=>setMode(prev=>prev==='dark'?'light':'dark')}/></BrowserRouter></ThemeProvider>;
}
createRoot(document.getElementById('root')).render(<React.StrictMode><Site/></React.StrictMode>);
