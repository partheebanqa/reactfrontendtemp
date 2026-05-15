import{j as e,bd as Pe,be as Ie,r as w,aX as Ue,R as ne}from"./vendor-CFQAAhWr.js";import{a as we,u as Ne}from"./router-oVxxGWtL.js";import{b as Ae}from"./tanstack-DiIOg211.js";import{a as G,e as ce}from"./exportDate-DNoXCdwI.js";import{R as Le,V as Be}from"./VariablesAndDataFlow-Dt6JFo7u.js";import{E as ke,h as Oe}from"./pdf-utils-DPkYwHC8.js";import{m as Y,C as xe,i as D,g as J,E as V,a9 as le,Y as X,n as me,h as Q,T as oe,am as W,aH as H,br as pe,a1 as Te,Q as $e,ap as ue,X as qe,ab as He,N as _e,x as Ce,ag as Re,aI as Se,bs as Je}from"./icons-CLRbx-bL.js";import{L as Ee}from"./OptraLogo-Cw5cE5z2.js";import{k as ee,q as se,T as I,f as U,g as A,h as Ve}from"./index-D_uWO7un.js";import{u as te}from"./useWorkspace-DquDs94r.js";import{g as de,i as Ge}from"./integrationTools.service-8LGqaOCv.js";import{I as Ke}from"./input-BtWUN392.js";import{T as Ze}from"./textarea-DfItQIsw.js";import{B as re}from"./button-D-FUrgE2.js";import"./badge-DSthG6vs.js";import"./radix-ui-B9y0QeMm.js";import"./tabs-NQSX5Xk2.js";import"./select-CRuCv8hx.js";import"./card-DQbIhmZL.js";const Me=(s,t)=>{const i=`${window.location.origin}/executions/report/test_suite/${s}?executionId=${t}`;navigator.share?navigator.share({title:"Test Suite Report",text:"View this comprehensive API test suite report",url:i}).catch(console.error):navigator.clipboard?navigator.clipboard.writeText(i).then(()=>alert("Shareable link copied to clipboard!")).catch(()=>prompt("Copy this shareable link:",i)):prompt("Copy this shareable link:",i)},q=({code:s,language:t="json",className:i})=>e.jsx("div",{className:i,children:e.jsx(Pe,{language:t,style:Ie,customStyle:{borderRadius:8,margin:0,fontSize:12.5,lineHeight:1.6,padding:"12px 14px"},wrapLongLines:!0,showLineNumbers:!1,children:s})}),ge=s=>{if(!s)return"";let t=s.trim();return/^curl\b/.test(t)||(t="curl "+t),t=t.replace(/\s-X\s'([^']+)'/g,` \\
  -X $1`),t=t.replace(/\s-H\s'([^']+)'/g,` \\
  -H "$1"`),t=t.replace(/\s(--data-raw|-d)\s'([^']+)'/g,(i,a,x)=>{let o=x;try{const r=JSON.parse(x);o=JSON.stringify(r,null,2)}catch{}const n=o.replace(/'/g,"'\\''");return` \\
  ${a} '${n}'`}),t=t.replace(/\s'(https?:\/\/[^']+)'/g,` \\
  "$1"`),t=t.replace(/[ \t]+/g," "),t},he=s=>{switch(s){case"passed":return"bg-green-100 text-green-800 border-green-200";case"failed":return"bg-red-100 text-red-800 border-red-200";case"skipped":return"bg-yellow-100 text-yellow-800 border-yellow-200";default:return"bg-gray-100 text-gray-800 border-gray-200"}},fe=s=>{switch(s){case"critical":return"bg-red-600 text-white";case"high":return"bg-orange-600 text-white";case"medium":return"bg-yellow-600 text-white";case"low":return"bg-blue-600 text-white";default:return"bg-gray-600 text-white"}},be=s=>{try{const t=JSON.parse(s);return JSON.stringify(t,null,2)}catch{return s}},Ye=s=>{try{const t=JSON.parse(s);return(t==null?void 0:t.statusCode)!=null?String(t.statusCode):null}catch{return null}},Xe=s=>{var x,o;const t=((x=s.expectedResponse)==null?void 0:x.status)!=null?String(s.expectedResponse.status):null,i=Ye(s.response??"");if(s.status!=="failed")return{message:"",expected:t,actual:i};const a=((o=s.errorMessage)==null?void 0:o.trim())??"";return a?{message:a,expected:t,actual:i}:t!==null&&i!==null?{message:`Expected status ${t}, but got ${i}`,expected:t,actual:i}:{message:"N/A",expected:null,actual:null}},ve=({testCase:s})=>{const{status:t}=s,{message:i,expected:a,actual:x}=Xe(s);if(!(i||a!=null&&x!=null))return null;const n=t==="failed",r=t==="passed",l=n?"border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/30":r?"border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30":"border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950/30",d=n?"border-red-200 dark:border-red-800":r?"border-green-200 dark:border-green-800":"border-yellow-200 dark:border-yellow-800",m=n?"text-red-600 dark:text-red-400":r?"text-green-600 dark:text-green-400":"text-yellow-600 dark:text-yellow-400",g=n?"text-red-700 dark:text-red-400":r?"text-green-700 dark:text-green-400":"text-yellow-700 dark:text-yellow-400",p=n?"text-red-800 dark:text-red-300":r?"text-green-800 dark:text-green-300":"text-yellow-800 dark:text-yellow-300",c=n?"Failure Reason":r?"Status Check":"Test Summary",u=n?V:le,b="bg-green-100 text-green-800 border-green-200 dark:bg-green-900/40 dark:text-green-300 dark:border-green-700",$=n?"bg-red-100 text-red-800 border-red-200 dark:bg-red-900/40 dark:text-red-300 dark:border-red-700":"bg-green-100 text-green-800 border-green-200 dark:bg-green-900/40 dark:text-green-300 dark:border-green-700";return e.jsxs("div",{className:`mb-4 rounded-lg border overflow-hidden ${l}`,children:[e.jsxs("div",{className:`flex items-center gap-2 px-4 py-2.5 border-b ${d}`,children:[e.jsx(u,{className:`w-4 h-4 flex-shrink-0 ${m}`}),e.jsx("span",{className:`text-xs font-semibold uppercase tracking-wider ${g}`,children:c})]}),e.jsxs("div",{className:"px-4 py-3 space-y-3",children:[i&&e.jsx("p",{className:`text-sm font-medium break-words ${p}`,children:i}),a!=null&&x!=null&&e.jsxs("div",{className:"flex flex-wrap items-center gap-2 text-xs font-medium",children:[e.jsxs("div",{className:"flex items-center gap-1.5",children:[e.jsx("span",{className:"w-2 h-2 rounded-full bg-green-500 flex-shrink-0"}),e.jsx("span",{className:"text-gray-600 dark:text-gray-400",children:"Expected"}),e.jsx("span",{className:`inline-flex items-center px-2 py-0.5 rounded border font-semibold ${b}`,children:a})]}),e.jsx("span",{className:"text-gray-400 dark:text-gray-500",children:"→"}),e.jsxs("div",{className:"flex items-center gap-1.5",children:[e.jsx("span",{className:`w-2 h-2 rounded-full flex-shrink-0 ${n?"bg-red-500":"bg-green-500"}`}),e.jsx("span",{className:"text-gray-600 dark:text-gray-400",children:"Actual"}),e.jsx("span",{className:`inline-flex items-center px-2 py-0.5 rounded border font-semibold ${$}`,children:x})]})]})]})]})},ye=({testCase:s})=>{const[t,i]=w.useState(!1),a=e.jsxs("div",{className:"hidden md:block border border-gray-200 dark:border-gray-700 rounded-lg mb-4 overflow-hidden",children:[e.jsx("div",{className:"p-4 bg-gray-50 dark:bg-gray-800/40 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors",onClick:()=>i(!t),children:e.jsxs("div",{className:"flex items-center justify-between gap-4",children:[e.jsxs("div",{className:"flex items-start gap-3 min-w-0",children:[t?e.jsx(Y,{className:"w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0"}):e.jsx(xe,{className:"w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0"}),e.jsxs("div",{className:"min-w-0",children:[e.jsx("h3",{className:"font-semibold text-gray-900 dark:text-white truncate",children:s.name}),e.jsxs("div",{className:"flex flex-wrap items-center gap-2 mt-1",children:[e.jsx("span",{className:`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${he(s.status)}`,children:s.status.toUpperCase()}),e.jsx("span",{className:`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${fe(s.severity)}`,children:s.severity.toUpperCase()})]})]})]}),e.jsxs("div",{className:"flex items-center gap-5 text-sm text-gray-500 flex-shrink-0",children:[e.jsxs("div",{className:"flex items-center gap-1",children:[e.jsx(D,{className:"w-4 h-4"}),e.jsxs("span",{children:[s.duration,"ms"]})]}),e.jsxs("div",{className:"flex items-center gap-1",children:[e.jsx(J,{className:"w-4 h-4"}),e.jsxs("span",{children:[s.responseSize,"B"]})]})]})]})}),t&&e.jsx("div",{className:"p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900",children:e.jsxs("div",{className:"space-y-4",children:[e.jsx(ve,{testCase:s}),e.jsxs("div",{children:[e.jsx("h4",{className:"font-medium text-gray-900 dark:text-white mb-2",children:"Endpoint"}),e.jsx(q,{language:"http",code:`${s.method.toUpperCase()} ${s.url}`})]}),e.jsxs("div",{children:[e.jsx("h4",{className:"font-medium text-gray-900 dark:text-white mb-2",children:"Request cURL"}),e.jsx(q,{language:"bash",code:ge(s.requestCurl)})]}),e.jsxs("div",{children:[e.jsx("h4",{className:"font-medium text-gray-900 dark:text-white mb-2",children:"Response"}),e.jsx(q,{language:"json",code:be(s.response)})]})]})})]}),x=e.jsxs("div",{className:"block md:hidden border border-gray-200 dark:border-gray-800 rounded-xl mb-4 overflow-hidden bg-white dark:bg-gray-900",children:[e.jsx("div",{className:"p-4 cursor-pointer bg-gray-50 dark:bg-gray-800/40 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors",onClick:()=>i(!t),children:e.jsxs("div",{className:"flex items-start gap-3",children:[t?e.jsx(Y,{className:"w-5 h-5 text-gray-400 mt-1 flex-shrink-0"}):e.jsx(xe,{className:"w-5 h-5 text-gray-400 mt-1 flex-shrink-0"}),e.jsxs("div",{className:"flex-1 min-w-0",children:[e.jsx("h3",{className:"text-sm sm:text-base font-semibold text-gray-900 dark:text-white truncate",children:s.name}),e.jsxs("div",{className:"flex flex-wrap items-center gap-2 mt-2",children:[e.jsx("span",{className:`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${he(s.status)}`,children:s.status.toUpperCase()}),e.jsx("span",{className:`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${fe(s.severity)}`,children:s.severity.toUpperCase()})]}),e.jsxs("div",{className:"mt-3 grid grid-cols-2 sm:flex sm:items-center sm:gap-6 gap-3 text-xs sm:text-sm text-gray-500",children:[e.jsxs("div",{className:"flex items-center gap-1",children:[e.jsx(D,{className:"w-4 h-4"}),e.jsxs("span",{children:[s.duration,"ms"]})]}),e.jsxs("div",{className:"flex items-center gap-1",children:[e.jsx(J,{className:"w-4 h-4"}),e.jsxs("span",{children:[s.responseSize,"B"]})]})]})]})]})}),t&&e.jsxs("div",{className:"p-4 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 space-y-5",children:[e.jsx(ve,{testCase:s}),e.jsxs("div",{children:[e.jsx("h4",{className:"text-sm font-semibold text-gray-900 dark:text-white mb-2",children:"Endpoint"}),e.jsx(q,{language:"http",code:`${s.method.toUpperCase()} ${s.url}`})]}),e.jsxs("div",{children:[e.jsx("h4",{className:"text-sm font-semibold text-gray-900 dark:text-white mb-2",children:"Request cURL"}),e.jsx(q,{language:"bash",code:ge(s.requestCurl)})]}),e.jsxs("div",{children:[e.jsx("h4",{className:"text-sm font-semibold text-gray-900 dark:text-white mb-2",children:"Response"}),e.jsx(q,{language:"json",code:be(s.response)})]})]})]});return e.jsxs(e.Fragment,{children:[a,x]})},Qe=s=>{var a;if(!s)return[];const t=["positiveTests","negativeTests","functionalTests","semanticTests","edgeCaseTests","securityTests","advancedSecurityTests"],i=[];for(const x of s.requests||[])for(const o of t){const n=x[o];if((a=n==null?void 0:n.testCases)!=null&&a.length)for(const r of n.testCases)i.push({...r,method:r.method||x.method,url:r.url||x.url})}return i},We=s=>{try{const t=new URL(s),i=`${t.protocol}//${t.host.toLowerCase()}`,a=t.pathname.replace(/\/$/,"");return`${i}${a}${t.search}`}catch{return s.trim().replace(/\/$/,"")}},je=s=>{switch((s||"").toUpperCase()){case"GET":return"bg-blue-100 text-blue-800 border-blue-200";case"POST":return"bg-green-100 text-green-800 border-green-200";case"PUT":return"bg-yellow-100 text-yellow-800 border-yellow-200";case"DELETE":return"bg-red-100 text-red-800 border-red-200";case"PATCH":return"bg-purple-100 text-purple-800 border-purple-200";case"OPTIONS":return"bg-gray-100 text-gray-800 border-gray-200";default:return"bg-gray-100 text-gray-800 border-gray-200"}},es=({report:s,testCases:t})=>{const[i,a]=w.useState(new Set),x=w.useMemo(()=>t&&t.length?t:Qe(s),[s,t]),o=w.useMemo(()=>{const d={};for(const m of x){const g=We(m.url||"");d[g]||(d[g]={key:g,endpoint:m.url,methods:{},total:0,passed:0,failed:0,skipped:0,avgDuration:0});const p=d[g],c=(m.method||"").toUpperCase();p.methods[c]||(p.methods[c]={method:c,testCases:[],total:0,passed:0,failed:0,skipped:0,avgDuration:0});const u=p.methods[c];u.testCases.push(m),u.total+=1,m.status==="passed"?u.passed+=1:m.status==="failed"?u.failed+=1:m.status==="skipped"&&(u.skipped+=1),p.total+=1,m.status==="passed"?p.passed+=1:m.status==="failed"?p.failed+=1:m.status==="skipped"&&(p.skipped+=1)}return Object.values(d).forEach(m=>{Object.values(m.methods).forEach(p=>{const c=p.testCases.reduce((u,b)=>u+(b.duration||0),0);p.avgDuration=p.total?Math.round(c/p.total):0});const g=Object.values(m.methods).flatMap(p=>p.testCases).reduce((p,c)=>p+(c.duration||0),0);m.avgDuration=m.total?Math.round(g/m.total):0}),d},[x]),n=Object.values(o),r=d=>{const m=new Set(i);m.has(d)?m.delete(d):m.add(d),a(m)},l=(d,m)=>m?Math.round(d/m*100):0;return n.length?e.jsx("div",{className:"space-y-4",children:e.jsxs("div",{className:"bg-white rounded-lg border border-gray-200 p-3 md:p-6",children:[e.jsxs("h2",{className:"text-md md:text-xl font-bold text-gray-900 mb-4 flex items-center",children:[e.jsx(X,{className:"w-6 h-6 mr-2 text-blue-600"}),"API Endpoints (",n.length," endpoints)"]}),e.jsx("div",{className:"space-y-4 hidden md:block",children:n.map(d=>{const m=i.has(d.key),g=l(d.passed,d.total);return e.jsxs("div",{className:"border border-gray-200 rounded-lg overflow-hidden",children:[e.jsx("div",{className:"p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors",onClick:()=>r(d.key),children:e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsxs("div",{className:"flex items-center space-x-4 flex-1",children:[m?e.jsx(Y,{className:"w-5 h-5 text-gray-400"}):e.jsx(me,{className:"w-5 h-5 text-gray-400"}),e.jsxs("div",{className:"flex-1 min-w-0",children:[e.jsx("p",{className:"text-xs md:text-lg font-medium text-gray-900",title:d.endpoint,children:d.endpoint}),e.jsxs("p",{className:"text-sm text-gray-500",children:[d.total," test case",d.total===1?"":"s"]})]})]}),e.jsxs("div",{className:"flex items-center space-x-6 text-sm",children:[e.jsxs("div",{className:"flex items-center space-x-1 text-green-600",children:[e.jsx(Q,{className:"w-4 h-4"}),e.jsx("span",{children:d.passed})]}),e.jsxs("div",{className:"flex items-center space-x-1 text-red-600",children:[e.jsx(V,{className:"w-4 h-4"}),e.jsx("span",{children:d.failed})]}),d.skipped>0&&e.jsxs("div",{className:"flex items-center space-x-1 text-yellow-600",children:[e.jsx(oe,{className:"w-4 h-4"}),e.jsx("span",{children:d.skipped})]}),e.jsxs("div",{className:"flex items-center space-x-1 text-gray-500",children:[e.jsx(D,{className:"w-4 h-4"}),e.jsxs("span",{children:[d.avgDuration,"ms avg"]})]}),e.jsxs("div",{className:`font-semibold ${g>=80?"text-green-600":g>=60?"text-yellow-600":"text-red-600"}`,children:[g,"%"]})]})]})}),m&&e.jsx("div",{className:"border-t border-gray-200 bg-white",children:e.jsx("div",{className:"p-4 space-y-6",children:Object.values(d.methods).map(p=>e.jsxs("div",{className:"space-y-3",children:[e.jsx("div",{className:"flex items-center gap-3",children:e.jsx("span",{className:`inline-flex items-center px-2 py-1 rounded text-xs font-medium border ${je(p.method)}`,children:p.method})}),e.jsx("div",{className:"space-y-3",children:p.testCases.map(c=>e.jsx(ye,{testCase:c},c.id))})]},p.method))})})]},d.key)})}),e.jsx("div",{className:"space-y-4 block md:hidden",children:n.map(d=>{const m=i.has(d.key),g=l(d.passed,d.total);return e.jsxs("div",{className:"border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden bg-white dark:bg-gray-900",children:[e.jsxs("div",{className:"p-4 cursor-pointer bg-gray-50 dark:bg-gray-800/40 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors",onClick:()=>r(d.key),children:[e.jsxs("div",{className:"flex items-start gap-3",children:[m?e.jsx(Y,{className:"w-5 h-5 text-gray-400 mt-1 flex-shrink-0"}):e.jsx(me,{className:"w-5 h-5 text-gray-400 mt-1 flex-shrink-0"}),e.jsxs("div",{className:"flex-1 min-w-0",children:[e.jsx("p",{className:"text-sm sm:text-base font-semibold text-gray-900 dark:text-white truncate",title:d.endpoint,children:d.endpoint}),e.jsxs("p",{className:"text-xs text-gray-500 mt-1",children:[d.total," test case",d.total===1?"":"s"]})]})]}),e.jsxs("div",{className:"mt-4 grid grid-cols-2 sm:grid-cols-3 md:flex md:items-center md:justify-between gap-3 text-xs sm:text-sm",children:[e.jsxs("div",{className:"flex items-center gap-1 text-green-600",children:[e.jsx(Q,{className:"w-4 h-4"}),e.jsxs("span",{children:[d.passed," Passed"]})]}),e.jsxs("div",{className:"flex items-center gap-1 text-red-600",children:[e.jsx(V,{className:"w-4 h-4"}),e.jsxs("span",{children:[d.failed," Failed"]})]}),d.skipped>0&&e.jsxs("div",{className:"flex items-center gap-1 text-yellow-600",children:[e.jsx(oe,{className:"w-4 h-4"}),e.jsxs("span",{children:[d.skipped," Skipped"]})]}),e.jsxs("div",{className:"flex items-center gap-1 text-gray-500",children:[e.jsx(D,{className:"w-4 h-4"}),e.jsxs("span",{children:[d.avgDuration,"ms avg"]})]}),e.jsxs("div",{className:`font-semibold ${g>=80?"text-green-600":g>=60?"text-yellow-600":"text-red-600"}`,children:[g,"% Success"]})]})]}),m&&e.jsx("div",{className:"border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900",children:e.jsx("div",{className:"p-4 space-y-6",children:Object.values(d.methods).map(p=>e.jsxs("div",{className:"space-y-3",children:[e.jsxs("div",{className:"flex items-center gap-3 flex-wrap",children:[e.jsx("span",{className:`inline-flex items-center px-2 py-1 rounded text-xs font-medium border ${je(p.method)}`,children:p.method}),e.jsxs("span",{className:"text-xs text-gray-500",children:[p.total," cases • ",p.avgDuration,"ms avg"]})]}),e.jsx("div",{className:"space-y-3",children:p.testCases.map(c=>e.jsx(ye,{testCase:c},c.id))})]},p.method))})})]},d.key)})})]})}):e.jsxs("div",{className:"bg-white rounded-lg border border-gray-200 p-8 text-center",children:[e.jsx(X,{className:"w-12 h-12 text-gray-400 mx-auto mb-4"}),e.jsx("p",{className:"text-gray-500",children:"No API requests found"})]})},ss=(s,t,i={})=>{const a=window.__REPORT_DATA__;if(!a){alert("Report data not available for export");return}const x=js(a,s,{codeTheme:i.codeTheme??"dark"}),o=new Blob([x],{type:"text/html"}),n=URL.createObjectURL(o),r=document.createElement("a");r.href=n,r.download=t,document.body.appendChild(r),r.click(),r.remove(),URL.revokeObjectURL(n)},S=s=>String(s??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;"),ts=s=>{if(s==null)return"";if(typeof s=="object")try{return JSON.stringify(s,null,2)}catch{return String(s)}try{return JSON.stringify(JSON.parse(String(s)),null,2)}catch{return String(s)}},as=s=>`${((s??0)/1e3).toFixed(2)}s`,rs=s=>{if(!s)return"0 B";const t=1024,i=["B","KB","MB","GB"],a=Math.floor(Math.log(s)/Math.log(t));return`${parseFloat((s/Math.pow(t,a)).toFixed(2))} ${i[a]}`},Fe=s=>{const t={GET:"bg-blue-100 text-blue-800 border-blue-200",POST:"bg-green-100 text-green-800 border-green-200",PUT:"bg-yellow-100 text-yellow-800 border-yellow-200",DELETE:"bg-red-100 text-red-800 border-red-200",PATCH:"bg-purple-100 text-purple-800 border-purple-200",OPTIONS:"bg-gray-100 text-gray-800 border-gray-200"};return t[(s||"").toUpperCase()]||t.OPTIONS},is=s=>({passed:"bg-green-100 text-green-800 border-green-200",failed:"bg-red-100 text-red-800 border-red-200",skipped:"bg-yellow-100 text-yellow-800 border-yellow-200"})[s]||"bg-gray-100 text-gray-800 border-gray-200",ns=s=>({critical:"bg-red-600 text-white",high:"bg-orange-600 text-white",medium:"bg-yellow-600 text-white",low:"bg-blue-600 text-white"})[s]||"bg-gray-600 text-white",ze=s=>{try{const t=new URL(s),i=`${t.protocol}//${t.host.toLowerCase()}`,a=t.pathname.replace(/\/$/,"");return`${i}${a}${t.search}`}catch{return(s||"").trim().replace(/\/$/,"")}},ls=s=>{if(s==null)return null;if(typeof s=="object")return(s==null?void 0:s.statusCode)!=null?String(s.statusCode):null;try{const t=JSON.parse(s);return(t==null?void 0:t.statusCode)!=null?String(t.statusCode):null}catch{return null}},os=s=>{var x;const t=((x=s.expectedResponse)==null?void 0:x.status)!=null?String(s.expectedResponse.status):null,i=ls(s.response);if(s.status!=="failed")return{message:"",expected:t,actual:i};const a=(s.errorMessage??"").trim();return a?{message:a,expected:t,actual:i}:t!==null&&i!==null?{message:`Expected status ${t}, but got ${i}`,expected:t,actual:i}:{message:"N/A",expected:null,actual:null}},ds=s=>{const{message:t,expected:i,actual:a}=os(s);if(!(t||i!==null&&a!==null))return"";const o=s.status==="failed",n=s.status==="passed",r=o?"border:1px solid #fecaca;background:#fef2f2;border-radius:8px;margin-bottom:16px;overflow:hidden;":n?"border:1px solid #bbf7d0;background:#f0fdf4;border-radius:8px;margin-bottom:16px;overflow:hidden;":"border:1px solid #fde68a;background:#fefce8;border-radius:8px;margin-bottom:16px;overflow:hidden;",l=o?"#fecaca":n?"#bbf7d0":"#fde68a",d=o?"❌":n?"✅":"⚠️",m=o?"FAILURE REASON":n?"STATUS CHECK":"TEST SUMMARY",g=o?"#991b1b":n?"#166534":"#92400e",p=o?"#991b1b":n?"#166534":"#92400e",E=i!==null&&a!==null?`<div style="display:flex;flex-wrap:wrap;align-items:center;gap:10px;font-size:13px;font-weight:500;">
          <div style="display:flex;align-items:center;gap:6px;">
            <span style="width:8px;height:8px;border-radius:50%;background:#22c55e;display:inline-block;flex-shrink:0;"></span>
            <span style="color:#6b7280;">Expected</span>
            <span style="display:inline-flex;align-items:center;padding:2px 10px;border-radius:4px;font-size:13px;font-weight:700;background:#dcfce7;color:#166534;border:1px solid #bbf7d0;">${i}</span>
          </div>
          <span style="color:#9ca3af;font-size:16px;">→</span>
          <div style="display:flex;align-items:center;gap:6px;">
            <span style="width:8px;height:8px;border-radius:50%;background:${o?"#ef4444":"#22c55e"};display:inline-block;flex-shrink:0;"></span>
            <span style="color:#6b7280;">Actual</span>
            <span style="${o?"display:inline-flex;align-items:center;padding:2px 10px;border-radius:4px;font-size:13px;font-weight:700;background:#fef2f2;color:#991b1b;border:1px solid #fecaca;":"display:inline-flex;align-items:center;padding:2px 10px;border-radius:4px;font-size:13px;font-weight:700;background:#dcfce7;color:#166534;border:1px solid #bbf7d0;"}">${a}</span>
          </div>
        </div>`:"",h=t?`<p style="font-size:14px;font-weight:500;color:${p};margin:0 0 ${E?"12px":"0"} 0;word-break:break-word;">${S(t)}</p>`:"";return`
  <div style="${r}">
    <div style="padding:10px 16px;border-bottom:1px solid ${l};display:flex;align-items:center;gap:8px;">
      <span style="font-size:14px;">${d}</span>
      <span style="font-size:11px;font-weight:700;letter-spacing:0.08em;color:${g};">${m}</span>
    </div>
    <div style="padding:12px 16px;">
      ${h}
      ${E}
    </div>
  </div>`},cs=s=>{var x,o,n,r,l,d,m;const t=[...((x=s.positiveTests)==null?void 0:x.apis)??[],...((o=s.negativeTests)==null?void 0:o.apis)??[],...((n=s.functionalTests)==null?void 0:n.apis)??[],...((r=s.semanticTests)==null?void 0:r.apis)??[],...((l=s.edgeCaseTests)==null?void 0:l.apis)??[],...((d=s.securityTests)==null?void 0:d.apis)??[],...((m=s.advancedSecurityTests)==null?void 0:m.apis)??[]];if(t.length)return t;const i=["positiveTests","negativeTests","functionalTests","semanticTests","edgeCaseTests","securityTests","advancedSecurityTests"],a=[];for(const g of s.requests??[])for(const p of i){const c=g[p];for(const u of(c==null?void 0:c.testCases)??[])a.push({...u,method:u.method||g.method,url:u.url||g.url})}return a},xs=s=>{const t={};for(const i of s){const a=ze(i.url||"");t[a]||(t[a]={key:a,endpoint:i.url,methods:{},total:0,passed:0,failed:0,skipped:0,avgDuration:0});const x=t[a],o=(i.method||"").toUpperCase();x.methods[o]||(x.methods[o]={method:o,testCases:[],total:0,passed:0,failed:0,skipped:0,avgDuration:0});const n=x.methods[o];n.testCases.push(i),n.total++,i.status==="passed"?n.passed++:i.status==="failed"?n.failed++:i.status==="skipped"&&n.skipped++,x.total++,i.status==="passed"?x.passed++:i.status==="failed"?x.failed++:i.status==="skipped"&&x.skipped++}return Object.values(t).forEach(i=>{Object.values(i.methods).forEach(x=>{const o=x.testCases.reduce((n,r)=>n+(r.duration||0),0);x.avgDuration=x.total?Math.round(o/x.total):0});const a=Object.values(i.methods).flatMap(x=>x.testCases).reduce((x,o)=>x+(o.duration||0),0);i.avgDuration=i.total?Math.round(a/i.total):0}),Object.values(t)},ms=(s,t)=>t?Math.round(s/t*100):0,ps=s=>{const t=s.length,i=new Set(s.map(u=>ze(u.url))).size,a=s.map(u=>Number(u.duration||0)).filter(u=>Number.isFinite(u)),x=a.length?Math.min(...a):0,o=a.length?Math.max(...a):0,n=a.length?Math.round(a.reduce((u,b)=>u+b,0)/a.length):0,r=s.reduce((u,b)=>u+Number(b.responseSize||0),0),l={};s.forEach(u=>{const b=(u.method||"").toUpperCase();l[b]=(l[b]||0)+1});const d={};s.forEach(u=>{if(u.statusCode!=null){const b=String(u.statusCode);d[b]=(d[b]||0)+1}});const m={};s.forEach(u=>{if(u.status==="failed"){const b=u.category||"Failed";m[b]=(m[b]||0)+1}});const p=[...s].sort((u,b)=>(b.duration||0)-(u.duration||0)).slice(0,5).map(u=>({id:u.id,name:u.name,method:u.method,url:u.url,duration:u.duration||0})),c=[...s].sort((u,b)=>(u.duration||0)-(b.duration||0)).slice(0,5).map(u=>({id:u.id,name:u.name,method:u.method,url:u.url,duration:u.duration||0}));return{totalRequests:t,uniqueEndpoints:i,averageResponseTime:n,minResponseTime:x,maxResponseTime:o,totalDataTransferred:r,requestsByMethod:l,statusCodeDistribution:d,errorTypes:m,slowestRequests:p,fastestRequests:c}},us=s=>{const t=Object.entries(s.requestsByMethod).map(([r,l])=>`
    <div class="flex items-center justify-between">
      <span class="inline-flex items-center px-2 py-1 rounded text-xs font-medium ${Fe(r)}">${r}</span>
      <div class="flex items-center space-x-2">
        <div class="w-20 bg-gray-200 rounded-full h-2">
          <div class="bg-blue-600 h-2 rounded-full" style="width:${l/Math.max(s.totalRequests,1)*100}%"></div>
        </div>
        <span class="text-sm font-semibold text-gray-900 w-8">${l}</span>
      </div>
    </div>`).join(""),i=Object.entries(s.statusCodeDistribution).map(([r,l])=>`
    <div class="flex items-center justify-between">
      <span class="inline-flex items-center px-2 py-1 rounded text-xs font-medium ${parseInt(r,10)>=500?"bg-red-100 text-red-800":parseInt(r,10)>=400?"bg-yellow-100 text-yellow-800":parseInt(r,10)>=300?"bg-blue-100 text-blue-800":"bg-green-100 text-green-800"}">${r}</span>
      <div class="flex items-center space-x-2">
        <div class="w-20 bg-gray-200 rounded-full h-2">
          <div class="bg-blue-600 h-2 rounded-full" style="width:${l/Math.max(s.totalRequests,1)*100}%"></div>
        </div>
        <span class="text-sm font-semibold text-gray-900 w-8">${l}</span>
      </div>
    </div>`).join(""),a=Object.values(s.errorTypes).reduce((r,l)=>r+l,0),x=Object.keys(s.errorTypes).length>0?`
      <div class="bg-white rounded-lg shadow-md p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <i data-lucide="alert-triangle" class="w-5 h-5 mr-2 text-red-600"></i>
          Error Types
        </h3>
        <div class="space-y-3">
          ${Object.entries(s.errorTypes).map(([r,l])=>`
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-700 truncate flex-1 mr-2">${S(r)}</span>
              <div class="flex items-center space-x-2">
                <div class="w-16 bg-gray-200 rounded-full h-2">
                  <div class="bg-red-600 h-2 rounded-full" style="width:${l/Math.max(a,1)*100}%"></div>
                </div>
                <span class="text-sm font-semibold text-gray-900 w-6">${l}</span>
              </div>
            </div>`).join("")}
        </div>
      </div>`:"",o=s.slowestRequests.map((r,l)=>`
    <div class="flex items-center justify-between p-3 bg-red-50 rounded-lg">
      <div class="flex-1 min-w-0">
        <p class="text-sm font-medium text-gray-900 truncate">${S(r.name)}</p>
        <p class="text-xs text-gray-500 truncate">${S(r.method)} ${S(r.url)}</p>
      </div>
      <div class="text-right">
        <p class="text-sm font-semibold text-red-600">${r.duration}ms</p>
        <p class="text-xs text-gray-500">#${l+1}</p>
      </div>
    </div>`).join(""),n=s.fastestRequests.map((r,l)=>`
    <div class="flex items-center justify-between p-3 bg-green-50 rounded-lg">
      <div class="flex-1 min-w-0">
        <p class="text-sm font-medium text-gray-900 truncate">${S(r.name)}</p>
        <p class="text-xs text-gray-500 truncate">${S(r.method)} ${S(r.url)}</p>
      </div>
      <div class="text-right">
        <p class="text-sm font-semibold text-green-600">${r.duration}ms</p>
        <p class="text-xs text-gray-500">#${l+1}</p>
      </div>
    </div>`).join("");return`
  <div class="space-y-4 mt-3 mb-3">
    <div class="bg-white rounded-lg shadow-md p-6">
      <h2 class="text-xl font-bold text-gray-900 mb-6 flex items-center">
        <i data-lucide="activity" class="w-6 h-6 mr-2 text-blue-600"></i>
        Request-Level Metrics
      </h2>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div class="text-center">
          <div class="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mx-auto mb-2">
            <i data-lucide="globe" class="w-6 h-6 text-blue-600"></i>
          </div>
          <p class="text-2xl font-bold text-gray-900">${s.totalRequests}</p>
          <p class="text-sm text-gray-500">Total Requests</p>
        </div>
        <div class="text-center">
          <div class="flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mx-auto mb-2">
            <i data-lucide="database" class="w-6 h-6 text-green-600"></i>
          </div>
          <p class="text-2xl font-bold text-gray-900">${s.uniqueEndpoints}</p>
          <p class="text-sm text-gray-500">Unique Endpoints</p>
        </div>
        <div class="text-center">
          <div class="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mx-auto mb-2">
            <i data-lucide="clock" class="w-6 h-6 text-purple-600"></i>
          </div>
          <p class="text-2xl font-bold text-gray-900">${s.averageResponseTime}ms</p>
          <p class="text-sm text-gray-500">Avg Response Time</p>
        </div>
        <div class="text-center">
          <div class="flex items-center justify-center w-12 h-12 bg-orange-100 rounded-full mx-auto mb-2">
            <i data-lucide="trending-up" class="w-6 h-6 text-orange-600"></i>
          </div>
          <p class="text-2xl font-bold text-gray-900">${rs(s.totalDataTransferred)}</p>
          <p class="text-sm text-gray-500">Data Transferred</p>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="bg-white rounded-lg shadow-md p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Response Time Range</h3>
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-2">
              <i data-lucide="trending-down" class="w-4 h-4 text-green-600"></i>
              <span class="text-sm text-gray-600">Fastest</span>
            </div>
            <span class="font-semibold text-green-600">${s.minResponseTime}ms</span>
          </div>
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-2">
              <i data-lucide="clock" class="w-4 h-4 text-blue-600"></i>
              <span class="text-sm text-gray-600">Average</span>
            </div>
            <span class="font-semibold text-blue-600">${s.averageResponseTime}ms</span>
          </div>
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-2">
              <i data-lucide="trending-up" class="w-4 h-4 text-red-600"></i>
              <span class="text-sm text-gray-600">Slowest</span>
            </div>
            <span class="font-semibold text-red-600">${s.maxResponseTime}ms</span>
          </div>
        </div>
      </div>
      <div class="bg-white rounded-lg shadow-md p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">HTTP Methods</h3>
        <div class="space-y-3">${t}</div>
      </div>
    </div>

${i?`
<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
  <div class="bg-white rounded-lg shadow-md p-6">
    <h3 ...>Status Code Distribution</h3>
    <div class="space-y-3">${i}</div>
  </div>
  ${x}
</div>`:x?`
<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
  ${x}
</div>`:""}

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="bg-white rounded-lg shadow-md p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <i data-lucide="trending-up" class="w-5 h-5 mr-2 text-red-600"></i>
          Slowest Requests
        </h3>
        <div class="space-y-3">${o}</div>
      </div>
      <div class="bg-white rounded-lg shadow-md p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <i data-lucide="trending-down" class="w-5 h-5 mr-2 text-green-600"></i>
          Fastest Requests
        </h3>
        <div class="space-y-3">${n}</div>
      </div>
    </div>
  </div>`},gs=(s,t)=>`
  <div class="border border-gray-200 bg-white rounded-lg px-6 py-3 mt-3">
    <div class="flex justify-between items-start mb-6">
      <div>
        <h1 class="text-3xl font-bold text-gray-900 mb-2">${S(s.name)}</h1>
        <p class="text-gray-600">${S(s.description)}</p>
      </div>
      <div>${t?`<img src="${S(t)}" alt="Optraflow logo" style="width:100%;height:50px" />`:""}</div>
    </div>
    <div class="grid grid-cols-2 md:grid-cols-4 gap-6 mb-3">
      <div class="flex items-center space-x-3">
        <i data-lucide="calendar" class="w-5 h-5 text-blue-500"></i>
        <div><p class="text-sm text-gray-500">Execution Date</p><p class="font-semibold">
          ${(()=>{const{dateTime:i,tz:a}=G(Date.parse(s.lastExecutionDate));return`${i}, ${a}`})()}</p></div>
      </div>
      <div class="flex items-center space-x-3">
        <i data-lucide="clock" class="w-5 h-5 text-green-500"></i>
        <div><p class="text-sm text-gray-500">Duration</p><p class="font-semibold">${as(s==null?void 0:s.duration)}</p></div>
      </div>
      <div class="flex items-center space-x-3">
        <i data-lucide="user" class="w-5 h-5 text-purple-500"></i>
        <div><p class="text-sm text-gray-500">Executed By</p><p class="font-semibold text-xs">${S(s==null?void 0:s.executedBy)}</p></div>
      </div>
      <div class="flex items-center space-x-3">
        <i data-lucide="database" class="w-5 h-5 text-orange-500"></i>
        <div><p class="text-sm text-gray-500">Environment</p><p class="font-semibold text-xs">${S(s==null?void 0:s.environment)}</p></div>
      </div>
    </div>
  </div>
`,hs=(s,t)=>{const i=t.length||Number(s.totalTestCases||0),a=(t.length?t.filter(r=>r.status==="passed").length:0)||Number(s.successfulTestCases||0),x=(t.length?t.filter(r=>r.status==="failed").length:0)||Number(s.failedTestCases||0),o=i?Math.round(a/i*100):s.successRate||0,n=o>=80?"text-green-600 bg-green-100":o>=60?"text-yellow-600 bg-yellow-100":"text-red-600 bg-red-100";return`
  <div class="grid grid-cols-2 md:grid-cols-4 gap-6 mb-3 mt-3">
    ${Z("Success Rate",`${o}%`,"trending-up",n)}
    ${Z("Total Test Cases",`${i}`,"clock","text-blue-600 bg-blue-100")}
    ${Z("Passed",`${a}`,"check-circle","text-green-600 bg-green-100")}
    ${Z("Failed",`${x}`,"x-circle","text-red-600 bg-red-100")}
  </div>`},Z=(s,t,i,a)=>`
  <div class="border border-gray-200 bg-white rounded-lg px-6 py-6">
    <div class="flex items-center justify-between">
      <div><p class="text-sm text-gray-500 mb-1">${s}</p><p class="text-2xl font-bold text-gray-900">${t}</p></div>
      <div class="p-3 rounded-full ${a}"><i data-lucide="${i}" class="w-6 h-6"></i></div>
    </div>
  </div>
`,ie=(s,t)=>`
  <div class="rounded border border-gray-700 bg-gray-800 overflow-hidden">
    <pre class="m-0 p-4 overflow-x-auto scrollbar-thin"><code class="language-${s}">${S(t)}</code></pre>
  </div>
`,fs=s=>{const t=is(s.status),i=ns(s.severity),a=`tc-${s.id}`;return`
  <div class="border border-gray-200 rounded-lg mb-4 overflow-hidden">

    <!-- ── Collapsed header ── -->
    <div class="p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors" data-toggle="${a}">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-4">
          <i data-lucide="chevron-right" class="w-5 h-5 text-gray-400 toggle-icon" data-for="${a}"></i>
          <div>
            <h3 class="font-semibold text-gray-900">${S(s.name)}</h3>
            <div class="flex items-center space-x-2 mt-1">
              <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${t}">${String(s.status).toUpperCase()}</span>
              <span class="inline-flex items-center px-2 py-1 rounded text-xs font-medium ${i}">${String(s.severity).toUpperCase()}</span>
            </div>
          </div>
        </div>
        <div class="flex items-center space-x-6 text-sm text-gray-500">
          <div class="flex items-center space-x-1"><i data-lucide="clock" class="w-4 h-4"></i><span>${s.duration}ms</span></div>
          <div class="flex items-center space-x-1"><i data-lucide="alert-circle" class="w-4 h-4"></i><span>${s.responseSize}B</span></div>
        </div>
      </div>
    </div>

    <!-- ── Expanded body ── -->
    <div id="${a}" class="p-4 border-t border-gray-200 bg-white hidden">
      <div class="space-y-4">

        <!-- ① Status Summary — shown first for ALL statuses (passed, failed, skipped) -->
        ${ds(s)}

        <!-- ② Endpoint -->
        <div>
          <h4 class="font-medium text-gray-900 mb-2">Endpoint</h4>
          ${ie("http",`${(s.method||"").toUpperCase()} ${s.url}`)}
        </div>

        <!-- ③ Request cURL -->
        <div>
          <h4 class="font-medium text-gray-900 mb-2">Request cURL</h4>
          ${ie("bash",s.requestCurl)}
        </div>

        <!-- ④ Response -->
        <div>
          <h4 class="font-medium text-gray-900 mb-2">Response</h4>
          ${ie("json",ts(s.response))}
        </div>

      </div>
    </div>
  </div>`},bs=s=>{const t=ms(s.passed,s.total),i=t>=80?"text-green-600":t>=60?"text-yellow-600":"text-red-600",a=`url-${ys(s.key)}`,x=Object.values(s.methods).map(o=>`
    <div class="space-y-3">
      <div class="flex items-center gap-3">
        <span class="inline-flex items-center px-2 py-1 rounded text-xs font-medium border ${Fe(o.method)}">${o.method}</span>
      </div>
      <div class="space-y-3">
        ${o.testCases.map(n=>fs(n)).join("")}
      </div>
    </div>`).join("");return`
  <div class="border border-gray-200 rounded-lg overflow-hidden">
    <div class="p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors" data-toggle="${a}">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-4 flex-1">
          <i data-lucide="chevron-up" class="w-5 h-5 text-gray-400 toggle-icon" data-for="${a}"></i>
          <div class="flex-1 min-w-0">
            <p class="font-medium text-gray-900 truncate" title="${S(s.endpoint)}">${S(s.endpoint)}</p>
            <p class="text-sm text-gray-500">${s.total} test case${s.total===1?"":"s"}</p>
          </div>
        </div>
        <div class="flex items-center space-x-6 text-sm">
          <div class="flex items-center space-x-1 text-green-600"><i data-lucide="check-circle" class="w-4 h-4"></i><span>${s.passed}</span></div>
          <div class="flex items-center space-x-1 text-red-600"><i data-lucide="x-circle" class="w-4 h-4"></i><span>${s.failed}</span></div>
          ${s.skipped?`<div class="flex items-center space-x-1 text-yellow-600"><i data-lucide="alert-triangle" class="w-4 h-4"></i><span>${s.skipped}</span></div>`:""}
          <div class="flex items-center space-x-1 text-gray-500"><i data-lucide="clock" class="w-4 h-4"></i><span>${s.avgDuration}ms avg</span></div>
          <div class="font-semibold ${i}">${t}%</div>
        </div>
      </div>
    </div>
    <div id="${a}" class="border-t border-gray-200 bg-white hidden"><div class="p-4 space-y-6">${x}</div></div>
  </div>`},vs=s=>{const t=xs(s);return t.length?`
    <div class="space-y-4">
      <div class="bg-white rounded-lg shadow-md p-6">
        <h2 class="text-xl font-bold text-gray-900 mb-4 flex items-center">
          <i data-lucide="globe" class="w-6 h-6 mr-2 text-blue-600"></i>
          API Endpoints (${t.length} endpoints)
        </h2>
        <div class="space-y-4">${t.map(i=>bs(i)).join("")}</div>
      </div>
    </div>`:'<div class="bg-white rounded-lg shadow-md p-8 text-center"><i data-lucide="globe" class="w-12 h-12 text-gray-400 mx-auto mb-4"></i><p class="text-gray-500">No API requests found</p></div>'},ys=s=>{let t=0;for(let i=0;i<s.length;i++)t=(t<<5)-t+s.charCodeAt(i)|0;return`h${Math.abs(t)}`},js=(s,t,i)=>{let a=null;const x=document.getElementById(t)||document.body,o=x==null?void 0:x.querySelector('img[alt="Optraflow logo"]');o!=null&&o.src&&(a=o.src);const n=cs(s),r=ps(n),l=i.codeTheme==="dark"?"https://unpkg.com/prismjs@1/themes/prism-okaidia.css":"https://unpkg.com/prismjs@1/themes/prism.css";return`<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${S(s.name)} – Report</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <script src="https://cdn.tailwindcss.com"><\/script>
  <link rel="stylesheet" href="${l}">
  <script src="https://unpkg.com/prismjs@1/components/prism-core.min.js"><\/script>
  <script src="https://unpkg.com/prismjs@1/plugins/autoloader/prism-autoloader.min.js"><\/script>
  <script src="https://unpkg.com/lucide@latest"><\/script>
  <style>
    .code-surface { background:#1f2937; color:#e5e7eb; border-color:#374151; }
    pre { white-space: pre-wrap; word-break: break-word;  margin: 0;}
  </style>
</head>
<body class="mx-auto p-1 sm:p-1 bg-[#FAFAFA]">
  <header class="border border-gray-200 bg-white rounded-lg px-6 py-4">
    <div class="flex items-center justify-between">
      <div><h2 class="text-2xl font-semibold text-gray-900">Test Suite Report</h2></div>
      
    </div>
  </header>

  <div class="max-w-7xl mx-auto">
    ${gs(s,a)}
    ${hs(s,n)}
    ${us(r)}
    ${vs(n)}
  </div>

  <script>
    document.addEventListener('click', function(e){
      var t = e.target;
      while (t && t !== document) {
        var id = t.getAttribute && t.getAttribute('data-toggle');
        if (id) {
          var c = document.getElementById(id);
          if (c) {
            var hidden = c.classList.contains('hidden');
            c.classList.toggle('hidden');
            document.querySelectorAll('.toggle-icon[data-for="'+id+'"]').forEach(function(i){
              i.setAttribute('data-lucide', hidden ? 'chevron-down' : 'chevron-up');
            });
            if (window.lucide) window.lucide.createIcons();
          }
          break;
        }
        t = t.parentNode;
      }
    });

    document.addEventListener('DOMContentLoaded', function(){
      if (window.lucide) window.lucide.createIcons();
      if (window.Prism) window.Prism.highlightAll();
    });
  <\/script>
</body>
</html>`},ws=({metrics:s})=>{const t=r=>{if(!r)return"0 B";const l=1024,d=["B","KB","MB","GB"],m=Math.min(Math.floor(Math.log(r)/Math.log(l)),d.length-1);return`${parseFloat((r/Math.pow(l,m)).toFixed(2))} ${d[m]}`},i=r=>`${Number(r??0).toFixed(0)}ms`,a=r=>{switch((r||"").toUpperCase()){case"GET":return"bg-blue-100 text-blue-800";case"POST":return"bg-green-100 text-green-800";case"PUT":return"bg-yellow-100 text-yellow-800";case"DELETE":return"bg-red-100 text-red-800";case"PATCH":return"bg-purple-100 text-purple-800";default:return"bg-gray-100 text-gray-800"}},x=r=>{const l=parseInt(r,10);return l>=200&&l<300?"bg-green-100 text-green-800":l>=300&&l<400?"bg-blue-100 text-blue-800":l>=400&&l<500?"bg-yellow-100 text-yellow-800":l>=500?"bg-red-100 text-red-800":"bg-gray-100 text-gray-800"},o=Math.max(s.totalRequests||0,1),n=Math.max(Object.values(s.errorTypes||{}).reduce((r,l)=>r+l,0),1);return e.jsxs("div",{className:"space-y-4 mb-4",children:[e.jsxs("div",{className:"bg-background rounded-lg border border-gray-200 p-3 md:p-6",children:[e.jsx("h2",{className:"text-md md:text-xl font-bold text-gray-900 mb-4 flex items-center",children:"Request-Level Metrics"}),e.jsxs("div",{className:"grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6",children:[e.jsxs("div",{className:"text-center",children:[e.jsx("div",{className:"flex items-center justify-center w-8 h-8 md:w-12 md:h-12 bg-blue-100 rounded-full mx-auto mb-2",children:e.jsx(X,{className:"w-4 h-4 md:w-6 md:h-6 text-blue-600"})}),e.jsx("p",{className:"text-base md:text-2xl font-bold text-gray-900",children:s.totalRequests}),e.jsx("p",{className:"text-xs md:text-sm text-gray-500",children:"Total Requests"})]}),e.jsxs("div",{className:"text-center",children:[e.jsx("div",{className:"flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mx-auto mb-2",children:e.jsx(W,{className:"w-6 h-6 text-green-600"})}),e.jsx("p",{className:"text-md md:text-2xl font-bold text-gray-900",children:s.uniqueEndpoints}),e.jsx("p",{className:"text-xs md:text-sm text-gray-500",children:"Unique Endpoints"})]}),e.jsxs("div",{className:"text-center",children:[e.jsx("div",{className:"flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mx-auto mb-2",children:e.jsx(D,{className:"w-6 h-6 text-purple-600"})}),e.jsx("p",{className:"text-md md:text-2xl font-bold text-gray-900",children:i(s.averageResponseTime)}),e.jsx("p",{className:"text-xs md:text-sm text-gray-500",children:"Avg Response Time"})]}),e.jsxs("div",{className:"text-center",children:[e.jsx("div",{className:"flex items-center justify-center w-12 h-12 bg-orange-100 rounded-full mx-auto mb-2",children:e.jsx(H,{className:"w-6 h-6 text-orange-600"})}),e.jsx("p",{className:"text-md md:text-2xl font-bold text-gray-900",children:t(s.totalDataTransferred)}),e.jsx("p",{className:"text-xs md:text-sm text-gray-500",children:"Data Transferred"})]})]})]}),e.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6",children:[e.jsxs("div",{className:"bg-white rounded-lg border border-gray-200 p-3 md:p-6",children:[e.jsx("h3",{className:"text-base md:text-xl font-semibold text-gray-900 mb-4",children:"Response Time Range"}),e.jsxs("div",{className:"space-y-4",children:[e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsxs("div",{className:"flex items-center space-x-2",children:[e.jsx(pe,{className:"w-4 h-4 text-green-600"}),e.jsx("span",{className:"text-sm text-gray-600",children:"Fastest"})]}),e.jsx("span",{className:"font-semibold text-green-600",children:i(s.minResponseTime)})]}),e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsxs("div",{className:"flex items-center space-x-2",children:[e.jsx(D,{className:"w-4 h-4 text-blue-600"}),e.jsx("span",{className:"text-sm text-gray-600",children:"Average"})]}),e.jsx("span",{className:"font-semibold text-blue-600",children:i(s.averageResponseTime)})]}),e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsxs("div",{className:"flex items-center space-x-2",children:[e.jsx(H,{className:"w-4 h-4 text-red-600"}),e.jsx("span",{className:"text-sm text-gray-600",children:"Slowest"})]}),e.jsx("span",{className:"font-semibold text-red-600",children:i(s.maxResponseTime)})]})]})]}),e.jsxs("div",{className:"bg-background rounded-lg border border-gray-200 p-3 md:p-6",children:[e.jsx("h3",{className:"text-base md:text-xl font-semibold text-gray-900 mb-4",children:"HTTP Methods"}),e.jsx("div",{className:"space-y-3",children:Object.entries(s.requestsByMethod||{}).map(([r,l])=>e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsx("span",{className:`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${a(r)}`,children:r}),e.jsxs("div",{className:"flex items-center space-x-2",children:[e.jsx("div",{className:"w-16 md:w-24 bg-gray-200 rounded-full h-2",children:e.jsx("div",{className:"bg-blue-600 h-2 rounded-full",style:{width:`${l/o*100}%`}})}),e.jsx("span",{className:"text-sm font-semibold text-gray-900 w-8",children:l})]})]},r))})]})]}),e.jsxs("div",{className:"grid grid-cols-1 lg:grid-cols-2 gap-6",children:[e.jsxs("div",{className:"bg-background rounded-lg border border-gray-200 p-3 md:p-6",children:[e.jsx("h3",{className:"text-md md:text-xl font-semibold text-gray-900 mb-4",children:"Status Code Distribution"}),e.jsx("div",{className:"space-y-3",children:Object.entries(s.statusCodeDistribution||{}).map(([r,l])=>e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsx("span",{className:`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${x(r)}`,children:r}),e.jsxs("div",{className:"flex items-center space-x-2",children:[e.jsx("div",{className:"w-16 md:w-24 bg-gray-200 rounded-full h-2",children:e.jsx("div",{className:"bg-blue-600 h-2 rounded-full",style:{width:`${l/o*100}%`}})}),e.jsx("span",{className:"text-sm font-semibold text-gray-900 w-8",children:l})]})]},r))})]}),Object.keys(s.errorTypes||{}).length>0&&e.jsxs("div",{className:"bg-background rounded-lg border border-gray-200 p-3 md:p-6",children:[e.jsxs("h3",{className:"text-md md:text-xl font-semibold text-gray-900 mb-4 flex items-center",children:[e.jsx(oe,{className:"w-5 h-5 mr-2 text-red-600"}),"Error Types"]}),e.jsx("div",{className:"space-y-3",children:Object.entries(s.errorTypes||{}).map(([r,l])=>e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsx("span",{className:"text-sm text-gray-700 truncate flex-1 mr-2 min-w-0",children:r}),e.jsxs("div",{className:"flex items-center space-x-2",children:[e.jsx("div",{className:"w-16 bg-gray-200 rounded-full h-2",children:e.jsx("div",{className:"bg-red-600 h-2 rounded-full",style:{width:`${l/n*100}%`}})}),e.jsx("span",{className:"text-sm font-semibold text-gray-900 w-6",children:l})]})]},r))})]})]}),e.jsxs("div",{className:"grid grid-cols-1 lg:grid-cols-2 gap-6 ",children:[e.jsxs("div",{className:"bg-background rounded-lg border border-gray-200 p-3 md:p-6",children:[e.jsxs("h3",{className:"text-md md:text-xl font-semibold text-gray-900 mb-4 flex items-center",children:[e.jsx(H,{className:"w-5 h-5 mr-2 text-red-600"}),"Slowest Requests"]}),e.jsx("div",{className:"space-y-3",children:s.slowestRequests.slice(0,1).map((r,l)=>e.jsxs("div",{className:"flex items-center justify-between p-3 bg-red-50 rounded-lg",children:[e.jsxs("div",{className:"flex-1 min-w-0",children:[e.jsx("p",{className:"text-sm font-medium text-gray-900 truncate",children:r.name}),e.jsxs("p",{className:"text-xs text-gray-500 truncate",children:[r.method," ",r.url]})]}),e.jsxs("div",{className:"text-right",children:[e.jsx("p",{className:"text-sm font-semibold text-red-600",children:i(r.duration)}),e.jsxs("p",{className:"text-xs text-gray-500",children:["#",l+1]})]})]},r.id))})]}),e.jsxs("div",{className:"bg-background rounded-lg border border-gray-200 p-3 md:p-6",children:[e.jsxs("h3",{className:"text-md md:text-xl font-semibold text-gray-900 mb-4 flex items-center",children:[e.jsx(pe,{className:"w-5 h-5 mr-2 text-green-600"}),"Fastest Requests"]}),e.jsx("div",{className:"space-y-3",children:s.fastestRequests.slice(0,1).map((r,l)=>e.jsxs("div",{className:"flex items-center justify-between p-3 bg-green-50 rounded-lg",children:[e.jsxs("div",{className:"flex-1 min-w-0",children:[e.jsx("p",{className:"text-sm font-medium text-gray-900 truncate",children:r.name}),e.jsxs("p",{className:"text-xs text-gray-500 truncate",children:[r.method," ",r.url]})]}),e.jsxs("div",{className:"text-right",children:[e.jsx("p",{className:"text-sm font-semibold text-green-600",children:i(r.duration)}),e.jsxs("p",{className:"text-xs text-gray-500",children:["#",l+1]})]})]},r.id))})]})]})]})};function Ns(s){var $,E;const t=[];for(const h of s.requests??[]){const y=[h.positiveTests,h.negativeTests,h.functionalTests,h.semanticTests,h.edgeCaseTests,h.securityTests,h.advancedSecurityTests].filter(Boolean);for(const C of y)for(const N of C.testCases??[])N.method||(N.method=h.method),N.url||(N.url=h.url),t.push(N)}const i=h=>{if(h)try{return JSON.parse(h)}catch{return}};let a=0,x=0,o=Number.POSITIVE_INFINITY,n=0;const r={},l={},d={},m=[];for(const h of t){const y=i(h.response),C=y==null?void 0:y.statusCode,N=C!=null?String(C):"";N&&(l[N]=(l[N]||0)+1);const v=(h.method||"OTHER").toUpperCase();r[v]=(r[v]||0)+1;const F=(($=y==null?void 0:y.metrics)==null?void 0:$.bytesReceived)??h.responseSize??0;a+=F;const M=((E=y==null?void 0:y.metrics)==null?void 0:E.responseTime)??h.duration??0;if(x+=M,M>0&&(M<o&&(o=M),M>n&&(n=M)),h.status&&h.status.toLowerCase()!=="passed"){const P=`Failed (${N||"unknown"})`;d[P]=(d[P]||0)+1}m.push({id:h.id,name:h.name,method:v,url:h.url||"",duration:M,statusCode:C})}const g=t.length,p=g?x/g:0,c=[...m].sort((h,y)=>h.duration-y.duration),u=[...m].sort((h,y)=>y.duration-h.duration),b=new Set((s.requests??[]).map(h=>h.url)).size;return{totalRequests:g,uniqueEndpoints:b,averageResponseTime:p,minResponseTime:Number.isFinite(o)?o:0,maxResponseTime:n,totalDataTransferred:a,requestsByMethod:r,statusCodeDistribution:l,errorTypes:d,slowestRequests:u.slice(0,10),fastestRequests:c.slice(0,10)}}function ks({reportData:s}){const{toast:t}=ee(),i=l=>{const d=document.createElement("div");return d.textContent=l,d.innerHTML},a=()=>{if(s.requestExecutions.length===0)return 0;const l=s.requestExecutions.reduce((d,m)=>d+m.duration,0);return Math.round(l/s.requestExecutions.length)},x=()=>s.requestExecutions.reduce((l,d)=>l+d.responseSize,0),o=l=>{if(l===0)return"0 B";const d=1024,m=["B","KB","MB","GB"],g=Math.floor(Math.log(l)/Math.log(d));return`${parseFloat((l/Math.pow(d,g)).toFixed(2))} ${m[g]}`},n=()=>{const l=a(),d=x(),m=i,p=(()=>{const c=document.querySelector('img[alt="Optraflow logo"]');if(!(c!=null&&c.src))return"";if(c.src.startsWith("data:"))return c.src;try{const u=document.createElement("canvas");u.width=c.naturalWidth||c.width,u.height=c.naturalHeight||c.height;const b=u.getContext("2d");return b==null||b.drawImage(c,0,0),u.toDataURL("image/png")}catch{return""}})();return`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${m(s.name)} - API Test Report</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <script src="https://unpkg.com/lucide@latest"><\/script>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #ffffff;
      color: #0f172a;
      line-height: 1.6;
    }
    
    .container {
      max-width: 1280px;
      margin: 0 auto;
      padding: 0 24px;
    }
    
  .header-section {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 20px;
}
.header-title {
  font-size: 26px;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 4px;
}
.header-description {
  font-size: 14px;
  color: #64748b;
  margin-bottom: 20px;
}
.header-meta {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
  border-top: 1px solid #f1f5f9;
  padding-top: 16px;
}
.meta-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}
.meta-icon {
  font-size: 18px;
  margin-top: 2px;
  flex-shrink: 0;
}
.meta-label {
  font-size: 12px;
  color: #64748b;
  margin-bottom: 2px;
}
.meta-value {
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
}
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}
.metric-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 16px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.metric-label {
  font-size: 13px;
  color: #64748b;
  margin-bottom: 4px;
  font-weight: 400;
}
.metric-value {
  font-size: 24px;
  font-weight: 700;
  color: #0f172a;
}
.metric-unit {
  font-size: 13px;
  color: #64748b;
  margin-left: 2px;
}
.metric-icon {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
}
@media (max-width: 640px) {
  .header-meta { grid-template-columns: 1fr 1fr; }
  .metrics-grid { grid-template-columns: 1fr 1fr; }
  .header-title { font-size: 20px; }
  .request-header { flex-wrap: wrap; }
  .request-name { min-width: 0; word-break: break-word; }
  .request-stats { flex-wrap: wrap; gap: 8px; }
  .logo-wrap img { height: 28px; }
  .metric-card { padding: 12px 14px; }
  .metric-value { font-size: 20px; }
  .section { padding: 16px; }
  .container { padding: 0 12px; }
}
   
   
    .section {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 24px;
      margin-bottom: 24px;
    }
    
    .section-title {
      font-size: 20px;
      font-weight: 700;
      margin-bottom: 20px;
      color: #0f172a;
    }
    
    .request-item {
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 16px;
    }
    
    .request-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
    }

.meta-icon-wrap {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  margin-top: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.meta-icon-wrap i { display: block; width: 18px; height: 18px; }
.meta-icon-wrap svg { width: 18px; height: 18px; }
.metric-icon i { display: block; width: 22px; height: 22px; }
.metric-icon svg { width: 22px; height: 22px; }

.logo-wrap {
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
}
.logo-wrap img {
  height: 40px;
  width: auto;
  object-fit: contain;
}
    
    .request-order {
      background: #f1f5f9;
      color: #475569;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 14px;
    }
    
    .request-name {
      font-size: 16px;
      font-weight: 600;
      color: #0f172a;
      flex: 1;
    }
    
    .method-badge {
      padding: 4px 12px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      font-family: 'JetBrains Mono', monospace;
    }
    
    .method-get { background: #dbeafe; color: #1e40af; }
    .method-post { background: #dcfce7; color: #15803d; }
    .method-put { background: #fef3c7; color: #a16207; }
    .method-delete { background: #fee2e2; color: #b91c1c; }
    .method-patch { background: #f3e8ff; color: #6b21a8; }
    
    .status-badge {
      padding: 4px 12px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
    }
    
    .status-passed { background: #dcfce7; color: #15803d; }
    .status-failed { background: #fee2e2; color: #b91c1c; }
    .status-skipped { background: #fef3c7; color: #a16207; }
    
    .request-url {
      font-family: 'JetBrains Mono', monospace;
      font-size: 13px;
      color: #475569;
      margin-bottom: 12px;
      word-break: break-all;
    }
    
    .request-stats {
      display: flex;
      gap: 24px;
      font-size: 13px;
      color: #64748b;
    }
    
    .code-block {
      background: #1e293b;
      color: #e2e8f0;
      padding: 16px;
      border-radius: 6px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 12px;
      overflow-x: auto;
      margin-top: 12px;
    }
    
    .code-block pre {
      margin: 0;
      white-space: pre-wrap;
      word-break: break-all;
    }
    
    .variable-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 16px;
    }
    
    .variable-table th {
      background: #f8fafc;
      padding: 12px 16px;
      text-align: left;
      font-size: 13px;
      font-weight: 600;
      color: #475569;
      border-bottom: 2px solid #e2e8f0;
    }
    
    .variable-table td {
      padding: 12px 16px;
      border-bottom: 1px solid #e2e8f0;
      font-size: 13px;
    }
    
    .variable-table tr:last-child td {
      border-bottom: none;
    }
    
    .variable-name {
      font-family: 'JetBrains Mono', monospace;
      color: #0f172a;
      font-weight: 500;
    }
    
    .variable-value {
      font-family: 'JetBrains Mono', monospace;
      color: #475569;
      word-break: break-all;
    }
    
    .type-badge {
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
    }
    
    .type-dynamic { background: #dbeafe; color: #1e40af; }
    .type-static { background: #f1f5f9; color: #475569; }
    .type-environment { background: #fef3c7; color: #a16207; }
    .type-extracted { background: #dcfce7; color: #15803d; }
    
    .footer {
      text-align: center;
      padding: 32px 0;
      color: #64748b;
      font-size: 14px;
      border-top: 1px solid #e2e8f0;
      margin-top: 32px;
    }
    
    @media print {
      .header-section {
        background: #667eea !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
    }
  </style>
</head>
<body>



<div class="container">
  <div class="header-section">
    <div style="display:flex; align-items:flex-start; justify-content:space-between; gap:16px; margin-bottom:4px;">
      <h1 class="header-title">${m(s.name)}</h1>
      <div class="logo-wrap">
      ${p?`<img src="${m(p)}" alt="Optraflow logo" style="height:40px; width:auto;" />`:""}
      </div>
    </div>
    <p class="header-description">Request chain execution report</p>
    <div class="header-meta">
      <div class="meta-item">
        <span class="meta-icon-wrap" style="color:#3b82f6;">
          <i data-lucide="calendar"></i>
        </span>
        <div>
          <div class="meta-label">Execution Date</div>
          <div class="meta-value">${(()=>{const{dateTime:c,tz:u}=G(Date.parse(s.lastExecutionDate));return`${c}, ${u}`})()}</div>
        </div>
      </div>
      <div class="meta-item">
        <span class="meta-icon-wrap" style="color:#10b981;">
          <i data-lucide="clock"></i>
        </span>
        <div>
          <div class="meta-label">Duration</div>
          <div class="meta-value">${s.duration}ms</div>
        </div>
      </div>
      <div class="meta-item">
        <span class="meta-icon-wrap" style="color:#8b5cf6;">
          <i data-lucide="user"></i>
        </span>
        <div>
          <div class="meta-label">Executed By</div>
          <div class="meta-value">${m(s.executedBy)}</div>
        </div>
      </div>
      <div class="meta-item">
        <span class="meta-icon-wrap" style="color:#f59e0b;">
          <i data-lucide="database"></i>
        </span>
        <div>
          <div class="meta-label">Environment</div>
          <div class="meta-value">${m(s.environment)}</div>
        </div>
      </div>
    </div>
  </div>
</div>

<div class="container">
  <div class="metrics-grid">
    <div class="metric-card">
      <div>
        <div class="metric-label">Success Rate</div>
        <div class="metric-value">${s.successRate}<span class="metric-unit">%</span></div>
      </div>
      <div class="metric-icon" style="background:#fce7f3; color:#e11d48;">
        <i data-lucide="trending-up"></i>
      </div>
    </div>
    <div class="metric-card">
      <div>
        <div class="metric-label">Total Requests</div>
        <div class="metric-value">${s.totalRequests}</div>
      </div>
      <div class="metric-icon" style="background:#dbeafe; color:#2563eb;">
        <i data-lucide="clock"></i>
      </div>
    </div>
    <div class="metric-card">
      <div>
        <div class="metric-label">Successful</div>
        <div class="metric-value" style="color:#10b981">${s.successfulRequests}</div>
      </div>
      <div class="metric-icon" style="background:#dcfce7; color:#16a34a;">
        <i data-lucide="check-circle"></i>
      </div>
    </div>
    <div class="metric-card">
      <div>
        <div class="metric-label">Failed</div>
        <div class="metric-value" style="color:#ef4444">${s.failedRequests}</div>
      </div>
      <div class="metric-icon" style="background:#fee2e2; color:#dc2626;">
        <i data-lucide="x-circle"></i>
      </div>
    </div>
    <div class="metric-card">
      <div>
        <div class="metric-label">Skipped</div>
        <div class="metric-value" style="color:#f59e0b">${s.skippedRequests}</div>
      </div>
      <div class="metric-icon" style="background:#fef3c7; color:#d97706;">
        <i data-lucide="alert-triangle"></i>
      </div>
    </div>
    <div class="metric-card">
      <div>
        <div class="metric-label">Avg Response Time</div>
        <div class="metric-value">${l}<span class="metric-unit">ms</span></div>
      </div>
      <div class="metric-icon" style="background:#f3e8ff; color:#7c3aed;">
        <i data-lucide="clock"></i>
      </div>
    </div>
    <div class="metric-card">
      <div>
        <div class="metric-label">Data Transferred</div>
        <div class="metric-value" style="font-size:18px">${o(d)}</div>
      </div>
      <div class="metric-icon" style="background:#fef3c7; color:#d97706;">
        <i data-lucide="database"></i>
      </div>
    </div>
  </div>
</div>

    <div class="container">
    <div class="section">
      <h2 class="section-title">Request Execution Timeline</h2>
      ${s==null?void 0:s.requestExecutions.map(c=>`
        <div class="request-item">
          <div class="request-header">
            <div class="request-order">${c==null?void 0:c.order}</div>
            <div class="request-name">${m(c==null?void 0:c.name)}</div>
            <span class="method-badge method-${m(c==null?void 0:c.method.toLowerCase())}">${m(c.method)}</span>
            <span class="status-badge status-${m(c==null?void 0:c.status.toLowerCase())}">${m(c.status)}</span>
          </div>
          <div class="request-url">${m(c.url)}</div>
          <div class="request-stats">
            <span><strong>Status Code:</strong> ${c==null?void 0:c.responseStatusCode}</span>
            <span><strong>Duration:</strong> ${c==null?void 0:c.duration}ms</span>
            <span><strong>Size:</strong> ${m(o(c==null?void 0:c.responseSize))}</span>
          </div>
          
          
          
          <div style="margin-top: 16px;">
            <strong style="font-size: 14px; color: #475569;">Request cURL</strong>
            <div class="code-block"><pre>${m(c.requestCurl)}</pre></div>
          </div>
          
          <div style="margin-top: 16px;">
            <strong style="font-size: 14px; color: #475569;">Response</strong>
            <div class="code-block"><pre>${m(c.response)}</pre></div>
          </div>
        </div>
      `).join("")}
    </div>
 </div>

    <div class="footer">
      Generated on ${new Date().toLocaleDateString()} • OptraFlow API Testing Platform
    </div>
 
  <script>
  if (window.lucide) window.lucide.createIcons();
  document.addEventListener('DOMContentLoaded', function() {
    if (window.lucide) window.lucide.createIcons();
  });
<\/script>
</body>
</html>`},r=()=>{try{const l=n(),d=new Blob([l],{type:"text/html;charset=utf-8"}),m=URL.createObjectURL(d),g=document.createElement("a"),p=`${s.name.replace(/\s+/g,"_")}_Report_${new Date().getTime()}.html`;g.href=m,g.download=p,g.setAttribute("data-testid","download-link-html"),document.body.appendChild(g),g.click(),setTimeout(()=>{document.body.removeChild(g),URL.revokeObjectURL(m),t({title:"HTML Report Ready",description:"Your report has been downloaded successfully."})},100)}catch(l){console.error("HTML export error:",l),t({title:"Export Failed",description:"There was an error generating the HTML report.",variant:"destructive"})}};return e.jsx(se,{children:e.jsxs(I,{children:[e.jsx(U,{asChild:!0,children:e.jsx("button",{onClick:r,"data-testid":"export-html-button",className:"p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors group",children:e.jsx(Te,{className:"w-5 h-5"})})}),e.jsx(A,{children:"Download HTML Report"})]})})}function Ts({reportData:s}){const{toast:t}=ee(),i=()=>{try{const a=new ke,x=a.internal.pageSize.getWidth(),o=a.internal.pageSize.getHeight(),n=20;let r=n;a.setFontSize(20),a.setFont("helvetica","bold"),a.text(s.name,n,r),r+=8,a.setFontSize(10),a.setFont("helvetica","normal"),a.setTextColor(100,100,100),a.text("API Request Chain Execution Report",n,r),r+=15,a.setDrawColor(200,200,200),a.line(n,r,x-n,r),r+=10,a.setFontSize(12),a.setFont("helvetica","bold"),a.setTextColor(0,0,0),a.text("Execution Summary",n,r),r+=8,a.setFontSize(10),a.setFont("helvetica","normal"),[`Execution Date:  ${(()=>{const{dateTime:h,tz:y}=G(Date.parse(s.lastExecutionDate));return`${h}, ${y}`})()}`,`Duration: ${s.duration<1e3?`${s.duration}ms`:`${(s.duration/1e3).toFixed(2)}s`}`,`Executed By: ${s.executedBy}`,`Environment: ${s.environment}`].forEach(h=>{a.text(h,n+5,r),r+=6}),r+=5,a.setDrawColor(200,200,200),a.line(n,r,x-n,r),r+=10,a.setFontSize(12),a.setFont("helvetica","bold"),a.text("Performance Metrics",n,r),r+=8;const d=s.requestExecutions.length>0?Math.round(s.requestExecutions.reduce((h,y)=>h+y.duration,0)/s.requestExecutions.length):0,m=s.requestExecutions.reduce((h,y)=>h+y.responseSize,0),g=h=>h<1024?`${h} B`:h<1024*1024?`${(h/1024).toFixed(2)} KB`:`${(h/(1024*1024)).toFixed(2)} MB`;a.setFontSize(10),a.setFont("helvetica","normal");const p=n+5,c=x/2,u=(x-2*n-10)/2;a.setFillColor(240,240,240),a.rect(p-5,r-5,u,50,"F"),a.rect(c,r-5,u,50,"F"),a.setTextColor(0,0,0),a.setFont("helvetica","bold"),a.text("Total Requests",p,r),a.text("Success Rate",c+5,r),r+=7,a.setFontSize(18),a.setTextColor(33,150,243),a.text(s.totalRequests.toString(),p,r);const b=s.successRate===100?[76,175,80]:s.successRate>=80?[255,152,0]:[244,67,54];a.setTextColor(b[0],b[1],b[2]),a.text(`${s.successRate}%`,c+5,r),r+=10,a.setFontSize(10),a.setTextColor(0,0,0),a.setFont("helvetica","normal"),a.text(`Passed: ${s.successfulRequests}`,p,r),a.text(`Avg Response: ${d}ms`,c+5,r),r+=6,a.text(`Failed: ${s.failedRequests}`,p,r),a.text(`Data Transfer: ${g(m)}`,c+5,r),r+=6,a.text(`Skipped: ${s.skippedRequests}`,p,r),r+=15,a.setDrawColor(200,200,200),a.line(n,r,x-n,r),r+=10,a.setFontSize(12),a.setFont("helvetica","bold"),a.setTextColor(0,0,0),a.text("Request Execution Details",n,r),r+=8,a.setFontSize(9),a.setFont("helvetica","bold"),a.text("#",n,r),a.text("Request Name",n+10,r),a.text("Status",n+90,r),a.text("Duration",n+120,r),a.text("Status Code",n+155,r),r+=5,a.setFont("helvetica","normal"),[...s.requestExecutions].sort((h,y)=>h.order-y.order).forEach((h,y)=>{r>o-30&&(a.addPage(),r=n);const C=h.status==="passed"?[76,175,80]:h.status==="failed"?[244,67,54]:[158,158,158];a.setTextColor(0,0,0),a.text(h.order.toString(),n,r);const N=h.name.length>35?h.name.substring(0,32)+"...":h.name;a.text(N,n+10,r),a.setTextColor(C[0],C[1],C[2]),a.text(h.status.toUpperCase(),n+90,r),a.setTextColor(0,0,0),a.text(`${h.duration}ms`,n+120,r),a.text(h.responseStatusCode.toString(),n+155,r),r+=6}),r+=10,r>o-30&&(a.addPage(),r=n),a.setDrawColor(200,200,200),a.line(n,r,x-n,r),r+=5,a.setFontSize(8),a.setTextColor(150,150,150),a.text(`Generated on ${Ue(new Date,"MM/dd/yyyy 'at' h:mm a")} • OptraFlow API Testing Platform`,n,r);const E=`${s.name.replace(/[^a-z0-9]/gi,"_")}_Summary_${Date.now()}.pdf`;a.save(E),t({title:"PDF Summary Ready",description:`${E} has been downloaded.`})}catch(a){console.error("PDF export error:",a),t({title:"Export Failed",description:"There was an error generating the PDF. Please try again.",variant:"destructive"})}};return e.jsx(se,{children:e.jsxs(I,{children:[e.jsx(U,{asChild:!0,children:e.jsx("button",{onClick:i,"data-testid":"export-html-button",className:"p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors group",children:e.jsx($e,{className:"w-5 h-5"})})}),e.jsx(A,{children:"Download PDF Summary"})]})})}const $s=({metrics:s})=>{const t=d=>{const m=Number(d??0);return m<1e3?`${m.toFixed(0)}ms`:`${(m/1e3).toFixed(2)}s`},i=s.reduce((d,m)=>d+(m.total||0),0),a=s.reduce((d,m)=>d+(m.success||0),0);s.reduce((d,m)=>d+(m.failed||0),0);const x=i>0?Math.round(s.reduce((d,m)=>d+(m.avgDurationMs||0)*(m.total||0),0)/i):0,o=s.length>0?Math.max(...s.map(d=>d.p95DurationMs||0)):0,n=i>0?a/i*100:0,r=`${n.toFixed(1)}%`,l=n>=80?"bg-green-100 text-green-700":n>=60?"bg-yellow-100 text-yellow-700":"bg-red-100 text-red-700";return!s||s.length===0?e.jsxs("div",{className:"bg-white rounded-lg border border-gray-200 p-6 mb-3",children:[e.jsxs("h2",{className:"text-xl font-bold text-gray-900 mb-2 flex items-center",children:[e.jsx(ue,{className:"w-6 h-6 mr-2 text-blue-600"}),"Request-Level Metrics"]}),e.jsx("p",{className:"text-gray-500 text-sm",children:"No metrics available."})]}):e.jsx("div",{className:"space-y-3 mb-3",children:e.jsxs("div",{className:"bg-white rounded-lg border border-gray-200 p-6",children:[e.jsxs("h2",{className:"text-xl font-bold text-gray-900 mb-6 flex items-center",children:[e.jsx(ue,{className:"w-6 h-6 mr-2 text-blue-600"}),"Request-Level Metrics"]}),e.jsxs("div",{className:"grid grid-cols-2 md:grid-cols-4 gap-6",children:[e.jsxs("div",{className:"text-center",children:[e.jsx("div",{className:"flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mx-auto mb-2",children:e.jsx(X,{className:"w-6 h-6 text-blue-600"})}),e.jsx("p",{className:"text-2xl font-bold text-gray-900",children:i}),e.jsx("p",{className:"text-sm text-gray-500",children:"Total Requests"})]}),e.jsxs("div",{className:"text-center",children:[e.jsx("div",{className:`flex items-center justify-center w-12 h-12 rounded-full mx-auto mb-2 ${l}`,children:e.jsx(H,{className:"w-6 h-6"})}),e.jsx("p",{className:"text-2xl font-bold text-gray-900",children:r}),e.jsxs("p",{className:"text-sm text-gray-500",children:["Success (",a," / ",i,")"]})]}),e.jsxs("div",{className:"text-center",children:[e.jsx("div",{className:"flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mx-auto mb-2",children:e.jsx(D,{className:"w-6 h-6 text-purple-600"})}),e.jsx("p",{className:"text-2xl font-bold text-gray-900",children:t(x)}),e.jsx("p",{className:"text-sm text-gray-500",children:"Avg Response Time"})]}),e.jsxs("div",{className:"text-center",children:[e.jsx("div",{className:"flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mx-auto mb-2",children:e.jsx(W,{className:"w-6 h-6 text-green-600"})}),e.jsx("p",{className:"text-2xl font-bold text-gray-900",children:t(o)}),e.jsx("p",{className:"text-sm text-gray-500",children:"p95 Response Time"})]})]})]})})},L=()=>({total:0,passed:0,failed:0,skipped:0,apis:[]}),B=(s,t)=>{t&&(s.total+=t.total??0,s.passed+=t.passed??0,s.failed+=t.failed??0,s.skipped+=t.skipped??0,Array.isArray(t.testCases)&&t.testCases.forEach(i=>{const a={id:i.id,name:i.name,method:i.method,url:i.url,status:i.status,severity:i.severity,duration:i.duration,responseSize:i.responseSize,requestCurl:i.requestCurl,response:i.response};s.apis.push(a)}))},Cs=s=>{const t=L(),i=L(),a=L(),x=L(),o=L(),n=L(),r=L();let l=0,d=0,m=0,g=0;(s.requests??[]).forEach(v=>{l+=v.totalTestCases??0,d+=v.successfulTestCases??0,m+=v.failedTestCases??0,g+=v.skippedTestCases??0,B(t,v.positiveTests),B(i,v.negativeTests),B(a,v.functionalTests),B(x,v.semanticTests),B(o,v.edgeCaseTests),B(n,v.securityTests),B(r,v.advancedSecurityTests)});const p=[...t.apis,...i.apis,...a.apis,...x.apis,...o.apis,...n.apis,...r.apis],c=p.map(v=>v.duration??0),u=p.map(v=>v.responseSize??0),b=c.length?Math.min(...c):0,$=c.length?Math.max(...c):0,E=c.length?c.reduce((v,F)=>v+F,0)/c.length:0,h=u.reduce((v,F)=>v+F,0),y=new Set(p.map(v=>`${v.method} ${v.url}`)).size,C=l>0?Math.round(d/l*100):0;return{id:s.id,name:s.name,description:s.description??"",environment:s.environment??s.environmentId??"Unknown",lastExecutionDate:s.lastExecutionDate,duration:s.duration??0,executedBy:s.executedBy??"Unknown",successRate:C,totalTestCases:l,successfulTestCases:d,failedTestCases:m,skippedTestCases:g,requestMetrics:{minResponseTime:b,maxResponseTime:$,averageResponseTime:E,totalRequests:p.length,totalDataTransferred:h,uniqueEndpoints:y},positiveTests:t,negativeTests:i,functionalTests:a,semanticTests:x,edgeCaseTests:o,securityTests:n,advancedSecurityTests:r}},Rs=s=>{var n,r,l,d,m,g;const t=p=>new Date(p).toLocaleDateString("en-US",{year:"numeric",month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"}),i=p=>`${(p/1e3).toFixed(1)}s`,a=p=>{if(p===0)return"0 B";const c=1024,u=["B","KB","MB"],b=Math.floor(Math.log(p)/Math.log(c));return parseFloat((p/Math.pow(c,b)).toFixed(1))+" "+u[b]},x=[{title:"Positive Tests",category:s.positiveTests},{title:"Negative Tests",category:s.negativeTests},{title:"Functional Tests",category:s.functionalTests},{title:"Semantic Tests",category:s.semanticTests},{title:"Edge Case Tests",category:s.edgeCaseTests},{title:"Security Tests",category:s.securityTests},{title:"Advanced Security Tests",category:s.advancedSecurityTests}],o=Ms(x);return`
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; background: white;">
      <!-- Header -->
      <div style="border-bottom: 2px solid #e5e7eb; padding-bottom: 20px; margin-bottom: 30px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <h1 style="font-size: 24px; font-weight: 700; color: #111827; margin: 0 0 8px 0;">${s.name}</h1>
            <p style="color: #6b7280; margin: 0; font-size: 14px;">${s.description}</p>
          </div>
          <div style="text-align: right;">
            <h2 style="font-size: 18px; font-weight: 600; color: #2563eb; margin: 0;">Optraflow</h2>
            <p style="font-size: 12px; color: #6b7280; margin: 0;">API Testing Report</p>
          </div>
        </div>
        
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-top: 20px;">
          <div style="text-align: center;">
            <div style="font-size: 20px; font-weight: 700; color: ${s.successRate>=80?"#059669":s.successRate>=60?"#d97706":"#dc2626"};">${s.successRate}%</div>
            <div style="font-size: 12px; color: #6b7280;">Success Rate</div>
          </div>
          <div style="text-align: center;">
            <div style="font-size: 20px; font-weight: 700; color: #111827;">${s.totalTestCases}</div>
            <div style="font-size: 12px; color: #6b7280;">Total Tests</div>
          </div>
          <div style="text-align: center;">
            <div style="font-size: 20px; font-weight: 700; color: #111827;">${i(s.duration)}</div>
            <div style="font-size: 12px; color: #6b7280;">Duration</div>
          </div>
          <div style="text-align: center;">
            <div style="font-size: 20px; font-weight: 700; color: #111827;">${Object.keys(o).length}</div>
            <div style="font-size: 12px; color: #6b7280;">API Endpoints</div>
          </div>
        </div>
      </div>

      <!-- Test Results Summary -->
      <div style="margin-bottom: 30px;">
        <h2 style="font-size: 18px; font-weight: 600; color: #111827; margin: 0 0 15px 0;">Test Results Summary</h2>
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px;">
          <div style="text-align: center; padding: 15px; background: #f0fdf4; border-radius: 8px;">
            <div style="font-size: 24px; font-weight: 700; color: #059669;">${s.successfulTestCases}</div>
            <div style="font-size: 12px; color: #059669; font-weight: 500;">PASSED</div>
          </div>
          <div style="text-align: center; padding: 15px; background: #fef2f2; border-radius: 8px;">
            <div style="font-size: 24px; font-weight: 700; color: #dc2626;">${s.failedTestCases}</div>
            <div style="font-size: 12px; color: #dc2626; font-weight: 500;">FAILED</div>
          </div>
          <div style="text-align: center; padding: 15px; background: #fefce8; border-radius: 8px;">
            <div style="font-size: 24px; font-weight: 700; color: #d97706;">${s.skippedTestCases}</div>
            <div style="font-size: 12px; color: #d97706; font-weight: 500;">SKIPPED</div>
          </div>
        </div>
      </div>

      <!-- API Endpoints Summary -->
      <div style="margin-bottom: 30px;">
        <h2 style="font-size: 18px; font-weight: 600; color: #111827; margin: 0 0 15px 0;">API Endpoints Summary</h2>
        <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
          <thead>
            <tr style="background: #f9fafb; border-bottom: 1px solid #e5e7eb;">
              <th style="text-align: left; padding: 8px; font-weight: 600; color: #374151;">Endpoint</th>
              <th style="text-align: center; padding: 8px; font-weight: 600; color: #374151;">Method</th>
              <th style="text-align: center; padding: 8px; font-weight: 600; color: #374151;">Tests</th>
              <th style="text-align: center; padding: 8px; font-weight: 600; color: #374151;">Success</th>
              <th style="text-align: center; padding: 8px; font-weight: 600; color: #374151;">Avg Time</th>
            </tr>
          </thead>
          <tbody>
            ${Object.entries(o).slice(0,15).map(([p,c],u)=>{const b=Math.round(c.passedTests/c.totalTests*100);return`
                <tr style="background: ${u%2===0?"#ffffff":"#f9fafb"}; border-bottom: 1px solid #f3f4f6;">
                  <td style="padding: 8px; color: #374151; max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${c.endpoint}</td>
                  <td style="text-align: center; padding: 8px;">
                    <span style="background: ${Ss(c.method)}; color: white; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 500;">${c.method}</span>
                  </td>
                  <td style="text-align: center; padding: 8px; color: #374151;">${c.totalTests}</td>
                  <td style="text-align: center; padding: 8px; color: ${b>=80?"#059669":b>=60?"#d97706":"#dc2626"}; font-weight: 600;">${b}%</td>
                  <td style="text-align: center; padding: 8px; color: #374151;">${c.avgDuration}ms</td>
                </tr>
              `}).join("")}
          </tbody>
        </table>
        ${Object.keys(o).length>15?`
          <p style="font-size: 11px; color: #6b7280; margin: 8px 0 0 0; text-align: center;">
            Showing top 15 endpoints. Full report available in HTML export.
          </p>
        `:""}
      </div>

      <!-- Performance Metrics -->
      <div style="margin-bottom: 30px;">
        <h2 style="font-size: 18px; font-weight: 600; color: #111827; margin: 0 0 15px 0;">Performance Metrics</h2>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
          <div>
            <h3 style="font-size: 14px; font-weight: 600; color: #374151; margin: 0 0 10px 0;">Response Times</h3>
            <table style="width: 100%; font-size: 12px;">
              <tr><td style="padding: 4px 0; color: #059669;">Fastest:</td><td style="text-align: right; font-weight: 600;">${(n=s==null?void 0:s.requestMetrics)==null?void 0:n.minResponseTime}ms</td></tr>
              <tr><td style="padding: 4px 0; color: #2563eb;">Average:</td><td style="text-align: right; font-weight: 600;">${Math.round((r=s==null?void 0:s.requestMetrics)==null?void 0:r.averageResponseTime)}ms</td></tr>
              <tr><td style="padding: 4px 0; color: #dc2626;">Slowest:</td><td style="text-align: right; font-weight: 600;">${(l=s==null?void 0:s.requestMetrics)==null?void 0:l.maxResponseTime}ms</td></tr>
            </table>
          </div>
          <div>
            <h3 style="font-size: 14px; font-weight: 600; color: #374151; margin: 0 0 10px 0;">Data Transfer</h3>
            <table style="width: 100%; font-size: 12px;">
              <tr><td style="padding: 4px 0;">Total Requests:</td><td style="text-align: right; font-weight: 600;">${(d=s==null?void 0:s.requestMetrics)==null?void 0:d.totalRequests}</td></tr>
              <tr><td style="padding: 4px 0;">Data Transferred:</td><td style="text-align: right; font-weight: 600;">${a((m=s==null?void 0:s.requestMetrics)==null?void 0:m.totalDataTransferred)}</td></tr>
              <tr><td style="padding: 4px 0;">Unique Endpoints:</td><td style="text-align: right; font-weight: 600;">${(g=s==null?void 0:s.requestMetrics)==null?void 0:g.uniqueEndpoints}</td></tr>
            </table>
          </div>
        </div>
      </div>

      <!-- Test Categories -->
      <div style="margin-bottom: 30px;">
        <h2 style="font-size: 18px; font-weight: 600; color: #111827; margin: 0 0 15px 0;">Test Categories</h2>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;">
          ${x.filter(p=>{var c;return((c=p==null?void 0:p.category)==null?void 0:c.total)>0}).map(({title:p,category:c})=>{const u=Math.round(c.passed/c.total*100);return`
              <div style="padding: 12px; border: 1px solid #e5e7eb; border-radius: 6px; background: #fafafa;">
                <div style="font-size: 13px; font-weight: 600; color: #374151; margin-bottom: 4px;">${p}</div>
                <div style="font-size: 11px; color: #6b7280;">
                  ${c.total} tests • ${u}% success
                </div>
                <div style="display: flex; gap: 8px; margin-top: 4px; font-size: 10px;">
                  <span style="color: #059669;">✓ ${c.passed}</span>
                  <span style="color: #dc2626;">✗ ${c.failed}</span>
                  ${c.skipped>0?`<span style="color: #d97706;">⚠ ${c.skipped}</span>`:""}
                </div>
              </div>
            `}).join("")}
        </div>
      </div>

      <!-- Footer -->
      <div style="border-top: 1px solid #e5e7eb; padding-top: 15px; text-align: center; font-size: 11px; color: #6b7280;">
        <p style="margin: 0;">Generated by Optraflow • ${t(s.lastExecutionDate)}</p>
        <p style="margin: 4px 0 0 0;">For detailed test cases and responses, download the full HTML report</p>
      </div>
    </div>
  `},Ss=s=>({GET:"#2563eb",POST:"#059669",PUT:"#d97706",DELETE:"#dc2626",PATCH:"#7c3aed",OPTIONS:"#6b7280"})[s]||"#6b7280",Es=async(s,t)=>{if(!document.getElementById(s))return;const a=window.__REPORT_DATA__;if(!a){alert("Report data not available for export");return}const x=document.createElement("div");x.style.position="absolute",x.style.left="-9999px",x.style.top="0",x.style.width="800px",x.style.backgroundColor="white",x.innerHTML=Rs(a),document.body.appendChild(x);try{const o=await Oe(x,{allowTaint:!0,useCORS:!0,backgroundColor:"#ffffff",scale:1,logging:!1,width:800,height:x.scrollHeight}),n=o.toDataURL("image/png"),r=new ke({orientation:"portrait",unit:"mm",format:"a4",compress:!0}),l=210,d=295,m=o.height*l/o.width;let g=m,p=0;for(r.addImage(n,"PNG",0,p,l,m),g-=d;g>=0;)p=g-m,r.addPage(),r.addImage(n,"PNG",0,p,l,m),g-=d;r.save(t)}catch(o){console.error("Error generating PDF:",o),alert("Failed to generate PDF. Please try again.")}finally{document.body.removeChild(x)}},Ms=s=>{const t={};return s==null||s.forEach(({title:i,category:a})=>{if(!a)return;(a.apis??a.testCases??[]).forEach(o=>{const n=`${o.method} ${o.url}`;t[n]||(t[n]={endpoint:o.url,method:o.method,testCases:[],totalTests:0,passedTests:0,failedTests:0,skippedTests:0,avgDuration:0}),t[n].testCases.push({...o,category:i}),t[n].totalTests++,o.status==="passed"?t[n].passedTests++:o.status==="failed"?t[n].failedTests++:o.status==="skipped"&&t[n].skippedTests++})}),Object.values(t).forEach(i=>{const a=i.testCases.reduce((x,o)=>x+(o.duration??0),0);i.avgDuration=i.testCases.length?Math.round(a/i.testCases.length):0}),t},De=({openJiraModal:s,setOpenJiraModal:t,testSuiteData:i})=>{const[a,x]=w.useState(""),[o,n]=w.useState(""),[r,l]=w.useState("Bug"),[d,m]=w.useState(!1),[g,p]=w.useState(null),[c,u]=w.useState(null),[b,$]=w.useState(!1),E=typeof window<"u"?window.location.href:"";w.useEffect(()=>(s?document.body.style.overflow="hidden":document.body.style.overflow="unset",()=>{document.body.style.overflow="unset"}),[s]),w.useEffect(()=>{const j=R=>{R.key==="Escape"&&s&&!d&&f()};return document.addEventListener("keydown",j),()=>document.removeEventListener("keydown",j)},[s,d]);const h=j=>{try{const R=new Date(j);return isNaN(R.getTime())?"Invalid Date":R.toLocaleString("en-US",{year:"numeric",month:"short",day:"numeric",hour:"2-digit",minute:"2-digit",timeZone:"UTC",timeZoneName:"short"})}catch{return"Invalid Date"}},y=()=>{const{name:j,lastExecutionDate:R,environment:k}=i;return`Name: ${j},
Executed date: ${h(R)},
Environment: ${k||"N/A"},
Execution url: ${E}

Additional Description :
${o.trim()}

To access the report:
Click the above mentioned report link
If you have access by providing the valid credentials you will be able to access the report.`},[C,N]=w.useState(!1),[v,F]=w.useState([]),{currentWorkspace:M}=te(),P=M==null?void 0:M.id,ae=async()=>{try{N(!0),u(null);const R=await await de(P||"");F(R)}catch(j){console.error(j),u(j.message||"Failed to fetch integrations")}finally{N(!1)}};w.useEffect(()=>{P&&ae()},[P]);const _=v==null?void 0:v.find(j=>j.type==="jira"&&j.isActive),K=_==null?void 0:_.id,O=async j=>{if(j.preventDefault(),!a.trim()){u("Summary is required");return}m(!0),u(null);try{const R={summary:a.trim(),description:y(),issueType:r},k=await Ge(K||"",R,P||"");if(!(k!=null&&k.issueKey)||!(k!=null&&k.issueUrl))throw new Error("Invalid response from server");p(k)}catch(R){console.error("Jira API Error:",R),u(R instanceof Error?R.message:"Failed to create Jira issue. Please try again.")}finally{m(!1)}},T=async()=>{if(g!=null&&g.issueUrl)try{if(navigator.clipboard&&window.isSecureContext)await navigator.clipboard.writeText(g.issueUrl);else{const j=document.createElement("textarea");j.value=g.issueUrl,j.style.position="fixed",j.style.left="-999999px",document.body.appendChild(j),j.select(),document.execCommand("copy"),document.body.removeChild(j)}$(!0),setTimeout(()=>$(!1),2e3)}catch(j){console.error("Failed to copy:",j),u("Failed to copy URL. Please copy manually.")}},f=()=>{d||(x(""),n(""),l("Bug"),p(null),u(null),$(!1),t())},z=j=>{j.target===j.currentTarget&&!d&&f()};return s?e.jsxs("div",{className:"fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn",onClick:z,role:"dialog","aria-modal":"true","aria-labelledby":"modal-title",children:[e.jsxs("div",{className:"relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-slideUp",style:{maxHeight:"90vh"},children:[e.jsx("div",{className:"relative px-4 sm:px-6 py-4 sm:py-5",children:e.jsxs("div",{className:"flex items-center justify-between gap-4",children:[e.jsxs("div",{className:"flex-1 min-w-0",children:[e.jsx("h2",{id:"modal-title",className:"text-xl sm:text-2xl font-bold text-black tracking-tight truncate",children:g?"Issue Created Successfully":"Create Jira Issue"}),e.jsx("p",{className:"text-black text-xs sm:text-sm mt-1",children:g?"Your bug report has been submitted":"Report a bug from test suite execution"})]}),e.jsx("button",{onClick:f,disabled:d,className:"p-2 rounded-lg hover:bg-white/20 transition-all duration-200 text-white disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0","aria-label":"Close modal",type:"button",children:e.jsx(qe,{size:24,className:"text-black"})})]})}),e.jsx("div",{className:"overflow-y-auto",style:{maxHeight:"calc(90vh - 100px)"},children:g?e.jsxs("div",{className:"p-4 sm:p-6 space-y-4 sm:space-y-6",children:[e.jsxs("div",{className:"text-center py-6 sm:py-8",children:[e.jsx("div",{className:"inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 mb-4 animate-scaleIn",children:e.jsx(le,{size:40,className:"text-white"})}),e.jsx("h3",{className:"text-xl sm:text-2xl font-bold text-slate-800 mb-2",children:g.message}),e.jsx("p",{className:"text-slate-600 text-sm sm:text-base px-4",children:"Your bug report has been successfully submitted to Jira"})]}),e.jsx("div",{className:"bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-4 sm:p-6 border border-indigo-100",children:e.jsxs("div",{className:"space-y-4",children:[e.jsxs("div",{children:[e.jsx("label",{className:"text-sm font-medium text-slate-600 block mb-2",children:"Issue Key"}),e.jsxs("div",{className:"flex items-center gap-3 flex-wrap",children:[e.jsx("span",{className:"text-2xl sm:text-3xl font-bold text-indigo-600 break-all",children:g.issueKey}),e.jsx("span",{className:"px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full",children:"Created"})]})]}),e.jsxs("div",{children:[e.jsx("label",{className:"text-sm font-medium text-slate-600 block mb-2",children:"Issue URL"}),e.jsxs("div",{className:"flex flex-col sm:flex-row gap-2",children:[e.jsxs("a",{href:g.issueUrl,target:"_blank",rel:"noopener noreferrer",className:"flex-1 px-4 py-3 bg-white rounded-lg border border-indigo-200 text-indigo-600 hover:bg-indigo-50 transition-all duration-200 flex items-center justify-between group overflow-hidden min-w-0",children:[e.jsx("span",{className:"text-sm font-medium truncate mr-2",children:g.issueUrl}),e.jsx(He,{size:18,className:"flex-shrink-0 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-200"})]}),e.jsx(re,{onClick:T,size:"lg",type:"button",children:b?e.jsxs(e.Fragment,{children:[e.jsx(le,{size:18}),e.jsx("span",{children:"Copied!"})]}):e.jsxs(e.Fragment,{children:[e.jsx(_e,{size:18}),e.jsx("span",{children:"Copy URL"})]})})]})]})]})}),e.jsx("div",{className:"bg-blue-50 border border-blue-200 rounded-lg p-4",children:e.jsxs("div",{className:"flex gap-3",children:[e.jsx(J,{className:"text-blue-600 flex-shrink-0 mt-0.5",size:20}),e.jsxs("div",{className:"text-sm text-blue-800 min-w-0",children:[e.jsx("p",{className:"font-medium mb-1",children:"Share with your team"}),e.jsx("p",{className:"text-blue-700",children:"Copy the issue URL and share it with your team members. They can access the full report using their Jira credentials."})]})]})}),e.jsx("div",{className:"flex justify-end pt-2",children:e.jsx(re,{onClick:f,type:"button",children:"Close"})})]}):e.jsxs("form",{onSubmit:O,className:"p-4 sm:p-6 space-y-4 sm:space-y-6",children:[e.jsxs("div",{className:"bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-4 sm:p-5 border border-slate-200",children:[e.jsxs("h3",{className:"text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2",children:[e.jsx(J,{size:16,className:"text-indigo-600 flex-shrink-0"}),e.jsx("span",{children:"Test Suite Information (Auto-populated)"})]}),e.jsxs("div",{className:"space-y-2 text-sm",children:[e.jsxs("div",{className:"flex flex-col sm:flex-row sm:gap-2",children:[e.jsx("span",{className:"font-medium text-slate-600 sm:min-w-[140px]",children:"Suite Name:"}),e.jsx("span",{className:"text-slate-800 break-words",children:i==null?void 0:i.name})]}),e.jsxs("div",{className:"flex flex-col sm:flex-row sm:gap-2",children:[e.jsx("span",{className:"font-medium text-slate-600 sm:min-w-[140px]",children:"Executed Date:"}),e.jsx("span",{className:"text-slate-800 break-words",children:h(i==null?void 0:i.lastExecutionDate)})]}),e.jsxs("div",{className:"flex flex-col sm:flex-row sm:gap-2",children:[e.jsx("span",{className:"font-medium text-slate-600 sm:min-w-[140px]",children:"Environment:"}),e.jsx("span",{className:"text-slate-800 break-words",children:(i==null?void 0:i.environment)||"N/A"})]}),e.jsxs("div",{className:"flex flex-col sm:flex-row sm:gap-2",children:[e.jsx("span",{className:"font-medium text-slate-600 sm:min-w-[140px]",children:"Executed By:"}),e.jsx("span",{className:"text-slate-800 break-words",children:i==null?void 0:i.executedBy})]})]})]}),e.jsxs("div",{className:"space-y-2",children:[e.jsxs("label",{htmlFor:"summary",className:"block text-sm font-semibold text-slate-700",children:["Summary ",e.jsx("span",{className:"text-red-500",children:"*"})]}),e.jsx(Ke,{id:"summary",type:"text",value:a,onChange:j=>x(j.target.value),placeholder:"Brief description of the bug",required:!0,maxLength:200,disabled:d,"aria-required":"true"}),e.jsxs("p",{className:"text-xs text-slate-500",children:[a.length,"/200 characters"]})]}),e.jsxs("div",{className:"space-y-2",children:[e.jsx("label",{htmlFor:"userDescription",className:"block text-sm font-semibold text-slate-700",children:"Additional Description"}),e.jsx(Ze,{id:"userDescription",value:o,onChange:j=>n(j.target.value),placeholder:"Add any additional details about the bug (steps to reproduce, expected vs actual behavior, etc.)",rows:3,maxLength:2e3,disabled:d}),e.jsxs("p",{className:"text-xs text-slate-500",children:[o.length,"/2000 characters"]})]}),e.jsxs("div",{className:"space-y-2",children:[e.jsx("label",{htmlFor:"issueType",className:"block text-sm font-semibold text-slate-700",children:"Issue Type"}),e.jsxs("select",{id:"issueType",value:r,onChange:j=>l(j.target.value),disabled:d,className:"w-full px-4 py-3 rounded-lg border-2 border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all duration-200 text-slate-800 bg-white cursor-pointer disabled:bg-slate-100 disabled:cursor-not-allowed",children:[e.jsx("option",{value:"Bug",children:"Bug"}),e.jsx("option",{value:"Task",children:"Task"}),e.jsx("option",{value:"Story",children:"Story"}),e.jsx("option",{value:"Epic",children:"Epic"})]})]}),c&&e.jsxs("div",{className:"p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3",role:"alert",children:[e.jsx(J,{className:"text-red-600 flex-shrink-0 mt-0.5",size:20}),e.jsxs("div",{className:"flex-1 min-w-0",children:[e.jsx("p",{className:"text-sm font-medium text-red-800",children:"Error creating issue"}),e.jsx("p",{className:"text-sm text-red-600 mt-1 break-words",children:c})]})]}),e.jsx("div",{className:"flex justify-end flex-col-reverse sm:flex-row gap-3 pt-4",children:e.jsx(re,{type:"submit",disabled:d||!a.trim(),size:"lg",children:d?e.jsxs("span",{className:"flex items-center justify-center gap-2",children:[e.jsxs("svg",{className:"animate-spin h-5 w-5",viewBox:"0 0 24 24","aria-hidden":"true",children:[e.jsx("circle",{className:"opacity-25",cx:"12",cy:"12",r:"10",stroke:"currentColor",strokeWidth:"4",fill:"none"}),e.jsx("path",{className:"opacity-75",fill:"currentColor",d:"M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"})]}),"Creating..."]}):"Create Issue"})})]})})]}),e.jsx("style",{children:`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.8);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }

        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }

        .animate-scaleIn {
          animation: scaleIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `})]}):null},Fs=()=>{const s=typeof window<"u"?window.location.search:"";return ne.useMemo(()=>new URLSearchParams(s),[s])},zs=s=>{var a,x;const t=[];if(Array.isArray(s==null?void 0:s.requests)){const o=["positiveTests","negativeTests","functionalTests","semanticTests","edgeCaseTests","securityTests","advancedSecurityTests"];for(const n of s.requests)for(const r of o){const l=n==null?void 0:n[r];(a=l==null?void 0:l.testCases)!=null&&a.length&&t.push(...l.testCases)}}const i=["positiveTests","negativeTests","functionalTests","semanticTests","edgeCaseTests","securityTests","advancedSecurityTests"];for(const o of i){const n=s==null?void 0:s[o];(x=n==null?void 0:n.apis)!=null&&x.length&&t.push(...n.apis)}return t},Ds=s=>{const t=zs(s),i=t.length||Number((s==null?void 0:s.totalTestCases)||0),a=(t.length?t.filter(l=>l.status==="passed").length:0)||Number((s==null?void 0:s.successfulTestCases)||0),x=(t.length?t.filter(l=>l.status==="failed").length:0)||Number((s==null?void 0:s.failedTestCases)||0),o=(t.length?t.filter(l=>l.status==="skipped").length:0)||Number((s==null?void 0:s.skippedTestCases)||0),n=i>0?Math.round(a/i*100):Number((s==null?void 0:s.successRate)||0),r=t.length>0?Math.round(t.reduce((l,d)=>l+Number((d==null?void 0:d.duration)||0),0)/t.length):Number.isFinite(s==null?void 0:s.duration)?Number(s.duration):0;return{total:i,passed:a,failed:x,skipped:o,successRate:n,avgDuration:r}},Ps=({data:s})=>{const t=w.useMemo(()=>Ds(s),[s]),i=w.useMemo(()=>Ns(s),[s]),a=T=>`${(T/1e3).toFixed(2)}s`,x=[{title:"Success Rate",value:`${t.successRate}%`,icon:H,color:t.successRate>=80?"text-green-600 bg-green-100":t.successRate>=60?"text-yellow-600 bg-yellow-100":"text-red-600 bg-red-100"},{title:"Total Test Cases",value:t.total.toString(),icon:D,color:"text-blue-600 bg-blue-100"},{title:"Passed",value:t.passed.toString(),icon:Q,color:"text-green-600 bg-green-100"},{title:"Failed",value:t.failed.toString(),icon:V,color:"text-red-600 bg-red-100"}],n=new URLSearchParams(window.location.search).get("executionId"),{type:r,entityId:l}=we(),d=()=>{Me(l,n||"")},m=async()=>{const T=Cs(s);window.__REPORT_DATA__=T,await Es("report-content",`${T.name}_report.pdf`)},g=()=>ss("report-content",`${s.name}_report.html`),p=()=>e.jsxs("svg",{viewBox:"0 0 48 48",xmlns:"http://www.w3.org/2000/svg",className:"w-6 h-6",fill:"none",children:[e.jsx("path",{d:"M0 24C0 10.7452 10.7452 0 24 0C37.2548 0 48 10.7452 48 24C48 37.2548 37.2548 48 24 48C10.7452 48 0 37.2548 0 24Z",fill:"white"}),e.jsx("path",{d:"M34.9367 12H23.41C23.41 13.38 23.9582 14.7035 24.934 15.6793C25.9098 16.6551 27.2333 17.2033 28.6133 17.2033H30.7367V19.2533C30.7385 22.1245 33.0656 24.4515 35.9367 24.4533V13C35.9367 12.4477 35.489 12 34.9367 12Z",fill:"#2684FF"}),e.jsx("path",{d:"M29.2333 17.7433H17.7067C17.7085 20.6144 20.0355 22.9414 22.9067 22.9433H25.03V25C25.0337 27.8711 27.3622 30.1966 30.2333 30.1966V18.7433C30.2333 18.191 29.7856 17.7433 29.2333 17.7433Z",fill:"url(#paint0_linear)"}),e.jsx("path",{d:"M23.5267 23.4833H12C12 26.357 14.3296 28.6866 17.2033 28.6866H19.3333V30.7366C19.3352 33.6051 21.6582 35.9311 24.5267 35.9366V24.4833C24.5267 23.931 24.079 23.4833 23.5267 23.4833Z",fill:"url(#paint1_linear)"}),e.jsxs("defs",{children:[e.jsxs("linearGradient",{id:"paint0_linear",x1:"27.4434",y1:"15.326",x2:"22.5699",y2:"20.4112",gradientUnits:"userSpaceOnUse",children:[e.jsx("stop",{offset:"0.18",stopColor:"#0052CC"}),e.jsx("stop",{offset:"1",stopColor:"#2684FF"})]}),e.jsxs("linearGradient",{id:"paint1_linear",x1:"376.829",y1:"349.939",x2:"167.455",y2:"557.146",gradientUnits:"userSpaceOnUse",children:[e.jsx("stop",{offset:"0.18",stopColor:"#0052CC"}),e.jsx("stop",{offset:"1",stopColor:"#2684FF"})]})]})]}),[c,u]=w.useState([]),[b,$]=w.useState(!1),[E,h]=w.useState(null),{currentWorkspace:y}=te(),C=y==null?void 0:y.id,N=async()=>{try{$(!0),h(null);const f=await await de(C||"");u(f)}catch(T){console.error(T),h(T.message||"Failed to fetch integrations")}finally{$(!1)}};w.useEffect(()=>{C&&N()},[C]);const v=c==null?void 0:c.find(T=>T.type==="jira"&&T.isActive);v==null||v.id;const[F,M]=w.useState(!1),[P,ae]=w.useState({summary:"",description:"",issueType:""}),[_,K]=w.useState(!1);ee();const[,O]=Ne();return e.jsxs("div",{id:"report-content",children:[e.jsxs("div",{className:"border border-gray-200 bg-background rounded-lg px-6 py-3 animate-fade-in mt-3",children:[e.jsxs("div",{className:"flex justify-between items-start mb-6",children:[e.jsxs("div",{children:[e.jsx("h1",{className:"text-lg md:text-3xl font-bold text-gray-900 mb-2",children:s.name}),e.jsx("p",{className:"text-sm md:text-md text-gray-600",children:s.description})]}),e.jsx("div",{children:e.jsx("img",{src:Ee,alt:"Optraflow logo",className:"max-h-[50px] w-auto object-contain"})})]}),e.jsxs("div",{className:"grid grid-cols-2 md:grid-cols-4 gap-6 mb-3",children:[e.jsxs("div",{className:"flex items-center space-x-3",children:[e.jsx(Ce,{className:"w-5 h-5 text-blue-500"}),e.jsxs("div",{children:[e.jsx("p",{className:"text-xs md:text-sm text-gray-500",children:"Execution Date"}),e.jsx("p",{className:"text-xs md:text-sm font-semibold",children:(()=>{const{dateTime:T,tz:f}=G(s.lastExecutionDate);return`${T}, ${f}`})()})]})]}),e.jsxs("div",{className:"flex items-center space-x-3",children:[e.jsx(D,{className:"w-5 h-5 text-green-500"}),e.jsxs("div",{children:[e.jsx("p",{className:"text-xs md:text-sm text-gray-500",children:"Duration"}),e.jsx("p",{className:"text-xs md:text-sm font-semibold",children:a(s.duration)})]})]}),e.jsxs("div",{className:"flex items-center space-x-3",children:[e.jsx(Re,{className:"w-5 h-5 text-purple-500"}),e.jsxs("div",{children:[e.jsx("p",{className:"text-xs md:text-sm text-gray-500",children:"Executed By"}),e.jsx("p",{className:"text-xs md:text-sm font-semibold text-xs",children:s.executedBy})]})]}),e.jsxs("div",{className:"flex items-center space-x-3",children:[e.jsx(W,{className:"w-5 h-5 text-orange-500"}),e.jsxs("div",{children:[e.jsx("p",{className:"text-xs md:text-sm text-gray-500",children:"Environment"}),e.jsx("p",{className:"text-xs md:text-sm font-semibold text-xs",children:s.environment})]})]})]}),e.jsxs("div",{className:"flex items-center gap-4",children:[e.jsxs(se,{children:[e.jsxs(I,{children:[e.jsx(U,{asChild:!0,children:e.jsx("button",{onClick:g,className:"p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors group",children:e.jsx(Te,{className:"w-5 h-5"})})}),e.jsx(A,{children:"Download html Report"})]}),e.jsxs(I,{children:[e.jsx(U,{asChild:!0,children:e.jsx("button",{onClick:m,className:"p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors group",children:e.jsx($e,{className:"w-5 h-5"})})}),e.jsx(A,{children:"Download pdf Summary"})]}),e.jsxs(I,{children:[e.jsx(U,{asChild:!0,children:e.jsx("button",{onClick:d,className:"p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors group",children:e.jsx(Se,{className:"w-5 h-5"})})}),e.jsx(A,{children:"Share Report"})]}),e.jsxs(I,{children:[e.jsx(U,{asChild:!0,children:e.jsx("button",{onClick:()=>{v?M(!0):O("/settings/account?tab=external-tools")},className:"p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors",children:e.jsx(p,{})})}),e.jsx(A,{children:v?"Create Jira issue":"Configure Jira"})]})]}),e.jsx(De,{openJiraModal:F,setOpenJiraModal:()=>M(!1),testSuiteData:s})]})]}),e.jsx("div",{className:"grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-6 mb-3 mt-3",children:x.map((T,f)=>e.jsx("div",{className:"border border-gray-200 bg-background rounded-lg px-6 py-6 animate-fade-in",children:e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsxs("div",{children:[e.jsx("p",{className:"text-xs md:text-sm text-gray-500 mb-1",children:T.title}),e.jsx("p",{className:"text-md md:text-2xl font-bold text-gray-900",children:T.value})]}),e.jsx("div",{className:`p-3 rounded-full ${T.color}`,children:e.jsx(T.icon,{className:"w-4 h-4 md:w-6 md:h-6"})})]})},f))}),e.jsx(ws,{metrics:i}),e.jsx(es,{report:s})]})};function Is(s){var r;const t=Number(s==null?void 0:s.totalRequests)||((r=s==null?void 0:s.requestExecutions)==null?void 0:r.length)||0,i=Number(s==null?void 0:s.successfulRequests)||0,a=Number(s==null?void 0:s.failedRequests)||0,x=Number(s==null?void 0:s.skippedRequests)||0,o=t||i+a+x,n=o?Math.round(i/o*100):0;return{total:o,successful:i,failed:a,skipped:x,successRate:n}}function Us(s,t){if(!s.length)return 0;const i=[...s].sort((x,o)=>x-o),a=Math.min(i.length-1,Math.max(0,Math.ceil(t/100*i.length)-1));return i[a]}function As(s){const t=(s==null?void 0:s.requestExecutions)||[],i=new Map;t.forEach(o=>{const n=(o.method||"GET").toUpperCase();i.has(n)||i.set(n,[]),i.get(n).push(o)});const a=[];for(const[o,n]of i.entries()){const r=n.map(c=>Number(c.duration||0)).filter(c=>Number.isFinite(c)),l=n.length,d=n.filter(c=>c.status==="passed").length,m=n.filter(c=>c.status==="failed").length,g=r.length?Math.round(r.reduce((c,u)=>c+u,0)/r.length):0,p=Math.round(Us(r,95));a.push({method:o,total:l,success:d,failed:m,avgDurationMs:g,p95DurationMs:p})}const x=["GET","POST","PUT","PATCH","DELETE"];return a.sort((o,n)=>{const r=x.indexOf(o.method),l=x.indexOf(n.method);return r===-1&&l===-1?o.method.localeCompare(n.method):r===-1?1:l===-1?-1:r-l}),a}const Ls=({data:s,environment:t,startedQS:i})=>{var O,T;const a=((O=s.requestExecutions)==null?void 0:O.map((f,z)=>{var j,R;return{step:f.order||z+1,method:f.method,name:f.name,url:f.url,statusCode:f.responseStatusCode,requestCurl:f.requestCurl,response:f.response,responseSize:`${f.responseSize||0} bytes`,duration:`${f.duration}ms`,substitutedVariables:f.substitutedVariables||[],assertionResults:((j=f==null?void 0:f.assertionResults)==null?void 0:j.map(k=>({status:k.status,category:k.category,description:k.description,field:k.field,responseSize:k.responseSize,responseStatus:k.responseStatus,responseTime:k.responseTime,type:k.type,actualValue:k.actualValue,operator:k.operator,expectedValue:k.expectedValue})))??[],status:f.status==="passed"?"success":f.status==="failed"?"fail":"skipped",extractedVars:((R=f.extractedVariables)==null?void 0:R.map(k=>({key:k.name,value:k.value})))||[],errorMessage:f.status==="failed"?"Request failed":void 0}}))||[],x=s.globalVariables||{},o=((T=s.extractedVariables)==null?void 0:T.reduce((f,z)=>(f[z.name]=z.value,f),{}))||{},n=ne.useMemo(()=>Is(s),[s]),r=ne.useMemo(()=>As(s),[s]),l=n.successRate>=80?"text-green-600 bg-green-100":n.successRate>=60?"text-yellow-600 bg-yellow-100":"text-red-600 bg-red-100",d=[{title:"Success Rate",value:`${n.successRate}%`,icon:H,color:l},{title:"Total Requests",value:n.total.toString(),icon:D,color:"text-blue-600 bg-blue-100"},{title:"Successful",value:n.successful.toString(),icon:Q,color:"text-green-600 bg-green-100"},{title:"Failed",value:n.failed.toString(),icon:V,color:"text-red-600 bg-red-100"},{title:"Skipped",value:n.skipped.toString(),icon:Je,color:"text-red-600 bg-orange-100"}],m=f=>f<1e3?`${f}ms`:`${(f/1e3).toFixed(2)}s`,g=()=>e.jsxs("svg",{viewBox:"0 0 48 48",xmlns:"http://www.w3.org/2000/svg",className:"w-6 h-6",fill:"none",children:[e.jsx("path",{d:"M0 24C0 10.7452 10.7452 0 24 0C37.2548 0 48 10.7452 48 24C48 37.2548 37.2548 48 24 48C10.7452 48 0 37.2548 0 24Z",fill:"white"}),e.jsx("path",{d:"M34.9367 12H23.41C23.41 13.38 23.9582 14.7035 24.934 15.6793C25.9098 16.6551 27.2333 17.2033 28.6133 17.2033H30.7367V19.2533C30.7385 22.1245 33.0656 24.4515 35.9367 24.4533V13C35.9367 12.4477 35.489 12 34.9367 12Z",fill:"#2684FF"}),e.jsx("path",{d:"M29.2333 17.7433H17.7067C17.7085 20.6144 20.0355 22.9414 22.9067 22.9433H25.03V25C25.0337 27.8711 27.3622 30.1966 30.2333 30.1966V18.7433C30.2333 18.191 29.7856 17.7433 29.2333 17.7433Z",fill:"url(#paint0_linear)"}),e.jsx("path",{d:"M23.5267 23.4833H12C12 26.357 14.3296 28.6866 17.2033 28.6866H19.3333V30.7366C19.3352 33.6051 21.6582 35.9311 24.5267 35.9366V24.4833C24.5267 23.931 24.079 23.4833 23.5267 23.4833Z",fill:"url(#paint1_linear)"}),e.jsxs("defs",{children:[e.jsxs("linearGradient",{id:"paint0_linear",x1:"27.4434",y1:"15.326",x2:"22.5699",y2:"20.4112",gradientUnits:"userSpaceOnUse",children:[e.jsx("stop",{offset:"0.18",stopColor:"#0052CC"}),e.jsx("stop",{offset:"1",stopColor:"#2684FF"})]}),e.jsxs("linearGradient",{id:"paint1_linear",x1:"376.829",y1:"349.939",x2:"167.455",y2:"557.146",gradientUnits:"userSpaceOnUse",children:[e.jsx("stop",{offset:"0.18",stopColor:"#0052CC"}),e.jsx("stop",{offset:"1",stopColor:"#2684FF"})]})]})]}),[p,c]=w.useState([]),[u,b]=w.useState(!1),[$,E]=w.useState(null),{currentWorkspace:h}=te(),y=h==null?void 0:h.id,C=async()=>{try{b(!0),E(null);const z=await await de(y||"");c(z)}catch(f){console.error(f),E(f.message||"Failed to fetch integrations")}finally{b(!1)}};w.useEffect(()=>{y&&C()},[y]);const N=p==null?void 0:p.find(f=>f.type==="jira");N==null||N.id;const[v,F]=w.useState(!1),[M,P]=w.useState({summary:"",description:"",issueType:""}),[ae,_]=w.useState(!1);ee();const[,K]=Ne();return e.jsxs("div",{children:[e.jsxs("div",{className:"border border-gray-200 bg-background rounded-lg px-6 py-3 animate-fade-in mt-3",children:[e.jsxs("div",{className:"flex justify-between items-start mb-6",children:[e.jsxs("div",{children:[e.jsx("h1",{className:"text-xl md:text-3xl font-bold text-gray-900 mb-2 break-words",children:s.name}),e.jsx("p",{className:"text-gray-600",children:s.description||"Request chain execution flow with variable extraction and data flow analysis"})]}),e.jsx("div",{children:e.jsx("img",{src:Ee,alt:"Optraflow logo",className:"max-h-[50px] w-auto object-contain"})})]}),e.jsxs("div",{className:"grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-3",children:[e.jsxs("div",{className:"flex items-center space-x-3",children:[e.jsx(Ce,{className:"w-5 h-5 text-blue-500"}),e.jsxs("div",{children:[e.jsx("p",{className:"text-sm text-gray-500",children:"Execution Date"}),e.jsx("p",{className:"text-sm font-semibold",children:(()=>{const{dateTime:f,tz:z}=G(s.lastExecutionDate);return`${f}, ${z}`})()})]})]}),e.jsxs("div",{className:"flex items-center space-x-3",children:[e.jsx(D,{className:"w-5 h-5 text-green-500"}),e.jsxs("div",{children:[e.jsx("p",{className:"text-sm text-gray-500",children:"Duration"}),e.jsx("p",{className:"font-semibold",children:m((s==null?void 0:s.duration)||0)})]})]}),e.jsxs("div",{className:"flex items-center space-x-3",children:[e.jsx(Re,{className:"w-5 h-5 text-purple-500"}),e.jsxs("div",{children:[e.jsx("p",{className:"text-sm text-gray-500",children:"Executed By"}),e.jsx("p",{className:"font-semibold text-xs",children:s.executedBy})]})]}),e.jsxs("div",{className:"flex items-center space-x-3",children:[e.jsx(W,{className:"w-5 h-5 text-orange-500"}),e.jsxs("div",{children:[e.jsx("p",{className:"text-sm text-gray-500",children:"Environment"}),e.jsx("p",{className:"font-semibold text-xs",children:s==null?void 0:s.environment})]})]})]}),e.jsxs("div",{className:"flex flex-wrap items-center gap-2",children:[e.jsxs(se,{children:[e.jsx(ks,{reportData:s}),e.jsx(Ts,{reportData:s}),e.jsxs(I,{children:[e.jsx(U,{asChild:!0,children:e.jsx("button",{onClick:()=>Me(entityId,executionId||""),className:"p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors group",children:e.jsx(Se,{className:"w-5 h-5"})})}),e.jsx(A,{children:"Share Report"})]}),e.jsxs(I,{children:[e.jsx(U,{asChild:!0,children:e.jsx("button",{onClick:()=>{N?F(!0):K("/settings/account?tab=external-tools")},className:"p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors",children:e.jsx(g,{})})}),e.jsxs(A,{children:[$?"Failed to load integrations":N?"Create Jira issue":"Configure Jira"," "]})]})]}),e.jsx(De,{openJiraModal:v,setOpenJiraModal:()=>F(!1),testSuiteData:s})]})]}),e.jsx("div",{className:"grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 md:gap-6 mb-3 mt-3",children:d.map((f,z)=>e.jsx("div",{className:"border border-gray-200 bg-background rounded-lg px-6 py-6 animate-fade-in",children:e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsxs("div",{children:[e.jsx("p",{className:"text-sm text-gray-500 mb-1",children:f.title}),e.jsx("p",{className:"text-2xl font-bold text-gray-900",children:f.value})]}),e.jsx("div",{className:`p-3 rounded-full ${f.color}`,children:e.jsx(f.icon,{className:"w-6 h-6"})})]})},z))}),e.jsx($s,{metrics:r}),e.jsx(Le,{steps:a}),e.jsx("div",{className:"bg-[#FAFAFA]",children:e.jsx(Be,{globalVariables:x,extractedVariables:o})})]})},it=()=>{const{type:s,entityId:t}=we(),i=Fs(),a=i.get("env")||"Unknown",x=i.get("started"),o=i.get("executionId"),{currentWorkspace:n}=te(),r=w.useRef(null),{data:l,isLoading:d}=Ae({queryKey:["execution-report",t,s,o],queryFn:async()=>{if(!t||!s||!o||!(n!=null&&n.id))throw new Error("Missing required parameters");return s==="test_suite"?ce.getTestSuiteReport(t,o,n.id):ce.getRequestChainReport(t,o,n.id)},enabled:!!t&&!!s&&!!o&&!!(n!=null&&n.id)});return w.useEffect(()=>{typeof window>"u"||s==="test_suite"&&(l!=null&&l.data)&&(window.__REPORT_DATA__=l.data)},[s,l]),e.jsxs("div",{className:"mx-auto p-1 sm:p-1",ref:r,children:[e.jsx("header",{className:"border border-gray-200 bg-background rounded-lg px-6 py-4 animate-fade-in",children:e.jsx("div",{className:"flex items-center justify-between",children:e.jsx("div",{children:e.jsx("h2",{className:"text-2xl font-semibold text-foreground",children:s==="test_suite"?"Test Suite Report":"Request Chain Report"})})})}),d?e.jsx(Ve,{message:"Loading Report"}):l!=null&&l.data?s==="test_suite"?e.jsx(Ps,{data:l.data}):e.jsx(Ls,{data:l.data,environment:a,startedQS:x}):e.jsx("div",{className:"text-center py-8",children:e.jsx("p",{className:"text-gray-500",children:"No report data available"})})]})};export{it as default};
