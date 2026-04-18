import{a as u,j as a}from"./ui-DYv5pV-1.js";import{s as x}from"./security-BzU2OnB1.js";const p=u.forwardRef(({label:n,error:e,required:i,className:c="",...s},d)=>{const t=`input-${n.toLowerCase().replace(/\s+/g,"-")}`,m=r=>{const{value:l,type:o}=r.target;if(o==="text"||o==="tel"){const h=o==="tel"?20:100;r.target.value=x(l,h)}else o==="email"&&(r.target.value=l.slice(0,254).replace(/[<>]/g,""));s.onChange&&s.onChange(r)};return a.jsxs("div",{className:"space-y-1",children:[a.jsxs("label",{htmlFor:t,className:"block text-sm font-medium text-cyan-100",children:[n,i&&a.jsx("span",{className:"text-pink-300 ml-1","aria-label":"required",children:"*"})]}),a.jsx("input",{ref:d,id:t,className:`
            w-full px-0 py-3 bg-transparent text-white placeholder-white 
            border-0 border-b-2 border-white focus:border-cyan-300 
            focus:outline-none focus:ring-0 transition-colors duration-200
            ${e?"border-red-400":""}
            ${c}
          `,onChange:m,"aria-invalid":e?"true":"false","aria-describedby":e?`${t}-error`:void 0,autoComplete:s.autoComplete||"off",spellCheck:"false",...s}),e&&a.jsx("p",{id:`${t}-error`,className:"text-red-300 text-sm mt-1",role:"alert",children:e})]})});p.displayName="CustomInput";const f=u.forwardRef(({label:n,error:e,required:i,className:c="",...s},d)=>{const t=`textarea-${n.toLowerCase().replace(/\s+/g,"-")}`,m=r=>{const{value:l}=r.target;r.target.value=x(l,2e3),s.onChange&&s.onChange(r)};return a.jsxs("div",{className:"space-y-1",children:[a.jsxs("label",{htmlFor:t,className:"block text-sm font-medium text-cyan-100",children:[n,i&&a.jsx("span",{className:"text-pink-300 ml-1","aria-label":"required",children:"*"})]}),a.jsx("textarea",{ref:d,id:t,rows:4,className:`
            w-full px-0 py-3 bg-transparent text-white placeholder-white 
            border-0 border-b-2 border-white focus:border-cyan-300 
            focus:outline-none focus:ring-0 transition-colors duration-200 resize-none
            ${e?"border-red-400":""}
            ${c}
          `,onChange:m,"aria-invalid":e?"true":"false","aria-describedby":e?`${t}-error`:void 0,spellCheck:"true",...s}),e&&a.jsx("p",{id:`${t}-error`,className:"text-red-300 text-sm mt-1",role:"alert",children:e})]})});f.displayName="Textarea";export{p as C,f as a};
