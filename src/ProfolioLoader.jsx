import React from 'react';

/** Lightweight, accessible SVG loader for job and DSA requests. */
export default function ProfolioLoader({label='Loading Profolio',compact=false}){
  return <div className={'profolio-loading'+(compact?' is-compact':'')} role="status" aria-live="polite" aria-label={label}>
    <svg className="profolio-loader-svg" viewBox="0 0 64 64" width="64" height="64" fill="none" aria-hidden="true" focusable="false">
      <circle cx="32" cy="32" r="23" stroke="#DEE7F5" strokeWidth="5"/>
      <circle className="profolio-loader-ring" cx="32" cy="32" r="23" stroke="#3153BB" strokeWidth="5" strokeLinecap="round" strokeDasharray="51 145"/>
      <path className="profolio-loader-spark" d="M32 20L35.4 28.6 44 32 35.4 35.4 32 44 28.6 35.4 20 32 28.6 28.6Z" fill="#526BC5"/>
      <circle cx="12" cy="14" r="3" fill="#A99ADD"/>
      <circle cx="53" cy="48" r="2.8" fill="#8CCBB5"/>
    </svg>
    <span className="profolio-loader-label">{label}<span aria-hidden="true">…</span></span>
  </div>;
}
