const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/pdf-utils-BGmi_KU5.js","assets/vendor-Bb5uNfOx.js","assets/vendor-Cd6H9538.css","assets/RequestChainExecutionFlow-BWzMjK_x.js","assets/badge-DuyWHYCP.js","assets/index-gpqGaAJi.js","assets/tanstack-CEi7STuD.js","assets/radix-ui-BXC-FTh5.js","assets/icons-Cpb_7YEn.js","assets/router-C7dFEKHz.js","assets/index-BkIcLNrJ.css","assets/tabs-Dn0BoQqp.js","assets/VariableTable-BO6kUml8.js","assets/button-qDPLEwWX.js","assets/select-ewgkwika.js","assets/VariablesAndDataFlow-CAlMhw3C.js","assets/card-CJiGByLl.js","assets/RequestGrouping-DFMecRiw.js"])))=>i.map(i=>d[i]);
import{E as $e,_ as q}from"./pdf-utils-BGmi_KU5.js";import{j as t,aX as ke,r as j,R as O}from"./vendor-Bb5uNfOx.js";import{a as te,u as oe}from"./router-C7dFEKHz.js";import{b as Ce}from"./tanstack-CEi7STuD.js";import{a as H,e as ie}from"./exportDate-ogaX28YO.js";import{L as le}from"./OptraLogo-Cw5cE5z2.js";import{k as Y,q as X,T as P,f as I,g as L,h as de}from"./index-gpqGaAJi.js";import{af as ce,Y as Q,i as U,W as _,bD as ae,T as Re,aj as xe,$ as me,b6 as re,X as Se,g as W,ar as ne,at as Ee,ab as Me,h as pe,a6 as ue,x as ge,ay as he,aT as fe,bE as ze}from"./icons-Cpb_7YEn.js";import{u as se}from"./useWorkspace-Dwnfn1rQ.js";import{J as be}from"./JiraIcon-CJlCIVBo.js";import{g as ve,n as Fe}from"./integrationTools.service-Dp40Xnry.js";import{I as De}from"./input-BcDe-ty_.js";import{T as Pe}from"./textarea-Pu6hmm_N.js";import{B as Z}from"./button-qDPLEwWX.js";import"./radix-ui-BXC-FTh5.js";import"./collectionStore-CIlSrAss.js";const ye=(e,a)=>{const r=`${window.location.origin}/executions/report/test_suite/${e}?executionId=${a}`;navigator.share?navigator.share({title:"Test Suite Report",text:"View this comprehensive API test suite report",url:r}).catch(console.error):navigator.clipboard?navigator.clipboard.writeText(r).then(()=>alert("Shareable link copied to clipboard!")).catch(()=>prompt("Copy this shareable link:",r)):prompt("Copy this shareable link:",r)},Ie=(e,a,r={})=>{const s=window.__REPORT_DATA__;if(!s){alert("Report data not available for export");return}const x=st(s,e,{codeTheme:r.codeTheme??"dark"}),l=new Blob([x],{type:"text/html"}),n=URL.createObjectURL(l),i=document.createElement("a");i.href=n,i.download=a,document.body.appendChild(i),i.click(),i.remove(),URL.revokeObjectURL(n)},C=e=>String(e??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;"),Le=e=>{if(e==null)return"";if(typeof e=="object")try{return JSON.stringify(e,null,2)}catch{return String(e)}try{return JSON.stringify(JSON.parse(String(e)),null,2)}catch{return String(e)}},Ae=e=>`${((e??0)/1e3).toFixed(2)}s`,Be=e=>{if(!e)return"0 B";const a=1024,r=["B","KB","MB","GB"],s=Math.floor(Math.log(e)/Math.log(a));return`${parseFloat((e/Math.pow(a,s)).toFixed(2))} ${r[s]}`},we=e=>{const a={GET:"bg-blue-100 text-blue-800 border-blue-200",POST:"bg-green-100 text-green-800 border-green-200",PUT:"bg-yellow-100 text-yellow-800 border-yellow-200",DELETE:"bg-red-100 text-red-800 border-red-200",PATCH:"bg-purple-100 text-purple-800 border-purple-200",OPTIONS:"bg-gray-100 text-gray-800 border-gray-200"};return a[(e||"").toUpperCase()]||a.OPTIONS},Oe=e=>({passed:"bg-green-100 text-green-800 border-green-200",failed:"bg-red-100 text-red-800 border-red-200",skipped:"bg-yellow-100 text-yellow-800 border-yellow-200"})[e]||"bg-gray-100 text-gray-800 border-gray-200",Ue=e=>({critical:"bg-red-600 text-white",high:"bg-orange-600 text-white",medium:"bg-yellow-600 text-white",low:"bg-blue-600 text-white"})[e]||"bg-gray-600 text-white",je=e=>{try{const a=new URL(e),r=`${a.protocol}//${a.host.toLowerCase()}`,s=a.pathname.replace(/\/$/,"");return`${r}${s}${a.search}`}catch{return(e||"").trim().replace(/\/$/,"")}},_e=e=>{if(e==null)return null;if(typeof e=="object")return(e==null?void 0:e.statusCode)!=null?String(e.statusCode):null;try{const a=JSON.parse(e);return(a==null?void 0:a.statusCode)!=null?String(a.statusCode):null}catch{return null}},qe=e=>{var x;const a=((x=e.expectedResponse)==null?void 0:x.status)!=null?String(e.expectedResponse.status):null,r=_e(e.response);if(e.status!=="failed")return{message:"",expected:a,actual:r};const s=(e.errorMessage??"").trim();return s?{message:s,expected:a,actual:r}:a!==null&&r!==null?{message:`Expected status ${a}, but got ${r}`,expected:a,actual:r}:{message:"N/A",expected:null,actual:null}},He=e=>{const{message:a,expected:r,actual:s}=qe(e);if(!(a||r!==null&&s!==null))return"";const l=e.status==="failed",n=e.status==="passed",i=l?"border:1px solid #fecaca;background:#fef2f2;border-radius:8px;margin-bottom:16px;overflow:hidden;":n?"border:1px solid #bbf7d0;background:#f0fdf4;border-radius:8px;margin-bottom:16px;overflow:hidden;":"border:1px solid #fde68a;background:#fefce8;border-radius:8px;margin-bottom:16px;overflow:hidden;",o=l?"#fecaca":n?"#bbf7d0":"#fde68a",m=l?"❌":n?"✅":"⚠️",p=l?"FAILURE REASON":n?"STATUS CHECK":"TEST SUMMARY",h=l?"#991b1b":n?"#166534":"#92400e",g=l?"#991b1b":n?"#166534":"#92400e",k=r!==null&&s!==null?`<div style="display:flex;flex-wrap:wrap;align-items:center;gap:10px;font-size:13px;font-weight:500;">
          <div style="display:flex;align-items:center;gap:6px;">
            <span style="width:8px;height:8px;border-radius:50%;background:#22c55e;display:inline-block;flex-shrink:0;"></span>
            <span style="color:#6b7280;">Expected</span>
            <span style="display:inline-flex;align-items:center;padding:2px 10px;border-radius:4px;font-size:13px;font-weight:700;background:#dcfce7;color:#166534;border:1px solid #bbf7d0;">${r}</span>
          </div>
          <span style="color:#9ca3af;font-size:16px;">→</span>
          <div style="display:flex;align-items:center;gap:6px;">
            <span style="width:8px;height:8px;border-radius:50%;background:${l?"#ef4444":"#22c55e"};display:inline-block;flex-shrink:0;"></span>
            <span style="color:#6b7280;">Actual</span>
            <span style="${l?"display:inline-flex;align-items:center;padding:2px 10px;border-radius:4px;font-size:13px;font-weight:700;background:#fef2f2;color:#991b1b;border:1px solid #fecaca;":"display:inline-flex;align-items:center;padding:2px 10px;border-radius:4px;font-size:13px;font-weight:700;background:#dcfce7;color:#166534;border:1px solid #bbf7d0;"}">${s}</span>
          </div>
        </div>`:"",u=a?`<p style="font-size:14px;font-weight:500;color:${g};margin:0 0 ${k?"12px":"0"} 0;word-break:break-word;">${C(a)}</p>`:"";return`
  <div style="${i}">
    <div style="padding:10px 16px;border-bottom:1px solid ${o};display:flex;align-items:center;gap:8px;">
      <span style="font-size:14px;">${m}</span>
      <span style="font-size:11px;font-weight:700;letter-spacing:0.08em;color:${h};">${p}</span>
    </div>
    <div style="padding:12px 16px;">
      ${u}
      ${k}
    </div>
  </div>`},Je=e=>{var x,l,n,i,o,m,p;const a=[...((x=e.positiveTests)==null?void 0:x.apis)??[],...((l=e.negativeTests)==null?void 0:l.apis)??[],...((n=e.functionalTests)==null?void 0:n.apis)??[],...((i=e.semanticTests)==null?void 0:i.apis)??[],...((o=e.edgeCaseTests)==null?void 0:o.apis)??[],...((m=e.securityTests)==null?void 0:m.apis)??[],...((p=e.advancedSecurityTests)==null?void 0:p.apis)??[]];if(a.length)return a;const r=["positiveTests","negativeTests","functionalTests","semanticTests","edgeCaseTests","securityTests","advancedSecurityTests"],s=[];for(const h of e.requests??[])for(const g of r){const d=h[g];for(const c of(d==null?void 0:d.testCases)??[])s.push({...c,method:c.method||h.method,url:c.url||h.url})}return s},Ve=e=>{const a={};for(const r of e){const s=je(r.url||"");a[s]||(a[s]={key:s,endpoint:r.url,methods:{},total:0,passed:0,failed:0,skipped:0,avgDuration:0});const x=a[s],l=(r.method||"").toUpperCase();x.methods[l]||(x.methods[l]={method:l,testCases:[],total:0,passed:0,failed:0,skipped:0,avgDuration:0});const n=x.methods[l];n.testCases.push(r),n.total++,r.status==="passed"?n.passed++:r.status==="failed"?n.failed++:r.status==="skipped"&&n.skipped++,x.total++,r.status==="passed"?x.passed++:r.status==="failed"?x.failed++:r.status==="skipped"&&x.skipped++}return Object.values(a).forEach(r=>{Object.values(r.methods).forEach(x=>{const l=x.testCases.reduce((n,i)=>n+(i.duration||0),0);x.avgDuration=x.total?Math.round(l/x.total):0});const s=Object.values(r.methods).flatMap(x=>x.testCases).reduce((x,l)=>x+(l.duration||0),0);r.avgDuration=r.total?Math.round(s/r.total):0}),Object.values(a)},Ge=(e,a)=>a?Math.round(e/a*100):0,Ke=e=>{const a=e.length,r=new Set(e.map(c=>je(c.url))).size,s=e.map(c=>Number(c.duration||0)).filter(c=>Number.isFinite(c)),x=s.length?Math.min(...s):0,l=s.length?Math.max(...s):0,n=s.length?Math.round(s.reduce((c,b)=>c+b,0)/s.length):0,i=e.reduce((c,b)=>c+Number(b.responseSize||0),0),o={};e.forEach(c=>{const b=(c.method||"").toUpperCase();o[b]=(o[b]||0)+1});const m={};e.forEach(c=>{if(c.statusCode!=null){const b=String(c.statusCode);m[b]=(m[b]||0)+1}});const p={};e.forEach(c=>{if(c.status==="failed"){const b=c.category||"Failed";p[b]=(p[b]||0)+1}});const g=[...e].sort((c,b)=>(b.duration||0)-(c.duration||0)).slice(0,5).map(c=>({id:c.id,name:c.name,method:c.method,url:c.url,duration:c.duration||0})),d=[...e].sort((c,b)=>(c.duration||0)-(b.duration||0)).slice(0,5).map(c=>({id:c.id,name:c.name,method:c.method,url:c.url,duration:c.duration||0}));return{totalRequests:a,uniqueEndpoints:r,averageResponseTime:n,minResponseTime:x,maxResponseTime:l,totalDataTransferred:i,requestsByMethod:o,statusCodeDistribution:m,errorTypes:p,slowestRequests:g,fastestRequests:d}},Ye=e=>{const a=Object.entries(e.requestsByMethod).map(([i,o])=>`
    <div class="flex items-center justify-between">
      <span class="inline-flex items-center px-2 py-1 rounded text-xs font-medium ${we(i)}">${i}</span>
      <div class="flex items-center space-x-2">
        <div class="w-20 bg-gray-200 rounded-full h-2">
          <div class="bg-blue-600 h-2 rounded-full" style="width:${o/Math.max(e.totalRequests,1)*100}%"></div>
        </div>
        <span class="text-sm font-semibold text-gray-900 w-8">${o}</span>
      </div>
    </div>`).join(""),r=Object.entries(e.statusCodeDistribution).map(([i,o])=>`
    <div class="flex items-center justify-between">
      <span class="inline-flex items-center px-2 py-1 rounded text-xs font-medium ${parseInt(i,10)>=500?"bg-red-100 text-red-800":parseInt(i,10)>=400?"bg-yellow-100 text-yellow-800":parseInt(i,10)>=300?"bg-blue-100 text-blue-800":"bg-green-100 text-green-800"}">${i}</span>
      <div class="flex items-center space-x-2">
        <div class="w-20 bg-gray-200 rounded-full h-2">
          <div class="bg-blue-600 h-2 rounded-full" style="width:${o/Math.max(e.totalRequests,1)*100}%"></div>
        </div>
        <span class="text-sm font-semibold text-gray-900 w-8">${o}</span>
      </div>
    </div>`).join(""),s=Object.values(e.errorTypes).reduce((i,o)=>i+o,0),x=Object.keys(e.errorTypes).length>0?`
      <div class="bg-white rounded-lg shadow-md p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <i data-lucide="alert-triangle" class="w-5 h-5 mr-2 text-red-600"></i>
          Error Types
        </h3>
        <div class="space-y-3">
          ${Object.entries(e.errorTypes).map(([i,o])=>`
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-700 truncate flex-1 mr-2">${C(i)}</span>
              <div class="flex items-center space-x-2">
                <div class="w-16 bg-gray-200 rounded-full h-2">
                  <div class="bg-red-600 h-2 rounded-full" style="width:${o/Math.max(s,1)*100}%"></div>
                </div>
                <span class="text-sm font-semibold text-gray-900 w-6">${o}</span>
              </div>
            </div>`).join("")}
        </div>
      </div>`:"",l=e.slowestRequests.map((i,o)=>`
    <div class="flex items-center justify-between p-3 bg-red-50 rounded-lg">
      <div class="flex-1 min-w-0">
        <p class="text-sm font-medium text-gray-900 truncate">${C(i.name)}</p>
        <p class="text-xs text-gray-500 truncate">${C(i.method)} ${C(i.url)}</p>
      </div>
      <div class="text-right">
        <p class="text-sm font-semibold text-red-600">${i.duration}ms</p>
        <p class="text-xs text-gray-500">#${o+1}</p>
      </div>
    </div>`).join(""),n=e.fastestRequests.map((i,o)=>`
    <div class="flex items-center justify-between p-3 bg-green-50 rounded-lg">
      <div class="flex-1 min-w-0">
        <p class="text-sm font-medium text-gray-900 truncate">${C(i.name)}</p>
        <p class="text-xs text-gray-500 truncate">${C(i.method)} ${C(i.url)}</p>
      </div>
      <div class="text-right">
        <p class="text-sm font-semibold text-green-600">${i.duration}ms</p>
        <p class="text-xs text-gray-500">#${o+1}</p>
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
          <p class="text-2xl font-bold text-gray-900">${e.totalRequests}</p>
          <p class="text-sm text-gray-500">Total Requests</p>
        </div>
        <div class="text-center">
          <div class="flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mx-auto mb-2">
            <i data-lucide="database" class="w-6 h-6 text-green-600"></i>
          </div>
          <p class="text-2xl font-bold text-gray-900">${e.uniqueEndpoints}</p>
          <p class="text-sm text-gray-500">Unique Endpoints</p>
        </div>
        <div class="text-center">
          <div class="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mx-auto mb-2">
            <i data-lucide="clock" class="w-6 h-6 text-purple-600"></i>
          </div>
          <p class="text-2xl font-bold text-gray-900">${e.averageResponseTime}ms</p>
          <p class="text-sm text-gray-500">Avg Response Time</p>
        </div>
        <div class="text-center">
          <div class="flex items-center justify-center w-12 h-12 bg-orange-100 rounded-full mx-auto mb-2">
            <i data-lucide="trending-up" class="w-6 h-6 text-orange-600"></i>
          </div>
          <p class="text-2xl font-bold text-gray-900">${Be(e.totalDataTransferred)}</p>
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
            <span class="font-semibold text-green-600">${e.minResponseTime}ms</span>
          </div>
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-2">
              <i data-lucide="clock" class="w-4 h-4 text-blue-600"></i>
              <span class="text-sm text-gray-600">Average</span>
            </div>
            <span class="font-semibold text-blue-600">${e.averageResponseTime}ms</span>
          </div>
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-2">
              <i data-lucide="trending-up" class="w-4 h-4 text-red-600"></i>
              <span class="text-sm text-gray-600">Slowest</span>
            </div>
            <span class="font-semibold text-red-600">${e.maxResponseTime}ms</span>
          </div>
        </div>
      </div>
      <div class="bg-white rounded-lg shadow-md p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">HTTP Methods</h3>
        <div class="space-y-3">${a}</div>
      </div>
    </div>

${r?`
<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
  <div class="bg-white rounded-lg shadow-md p-6">
    <h3 ...>Status Code Distribution</h3>
    <div class="space-y-3">${r}</div>
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
        <div class="space-y-3">${l}</div>
      </div>
      <div class="bg-white rounded-lg shadow-md p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <i data-lucide="trending-down" class="w-5 h-5 mr-2 text-green-600"></i>
          Fastest Requests
        </h3>
        <div class="space-y-3">${n}</div>
      </div>
    </div>
  </div>`},Xe=(e,a)=>`
  <div class="border border-gray-200 bg-white rounded-lg px-6 py-3 mt-3">
    <div class="flex justify-between items-start mb-6">
      <div>
        <h1 class="text-3xl font-bold text-gray-900 mb-2">${C(e.name)}</h1>
        <p class="text-gray-600">${C(e.description)}</p>
      </div>
      <div>${a?`<img src="${C(a)}" alt="Optraflow logo" style="width:100%;height:50px" />`:""}</div>
    </div>
    <div class="grid grid-cols-2 md:grid-cols-4 gap-6 mb-3">
      <div class="flex items-center space-x-3">
        <i data-lucide="calendar" class="w-5 h-5 text-blue-500"></i>
        <div><p class="text-sm text-gray-500">Execution Date</p><p class="font-semibold">
          ${(()=>{const{dateTime:r,tz:s}=H(Date.parse(e.lastExecutionDate));return`${r}, ${s}`})()}</p></div>
      </div>
      <div class="flex items-center space-x-3">
        <i data-lucide="clock" class="w-5 h-5 text-green-500"></i>
        <div><p class="text-sm text-gray-500">Duration</p><p class="font-semibold">${Ae(e==null?void 0:e.duration)}</p></div>
      </div>
      <div class="flex items-center space-x-3">
        <i data-lucide="user" class="w-5 h-5 text-purple-500"></i>
        <div><p class="text-sm text-gray-500">Executed By</p><p class="font-semibold text-xs">${C(e==null?void 0:e.executedBy)}</p></div>
      </div>
      <div class="flex items-center space-x-3">
        <i data-lucide="database" class="w-5 h-5 text-orange-500"></i>
        <div><p class="text-sm text-gray-500">Environment</p><p class="font-semibold text-xs">${C(e==null?void 0:e.environment)}</p></div>
      </div>
    </div>
  </div>
`,Qe=(e,a)=>{const r=a.length||Number(e.totalTestCases||0),s=(a.length?a.filter(i=>i.status==="passed").length:0)||Number(e.successfulTestCases||0),x=(a.length?a.filter(i=>i.status==="failed").length:0)||Number(e.failedTestCases||0),l=r?Math.round(s/r*100):e.successRate||0,n=l>=80?"text-green-600 bg-green-100":l>=60?"text-yellow-600 bg-yellow-100":"text-red-600 bg-red-100";return`
  <div class="grid grid-cols-2 md:grid-cols-4 gap-6 mb-3 mt-3">
    ${K("Success Rate",`${l}%`,"trending-up",n)}
    ${K("Total Test Cases",`${r}`,"clock","text-blue-600 bg-blue-100")}
    ${K("Passed",`${s}`,"check-circle","text-green-600 bg-green-100")}
    ${K("Failed",`${x}`,"x-circle","text-red-600 bg-red-100")}
  </div>`},K=(e,a,r,s)=>`
  <div class="border border-gray-200 bg-white rounded-lg px-6 py-6">
    <div class="flex items-center justify-between">
      <div><p class="text-sm text-gray-500 mb-1">${e}</p><p class="text-2xl font-bold text-gray-900">${a}</p></div>
      <div class="p-3 rounded-full ${s}"><i data-lucide="${r}" class="w-6 h-6"></i></div>
    </div>
  </div>
`,ee=(e,a)=>`
  <div class="rounded border border-gray-700 bg-gray-800 overflow-hidden">
    <pre class="m-0 p-4 overflow-x-auto scrollbar-thin"><code class="language-${e}">${C(a)}</code></pre>
  </div>
`,We=e=>{const a=Oe(e.status),r=Ue(e.severity),s=`tc-${e.id}`;return`
  <div class="border border-gray-200 rounded-lg mb-4 overflow-hidden">

    <!-- ── Collapsed header ── -->
    <div class="p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors" data-toggle="${s}">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-4">
          <i data-lucide="chevron-right" class="w-5 h-5 text-gray-400 toggle-icon" data-for="${s}"></i>
          <div>
            <h3 class="font-semibold text-gray-900">${C(e.name)}</h3>
            <div class="flex items-center space-x-2 mt-1">
              <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${a}">${String(e.status).toUpperCase()}</span>
              <span class="inline-flex items-center px-2 py-1 rounded text-xs font-medium ${r}">${String(e.severity).toUpperCase()}</span>
            </div>
          </div>
        </div>
        <div class="flex items-center space-x-6 text-sm text-gray-500">
          <div class="flex items-center space-x-1"><i data-lucide="clock" class="w-4 h-4"></i><span>${e.duration}ms</span></div>
          <div class="flex items-center space-x-1"><i data-lucide="alert-circle" class="w-4 h-4"></i><span>${e.responseSize}B</span></div>
        </div>
      </div>
    </div>

    <!-- ── Expanded body ── -->
    <div id="${s}" class="p-4 border-t border-gray-200 bg-white hidden">
      <div class="space-y-4">

        <!-- ① Status Summary — shown first for ALL statuses (passed, failed, skipped) -->
        ${He(e)}

        <!-- ② Endpoint -->
        <div>
          <h4 class="font-medium text-gray-900 mb-2">Endpoint</h4>
          ${ee("http",`${(e.method||"").toUpperCase()} ${e.url}`)}
        </div>

        <!-- ③ Request cURL -->
        <div>
          <h4 class="font-medium text-gray-900 mb-2">Request cURL</h4>
          ${ee("bash",e.requestCurl)}
        </div>

        <!-- ④ Response -->
        <div>
          <h4 class="font-medium text-gray-900 mb-2">Response</h4>
          ${ee("json",Le(e.response))}
        </div>

      </div>
    </div>
  </div>`},Ze=e=>{const a=Ge(e.passed,e.total),r=a>=80?"text-green-600":a>=60?"text-yellow-600":"text-red-600",s=`url-${tt(e.key)}`,x=Object.values(e.methods).map(l=>`
    <div class="space-y-3">
      <div class="flex items-center gap-3">
        <span class="inline-flex items-center px-2 py-1 rounded text-xs font-medium border ${we(l.method)}">${l.method}</span>
      </div>
      <div class="space-y-3">
        ${l.testCases.map(n=>We(n)).join("")}
      </div>
    </div>`).join("");return`
  <div class="border border-gray-200 rounded-lg overflow-hidden">
    <div class="p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors" data-toggle="${s}">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-4 flex-1">
          <i data-lucide="chevron-up" class="w-5 h-5 text-gray-400 toggle-icon" data-for="${s}"></i>
          <div class="flex-1 min-w-0">
            <p class="font-medium text-gray-900 truncate" title="${C(e.endpoint)}">${C(e.endpoint)}</p>
            <p class="text-sm text-gray-500">${e.total} test case${e.total===1?"":"s"}</p>
          </div>
        </div>
        <div class="flex items-center space-x-6 text-sm">
          <div class="flex items-center space-x-1 text-green-600"><i data-lucide="check-circle" class="w-4 h-4"></i><span>${e.passed}</span></div>
          <div class="flex items-center space-x-1 text-red-600"><i data-lucide="x-circle" class="w-4 h-4"></i><span>${e.failed}</span></div>
          ${e.skipped?`<div class="flex items-center space-x-1 text-yellow-600"><i data-lucide="alert-triangle" class="w-4 h-4"></i><span>${e.skipped}</span></div>`:""}
          <div class="flex items-center space-x-1 text-gray-500"><i data-lucide="clock" class="w-4 h-4"></i><span>${e.avgDuration}ms avg</span></div>
          <div class="font-semibold ${r}">${a}%</div>
        </div>
      </div>
    </div>
    <div id="${s}" class="border-t border-gray-200 bg-white hidden"><div class="p-4 space-y-6">${x}</div></div>
  </div>`},et=e=>{const a=Ve(e);return a.length?`
    <div class="space-y-4">
      <div class="bg-white rounded-lg shadow-md p-6">
        <h2 class="text-xl font-bold text-gray-900 mb-4 flex items-center">
          <i data-lucide="globe" class="w-6 h-6 mr-2 text-blue-600"></i>
          API Endpoints (${a.length} endpoints)
        </h2>
        <div class="space-y-4">${a.map(r=>Ze(r)).join("")}</div>
      </div>
    </div>`:'<div class="bg-white rounded-lg shadow-md p-8 text-center"><i data-lucide="globe" class="w-12 h-12 text-gray-400 mx-auto mb-4"></i><p class="text-gray-500">No API requests found</p></div>'},tt=e=>{let a=0;for(let r=0;r<e.length;r++)a=(a<<5)-a+e.charCodeAt(r)|0;return`h${Math.abs(a)}`},st=(e,a,r)=>{let s=null;const x=document.getElementById(a)||document.body,l=x==null?void 0:x.querySelector('img[alt="Optraflow logo"]');l!=null&&l.src&&(s=l.src);const n=Je(e),i=Ke(n),o=r.codeTheme==="dark"?"https://unpkg.com/prismjs@1/themes/prism-okaidia.css":"https://unpkg.com/prismjs@1/themes/prism.css";return`<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${C(e.name)} – Report</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <script src="https://cdn.tailwindcss.com"><\/script>
  <link rel="stylesheet" href="${o}">
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
    ${Xe(e,s)}
    ${Qe(e,n)}
    ${Ye(i)}
    ${et(n)}
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
</html>`},it=({metrics:e})=>{const a=i=>{if(!i)return"0 B";const o=1024,m=["B","KB","MB","GB"],p=Math.min(Math.floor(Math.log(i)/Math.log(o)),m.length-1);return`${parseFloat((i/Math.pow(o,p)).toFixed(2))} ${m[p]}`},r=i=>`${Number(i??0).toFixed(0)}ms`,s=i=>{switch((i||"").toUpperCase()){case"GET":return"bg-blue-100 text-blue-800";case"POST":return"bg-green-100 text-green-800";case"PUT":return"bg-yellow-100 text-yellow-800";case"DELETE":return"bg-red-100 text-red-800";case"PATCH":return"bg-purple-100 text-purple-800";default:return"bg-gray-100 text-gray-800"}},x=i=>{const o=parseInt(i,10);return o>=200&&o<300?"bg-green-100 text-green-800":o>=300&&o<400?"bg-blue-100 text-blue-800":o>=400&&o<500?"bg-yellow-100 text-yellow-800":o>=500?"bg-red-100 text-red-800":"bg-gray-100 text-gray-800"},l=Math.max(e.totalRequests||0,1),n=Math.max(Object.values(e.errorTypes||{}).reduce((i,o)=>i+o,0),1);return t.jsxs("div",{className:"space-y-4 mb-4",children:[t.jsxs("div",{className:"bg-background rounded-lg border border-gray-200 p-3 md:p-6",children:[t.jsx("h2",{className:"text-md md:text-xl font-bold text-gray-900 mb-4 flex items-center",children:"Request-Level Metrics"}),t.jsxs("div",{className:"grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6",children:[t.jsxs("div",{className:"text-center",children:[t.jsx("div",{className:"flex items-center justify-center w-8 h-8 md:w-12 md:h-12 bg-blue-100 rounded-full mx-auto mb-2",children:t.jsx(ce,{className:"w-4 h-4 md:w-6 md:h-6 text-blue-600"})}),t.jsx("p",{className:"text-base md:text-2xl font-bold text-gray-900",children:e.totalRequests}),t.jsx("p",{className:"text-xs md:text-sm text-gray-500",children:"Total Requests"})]}),t.jsxs("div",{className:"text-center",children:[t.jsx("div",{className:"flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mx-auto mb-2",children:t.jsx(Q,{className:"w-6 h-6 text-green-600"})}),t.jsx("p",{className:"text-md md:text-2xl font-bold text-gray-900",children:e.uniqueEndpoints}),t.jsx("p",{className:"text-xs md:text-sm text-gray-500",children:"Unique Endpoints"})]}),t.jsxs("div",{className:"text-center",children:[t.jsx("div",{className:"flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mx-auto mb-2",children:t.jsx(U,{className:"w-6 h-6 text-purple-600"})}),t.jsx("p",{className:"text-md md:text-2xl font-bold text-gray-900",children:r(e.averageResponseTime)}),t.jsx("p",{className:"text-xs md:text-sm text-gray-500",children:"Avg Response Time"})]}),t.jsxs("div",{className:"text-center",children:[t.jsx("div",{className:"flex items-center justify-center w-12 h-12 bg-orange-100 rounded-full mx-auto mb-2",children:t.jsx(_,{className:"w-6 h-6 text-orange-600"})}),t.jsx("p",{className:"text-md md:text-2xl font-bold text-gray-900",children:a(e.totalDataTransferred)}),t.jsx("p",{className:"text-xs md:text-sm text-gray-500",children:"Data Transferred"})]})]})]}),t.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6",children:[t.jsxs("div",{className:"bg-white rounded-lg border border-gray-200 p-3 md:p-6",children:[t.jsx("h3",{className:"text-base md:text-xl font-semibold text-gray-900 mb-4",children:"Response Time Range"}),t.jsxs("div",{className:"space-y-4",children:[t.jsxs("div",{className:"flex items-center justify-between",children:[t.jsxs("div",{className:"flex items-center space-x-2",children:[t.jsx(ae,{className:"w-4 h-4 text-green-600"}),t.jsx("span",{className:"text-sm text-gray-600",children:"Fastest"})]}),t.jsx("span",{className:"font-semibold text-green-600",children:r(e.minResponseTime)})]}),t.jsxs("div",{className:"flex items-center justify-between",children:[t.jsxs("div",{className:"flex items-center space-x-2",children:[t.jsx(U,{className:"w-4 h-4 text-blue-600"}),t.jsx("span",{className:"text-sm text-gray-600",children:"Average"})]}),t.jsx("span",{className:"font-semibold text-blue-600",children:r(e.averageResponseTime)})]}),t.jsxs("div",{className:"flex items-center justify-between",children:[t.jsxs("div",{className:"flex items-center space-x-2",children:[t.jsx(_,{className:"w-4 h-4 text-red-600"}),t.jsx("span",{className:"text-sm text-gray-600",children:"Slowest"})]}),t.jsx("span",{className:"font-semibold text-red-600",children:r(e.maxResponseTime)})]})]})]}),t.jsxs("div",{className:"bg-background rounded-lg border border-gray-200 p-3 md:p-6",children:[t.jsx("h3",{className:"text-base md:text-xl font-semibold text-gray-900 mb-4",children:"HTTP Methods"}),t.jsx("div",{className:"space-y-3",children:Object.entries(e.requestsByMethod||{}).map(([i,o])=>t.jsxs("div",{className:"flex items-center justify-between",children:[t.jsx("span",{className:`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${s(i)}`,children:i}),t.jsxs("div",{className:"flex items-center space-x-2",children:[t.jsx("div",{className:"w-16 md:w-24 bg-gray-200 rounded-full h-2",children:t.jsx("div",{className:"bg-blue-600 h-2 rounded-full",style:{width:`${o/l*100}%`}})}),t.jsx("span",{className:"text-sm font-semibold text-gray-900 w-8",children:o})]})]},i))})]})]}),t.jsxs("div",{className:"grid grid-cols-1 lg:grid-cols-2 gap-6",children:[t.jsxs("div",{className:"bg-background rounded-lg border border-gray-200 p-3 md:p-6",children:[t.jsx("h3",{className:"text-md md:text-xl font-semibold text-gray-900 mb-4",children:"Status Code Distribution"}),t.jsx("div",{className:"space-y-3",children:Object.entries(e.statusCodeDistribution||{}).map(([i,o])=>t.jsxs("div",{className:"flex items-center justify-between",children:[t.jsx("span",{className:`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${x(i)}`,children:i}),t.jsxs("div",{className:"flex items-center space-x-2",children:[t.jsx("div",{className:"w-16 md:w-24 bg-gray-200 rounded-full h-2",children:t.jsx("div",{className:"bg-blue-600 h-2 rounded-full",style:{width:`${o/l*100}%`}})}),t.jsx("span",{className:"text-sm font-semibold text-gray-900 w-8",children:o})]})]},i))})]}),Object.keys(e.errorTypes||{}).length>0&&t.jsxs("div",{className:"bg-background rounded-lg border border-gray-200 p-3 md:p-6",children:[t.jsxs("h3",{className:"text-md md:text-xl font-semibold text-gray-900 mb-4 flex items-center",children:[t.jsx(Re,{className:"w-5 h-5 mr-2 text-red-600"}),"Error Types"]}),t.jsx("div",{className:"space-y-3",children:Object.entries(e.errorTypes||{}).map(([i,o])=>t.jsxs("div",{className:"flex items-center justify-between",children:[t.jsx("span",{className:"text-sm text-gray-700 truncate flex-1 mr-2 min-w-0",children:i}),t.jsxs("div",{className:"flex items-center space-x-2",children:[t.jsx("div",{className:"w-16 bg-gray-200 rounded-full h-2",children:t.jsx("div",{className:"bg-red-600 h-2 rounded-full",style:{width:`${o/n*100}%`}})}),t.jsx("span",{className:"text-sm font-semibold text-gray-900 w-6",children:o})]})]},i))})]})]}),t.jsxs("div",{className:"grid grid-cols-1 lg:grid-cols-2 gap-6 ",children:[t.jsxs("div",{className:"bg-background rounded-lg border border-gray-200 p-3 md:p-6",children:[t.jsxs("h3",{className:"text-md md:text-xl font-semibold text-gray-900 mb-4 flex items-center",children:[t.jsx(_,{className:"w-5 h-5 mr-2 text-red-600"}),"Slowest Requests"]}),t.jsx("div",{className:"space-y-3",children:e.slowestRequests.slice(0,1).map((i,o)=>t.jsxs("div",{className:"flex items-center justify-between p-3 bg-red-50 rounded-lg",children:[t.jsxs("div",{className:"flex-1 min-w-0",children:[t.jsx("p",{className:"text-sm font-medium text-gray-900 truncate",children:i.name}),t.jsxs("p",{className:"text-xs text-gray-500 truncate",children:[i.method," ",i.url]})]}),t.jsxs("div",{className:"text-right",children:[t.jsx("p",{className:"text-sm font-semibold text-red-600",children:r(i.duration)}),t.jsxs("p",{className:"text-xs text-gray-500",children:["#",o+1]})]})]},i.id))})]}),t.jsxs("div",{className:"bg-background rounded-lg border border-gray-200 p-3 md:p-6",children:[t.jsxs("h3",{className:"text-md md:text-xl font-semibold text-gray-900 mb-4 flex items-center",children:[t.jsx(ae,{className:"w-5 h-5 mr-2 text-green-600"}),"Fastest Requests"]}),t.jsx("div",{className:"space-y-3",children:e.fastestRequests.slice(0,1).map((i,o)=>t.jsxs("div",{className:"flex items-center justify-between p-3 bg-green-50 rounded-lg",children:[t.jsxs("div",{className:"flex-1 min-w-0",children:[t.jsx("p",{className:"text-sm font-medium text-gray-900 truncate",children:i.name}),t.jsxs("p",{className:"text-xs text-gray-500 truncate",children:[i.method," ",i.url]})]}),t.jsxs("div",{className:"text-right",children:[t.jsx("p",{className:"text-sm font-semibold text-green-600",children:r(i.duration)}),t.jsxs("p",{className:"text-xs text-gray-500",children:["#",o+1]})]})]},i.id))})]})]})]})};function at(e){var N,k;const a=[];for(const u of e.requests??[]){const w=[u.positiveTests,u.negativeTests,u.functionalTests,u.semanticTests,u.edgeCaseTests,u.securityTests,u.advancedSecurityTests].filter(Boolean);for(const S of w)for(const T of S.testCases??[])T.method||(T.method=u.method),T.url||(T.url=u.url),a.push(T)}const r=u=>{if(u)try{return JSON.parse(u)}catch{return}};let s=0,x=0,l=Number.POSITIVE_INFINITY,n=0;const i={},o={},m={},p=[];for(const u of a){const w=r(u.response),S=w==null?void 0:w.statusCode,T=S!=null?String(S):"";T&&(o[T]=(o[T]||0)+1);const f=(u.method||"OTHER").toUpperCase();i[f]=(i[f]||0)+1;const E=((N=w==null?void 0:w.metrics)==null?void 0:N.bytesReceived)??u.responseSize??0;s+=E;const M=((k=w==null?void 0:w.metrics)==null?void 0:k.responseTime)??u.duration??0;if(x+=M,M>0&&(M<l&&(l=M),M>n&&(n=M)),u.status&&u.status.toLowerCase()!=="passed"){const z=`Failed (${T||"unknown"})`;m[z]=(m[z]||0)+1}p.push({id:u.id,name:u.name,method:f,url:u.url||"",duration:M,statusCode:S})}const h=a.length,g=h?x/h:0,d=[...p].sort((u,w)=>u.duration-w.duration),c=[...p].sort((u,w)=>w.duration-u.duration),b=new Set((e.requests??[]).map(u=>u.url)).size;return{totalRequests:h,uniqueEndpoints:b,averageResponseTime:g,minResponseTime:Number.isFinite(l)?l:0,maxResponseTime:n,totalDataTransferred:s,requestsByMethod:i,statusCodeDistribution:o,errorTypes:m,slowestRequests:c.slice(0,10),fastestRequests:d.slice(0,10)}}function rt({reportData:e}){const{toast:a}=Y(),r=o=>{const m=document.createElement("div");return m.textContent=o,m.innerHTML},s=()=>{if(e.requestExecutions.length===0)return 0;const o=e.requestExecutions.reduce((m,p)=>m+p.duration,0);return Math.round(o/e.requestExecutions.length)},x=()=>e.requestExecutions.reduce((o,m)=>o+m.responseSize,0),l=o=>{if(o===0)return"0 B";const m=1024,p=["B","KB","MB","GB"],h=Math.floor(Math.log(o)/Math.log(m));return`${parseFloat((o/Math.pow(m,h)).toFixed(2))} ${p[h]}`},n=()=>{const o=s(),m=x(),p=r,g=(()=>{const d=document.querySelector('img[alt="Optraflow logo"]');if(!(d!=null&&d.src))return"";if(d.src.startsWith("data:"))return d.src;try{const c=document.createElement("canvas");c.width=d.naturalWidth||d.width,c.height=d.naturalHeight||d.height;const b=c.getContext("2d");return b==null||b.drawImage(d,0,0),c.toDataURL("image/png")}catch{return""}})();return`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${p(e.name)} - API Test Report</title>
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
      <h1 class="header-title">${p(e.name)}</h1>
      <div class="logo-wrap">
      ${g?`<img src="${p(g)}" alt="Optraflow logo" style="height:40px; width:auto;" />`:""}
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
          <div class="meta-value">${(()=>{const{dateTime:d,tz:c}=H(Date.parse(e.lastExecutionDate));return`${d}, ${c}`})()}</div>
        </div>
      </div>
      <div class="meta-item">
        <span class="meta-icon-wrap" style="color:#10b981;">
          <i data-lucide="clock"></i>
        </span>
        <div>
          <div class="meta-label">Duration</div>
          <div class="meta-value">${e.duration}ms</div>
        </div>
      </div>
      <div class="meta-item">
        <span class="meta-icon-wrap" style="color:#8b5cf6;">
          <i data-lucide="user"></i>
        </span>
        <div>
          <div class="meta-label">Executed By</div>
          <div class="meta-value">${p(e.executedBy)}</div>
        </div>
      </div>
      <div class="meta-item">
        <span class="meta-icon-wrap" style="color:#f59e0b;">
          <i data-lucide="database"></i>
        </span>
        <div>
          <div class="meta-label">Environment</div>
          <div class="meta-value">${p(e.environment)}</div>
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
        <div class="metric-value">${e.successRate}<span class="metric-unit">%</span></div>
      </div>
      <div class="metric-icon" style="background:#fce7f3; color:#e11d48;">
        <i data-lucide="trending-up"></i>
      </div>
    </div>
    <div class="metric-card">
      <div>
        <div class="metric-label">Total Requests</div>
        <div class="metric-value">${e.totalRequests}</div>
      </div>
      <div class="metric-icon" style="background:#dbeafe; color:#2563eb;">
        <i data-lucide="clock"></i>
      </div>
    </div>
    <div class="metric-card">
      <div>
        <div class="metric-label">Successful</div>
        <div class="metric-value" style="color:#10b981">${e.successfulRequests}</div>
      </div>
      <div class="metric-icon" style="background:#dcfce7; color:#16a34a;">
        <i data-lucide="check-circle"></i>
      </div>
    </div>
    <div class="metric-card">
      <div>
        <div class="metric-label">Failed</div>
        <div class="metric-value" style="color:#ef4444">${e.failedRequests}</div>
      </div>
      <div class="metric-icon" style="background:#fee2e2; color:#dc2626;">
        <i data-lucide="x-circle"></i>
      </div>
    </div>
    <div class="metric-card">
      <div>
        <div class="metric-label">Skipped</div>
        <div class="metric-value" style="color:#f59e0b">${e.skippedRequests}</div>
      </div>
      <div class="metric-icon" style="background:#fef3c7; color:#d97706;">
        <i data-lucide="alert-triangle"></i>
      </div>
    </div>
    <div class="metric-card">
      <div>
        <div class="metric-label">Avg Response Time</div>
        <div class="metric-value">${o}<span class="metric-unit">ms</span></div>
      </div>
      <div class="metric-icon" style="background:#f3e8ff; color:#7c3aed;">
        <i data-lucide="clock"></i>
      </div>
    </div>
    <div class="metric-card">
      <div>
        <div class="metric-label">Data Transferred</div>
        <div class="metric-value" style="font-size:18px">${l(m)}</div>
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
      ${e==null?void 0:e.requestExecutions.map(d=>`
        <div class="request-item">
          <div class="request-header">
            <div class="request-order">${d==null?void 0:d.order}</div>
            <div class="request-name">${p(d==null?void 0:d.name)}</div>
            <span class="method-badge method-${p(d==null?void 0:d.method.toLowerCase())}">${p(d.method)}</span>
            <span class="status-badge status-${p(d==null?void 0:d.status.toLowerCase())}">${p(d.status)}</span>
          </div>
          <div class="request-url">${p(d.url)}</div>
          <div class="request-stats">
            <span><strong>Status Code:</strong> ${d==null?void 0:d.responseStatusCode}</span>
            <span><strong>Duration:</strong> ${d==null?void 0:d.duration}ms</span>
            <span><strong>Size:</strong> ${p(l(d==null?void 0:d.responseSize))}</span>
          </div>
          
          
          
          <div style="margin-top: 16px;">
            <strong style="font-size: 14px; color: #475569;">Request cURL</strong>
            <div class="code-block"><pre>${p(d.requestCurl)}</pre></div>
          </div>
          
          <div style="margin-top: 16px;">
            <strong style="font-size: 14px; color: #475569;">Response</strong>
            <div class="code-block"><pre>${p(d.response)}</pre></div>
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
</html>`},i=()=>{try{const o=n(),m=new Blob([o],{type:"text/html;charset=utf-8"}),p=URL.createObjectURL(m),h=document.createElement("a"),g=`${e.name.replace(/\s+/g,"_")}_Report_${new Date().getTime()}.html`;h.href=p,h.download=g,h.setAttribute("data-testid","download-link-html"),document.body.appendChild(h),h.click(),setTimeout(()=>{document.body.removeChild(h),URL.revokeObjectURL(p),a({title:"HTML Report Ready",description:"Your report has been downloaded successfully."})},100)}catch(o){console.error("HTML export error:",o),a({title:"Export Failed",description:"There was an error generating the HTML report.",variant:"destructive"})}};return t.jsx(X,{children:t.jsxs(P,{children:[t.jsx(I,{asChild:!0,children:t.jsx("button",{onClick:i,"data-testid":"export-html-button",className:"p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors group",children:t.jsx(xe,{className:"w-5 h-5"})})}),t.jsx(L,{children:"Download HTML Report"})]})})}function nt({reportData:e}){const{toast:a}=Y(),r=()=>{try{const s=new $e,x=s.internal.pageSize.getWidth(),l=s.internal.pageSize.getHeight(),n=20;let i=n;s.setFontSize(20),s.setFont("helvetica","bold"),s.text(e.name,n,i),i+=8,s.setFontSize(10),s.setFont("helvetica","normal"),s.setTextColor(100,100,100),s.text("API Request Chain Execution Report",n,i),i+=15,s.setDrawColor(200,200,200),s.line(n,i,x-n,i),i+=10,s.setFontSize(12),s.setFont("helvetica","bold"),s.setTextColor(0,0,0),s.text("Execution Summary",n,i),i+=8,s.setFontSize(10),s.setFont("helvetica","normal"),[`Execution Date:  ${(()=>{const{dateTime:u,tz:w}=H(Date.parse(e.lastExecutionDate));return`${u}, ${w}`})()}`,`Duration: ${e.duration<1e3?`${e.duration}ms`:`${(e.duration/1e3).toFixed(2)}s`}`,`Executed By: ${e.executedBy}`,`Environment: ${e.environment}`].forEach(u=>{s.text(u,n+5,i),i+=6}),i+=5,s.setDrawColor(200,200,200),s.line(n,i,x-n,i),i+=10,s.setFontSize(12),s.setFont("helvetica","bold"),s.text("Performance Metrics",n,i),i+=8;const m=e.requestExecutions.length>0?Math.round(e.requestExecutions.reduce((u,w)=>u+w.duration,0)/e.requestExecutions.length):0,p=e.requestExecutions.reduce((u,w)=>u+w.responseSize,0),h=u=>u<1024?`${u} B`:u<1024*1024?`${(u/1024).toFixed(2)} KB`:`${(u/(1024*1024)).toFixed(2)} MB`;s.setFontSize(10),s.setFont("helvetica","normal");const g=n+5,d=x/2,c=(x-2*n-10)/2;s.setFillColor(240,240,240),s.rect(g-5,i-5,c,50,"F"),s.rect(d,i-5,c,50,"F"),s.setTextColor(0,0,0),s.setFont("helvetica","bold"),s.text("Total Requests",g,i),s.text("Success Rate",d+5,i),i+=7,s.setFontSize(18),s.setTextColor(33,150,243),s.text(e.totalRequests.toString(),g,i);const b=e.successRate===100?[76,175,80]:e.successRate>=80?[255,152,0]:[244,67,54];s.setTextColor(b[0],b[1],b[2]),s.text(`${e.successRate}%`,d+5,i),i+=10,s.setFontSize(10),s.setTextColor(0,0,0),s.setFont("helvetica","normal"),s.text(`Passed: ${e.successfulRequests}`,g,i),s.text(`Avg Response: ${m}ms`,d+5,i),i+=6,s.text(`Failed: ${e.failedRequests}`,g,i),s.text(`Data Transfer: ${h(p)}`,d+5,i),i+=6,s.text(`Skipped: ${e.skippedRequests}`,g,i),i+=15,s.setDrawColor(200,200,200),s.line(n,i,x-n,i),i+=10,s.setFontSize(12),s.setFont("helvetica","bold"),s.setTextColor(0,0,0),s.text("Request Execution Details",n,i),i+=8,s.setFontSize(9),s.setFont("helvetica","bold"),s.text("#",n,i),s.text("Request Name",n+10,i),s.text("Status",n+90,i),s.text("Duration",n+120,i),s.text("Status Code",n+155,i),i+=5,s.setFont("helvetica","normal"),[...e.requestExecutions].sort((u,w)=>u.order-w.order).forEach((u,w)=>{i>l-30&&(s.addPage(),i=n);const S=u.status==="passed"?[76,175,80]:u.status==="failed"?[244,67,54]:[158,158,158];s.setTextColor(0,0,0),s.text(u.order.toString(),n,i);const T=u.name.length>35?u.name.substring(0,32)+"...":u.name;s.text(T,n+10,i),s.setTextColor(S[0],S[1],S[2]),s.text(u.status.toUpperCase(),n+90,i),s.setTextColor(0,0,0),s.text(`${u.duration}ms`,n+120,i),s.text(u.responseStatusCode.toString(),n+155,i),i+=6}),i+=10,i>l-30&&(s.addPage(),i=n),s.setDrawColor(200,200,200),s.line(n,i,x-n,i),i+=5,s.setFontSize(8),s.setTextColor(150,150,150),s.text(`Generated on ${ke(new Date,"MM/dd/yyyy 'at' h:mm a")} • OptraFlow API Testing Platform`,n,i);const k=`${e.name.replace(/[^a-z0-9]/gi,"_")}_Summary_${Date.now()}.pdf`;s.save(k),a({title:"PDF Summary Ready",description:`${k} has been downloaded.`})}catch(s){console.error("PDF export error:",s),a({title:"Export Failed",description:"There was an error generating the PDF. Please try again.",variant:"destructive"})}};return t.jsx(X,{children:t.jsxs(P,{children:[t.jsx(I,{asChild:!0,children:t.jsx("button",{onClick:r,"data-testid":"export-html-button",className:"p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors group",children:t.jsx(me,{className:"w-5 h-5"})})}),t.jsx(L,{children:"Download PDF Summary"})]})})}const ot=({metrics:e})=>{const a=m=>{const p=Number(m??0);return p<1e3?`${p.toFixed(0)}ms`:`${(p/1e3).toFixed(2)}s`},r=e.reduce((m,p)=>m+(p.total||0),0),s=e.reduce((m,p)=>m+(p.success||0),0);e.reduce((m,p)=>m+(p.failed||0),0);const x=r>0?Math.round(e.reduce((m,p)=>m+(p.avgDurationMs||0)*(p.total||0),0)/r):0,l=e.length>0?Math.max(...e.map(m=>m.p95DurationMs||0)):0,n=r>0?s/r*100:0,i=`${n.toFixed(1)}%`,o=n>=80?"bg-green-100 text-green-700":n>=60?"bg-yellow-100 text-yellow-700":"bg-red-100 text-red-700";return!e||e.length===0?t.jsxs("div",{className:"bg-white rounded-lg border border-gray-200 p-6 mb-3",children:[t.jsxs("h2",{className:"text-xl font-bold text-gray-900 mb-2 flex items-center",children:[t.jsx(re,{className:"w-6 h-6 mr-2 text-blue-600"}),"Request-Level Metrics"]}),t.jsx("p",{className:"text-gray-500 text-sm",children:"No metrics available."})]}):t.jsx("div",{className:"space-y-3 mb-3",children:t.jsxs("div",{className:"bg-white rounded-lg border border-gray-200 p-6",children:[t.jsxs("h2",{className:"text-xl font-bold text-gray-900 mb-6 flex items-center",children:[t.jsx(re,{className:"w-6 h-6 mr-2 text-blue-600"}),"Request-Level Metrics"]}),t.jsxs("div",{className:"grid grid-cols-2 md:grid-cols-4 gap-6",children:[t.jsxs("div",{className:"text-center",children:[t.jsx("div",{className:"flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mx-auto mb-2",children:t.jsx(ce,{className:"w-6 h-6 text-blue-600"})}),t.jsx("p",{className:"text-2xl font-bold text-gray-900",children:r}),t.jsx("p",{className:"text-sm text-gray-500",children:"Total Requests"})]}),t.jsxs("div",{className:"text-center",children:[t.jsx("div",{className:`flex items-center justify-center w-12 h-12 rounded-full mx-auto mb-2 ${o}`,children:t.jsx(_,{className:"w-6 h-6"})}),t.jsx("p",{className:"text-2xl font-bold text-gray-900",children:i}),t.jsxs("p",{className:"text-sm text-gray-500",children:["Success (",s," / ",r,")"]})]}),t.jsxs("div",{className:"text-center",children:[t.jsx("div",{className:"flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mx-auto mb-2",children:t.jsx(U,{className:"w-6 h-6 text-purple-600"})}),t.jsx("p",{className:"text-2xl font-bold text-gray-900",children:a(x)}),t.jsx("p",{className:"text-sm text-gray-500",children:"Avg Response Time"})]}),t.jsxs("div",{className:"text-center",children:[t.jsx("div",{className:"flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mx-auto mb-2",children:t.jsx(Q,{className:"w-6 h-6 text-green-600"})}),t.jsx("p",{className:"text-2xl font-bold text-gray-900",children:a(l)}),t.jsx("p",{className:"text-sm text-gray-500",children:"p95 Response Time"})]})]})]})})},A=()=>({total:0,passed:0,failed:0,skipped:0,apis:[]}),B=(e,a)=>{a&&(e.total+=a.total??0,e.passed+=a.passed??0,e.failed+=a.failed??0,e.skipped+=a.skipped??0,Array.isArray(a.testCases)&&a.testCases.forEach(r=>{const s={id:r.id,name:r.name,method:r.method,url:r.url,status:r.status,severity:r.severity,duration:r.duration,responseSize:r.responseSize,requestCurl:r.requestCurl,response:r.response};e.apis.push(s)}))},lt=e=>{const a=A(),r=A(),s=A(),x=A(),l=A(),n=A(),i=A();let o=0,m=0,p=0,h=0;(e.requests??[]).forEach(f=>{o+=f.totalTestCases??0,m+=f.successfulTestCases??0,p+=f.failedTestCases??0,h+=f.skippedTestCases??0,B(a,f.positiveTests),B(r,f.negativeTests),B(s,f.functionalTests),B(x,f.semanticTests),B(l,f.edgeCaseTests),B(n,f.securityTests),B(i,f.advancedSecurityTests)});const g=[...a.apis,...r.apis,...s.apis,...x.apis,...l.apis,...n.apis,...i.apis],d=g.map(f=>f.duration??0),c=g.map(f=>f.responseSize??0),b=d.length?Math.min(...d):0,N=d.length?Math.max(...d):0,k=d.length?d.reduce((f,E)=>f+E,0)/d.length:0,u=c.reduce((f,E)=>f+E,0),w=new Set(g.map(f=>`${f.method} ${f.url}`)).size,S=o>0?Math.round(m/o*100):0;return{id:e.id,name:e.name,description:e.description??"",environment:e.environment??e.environmentId??"Unknown",lastExecutionDate:e.lastExecutionDate,duration:e.duration??0,executedBy:e.executedBy??"Unknown",successRate:S,totalTestCases:o,successfulTestCases:m,failedTestCases:p,skippedTestCases:h,requestMetrics:{minResponseTime:b,maxResponseTime:N,averageResponseTime:k,totalRequests:g.length,totalDataTransferred:u,uniqueEndpoints:w},positiveTests:a,negativeTests:r,functionalTests:s,semanticTests:x,edgeCaseTests:l,securityTests:n,advancedSecurityTests:i}},dt=e=>{var n,i,o,m,p,h;const a=g=>new Date(g).toLocaleDateString("en-US",{year:"numeric",month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"}),r=g=>`${(g/1e3).toFixed(1)}s`,s=g=>{if(g===0)return"0 B";const d=1024,c=["B","KB","MB"],b=Math.floor(Math.log(g)/Math.log(d));return parseFloat((g/Math.pow(d,b)).toFixed(1))+" "+c[b]},x=[{title:"Positive Tests",category:e.positiveTests},{title:"Negative Tests",category:e.negativeTests},{title:"Functional Tests",category:e.functionalTests},{title:"Semantic Tests",category:e.semanticTests},{title:"Edge Case Tests",category:e.edgeCaseTests},{title:"Security Tests",category:e.securityTests},{title:"Advanced Security Tests",category:e.advancedSecurityTests}],l=mt(x);return`
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; background: white;">
      <!-- Header -->
      <div style="border-bottom: 2px solid #e5e7eb; padding-bottom: 20px; margin-bottom: 30px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <h1 style="font-size: 24px; font-weight: 700; color: #111827; margin: 0 0 8px 0;">${e.name}</h1>
            <p style="color: #6b7280; margin: 0; font-size: 14px;">${e.description}</p>
          </div>
          <div style="text-align: right;">
            <h2 style="font-size: 18px; font-weight: 600; color: #2563eb; margin: 0;">Optraflow</h2>
            <p style="font-size: 12px; color: #6b7280; margin: 0;">API Testing Report</p>
          </div>
        </div>
        
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-top: 20px;">
          <div style="text-align: center;">
            <div style="font-size: 20px; font-weight: 700; color: ${e.successRate>=80?"#059669":e.successRate>=60?"#d97706":"#dc2626"};">${e.successRate}%</div>
            <div style="font-size: 12px; color: #6b7280;">Success Rate</div>
          </div>
          <div style="text-align: center;">
            <div style="font-size: 20px; font-weight: 700; color: #111827;">${e.totalTestCases}</div>
            <div style="font-size: 12px; color: #6b7280;">Total Tests</div>
          </div>
          <div style="text-align: center;">
            <div style="font-size: 20px; font-weight: 700; color: #111827;">${r(e.duration)}</div>
            <div style="font-size: 12px; color: #6b7280;">Duration</div>
          </div>
          <div style="text-align: center;">
            <div style="font-size: 20px; font-weight: 700; color: #111827;">${Object.keys(l).length}</div>
            <div style="font-size: 12px; color: #6b7280;">API Endpoints</div>
          </div>
        </div>
      </div>

      <!-- Test Results Summary -->
      <div style="margin-bottom: 30px;">
        <h2 style="font-size: 18px; font-weight: 600; color: #111827; margin: 0 0 15px 0;">Test Results Summary</h2>
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px;">
          <div style="text-align: center; padding: 15px; background: #f0fdf4; border-radius: 8px;">
            <div style="font-size: 24px; font-weight: 700; color: #059669;">${e.successfulTestCases}</div>
            <div style="font-size: 12px; color: #059669; font-weight: 500;">PASSED</div>
          </div>
          <div style="text-align: center; padding: 15px; background: #fef2f2; border-radius: 8px;">
            <div style="font-size: 24px; font-weight: 700; color: #dc2626;">${e.failedTestCases}</div>
            <div style="font-size: 12px; color: #dc2626; font-weight: 500;">FAILED</div>
          </div>
          <div style="text-align: center; padding: 15px; background: #fefce8; border-radius: 8px;">
            <div style="font-size: 24px; font-weight: 700; color: #d97706;">${e.skippedTestCases}</div>
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
            ${Object.entries(l).slice(0,15).map(([g,d],c)=>{const b=Math.round(d.passedTests/d.totalTests*100);return`
                <tr style="background: ${c%2===0?"#ffffff":"#f9fafb"}; border-bottom: 1px solid #f3f4f6;">
                  <td style="padding: 8px; color: #374151; max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${d.endpoint}</td>
                  <td style="text-align: center; padding: 8px;">
                    <span style="background: ${ct(d.method)}; color: white; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 500;">${d.method}</span>
                  </td>
                  <td style="text-align: center; padding: 8px; color: #374151;">${d.totalTests}</td>
                  <td style="text-align: center; padding: 8px; color: ${b>=80?"#059669":b>=60?"#d97706":"#dc2626"}; font-weight: 600;">${b}%</td>
                  <td style="text-align: center; padding: 8px; color: #374151;">${d.avgDuration}ms</td>
                </tr>
              `}).join("")}
          </tbody>
        </table>
        ${Object.keys(l).length>15?`
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
              <tr><td style="padding: 4px 0; color: #059669;">Fastest:</td><td style="text-align: right; font-weight: 600;">${(n=e==null?void 0:e.requestMetrics)==null?void 0:n.minResponseTime}ms</td></tr>
              <tr><td style="padding: 4px 0; color: #2563eb;">Average:</td><td style="text-align: right; font-weight: 600;">${Math.round((i=e==null?void 0:e.requestMetrics)==null?void 0:i.averageResponseTime)}ms</td></tr>
              <tr><td style="padding: 4px 0; color: #dc2626;">Slowest:</td><td style="text-align: right; font-weight: 600;">${(o=e==null?void 0:e.requestMetrics)==null?void 0:o.maxResponseTime}ms</td></tr>
            </table>
          </div>
          <div>
            <h3 style="font-size: 14px; font-weight: 600; color: #374151; margin: 0 0 10px 0;">Data Transfer</h3>
            <table style="width: 100%; font-size: 12px;">
              <tr><td style="padding: 4px 0;">Total Requests:</td><td style="text-align: right; font-weight: 600;">${(m=e==null?void 0:e.requestMetrics)==null?void 0:m.totalRequests}</td></tr>
              <tr><td style="padding: 4px 0;">Data Transferred:</td><td style="text-align: right; font-weight: 600;">${s((p=e==null?void 0:e.requestMetrics)==null?void 0:p.totalDataTransferred)}</td></tr>
              <tr><td style="padding: 4px 0;">Unique Endpoints:</td><td style="text-align: right; font-weight: 600;">${(h=e==null?void 0:e.requestMetrics)==null?void 0:h.uniqueEndpoints}</td></tr>
            </table>
          </div>
        </div>
      </div>

      <!-- Test Categories -->
      <div style="margin-bottom: 30px;">
        <h2 style="font-size: 18px; font-weight: 600; color: #111827; margin: 0 0 15px 0;">Test Categories</h2>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;">
          ${x.filter(g=>{var d;return((d=g==null?void 0:g.category)==null?void 0:d.total)>0}).map(({title:g,category:d})=>{const c=Math.round(d.passed/d.total*100);return`
              <div style="padding: 12px; border: 1px solid #e5e7eb; border-radius: 6px; background: #fafafa;">
                <div style="font-size: 13px; font-weight: 600; color: #374151; margin-bottom: 4px;">${g}</div>
                <div style="font-size: 11px; color: #6b7280;">
                  ${d.total} tests • ${c}% success
                </div>
                <div style="display: flex; gap: 8px; margin-top: 4px; font-size: 10px;">
                  <span style="color: #059669;">✓ ${d.passed}</span>
                  <span style="color: #dc2626;">✗ ${d.failed}</span>
                  ${d.skipped>0?`<span style="color: #d97706;">⚠ ${d.skipped}</span>`:""}
                </div>
              </div>
            `}).join("")}
        </div>
      </div>

      <!-- Footer -->
      <div style="border-top: 1px solid #e5e7eb; padding-top: 15px; text-align: center; font-size: 11px; color: #6b7280;">
        <p style="margin: 0;">Generated by Optraflow • ${a(e.lastExecutionDate)}</p>
        <p style="margin: 4px 0 0 0;">For detailed test cases and responses, download the full HTML report</p>
      </div>
    </div>
  `},ct=e=>({GET:"#2563eb",POST:"#059669",PUT:"#d97706",DELETE:"#dc2626",PATCH:"#7c3aed",OPTIONS:"#6b7280"})[e]||"#6b7280",xt=async(e,a)=>{if(!document.getElementById(e))return;const s=window.__REPORT_DATA__;if(!s){alert("Report data not available for export");return}const[{default:x},{default:l}]=await Promise.all([q(()=>import("./pdf-utils-BGmi_KU5.js").then(i=>i.h),__vite__mapDeps([0,1,2])),q(()=>import("./pdf-utils-BGmi_KU5.js").then(i=>i.j),__vite__mapDeps([0,1,2]))]),n=document.createElement("div");n.style.cssText="position:absolute;left:-9999px;top:0;width:800px;background:#fff;",n.innerHTML=dt(s),document.body.appendChild(n);try{const i=await x(n,{allowTaint:!0,useCORS:!0,backgroundColor:"#ffffff",scale:1,logging:!1,width:800,height:n.scrollHeight}),o=i.toDataURL("image/png"),m=new l({orientation:"portrait",unit:"mm",format:"a4",compress:!0}),p=210,h=295,g=i.height*p/i.width;let d=g,c=0;for(m.addImage(o,"PNG",0,c,p,g),d-=h;d>=0;)c=-(g-d),m.addPage(),m.addImage(o,"PNG",0,c,p,g),d-=h;m.save(a)}catch(i){console.error("Error generating PDF:",i),alert("Failed to generate PDF. Please try again.")}finally{document.body.removeChild(n)}},mt=e=>{const a={};return e==null||e.forEach(({title:r,category:s})=>{if(!s)return;(s.apis??s.testCases??[]).forEach(l=>{const n=`${l.method} ${l.url}`;a[n]||(a[n]={endpoint:l.url,method:l.method,testCases:[],totalTests:0,passedTests:0,failedTests:0,skippedTests:0,avgDuration:0}),a[n].testCases.push({...l,category:r}),a[n].totalTests++,l.status==="passed"?a[n].passedTests++:l.status==="failed"?a[n].failedTests++:l.status==="skipped"&&a[n].skippedTests++})}),Object.values(a).forEach(r=>{const s=r.testCases.reduce((x,l)=>x+(l.duration??0),0);r.avgDuration=r.testCases.length?Math.round(s/r.testCases.length):0}),a},Ne=({openJiraModal:e,setOpenJiraModal:a,testSuiteData:r})=>{const[s,x]=j.useState(""),[l,n]=j.useState(""),[i,o]=j.useState("Bug"),[m,p]=j.useState(!1),[h,g]=j.useState(null),[d,c]=j.useState(null),[b,N]=j.useState(!1),k=typeof window<"u"?window.location.href:"";j.useEffect(()=>(e?document.body.style.overflow="hidden":document.body.style.overflow="unset",()=>{document.body.style.overflow="unset"}),[e]),j.useEffect(()=>{const y=R=>{R.key==="Escape"&&e&&!m&&$()};return document.addEventListener("keydown",y),()=>document.removeEventListener("keydown",y)},[e,m]);const u=y=>{try{const R=new Date(y);return isNaN(R.getTime())?"Invalid Date":R.toLocaleString("en-US",{year:"numeric",month:"short",day:"numeric",hour:"2-digit",minute:"2-digit",timeZone:"UTC",timeZoneName:"short"})}catch{return"Invalid Date"}},w=()=>{const{name:y,lastExecutionDate:R,environment:D}=r;return`Name: ${y},
Executed date: ${u(R)},
Environment: ${D||"N/A"},
Execution url: ${k}

Additional Description :
${l.trim()}

To access the report:
Click the above mentioned report link
If you have access by providing the valid credentials you will be able to access the report.`},[S,T]=j.useState(!1),[f,E]=j.useState([]),{currentWorkspace:M}=se(),z=M==null?void 0:M.id,J=async()=>{try{T(!0),c(null);const R=await await ve(z||"");E(R)}catch(y){console.error(y),c(y.message||"Failed to fetch integrations")}finally{T(!1)}};j.useEffect(()=>{z&&J()},[z]);const v=f==null?void 0:f.find(y=>y.type==="jira"&&y.isActive),F=v==null?void 0:v.id,V=async y=>{if(y.preventDefault(),!s.trim()){c("Summary is required");return}p(!0),c(null);try{const R={summary:s.trim(),description:w(),issueType:i},D=await Fe(F||"",R,z||"");if(!(D!=null&&D.issueKey)||!(D!=null&&D.issueUrl))throw new Error("Invalid response from server");g(D)}catch(R){console.error("Jira API Error:",R),c(R instanceof Error?R.message:"Failed to create Jira issue. Please try again.")}finally{p(!1)}},G=async()=>{if(h!=null&&h.issueUrl)try{if(navigator.clipboard&&window.isSecureContext)await navigator.clipboard.writeText(h.issueUrl);else{const y=document.createElement("textarea");y.value=h.issueUrl,y.style.position="fixed",y.style.left="-999999px",document.body.appendChild(y),y.select(),document.execCommand("copy"),document.body.removeChild(y)}N(!0),setTimeout(()=>N(!1),2e3)}catch(y){console.error("Failed to copy:",y),c("Failed to copy URL. Please copy manually.")}},$=()=>{m||(x(""),n(""),o("Bug"),g(null),c(null),N(!1),a())},Te=y=>{y.target===y.currentTarget&&!m&&$()};return e?t.jsxs("div",{className:"fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn",onClick:Te,role:"dialog","aria-modal":"true","aria-labelledby":"modal-title",children:[t.jsxs("div",{className:"relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-slideUp",style:{maxHeight:"90vh"},children:[t.jsx("div",{className:"relative px-4 sm:px-6 py-4 sm:py-5",children:t.jsxs("div",{className:"flex items-center justify-between gap-4",children:[t.jsxs("div",{className:"flex-1 min-w-0",children:[t.jsx("h2",{id:"modal-title",className:"text-xl sm:text-2xl font-bold text-black tracking-tight truncate",children:h?"Issue Created Successfully":"Create Jira Issue"}),t.jsx("p",{className:"text-black text-xs sm:text-sm mt-1",children:h?"Your bug report has been submitted":"Report a bug from test suite execution"})]}),t.jsx("button",{onClick:$,disabled:m,className:"p-2 rounded-lg hover:bg-white/20 transition-all duration-200 text-white disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0","aria-label":"Close modal",type:"button",children:t.jsx(Se,{size:24,className:"text-black"})})]})}),t.jsx("div",{className:"overflow-y-auto",style:{maxHeight:"calc(90vh - 100px)"},children:h?t.jsxs("div",{className:"p-4 sm:p-6 space-y-4 sm:space-y-6",children:[t.jsxs("div",{className:"text-center py-6 sm:py-8",children:[t.jsx("div",{className:"inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 mb-4 animate-scaleIn",children:t.jsx(ne,{size:40,className:"text-white"})}),t.jsx("h3",{className:"text-xl sm:text-2xl font-bold text-slate-800 mb-2",children:h.message}),t.jsx("p",{className:"text-slate-600 text-sm sm:text-base px-4",children:"Your bug report has been successfully submitted to Jira"})]}),t.jsx("div",{className:"bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-4 sm:p-6 border border-indigo-100",children:t.jsxs("div",{className:"space-y-4",children:[t.jsxs("div",{children:[t.jsx("label",{className:"text-sm font-medium text-slate-600 block mb-2",children:"Issue Key"}),t.jsxs("div",{className:"flex items-center gap-3 flex-wrap",children:[t.jsx("span",{className:"text-2xl sm:text-3xl font-bold text-indigo-600 break-all",children:h.issueKey}),t.jsx("span",{className:"px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full",children:"Created"})]})]}),t.jsxs("div",{children:[t.jsx("label",{className:"text-sm font-medium text-slate-600 block mb-2",children:"Issue URL"}),t.jsxs("div",{className:"flex flex-col sm:flex-row gap-2",children:[t.jsxs("a",{href:h.issueUrl,target:"_blank",rel:"noopener noreferrer",className:"flex-1 px-4 py-3 bg-white rounded-lg border border-indigo-200 text-indigo-600 hover:bg-indigo-50 transition-all duration-200 flex items-center justify-between group overflow-hidden min-w-0",children:[t.jsx("span",{className:"text-sm font-medium truncate mr-2",children:h.issueUrl}),t.jsx(Ee,{size:18,className:"flex-shrink-0 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-200"})]}),t.jsx(Z,{onClick:G,size:"lg",type:"button",children:b?t.jsxs(t.Fragment,{children:[t.jsx(ne,{size:18}),t.jsx("span",{children:"Copied!"})]}):t.jsxs(t.Fragment,{children:[t.jsx(Me,{size:18}),t.jsx("span",{children:"Copy URL"})]})})]})]})]})}),t.jsx("div",{className:"bg-blue-50 border border-blue-200 rounded-lg p-4",children:t.jsxs("div",{className:"flex gap-3",children:[t.jsx(W,{className:"text-blue-600 flex-shrink-0 mt-0.5",size:20}),t.jsxs("div",{className:"text-sm text-blue-800 min-w-0",children:[t.jsx("p",{className:"font-medium mb-1",children:"Share with your team"}),t.jsx("p",{className:"text-blue-700",children:"Copy the issue URL and share it with your team members. They can access the full report using their Jira credentials."})]})]})}),t.jsx("div",{className:"flex justify-end pt-2",children:t.jsx(Z,{onClick:$,type:"button",children:"Close"})})]}):t.jsxs("form",{onSubmit:V,className:"p-4 sm:p-6 space-y-4 sm:space-y-6",children:[t.jsxs("div",{className:"bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-4 sm:p-5 border border-slate-200",children:[t.jsxs("h3",{className:"text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2",children:[t.jsx(W,{size:16,className:"text-indigo-600 flex-shrink-0"}),t.jsx("span",{children:"Test Suite Information (Auto-populated)"})]}),t.jsxs("div",{className:"space-y-2 text-sm",children:[t.jsxs("div",{className:"flex flex-col sm:flex-row sm:gap-2",children:[t.jsx("span",{className:"font-medium text-slate-600 sm:min-w-[140px]",children:"Suite Name:"}),t.jsx("span",{className:"text-slate-800 break-words",children:r==null?void 0:r.name})]}),t.jsxs("div",{className:"flex flex-col sm:flex-row sm:gap-2",children:[t.jsx("span",{className:"font-medium text-slate-600 sm:min-w-[140px]",children:"Executed Date:"}),t.jsx("span",{className:"text-slate-800 break-words",children:u(r==null?void 0:r.lastExecutionDate)})]}),t.jsxs("div",{className:"flex flex-col sm:flex-row sm:gap-2",children:[t.jsx("span",{className:"font-medium text-slate-600 sm:min-w-[140px]",children:"Environment:"}),t.jsx("span",{className:"text-slate-800 break-words",children:(r==null?void 0:r.environment)||"N/A"})]}),t.jsxs("div",{className:"flex flex-col sm:flex-row sm:gap-2",children:[t.jsx("span",{className:"font-medium text-slate-600 sm:min-w-[140px]",children:"Executed By:"}),t.jsx("span",{className:"text-slate-800 break-words",children:r==null?void 0:r.executedBy})]})]})]}),t.jsxs("div",{className:"space-y-2",children:[t.jsxs("label",{htmlFor:"summary",className:"block text-sm font-semibold text-slate-700",children:["Summary ",t.jsx("span",{className:"text-red-500",children:"*"})]}),t.jsx(De,{id:"summary",type:"text",value:s,onChange:y=>x(y.target.value),placeholder:"Brief description of the bug",required:!0,maxLength:200,disabled:m,"aria-required":"true"}),t.jsxs("p",{className:"text-xs text-slate-500",children:[s.length,"/200 characters"]})]}),t.jsxs("div",{className:"space-y-2",children:[t.jsx("label",{htmlFor:"userDescription",className:"block text-sm font-semibold text-slate-700",children:"Additional Description"}),t.jsx(Pe,{id:"userDescription",value:l,onChange:y=>n(y.target.value),placeholder:"Add any additional details about the bug (steps to reproduce, expected vs actual behavior, etc.)",rows:3,maxLength:2e3,disabled:m}),t.jsxs("p",{className:"text-xs text-slate-500",children:[l.length,"/2000 characters"]})]}),t.jsxs("div",{className:"space-y-2",children:[t.jsx("label",{htmlFor:"issueType",className:"block text-sm font-semibold text-slate-700",children:"Issue Type"}),t.jsxs("select",{id:"issueType",value:i,onChange:y=>o(y.target.value),disabled:m,className:"w-full px-4 py-3 rounded-lg border-2 border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all duration-200 text-slate-800 bg-white cursor-pointer disabled:bg-slate-100 disabled:cursor-not-allowed",children:[t.jsx("option",{value:"Bug",children:"Bug"}),t.jsx("option",{value:"Task",children:"Task"}),t.jsx("option",{value:"Story",children:"Story"}),t.jsx("option",{value:"Epic",children:"Epic"})]})]}),d&&t.jsxs("div",{className:"p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3",role:"alert",children:[t.jsx(W,{className:"text-red-600 flex-shrink-0 mt-0.5",size:20}),t.jsxs("div",{className:"flex-1 min-w-0",children:[t.jsx("p",{className:"text-sm font-medium text-red-800",children:"Error creating issue"}),t.jsx("p",{className:"text-sm text-red-600 mt-1 break-words",children:d})]})]}),t.jsx("div",{className:"flex justify-end flex-col-reverse sm:flex-row gap-3 pt-4",children:t.jsx(Z,{type:"submit",disabled:m||!s.trim(),size:"lg",children:m?t.jsxs("span",{className:"flex items-center justify-center gap-2",children:[t.jsxs("svg",{className:"animate-spin h-5 w-5",viewBox:"0 0 24 24","aria-hidden":"true",children:[t.jsx("circle",{className:"opacity-25",cx:"12",cy:"12",r:"10",stroke:"currentColor",strokeWidth:"4",fill:"none"}),t.jsx("path",{className:"opacity-75",fill:"currentColor",d:"M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"})]}),"Creating..."]}):"Create Issue"})})]})})]}),t.jsx("style",{children:`
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
      `})]}):null},pt=O.lazy(()=>q(()=>import("./RequestChainExecutionFlow-BWzMjK_x.js"),__vite__mapDeps([3,1,2,4,5,6,7,8,0,9,10,11,12,13,14]))),ut=O.lazy(()=>q(()=>import("./VariablesAndDataFlow-CAlMhw3C.js"),__vite__mapDeps([15,1,2,16,5,6,7,8,0,9,10,11,12,4]))),gt=O.lazy(()=>q(()=>import("./RequestGrouping-DFMecRiw.js"),__vite__mapDeps([17,1,2,8])).then(e=>({default:e.RequestGrouping}))),ht=()=>{const e=typeof window<"u"?window.location.search:"";return O.useMemo(()=>new URLSearchParams(e),[e])},ft=e=>{var s,x;const a=[];if(Array.isArray(e==null?void 0:e.requests)){const l=["positiveTests","negativeTests","functionalTests","semanticTests","edgeCaseTests","securityTests","advancedSecurityTests"];for(const n of e.requests)for(const i of l){const o=n==null?void 0:n[i];(s=o==null?void 0:o.testCases)!=null&&s.length&&a.push(...o.testCases)}if(a.length)return a}const r=["positiveTests","negativeTests","functionalTests","semanticTests","edgeCaseTests","securityTests","advancedSecurityTests"];for(const l of r){const n=e==null?void 0:e[l];(x=n==null?void 0:n.apis)!=null&&x.length&&a.push(...n.apis)}return a},bt=e=>{const a=ft(e),r=a.length||Number((e==null?void 0:e.totalTestCases)||0),s=(a.length?a.filter(o=>o.status==="passed").length:0)||Number((e==null?void 0:e.successfulTestCases)||0),x=(a.length?a.filter(o=>o.status==="failed").length:0)||Number((e==null?void 0:e.failedTestCases)||0),l=(a.length?a.filter(o=>o.status==="skipped").length:0)||Number((e==null?void 0:e.skippedTestCases)||0),n=r>0?Math.round(s/r*100):Number((e==null?void 0:e.successRate)||0),i=a.length>0?Math.round(a.reduce((o,m)=>o+Number((m==null?void 0:m.duration)||0),0)/a.length):Number.isFinite(e==null?void 0:e.duration)?Number(e.duration):0;return{total:r,passed:s,failed:x,skipped:l,successRate:n,avgDuration:i}},vt=({data:e,integrations:a,integrationsLoading:r})=>{const s=j.useMemo(()=>bt(e),[e]),x=j.useMemo(()=>at(e),[e]),l=f=>`${(f/1e3).toFixed(2)}s`,n=j.useMemo(()=>[{title:"Success Rate",value:`${s.successRate}%`,icon:_,color:s.successRate>=80?"text-green-600 bg-green-100":s.successRate>=60?"text-yellow-600 bg-yellow-100":"text-red-600 bg-red-100"},{title:"Total Test Cases",value:s.total.toString(),icon:U,color:"text-blue-600 bg-blue-100"},{title:"Passed",value:s.passed.toString(),icon:pe,color:"text-green-600 bg-green-100"},{title:"Failed",value:s.failed.toString(),icon:ue,color:"text-red-600 bg-red-100"}],[s]),o=new URLSearchParams(window.location.search).get("executionId"),{type:m,entityId:p}=te(),h=()=>{ye(p,o||"")},g=async()=>{const f=lt(e);window.__REPORT_DATA__=f,await xt("report-content",`${f.name}_report.pdf`)},d=()=>Ie("report-content",`${e.name}_report.html`),c=a==null?void 0:a.find(f=>f.type==="jira"&&f.isActive);c==null||c.id;const[b,N]=j.useState(!1),[k,u]=j.useState({summary:"",description:"",issueType:""}),[w,S]=j.useState(!1);Y();const[,T]=oe();return t.jsxs("div",{id:"report-content",children:[t.jsxs("div",{className:"border border-gray-200 bg-background rounded-lg px-6 py-3 animate-fade-in mt-3",children:[t.jsxs("div",{className:"flex justify-between items-start mb-6",children:[t.jsxs("div",{children:[t.jsx("h1",{className:"text-lg md:text-3xl font-bold text-gray-900 mb-2",children:e.name}),t.jsx("p",{className:"text-sm md:text-md text-gray-600",children:e.description})]}),t.jsx("div",{children:t.jsx("img",{src:le,alt:"Optraflow logo",className:"max-h-[50px] w-auto object-contain"})})]}),t.jsxs("div",{className:"grid grid-cols-2 md:grid-cols-4 gap-6 mb-3",children:[t.jsxs("div",{className:"flex items-center space-x-3",children:[t.jsx(ge,{className:"w-5 h-5 text-blue-500"}),t.jsxs("div",{children:[t.jsx("p",{className:"text-xs md:text-sm text-gray-500",children:"Execution Date"}),t.jsx("p",{className:"text-xs md:text-sm font-semibold",children:(()=>{const{dateTime:f,tz:E}=H(e.lastExecutionDate);return`${f}, ${E}`})()})]})]}),t.jsxs("div",{className:"flex items-center space-x-3",children:[t.jsx(U,{className:"w-5 h-5 text-green-500"}),t.jsxs("div",{children:[t.jsx("p",{className:"text-xs md:text-sm text-gray-500",children:"Duration"}),t.jsx("p",{className:"text-xs md:text-sm font-semibold",children:l(e.duration)})]})]}),t.jsxs("div",{className:"flex items-center space-x-3",children:[t.jsx(he,{className:"w-5 h-5 text-purple-500"}),t.jsxs("div",{children:[t.jsx("p",{className:"text-xs md:text-sm text-gray-500",children:"Executed By"}),t.jsx("p",{className:"text-xs md:text-sm font-semibold text-xs",children:e.executedBy})]})]}),t.jsxs("div",{className:"flex items-center space-x-3",children:[t.jsx(Q,{className:"w-5 h-5 text-orange-500"}),t.jsxs("div",{children:[t.jsx("p",{className:"text-xs md:text-sm text-gray-500",children:"Environment"}),t.jsx("p",{className:"text-xs md:text-sm font-semibold text-xs",children:e.environment})]})]})]}),t.jsxs("div",{className:"flex items-center gap-4",children:[t.jsxs(X,{children:[t.jsxs(P,{children:[t.jsx(I,{asChild:!0,children:t.jsx("button",{onClick:d,className:"p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors group",children:t.jsx(xe,{className:"w-5 h-5"})})}),t.jsx(L,{children:"Download html Report"})]}),t.jsxs(P,{children:[t.jsx(I,{asChild:!0,children:t.jsx("button",{onClick:g,className:"p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors group",children:t.jsx(me,{className:"w-5 h-5"})})}),t.jsx(L,{children:"Download pdf Summary"})]}),t.jsxs(P,{children:[t.jsx(I,{asChild:!0,children:t.jsx("button",{onClick:h,className:"p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors group",children:t.jsx(fe,{className:"w-5 h-5"})})}),t.jsx(L,{children:"Share Report"})]}),r?t.jsx("div",{className:"p-2",children:t.jsx("div",{className:"w-6 h-6 rounded bg-gray-200 animate-pulse"})}):t.jsxs(P,{children:[t.jsx(I,{asChild:!0,children:t.jsxs("button",{onClick:()=>{c?N(!0):T("/settings/account?tab=external-tools")},className:`p-2 rounded-lg transition-colors relative ${c?"hover:bg-blue-50 cursor-pointer":"opacity-40 cursor-not-allowed grayscale"}`,"aria-label":c?"Create Jira issue":"Connect Jira to enable",children:[t.jsx(be,{}),c&&t.jsx("span",{className:"absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full ring-1 ring-white"})]})}),t.jsx(L,{side:"bottom",children:c?"Create Jira issue":t.jsxs("span",{className:"flex items-center gap-1.5",children:[t.jsx("span",{className:"w-1.5 h-1.5 rounded-full bg-gray-400"}),"Jira not connected — click to configure"]})})]})]}),t.jsx(Ne,{openJiraModal:b,setOpenJiraModal:()=>N(!1),testSuiteData:e})]})]}),t.jsx("div",{className:"grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-6 mb-3 mt-3",children:n.map((f,E)=>t.jsx("div",{className:"border border-gray-200 bg-background rounded-lg px-6 py-6 animate-fade-in",children:t.jsxs("div",{className:"flex items-center justify-between",children:[t.jsxs("div",{children:[t.jsx("p",{className:"text-xs md:text-sm text-gray-500 mb-1",children:f.title}),t.jsx("p",{className:"text-md md:text-2xl font-bold text-gray-900",children:f.value})]}),t.jsx("div",{className:`p-3 rounded-full ${f.color}`,children:t.jsx(f.icon,{className:"w-4 h-4 md:w-6 md:h-6"})})]})},E))}),t.jsx(it,{metrics:x}),t.jsx(O.Suspense,{fallback:t.jsx(de,{message:"Loading..."}),children:t.jsx(gt,{report:e})})]})};function yt(e){var i;const a=Number(e==null?void 0:e.totalRequests)||((i=e==null?void 0:e.requestExecutions)==null?void 0:i.length)||0,r=Number(e==null?void 0:e.successfulRequests)||0,s=Number(e==null?void 0:e.failedRequests)||0,x=Number(e==null?void 0:e.skippedRequests)||0,l=a||r+s+x,n=l?Math.round(r/l*100):0;return{total:l,successful:r,failed:s,skipped:x,successRate:n}}function wt(e,a){if(!e.length)return 0;const r=[...e].sort((x,l)=>x-l),s=Math.min(r.length-1,Math.max(0,Math.ceil(a/100*r.length)-1));return r[s]}function jt(e){const a=(e==null?void 0:e.requestExecutions)||[],r=new Map;a.forEach(l=>{const n=(l.method||"GET").toUpperCase();r.has(n)||r.set(n,[]),r.get(n).push(l)});const s=[];for(const[l,n]of r.entries()){const i=n.map(d=>Number(d.duration||0)).filter(d=>Number.isFinite(d)),o=n.length,m=n.filter(d=>d.status==="passed").length,p=n.filter(d=>d.status==="failed").length,h=i.length?Math.round(i.reduce((d,c)=>d+c,0)/i.length):0,g=Math.round(wt(i,95));s.push({method:l,total:o,success:m,failed:p,avgDurationMs:h,p95DurationMs:g})}const x=["GET","POST","PUT","PATCH","DELETE"];return s.sort((l,n)=>{const i=x.indexOf(l.method),o=x.indexOf(n.method);return i===-1&&o===-1?l.method.localeCompare(n.method):i===-1?1:o===-1?-1:i-o}),s}const Nt=({data:e,environment:a,startedQS:r,integrations:s,integrationsLoading:x})=>{var z,J;const l=((z=e.requestExecutions)==null?void 0:z.map((v,F)=>{var V,G;return{step:v.order||F+1,method:v.method,name:v.name,url:v.url,statusCode:v.responseStatusCode,requestCurl:v.requestCurl,response:v.response,responseSize:`${v.responseSize||0} bytes`,duration:`${v.duration}ms`,substitutedVariables:v.substitutedVariables||[],assertionResults:((V=v==null?void 0:v.assertionResults)==null?void 0:V.map($=>({status:$.status,category:$.category,description:$.description,field:$.field,responseSize:$.responseSize,responseStatus:$.responseStatus,responseTime:$.responseTime,type:$.type,actualValue:$.actualValue,operator:$.operator,expectedValue:$.expectedValue})))??[],status:v.status==="passed"?"success":v.status==="failed"?"fail":"skipped",extractedVars:((G=v.extractedVariables)==null?void 0:G.map($=>({key:$.name,value:$.value})))||[],errorMessage:v.status==="failed"?"Request failed":void 0}}))||[],n=e.globalVariables||{},i=((J=e.extractedVariables)==null?void 0:J.reduce((v,F)=>(v[F.name]=F.value,v),{}))||{},o=O.useMemo(()=>yt(e),[e]),m=O.useMemo(()=>jt(e),[e]),p=o.successRate>=80?"text-green-600 bg-green-100":o.successRate>=60?"text-yellow-600 bg-yellow-100":"text-red-600 bg-red-100",h=[{title:"Success Rate",value:`${o.successRate}%`,icon:_,color:p},{title:"Total Requests",value:o.total.toString(),icon:U,color:"text-blue-600 bg-blue-100"},{title:"Successful",value:o.successful.toString(),icon:pe,color:"text-green-600 bg-green-100"},{title:"Failed",value:o.failed.toString(),icon:ue,color:"text-red-600 bg-red-100"},{title:"Skipped",value:o.skipped.toString(),icon:ze,color:"text-red-600 bg-orange-100"}],g=v=>v<1e3?`${v}ms`:`${(v/1e3).toFixed(2)}s`,{currentWorkspace:d}=se();d==null||d.id;const c=s==null?void 0:s.find(v=>v.type==="jira");c==null||c.id;const[b,N]=j.useState(!1),[k,u]=j.useState({summary:"",description:"",issueType:""}),[w,S]=j.useState(!1);Y();const[,T]=oe(),{type:f,entityId:E}=te(),M=new URLSearchParams(window.location.search).get("executionId");return t.jsxs("div",{children:[t.jsxs("div",{className:"border border-gray-200 bg-background rounded-lg px-6 py-3 animate-fade-in mt-3",children:[t.jsxs("div",{className:"flex justify-between items-start mb-6",children:[t.jsxs("div",{children:[t.jsx("h1",{className:"text-xl md:text-3xl font-bold text-gray-900 mb-2 break-words",children:e.name}),t.jsx("p",{className:"text-gray-600",children:e.description||"Request chain execution flow with variable extraction and data flow analysis"})]}),t.jsx("div",{children:t.jsx("img",{src:le,alt:"Optraflow logo",className:"max-h-[50px] w-auto object-contain"})})]}),t.jsxs("div",{className:"grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-3",children:[t.jsxs("div",{className:"flex items-center space-x-3",children:[t.jsx(ge,{className:"w-5 h-5 text-blue-500"}),t.jsxs("div",{children:[t.jsx("p",{className:"text-sm text-gray-500",children:"Execution Date"}),t.jsx("p",{className:"text-sm font-semibold",children:(()=>{const{dateTime:v,tz:F}=H(e.lastExecutionDate);return`${v}, ${F}`})()})]})]}),t.jsxs("div",{className:"flex items-center space-x-3",children:[t.jsx(U,{className:"w-5 h-5 text-green-500"}),t.jsxs("div",{children:[t.jsx("p",{className:"text-sm text-gray-500",children:"Duration"}),t.jsx("p",{className:"font-semibold",children:g((e==null?void 0:e.duration)||0)})]})]}),t.jsxs("div",{className:"flex items-center space-x-3",children:[t.jsx(he,{className:"w-5 h-5 text-purple-500"}),t.jsxs("div",{children:[t.jsx("p",{className:"text-sm text-gray-500",children:"Executed By"}),t.jsx("p",{className:"font-semibold text-xs",children:e.executedBy})]})]}),t.jsxs("div",{className:"flex items-center space-x-3",children:[t.jsx(Q,{className:"w-5 h-5 text-orange-500"}),t.jsxs("div",{children:[t.jsx("p",{className:"text-sm text-gray-500",children:"Environment"}),t.jsx("p",{className:"font-semibold text-xs",children:e==null?void 0:e.environment})]})]})]}),t.jsxs("div",{className:"flex flex-wrap items-center gap-2",children:[t.jsxs(X,{children:[t.jsx(rt,{reportData:e}),t.jsx(nt,{reportData:e}),t.jsxs(P,{children:[t.jsx(I,{asChild:!0,children:t.jsx("button",{onClick:()=>ye(E,M||""),className:"p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors group",children:t.jsx(fe,{className:"w-5 h-5"})})}),t.jsx(L,{children:"Share Report"})]}),t.jsxs(P,{children:[t.jsx(I,{asChild:!0,children:t.jsxs("button",{onClick:()=>{c?N(!0):T("/settings/account?tab=external-tools")},className:`p-2 rounded-lg transition-colors relative ${c?"hover:bg-blue-50 cursor-pointer":"opacity-40 cursor-not-allowed grayscale"}`,"aria-label":c?"Create Jira issue":"Connect Jira to enable",children:[t.jsx(be,{}),c&&t.jsx("span",{className:"absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full ring-1 ring-white"})]})}),t.jsx(L,{side:"bottom",children:c?"Create Jira issue":t.jsxs("span",{className:"flex items-center gap-1.5",children:[t.jsx("span",{className:"w-1.5 h-1.5 rounded-full bg-gray-400"}),"Jira not connected — click to configure"]})})]})]}),t.jsx(Ne,{openJiraModal:b,setOpenJiraModal:()=>N(!1),testSuiteData:e})]})]}),t.jsx("div",{className:"grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 md:gap-6 mb-3 mt-3",children:h.map((v,F)=>t.jsx("div",{className:"border border-gray-200 bg-background rounded-lg px-6 py-6 animate-fade-in",children:t.jsxs("div",{className:"flex items-center justify-between",children:[t.jsxs("div",{children:[t.jsx("p",{className:"text-sm text-gray-500 mb-1",children:v.title}),t.jsx("p",{className:"text-2xl font-bold text-gray-900",children:v.value})]}),t.jsx("div",{className:`p-3 rounded-full ${v.color}`,children:t.jsx(v.icon,{className:"w-6 h-6"})})]})},F))}),t.jsx(ot,{metrics:m}),t.jsx(pt,{steps:l}),t.jsx("div",{className:"bg-[#FAFAFA]",children:t.jsx(ut,{globalVariables:n,extractedVariables:i})})]})},Ot=()=>{const{type:e,entityId:a}=te(),r=ht(),s=r.get("env")||"Unknown",x=r.get("started"),l=r.get("executionId"),{currentWorkspace:n}=se(),i=j.useRef(null),{data:o,isLoading:m}=Ce({queryKey:["execution-report",a,e,l],queryFn:async()=>{if(!a||!e||!l||!(n!=null&&n.id))throw new Error("Missing required parameters");return e==="test_suite"?ie.getTestSuiteReport(a,l,n.id):ie.getRequestChainReport(a,l,n.id)},enabled:!!a&&!!e&&!!l&&!!(n!=null&&n.id)}),p=n==null?void 0:n.id,[h,g]=j.useState([]),[d,c]=j.useState(null),[b,N]=j.useState(!0);return j.useEffect(()=>{p&&(N(!0),ve(p).then(k=>g(k)).catch(k=>c(k.message)).finally(()=>N(!1)))},[p]),j.useEffect(()=>{typeof window>"u"||e==="test_suite"&&(o!=null&&o.data)&&(window.__REPORT_DATA__=o.data)},[e,o]),t.jsxs("div",{className:"mx-auto p-1 sm:p-1",ref:i,children:[t.jsx("header",{className:"border border-gray-200 bg-background rounded-lg px-6 py-4 animate-fade-in",children:t.jsx("div",{className:"flex items-center justify-between",children:t.jsx("div",{children:t.jsx("h2",{className:"text-2xl font-semibold text-foreground",children:e==="test_suite"?"Test Suite Report":"Request Chain Report"})})})}),m?t.jsx(de,{message:"Loading Report"}):o!=null&&o.data?e==="test_suite"?t.jsx(vt,{data:o.data,integrations:h,integrationsLoading:b}):t.jsx(Nt,{data:o.data,environment:s,startedQS:x,integrations:h,integrationsLoading:b}):t.jsx("div",{className:"text-center py-8",children:t.jsx("p",{className:"text-gray-500",children:"No report data available"})})]})};export{Ot as default};
