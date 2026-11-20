import React from 'react';

/**
 * Lightweight, accessible SVG loader shared by jobs and DSA.
 * Motion comes from CSS and turns off for reduced-motion preferences.
 */
export default function ProfolioLoader({label='Loading Profolio',compact=false}){
  return <div className={'profolio-loading'+(compact?' is-compact':'')} role="status" aria-live="polite" aria-label={label}>
    <svg className="profolio-loader-svg" viewBox="0 0 80 80" width="72" height="72" fill="none" aria-hidden="true" focusable="false">
      <circle cx="40" cy="40" r="30" stroke="#E1EAF7" strokeWidth="5"/>
      <circle className="profolio-loader-ring" cx="40" cy="40" r="30" stroke="#3658B8" strokeWidth="5" strokeLinecap="round" strokeDasharray="68 188" transform="rotate(-90 40 40)"/>
      <path className="profolio-loader-spark" d="M40 22.5L44.6 35.4 57.5 40 44.6 44.6 40 57.5 35.4 44.6 22.5 40 35.4 35.4Z" fill="#4969C2"/>
      <circle className="profolio-loader-dot dot-one" cx="15" cy="20" r="3.5" fill="#A89CE1"/>
      <circle className="profolio-loader-dot dot-two" cx="66" cy="57" r="3" fill="#7FC4AB"/>
    </svg>
    <span className="profolio-loader-label">{label}<span className="profolio-loader-ellipsis" aria-hidden="true">...</span></span>
  </div>
}
