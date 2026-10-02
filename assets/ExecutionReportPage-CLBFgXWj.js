const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/pdf-utils-C2-73oHn.js","assets/vendor-7EzcLXMk.js","assets/vendor-Cd6H9538.css","assets/RequestChainExecutionFlow-BsuK6kFW.js","assets/badge-CNB90qPv.js","assets/index-FSgJIUOl.js","assets/tanstack-CREO3szZ.js","assets/radix-ui-DVhjBwIM.js","assets/icons-BW2_FnMt.js","assets/router-DpaPmXr1.js","assets/index-CwlbHYIe.css","assets/tabs-CcLZIWSJ.js","assets/VariableTable-Bmm7jfIx.js","assets/button-CXevCU87.js","assets/select-V8TJfK8O.js","assets/curlImporter-CVYXbLaX.js","assets/VariablesAndDataFlow-wfl5qyMN.js","assets/card-P86twICu.js","assets/RequestGrouping-DQm6okbg.js"])))=>i.map(i=>d[i]);
import{E as Se,_ as V}from"./pdf-utils-C2-73oHn.js";import{j as t,aY as Re,r as j,R as U}from"./vendor-7EzcLXMk.js";import{a as ae,u as me}from"./router-DpaPmXr1.js";import{b as Ee}from"./tanstack-CREO3szZ.js";import{a as W,e as ie}from"./exportDate-B8z_8Rg9.js";import{L as pe}from"./OptraLogo-Cw5cE5z2.js";import{o as Y,z as Q,T as L,j as I,k as A,l as ue}from"./index-FSgJIUOl.js";import{az as ge,D as X,i as _,aq as J,c2 as le,T as Me,F as ne,z as re,aL as oe,X as ze,g as ee,ac as de,E as Fe,I as he,p as De,h as fe,aE as be,s as ve,bb as ye,bk as we,ab as Le,c3 as Ie}from"./icons-BW2_FnMt.js";import{u as Z}from"./useWorkspace-WBCHNwLC.js";import{J as je}from"./JiraIcon-oIrwMziy.js";import{g as Ne,n as Ae}from"./integrationTools.service-DF-iKyZZ.js";import{I as Pe}from"./input-92WIIuw3.js";import{T as Be}from"./textarea-0-LiiN-8.js";import{B as te}from"./button-CXevCU87.js";import{D as Oe,a as Ue,b as _e,c as qe}from"./dialog-Dmn-EhDJ.js";import"./radix-ui-DVhjBwIM.js";import"./collectionStore-CJc6OyJL.js";const Te=(e,a)=>{const n=`${window.location.origin}/executions/report/test_suite/${e}?executionId=${a}`;navigator.share?navigator.share({title:"Test Suite Report",text:"View this comprehensive API test suite report",url:n}).catch(console.error):navigator.clipboard?navigator.clipboard.writeText(n).then(()=>alert("Shareable link copied to clipboard!")).catch(()=>prompt("Copy this shareable link:",n)):prompt("Copy this shareable link:",n)},He=(e,a,n={})=>{const s=window.__REPORT_DATA__;if(!s){alert("Report data not available for export");return}const c=ct(s,e,{codeTheme:n.codeTheme??"dark"}),o=new Blob([c],{type:"text/html"}),r=URL.createObjectURL(o),i=document.createElement("a");i.href=r,i.download=a,document.body.appendChild(i),i.click(),i.remove(),URL.revokeObjectURL(r)},C=e=>String(e??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;"),Je=e=>{if(e==null)return"";if(typeof e=="object")try{return JSON.stringify(e,null,2)}catch{return String(e)}try{return JSON.stringify(JSON.parse(String(e)),null,2)}catch{return String(e)}},Ge=e=>`${((e??0)/1e3).toFixed(2)}s`,Ve=e=>{if(!e)return"0 B";const a=1024,n=["B","KB","MB","GB"],s=Math.floor(Math.log(e)/Math.log(a));return`${parseFloat((e/Math.pow(a,s)).toFixed(2))} ${n[s]}`},$e=e=>{const a={GET:"bg-blue-100 text-blue-800 border-blue-200",POST:"bg-green-100 text-green-800 border-green-200",PUT:"bg-yellow-100 text-yellow-800 border-yellow-200",DELETE:"bg-red-100 text-red-800 border-red-200",PATCH:"bg-purple-100 text-purple-800 border-purple-200",OPTIONS:"bg-gray-100 text-gray-800 border-gray-200"};return a[(e||"").toUpperCase()]||a.OPTIONS},We=e=>({passed:"bg-green-100 text-green-800 border-green-200",failed:"bg-red-100 text-red-800 border-red-200",skipped:"bg-yellow-100 text-yellow-800 border-yellow-200"})[e]||"bg-gray-100 text-gray-800 border-gray-200",Ke=e=>({critical:"bg-red-600 text-white",high:"bg-orange-600 text-white",medium:"bg-yellow-600 text-white",low:"bg-blue-600 text-white"})[e]||"bg-gray-600 text-white",ke=e=>{try{const a=new URL(e),n=`${a.protocol}//${a.host.toLowerCase()}`,s=a.pathname.replace(/\/$/,"");return`${n}${s}${a.search}`}catch{return(e||"").trim().replace(/\/$/,"")}},Ye=e=>{if(e==null)return null;if(typeof e=="object")return(e==null?void 0:e.statusCode)!=null?String(e.statusCode):null;try{const a=JSON.parse(e);return(a==null?void 0:a.statusCode)!=null?String(a.statusCode):null}catch{return null}},Qe=e=>{var c;const a=((c=e.expectedResponse)==null?void 0:c.status)!=null?String(e.expectedResponse.status):null,n=Ye(e.response);if(e.status!=="failed")return{message:"",expected:a,actual:n};const s=(e.errorMessage??"").trim();return s?{message:s,expected:a,actual:n}:a!==null&&n!==null?{message:`Expected status ${a}, but got ${n}`,expected:a,actual:n}:{message:"N/A",expected:null,actual:null}},Xe=e=>{const{message:a,expected:n,actual:s}=Qe(e);if(!(a||n!==null&&s!==null))return"";const o=e.status==="failed",r=e.status==="passed",i=o?"border:1px solid #fecaca;background:#fef2f2;border-radius:8px;margin-bottom:16px;overflow:hidden;":r?"border:1px solid #bbf7d0;background:#f0fdf4;border-radius:8px;margin-bottom:16px;overflow:hidden;":"border:1px solid #fde68a;background:#fefce8;border-radius:8px;margin-bottom:16px;overflow:hidden;",l=o?"#fecaca":r?"#bbf7d0":"#fde68a",p=o?"❌":r?"✅":"⚠️",m=o?"FAILURE REASON":r?"STATUS CHECK":"TEST SUMMARY",h=o?"#991b1b":r?"#166534":"#92400e",g=o?"#991b1b":r?"#166534":"#92400e",k=n!==null&&s!==null?`<div style="display:flex;flex-wrap:wrap;align-items:center;gap:10px;font-size:13px;font-weight:500;">
          <div style="display:flex;align-items:center;gap:6px;">
            <span style="width:8px;height:8px;border-radius:50%;background:#22c55e;display:inline-block;flex-shrink:0;"></span>
            <span style="color:#6b7280;">Expected</span>
            <span style="display:inline-flex;align-items:center;padding:2px 10px;border-radius:4px;font-size:13px;font-weight:700;background:#dcfce7;color:#166534;border:1px solid #bbf7d0;">${n}</span>
          </div>
          <span style="color:#9ca3af;font-size:16px;">→</span>
          <div style="display:flex;align-items:center;gap:6px;">
            <span style="width:8px;height:8px;border-radius:50%;background:${o?"#ef4444":"#22c55e"};display:inline-block;flex-shrink:0;"></span>
            <span style="color:#6b7280;">Actual</span>
            <span style="${o?"display:inline-flex;align-items:center;padding:2px 10px;border-radius:4px;font-size:13px;font-weight:700;background:#fef2f2;color:#991b1b;border:1px solid #fecaca;":"display:inline-flex;align-items:center;padding:2px 10px;border-radius:4px;font-size:13px;font-weight:700;background:#dcfce7;color:#166534;border:1px solid #bbf7d0;"}">${s}</span>
          </div>
        </div>`:"",u=a?`<p style="font-size:14px;font-weight:500;color:${g};margin:0 0 ${k?"12px":"0"} 0;word-break:break-word;">${C(a)}</p>`:"";return`
  <div style="${i}">
    <div style="padding:10px 16px;border-bottom:1px solid ${l};display:flex;align-items:center;gap:8px;">
      <span style="font-size:14px;">${p}</span>
      <span style="font-size:11px;font-weight:700;letter-spacing:0.08em;color:${h};">${m}</span>
    </div>
    <div style="padding:12px 16px;">
      ${u}
      ${k}
    </div>
  </div>`},Ze=e=>{var c,o,r,i,l,p,m;const a=[...((c=e.positiveTests)==null?void 0:c.apis)??[],...((o=e.negativeTests)==null?void 0:o.apis)??[],...((r=e.functionalTests)==null?void 0:r.apis)??[],...((i=e.semanticTests)==null?void 0:i.apis)??[],...((l=e.edgeCaseTests)==null?void 0:l.apis)??[],...((p=e.securityTests)==null?void 0:p.apis)??[],...((m=e.advancedSecurityTests)==null?void 0:m.apis)??[]];if(a.length)return a;const n=["positiveTests","negativeTests","functionalTests","semanticTests","edgeCaseTests","securityTests","advancedSecurityTests"],s=[];for(const h of e.requests??[])for(const g of n){const d=h[g];for(const x of(d==null?void 0:d.testCases)??[])s.push({...x,method:x.method||h.method,url:x.url||h.url})}return s},et=e=>{const a={};for(const n of e){const s=ke(n.url||"");a[s]||(a[s]={key:s,endpoint:n.url,methods:{},total:0,passed:0,failed:0,skipped:0,avgDuration:0});const c=a[s],o=(n.method||"").toUpperCase();c.methods[o]||(c.methods[o]={method:o,testCases:[],total:0,passed:0,failed:0,skipped:0,avgDuration:0});const r=c.methods[o];r.testCases.push(n),r.total++,n.status==="passed"?r.passed++:n.status==="failed"?r.failed++:n.status==="skipped"&&r.skipped++,c.total++,n.status==="passed"?c.passed++:n.status==="failed"?c.failed++:n.status==="skipped"&&c.skipped++}return Object.values(a).forEach(n=>{Object.values(n.methods).forEach(c=>{const o=c.testCases.reduce((r,i)=>r+(i.duration||0),0);c.avgDuration=c.total?Math.round(o/c.total):0});const s=Object.values(n.methods).flatMap(c=>c.testCases).reduce((c,o)=>c+(o.duration||0),0);n.avgDuration=n.total?Math.round(s/n.total):0}),Object.values(a)},tt=(e,a)=>a?Math.round(e/a*100):0,st=e=>{const a=e.length,n=new Set(e.map(x=>ke(x.url))).size,s=e.map(x=>Number(x.duration||0)).filter(x=>Number.isFinite(x)),c=s.length?Math.min(...s):0,o=s.length?Math.max(...s):0,r=s.length?Math.round(s.reduce((x,f)=>x+f,0)/s.length):0,i=e.reduce((x,f)=>x+Number(f.responseSize||0),0),l={};e.forEach(x=>{const f=(x.method||"").toUpperCase();l[f]=(l[f]||0)+1});const p={};e.forEach(x=>{if(x.statusCode!=null){const f=String(x.statusCode);p[f]=(p[f]||0)+1}});const m={};e.forEach(x=>{if(x.status==="failed"){const f=x.category||"Failed";m[f]=(m[f]||0)+1}});const g=[...e].sort((x,f)=>(f.duration||0)-(x.duration||0)).slice(0,5).map(x=>({id:x.id,name:x.name,method:x.method,url:x.url,duration:x.duration||0})),d=[...e].sort((x,f)=>(x.duration||0)-(f.duration||0)).slice(0,5).map(x=>({id:x.id,name:x.name,method:x.method,url:x.url,duration:x.duration||0}));return{totalRequests:a,uniqueEndpoints:n,averageResponseTime:r,minResponseTime:c,maxResponseTime:o,totalDataTransferred:i,requestsByMethod:l,statusCodeDistribution:p,errorTypes:m,slowestRequests:g,fastestRequests:d}},it=e=>{const a=Object.entries(e.requestsByMethod).map(([i,l])=>`
    <div class="flex items-center justify-between">
      <span class="inline-flex items-center px-2 py-1 rounded text-xs font-medium ${$e(i)}">${i}</span>
      <div class="flex items-center space-x-2">
        <div class="w-20 bg-gray-200 rounded-full h-2">
          <div class="bg-blue-600 h-2 rounded-full" style="width:${l/Math.max(e.totalRequests,1)*100}%"></div>
        </div>
        <span class="text-sm font-semibold text-gray-900 w-8">${l}</span>
      </div>
    </div>`).join(""),n=Object.entries(e.statusCodeDistribution).map(([i,l])=>`
    <div class="flex items-center justify-between">
      <span class="inline-flex items-center px-2 py-1 rounded text-xs font-medium ${parseInt(i,10)>=500?"bg-red-100 text-red-800":parseInt(i,10)>=400?"bg-yellow-100 text-yellow-800":parseInt(i,10)>=300?"bg-blue-100 text-blue-800":"bg-green-100 text-green-800"}">${i}</span>
      <div class="flex items-center space-x-2">
        <div class="w-20 bg-gray-200 rounded-full h-2">
          <div class="bg-blue-600 h-2 rounded-full" style="width:${l/Math.max(e.totalRequests,1)*100}%"></div>
        </div>
        <span class="text-sm font-semibold text-gray-900 w-8">${l}</span>
      </div>
    </div>`).join(""),s=Object.values(e.errorTypes).reduce((i,l)=>i+l,0),c=Object.keys(e.errorTypes).length>0?`
      <div class="bg-white rounded-lg shadow-md p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <i data-lucide="alert-triangle" class="w-5 h-5 mr-2 text-red-600"></i>
          Error Types
        </h3>
        <div class="space-y-3">
          ${Object.entries(e.errorTypes).map(([i,l])=>`
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-700 truncate flex-1 mr-2">${C(i)}</span>
              <div class="flex items-center space-x-2">
                <div class="w-16 bg-gray-200 rounded-full h-2">
                  <div class="bg-red-600 h-2 rounded-full" style="width:${l/Math.max(s,1)*100}%"></div>
                </div>
                <span class="text-sm font-semibold text-gray-900 w-6">${l}</span>
              </div>
            </div>`).join("")}
        </div>
      </div>`:"",o=e.slowestRequests.map((i,l)=>`
    <div class="flex items-center justify-between p-3 bg-red-50 rounded-lg">
      <div class="flex-1 min-w-0">
        <p class="text-sm font-medium text-gray-900 truncate">${C(i.name)}</p>
        <p class="text-xs text-gray-500 truncate">${C(i.method)} ${C(i.url)}</p>
      </div>
      <div class="text-right">
        <p class="text-sm font-semibold text-red-600">${i.duration}ms</p>
        <p class="text-xs text-gray-500">#${l+1}</p>
      </div>
    </div>`).join(""),r=e.fastestRequests.map((i,l)=>`
    <div class="flex items-center justify-between p-3 bg-green-50 rounded-lg">
      <div class="flex-1 min-w-0">
        <p class="text-sm font-medium text-gray-900 truncate">${C(i.name)}</p>
        <p class="text-xs text-gray-500 truncate">${C(i.method)} ${C(i.url)}</p>
      </div>
      <div class="text-right">
        <p class="text-sm font-semibold text-green-600">${i.duration}ms</p>
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
          <p class="text-2xl font-bold text-gray-900">${Ve(e.totalDataTransferred)}</p>
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

${n?`
<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
  <div class="bg-white rounded-lg shadow-md p-6">
    <h3 ...>Status Code Distribution</h3>
    <div class="space-y-3">${n}</div>
  </div>
  ${c}
</div>`:c?`
<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
  ${c}
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
        <div class="space-y-3">${r}</div>
      </div>
    </div>
  </div>`},at=(e,a)=>`
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
          ${(()=>{const{dateTime:n,tz:s}=W(Date.parse(e.lastExecutionDate));return`${n}, ${s}`})()}</p></div>
      </div>
      <div class="flex items-center space-x-3">
        <i data-lucide="clock" class="w-5 h-5 text-green-500"></i>
        <div><p class="text-sm text-gray-500">Duration</p><p class="font-semibold">${Ge(e==null?void 0:e.duration)}</p></div>
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
`,nt=(e,a)=>{const n=a.length||Number(e.totalTestCases||0),s=(a.length?a.filter(i=>i.status==="passed").length:0)||Number(e.successfulTestCases||0),c=(a.length?a.filter(i=>i.status==="failed").length:0)||Number(e.failedTestCases||0),o=n?Math.round(s/n*100):e.successRate||0,r=o>=80?"text-green-600 bg-green-100":o>=60?"text-yellow-600 bg-yellow-100":"text-red-600 bg-red-100";return`
  <div class="grid grid-cols-2 md:grid-cols-4 gap-6 mb-3 mt-3">
    ${K("Success Rate",`${o}%`,"trending-up",r)}
    ${K("Total Test Cases",`${n}`,"clock","text-blue-600 bg-blue-100")}
    ${K("Passed",`${s}`,"check-circle","text-green-600 bg-green-100")}
    ${K("Failed",`${c}`,"x-circle","text-red-600 bg-red-100")}
  </div>`},K=(e,a,n,s)=>`
  <div class="border border-gray-200 bg-white rounded-lg px-6 py-6">
    <div class="flex items-center justify-between">
      <div><p class="text-sm text-gray-500 mb-1">${e}</p><p class="text-2xl font-bold text-gray-900">${a}</p></div>
      <div class="p-3 rounded-full ${s}"><i data-lucide="${n}" class="w-6 h-6"></i></div>
    </div>
  </div>
`,se=(e,a)=>`
  <div class="rounded border border-gray-700 bg-gray-800 overflow-hidden">
    <pre class="m-0 p-4 overflow-x-auto scrollbar-thin"><code class="language-${e}">${C(a)}</code></pre>
  </div>
`,rt=e=>{const a=We(e.status),n=Ke(e.severity),s=`tc-${e.id}`;return`
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
              <span class="inline-flex items-center px-2 py-1 rounded text-xs font-medium ${n}">${String(e.severity).toUpperCase()}</span>
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
        ${Xe(e)}

        <!-- ② Endpoint -->
        <div>
          <h4 class="font-medium text-gray-900 mb-2">Endpoint</h4>
          ${se("http",`${(e.method||"").toUpperCase()} ${e.url}`)}
        </div>

        <!-- ③ Request cURL -->
        <div>
          <h4 class="font-medium text-gray-900 mb-2">Request cURL</h4>
          ${se("bash",e.requestCurl)}
        </div>

        <!-- ④ Response -->
        <div>
          <h4 class="font-medium text-gray-900 mb-2">Response</h4>
          ${se("json",Je(e.response))}
        </div>

      </div>
    </div>
  </div>`},lt=e=>{const a=tt(e.passed,e.total),n=a>=80?"text-green-600":a>=60?"text-yellow-600":"text-red-600",s=`url-${dt(e.key)}`,c=Object.values(e.methods).map(o=>`
    <div class="space-y-3">
      <div class="flex items-center gap-3">
        <span class="inline-flex items-center px-2 py-1 rounded text-xs font-medium border ${$e(o.method)}">${o.method}</span>
      </div>
      <div class="space-y-3">
        ${o.testCases.map(r=>rt(r)).join("")}
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
          <div class="font-semibold ${n}">${a}%</div>
        </div>
      </div>
    </div>
    <div id="${s}" class="border-t border-gray-200 bg-white hidden"><div class="p-4 space-y-6">${c}</div></div>
  </div>`},ot=e=>{const a=et(e);return a.length?`
    <div class="space-y-4">
      <div class="bg-white rounded-lg shadow-md p-6">
        <h2 class="text-xl font-bold text-gray-900 mb-4 flex items-center">
          <i data-lucide="globe" class="w-6 h-6 mr-2 text-blue-600"></i>
          API Endpoints (${a.length} endpoints)
        </h2>
        <div class="space-y-4">${a.map(n=>lt(n)).join("")}</div>
      </div>
    </div>`:'<div class="bg-white rounded-lg shadow-md p-8 text-center"><i data-lucide="globe" class="w-12 h-12 text-gray-400 mx-auto mb-4"></i><p class="text-gray-500">No API requests found</p></div>'},dt=e=>{let a=0;for(let n=0;n<e.length;n++)a=(a<<5)-a+e.charCodeAt(n)|0;return`h${Math.abs(a)}`},ct=(e,a,n)=>{let s=null;const c=document.getElementById(a)||document.body,o=c==null?void 0:c.querySelector('img[alt="Optraflow logo"]');o!=null&&o.src&&(s=o.src);const r=Ze(e),i=st(r),l=n.codeTheme==="dark"?"https://unpkg.com/prismjs@1/themes/prism-okaidia.css":"https://unpkg.com/prismjs@1/themes/prism.css";return`<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${C(e.name)} – Report</title>
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
    ${at(e,s)}
    ${nt(e,r)}
    ${it(i)}
    ${ot(r)}
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
</html>`},xt=({metrics:e})=>{const a=i=>{if(!i)return"0 B";const l=1024,p=["B","KB","MB","GB"],m=Math.min(Math.floor(Math.log(i)/Math.log(l)),p.length-1);return`${parseFloat((i/Math.pow(l,m)).toFixed(2))} ${p[m]}`},n=i=>`${Number(i??0).toFixed(0)}ms`,s=i=>{switch((i||"").toUpperCase()){case"GET":return"bg-blue-100 text-blue-800";case"POST":return"bg-green-100 text-green-800";case"PUT":return"bg-yellow-100 text-yellow-800";case"DELETE":return"bg-red-100 text-red-800";case"PATCH":return"bg-purple-100 text-purple-800";default:return"bg-gray-100 text-gray-800"}},c=i=>{const l=parseInt(i,10);return l>=200&&l<300?"bg-green-100 text-green-800":l>=300&&l<400?"bg-blue-100 text-blue-800":l>=400&&l<500?"bg-yellow-100 text-yellow-800":l>=500?"bg-red-100 text-red-800":"bg-gray-100 text-gray-800"},o=Math.max(e.totalRequests||0,1),r=Math.max(Object.values(e.errorTypes||{}).reduce((i,l)=>i+l,0),1);return t.jsxs("div",{className:"space-y-4 mb-4",children:[t.jsxs("div",{className:"bg-background rounded-lg border border-gray-200 p-3 md:p-6",children:[t.jsx("h2",{className:"text-md md:text-xl font-bold text-gray-900 mb-4 flex items-center",children:"Request-Level Metrics"}),t.jsxs("div",{className:"grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6",children:[t.jsxs("div",{className:"text-center",children:[t.jsx("div",{className:"flex items-center justify-center w-8 h-8 md:w-12 md:h-12 bg-blue-100 rounded-full mx-auto mb-2",children:t.jsx(ge,{className:"w-4 h-4 md:w-6 md:h-6 text-blue-600"})}),t.jsx("p",{className:"text-base md:text-2xl font-bold text-gray-900",children:e.totalRequests}),t.jsx("p",{className:"text-xs md:text-sm text-gray-500",children:"Total Requests"})]}),t.jsxs("div",{className:"text-center",children:[t.jsx("div",{className:"flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mx-auto mb-2",children:t.jsx(X,{className:"w-6 h-6 text-green-600"})}),t.jsx("p",{className:"text-md md:text-2xl font-bold text-gray-900",children:e.uniqueEndpoints}),t.jsx("p",{className:"text-xs md:text-sm text-gray-500",children:"Unique Endpoints"})]}),t.jsxs("div",{className:"text-center",children:[t.jsx("div",{className:"flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mx-auto mb-2",children:t.jsx(_,{className:"w-6 h-6 text-purple-600"})}),t.jsx("p",{className:"text-md md:text-2xl font-bold text-gray-900",children:n(e.averageResponseTime)}),t.jsx("p",{className:"text-xs md:text-sm text-gray-500",children:"Avg Response Time"})]}),t.jsxs("div",{className:"text-center",children:[t.jsx("div",{className:"flex items-center justify-center w-12 h-12 bg-orange-100 rounded-full mx-auto mb-2",children:t.jsx(J,{className:"w-6 h-6 text-orange-600"})}),t.jsx("p",{className:"text-md md:text-2xl font-bold text-gray-900",children:a(e.totalDataTransferred)}),t.jsx("p",{className:"text-xs md:text-sm text-gray-500",children:"Data Transferred"})]})]})]}),t.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6",children:[t.jsxs("div",{className:"bg-white rounded-lg border border-gray-200 p-3 md:p-6",children:[t.jsx("h3",{className:"text-base md:text-xl font-semibold text-gray-900 mb-4",children:"Response Time Range"}),t.jsxs("div",{className:"space-y-4",children:[t.jsxs("div",{className:"flex items-center justify-between",children:[t.jsxs("div",{className:"flex items-center space-x-2",children:[t.jsx(le,{className:"w-4 h-4 text-green-600"}),t.jsx("span",{className:"text-sm text-gray-600",children:"Fastest"})]}),t.jsx("span",{className:"font-semibold text-green-600",children:n(e.minResponseTime)})]}),t.jsxs("div",{className:"flex items-center justify-between",children:[t.jsxs("div",{className:"flex items-center space-x-2",children:[t.jsx(_,{className:"w-4 h-4 text-blue-600"}),t.jsx("span",{className:"text-sm text-gray-600",children:"Average"})]}),t.jsx("span",{className:"font-semibold text-blue-600",children:n(e.averageResponseTime)})]}),t.jsxs("div",{className:"flex items-center justify-between",children:[t.jsxs("div",{className:"flex items-center space-x-2",children:[t.jsx(J,{className:"w-4 h-4 text-red-600"}),t.jsx("span",{className:"text-sm text-gray-600",children:"Slowest"})]}),t.jsx("span",{className:"font-semibold text-red-600",children:n(e.maxResponseTime)})]})]})]}),t.jsxs("div",{className:"bg-background rounded-lg border border-gray-200 p-3 md:p-6",children:[t.jsx("h3",{className:"text-base md:text-xl font-semibold text-gray-900 mb-4",children:"HTTP Methods"}),t.jsx("div",{className:"space-y-3",children:Object.entries(e.requestsByMethod||{}).map(([i,l])=>t.jsxs("div",{className:"flex items-center justify-between",children:[t.jsx("span",{className:`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${s(i)}`,children:i}),t.jsxs("div",{className:"flex items-center space-x-2",children:[t.jsx("div",{className:"w-16 md:w-24 bg-gray-200 rounded-full h-2",children:t.jsx("div",{className:"bg-blue-600 h-2 rounded-full",style:{width:`${l/o*100}%`}})}),t.jsx("span",{className:"text-sm font-semibold text-gray-900 w-8",children:l})]})]},i))})]})]}),t.jsxs("div",{className:"grid grid-cols-1 lg:grid-cols-2 gap-6",children:[t.jsxs("div",{className:"bg-background rounded-lg border border-gray-200 p-3 md:p-6",children:[t.jsx("h3",{className:"text-md md:text-xl font-semibold text-gray-900 mb-4",children:"Status Code Distribution"}),t.jsx("div",{className:"space-y-3",children:Object.entries(e.statusCodeDistribution||{}).map(([i,l])=>t.jsxs("div",{className:"flex items-center justify-between",children:[t.jsx("span",{className:`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${c(i)}`,children:i}),t.jsxs("div",{className:"flex items-center space-x-2",children:[t.jsx("div",{className:"w-16 md:w-24 bg-gray-200 rounded-full h-2",children:t.jsx("div",{className:"bg-blue-600 h-2 rounded-full",style:{width:`${l/o*100}%`}})}),t.jsx("span",{className:"text-sm font-semibold text-gray-900 w-8",children:l})]})]},i))})]}),Object.keys(e.errorTypes||{}).length>0&&t.jsxs("div",{className:"bg-background rounded-lg border border-gray-200 p-3 md:p-6",children:[t.jsxs("h3",{className:"text-md md:text-xl font-semibold text-gray-900 mb-4 flex items-center",children:[t.jsx(Me,{className:"w-5 h-5 mr-2 text-red-600"}),"Error Types"]}),t.jsx("div",{className:"space-y-3",children:Object.entries(e.errorTypes||{}).map(([i,l])=>t.jsxs("div",{className:"flex items-center justify-between",children:[t.jsx("span",{className:"text-sm text-gray-700 truncate flex-1 mr-2 min-w-0",children:i}),t.jsxs("div",{className:"flex items-center space-x-2",children:[t.jsx("div",{className:"w-16 bg-gray-200 rounded-full h-2",children:t.jsx("div",{className:"bg-red-600 h-2 rounded-full",style:{width:`${l/r*100}%`}})}),t.jsx("span",{className:"text-sm font-semibold text-gray-900 w-6",children:l})]})]},i))})]})]}),t.jsxs("div",{className:"grid grid-cols-1 lg:grid-cols-2 gap-6 ",children:[t.jsxs("div",{className:"bg-background rounded-lg border border-gray-200 p-3 md:p-6",children:[t.jsxs("h3",{className:"text-md md:text-xl font-semibold text-gray-900 mb-4 flex items-center",children:[t.jsx(J,{className:"w-5 h-5 mr-2 text-red-600"}),"Slowest Requests"]}),t.jsx("div",{className:"space-y-3",children:e.slowestRequests.slice(0,1).map((i,l)=>t.jsxs("div",{className:"flex items-center justify-between p-3 bg-red-50 rounded-lg",children:[t.jsxs("div",{className:"flex-1 min-w-0",children:[t.jsx("p",{className:"text-sm font-medium text-gray-900 truncate",children:i.name}),t.jsxs("p",{className:"text-xs text-gray-500 truncate",children:[i.method," ",i.url]})]}),t.jsxs("div",{className:"text-right",children:[t.jsx("p",{className:"text-sm font-semibold text-red-600",children:n(i.duration)}),t.jsxs("p",{className:"text-xs text-gray-500",children:["#",l+1]})]})]},i.id))})]}),t.jsxs("div",{className:"bg-background rounded-lg border border-gray-200 p-3 md:p-6",children:[t.jsxs("h3",{className:"text-md md:text-xl font-semibold text-gray-900 mb-4 flex items-center",children:[t.jsx(le,{className:"w-5 h-5 mr-2 text-green-600"}),"Fastest Requests"]}),t.jsx("div",{className:"space-y-3",children:e.fastestRequests.slice(0,1).map((i,l)=>t.jsxs("div",{className:"flex items-center justify-between p-3 bg-green-50 rounded-lg",children:[t.jsxs("div",{className:"flex-1 min-w-0",children:[t.jsx("p",{className:"text-sm font-medium text-gray-900 truncate",children:i.name}),t.jsxs("p",{className:"text-xs text-gray-500 truncate",children:[i.method," ",i.url]})]}),t.jsxs("div",{className:"text-right",children:[t.jsx("p",{className:"text-sm font-semibold text-green-600",children:n(i.duration)}),t.jsxs("p",{className:"text-xs text-gray-500",children:["#",l+1]})]})]},i.id))})]})]})]})};function mt(e){var T,k;const a=[];for(const u of e.requests??[]){const N=[u.positiveTests,u.negativeTests,u.functionalTests,u.semanticTests,u.edgeCaseTests,u.securityTests,u.advancedSecurityTests].filter(Boolean);for(const E of N)for(const $ of E.testCases??[])$.method||($.method=u.method),$.url||($.url=u.url),a.push($)}const n=u=>{if(u)try{return JSON.parse(u)}catch{return}};let s=0,c=0,o=Number.POSITIVE_INFINITY,r=0;const i={},l={},p={},m=[];for(const u of a){const N=n(u.response),E=N==null?void 0:N.statusCode,$=E!=null?String(E):"";$&&(l[$]=(l[$]||0)+1);const y=(u.method||"OTHER").toUpperCase();i[y]=(i[y]||0)+1;const M=((T=N==null?void 0:N.metrics)==null?void 0:T.bytesReceived)??u.responseSize??0;s+=M;const S=((k=N==null?void 0:N.metrics)==null?void 0:k.responseTime)??u.duration??0;if(c+=S,S>0&&(S<o&&(o=S),S>r&&(r=S)),u.status&&u.status.toLowerCase()!=="passed"){const z=`Failed (${$||"unknown"})`;p[z]=(p[z]||0)+1}m.push({id:u.id,name:u.name,method:y,url:u.url||"",duration:S,statusCode:E})}const h=a.length,g=h?c/h:0,d=[...m].sort((u,N)=>u.duration-N.duration),x=[...m].sort((u,N)=>N.duration-u.duration),f=new Set((e.requests??[]).map(u=>u.url)).size;return{totalRequests:h,uniqueEndpoints:f,averageResponseTime:g,minResponseTime:Number.isFinite(o)?o:0,maxResponseTime:r,totalDataTransferred:s,requestsByMethod:i,statusCodeDistribution:l,errorTypes:p,slowestRequests:x.slice(0,10),fastestRequests:d.slice(0,10)}}function pt({reportData:e}){const{toast:a}=Y(),n=l=>{const p=document.createElement("div");return p.textContent=l,p.innerHTML},s=()=>{if(e.requestExecutions.length===0)return 0;const l=e.requestExecutions.reduce((p,m)=>p+m.duration,0);return Math.round(l/e.requestExecutions.length)},c=()=>e.requestExecutions.reduce((l,p)=>l+p.responseSize,0),o=l=>{if(l===0)return"0 B";const p=1024,m=["B","KB","MB","GB"],h=Math.floor(Math.log(l)/Math.log(p));return`${parseFloat((l/Math.pow(p,h)).toFixed(2))} ${m[h]}`},r=()=>{const l=s(),p=c(),m=n,g=(()=>{const d=document.querySelector('img[alt="Optraflow logo"]');if(!(d!=null&&d.src))return"";if(d.src.startsWith("data:"))return d.src;try{const x=document.createElement("canvas");x.width=d.naturalWidth||d.width,x.height=d.naturalHeight||d.height;const f=x.getContext("2d");return f==null||f.drawImage(d,0,0),x.toDataURL("image/png")}catch{return""}})();return`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${m(e.name)} - API Test Report</title>
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
      <h1 class="header-title">${m(e.name)}</h1>
      <div class="logo-wrap">
      ${g?`<img src="${m(g)}" alt="Optraflow logo" style="height:40px; width:auto;" />`:""}
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
          <div class="meta-value">${(()=>{const{dateTime:d,tz:x}=W(Date.parse(e.lastExecutionDate));return`${d}, ${x}`})()}</div>
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
          <div class="meta-value">${m(e.executedBy)}</div>
        </div>
      </div>
      <div class="meta-item">
        <span class="meta-icon-wrap" style="color:#f59e0b;">
          <i data-lucide="database"></i>
        </span>
        <div>
          <div class="meta-label">Environment</div>
          <div class="meta-value">${m(e.environment)}</div>
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
        <div class="metric-value">${l}<span class="metric-unit">ms</span></div>
      </div>
      <div class="metric-icon" style="background:#f3e8ff; color:#7c3aed;">
        <i data-lucide="clock"></i>
      </div>
    </div>
    <div class="metric-card">
      <div>
        <div class="metric-label">Data Transferred</div>
        <div class="metric-value" style="font-size:18px">${o(p)}</div>
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
            <div class="request-name">${m(d==null?void 0:d.name)}</div>
            <span class="method-badge method-${m(d==null?void 0:d.method.toLowerCase())}">${m(d.method)}</span>
            <span class="status-badge status-${m(d==null?void 0:d.status.toLowerCase())}">${m(d.status)}</span>
          </div>
          <div class="request-url">${m(d.url)}</div>
          <div class="request-stats">
            <span><strong>Status Code:</strong> ${d==null?void 0:d.responseStatusCode}</span>
            <span><strong>Duration:</strong> ${d==null?void 0:d.duration}ms</span>
            <span><strong>Size:</strong> ${m(o(d==null?void 0:d.responseSize))}</span>
          </div>
          
          
          
          <div style="margin-top: 16px;">
            <strong style="font-size: 14px; color: #475569;">Request cURL</strong>
            <div class="code-block"><pre>${m(d.requestCurl)}</pre></div>
          </div>
          
          <div style="margin-top: 16px;">
            <strong style="font-size: 14px; color: #475569;">Response</strong>
            <div class="code-block"><pre>${m(d.response)}</pre></div>
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
</html>`},i=()=>{try{const l=r(),p=new Blob([l],{type:"text/html;charset=utf-8"}),m=URL.createObjectURL(p),h=document.createElement("a"),g=`${e.name.replace(/\s+/g,"_")}_Report_${new Date().getTime()}.html`;h.href=m,h.download=g,h.setAttribute("data-testid","download-link-html"),document.body.appendChild(h),h.click(),setTimeout(()=>{document.body.removeChild(h),URL.revokeObjectURL(m),a({title:"HTML Report Ready",description:"Your report has been downloaded successfully."})},100)}catch(l){console.error("HTML export error:",l),a({title:"Export Failed",description:"There was an error generating the HTML report.",variant:"destructive"})}};return t.jsx(Q,{children:t.jsxs(L,{children:[t.jsx(I,{asChild:!0,children:t.jsx("button",{onClick:i,"data-testid":"export-html-button",className:"p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors group",children:t.jsx(ne,{className:"w-5 h-5"})})}),t.jsx(A,{children:"Download HTML Report"})]})})}function ut({reportData:e}){const{toast:a}=Y(),n=()=>{try{const s=new Se,c=s.internal.pageSize.getWidth(),o=s.internal.pageSize.getHeight(),r=20;let i=r;s.setFontSize(20),s.setFont("helvetica","bold"),s.text(e.name,r,i),i+=8,s.setFontSize(10),s.setFont("helvetica","normal"),s.setTextColor(100,100,100),s.text("API Request Chain Execution Report",r,i),i+=15,s.setDrawColor(200,200,200),s.line(r,i,c-r,i),i+=10,s.setFontSize(12),s.setFont("helvetica","bold"),s.setTextColor(0,0,0),s.text("Execution Summary",r,i),i+=8,s.setFontSize(10),s.setFont("helvetica","normal"),[`Execution Date:  ${(()=>{const{dateTime:u,tz:N}=W(Date.parse(e.lastExecutionDate));return`${u}, ${N}`})()}`,`Duration: ${e.duration<1e3?`${e.duration}ms`:`${(e.duration/1e3).toFixed(2)}s`}`,`Executed By: ${e.executedBy}`,`Environment: ${e.environment}`].forEach(u=>{s.text(u,r+5,i),i+=6}),i+=5,s.setDrawColor(200,200,200),s.line(r,i,c-r,i),i+=10,s.setFontSize(12),s.setFont("helvetica","bold"),s.text("Performance Metrics",r,i),i+=8;const p=e.requestExecutions.length>0?Math.round(e.requestExecutions.reduce((u,N)=>u+N.duration,0)/e.requestExecutions.length):0,m=e.requestExecutions.reduce((u,N)=>u+N.responseSize,0),h=u=>u<1024?`${u} B`:u<1024*1024?`${(u/1024).toFixed(2)} KB`:`${(u/(1024*1024)).toFixed(2)} MB`;s.setFontSize(10),s.setFont("helvetica","normal");const g=r+5,d=c/2,x=(c-2*r-10)/2;s.setFillColor(240,240,240),s.rect(g-5,i-5,x,50,"F"),s.rect(d,i-5,x,50,"F"),s.setTextColor(0,0,0),s.setFont("helvetica","bold"),s.text("Total Requests",g,i),s.text("Success Rate",d+5,i),i+=7,s.setFontSize(18),s.setTextColor(33,150,243),s.text(e.totalRequests.toString(),g,i);const f=e.successRate===100?[76,175,80]:e.successRate>=80?[255,152,0]:[244,67,54];s.setTextColor(f[0],f[1],f[2]),s.text(`${e.successRate}%`,d+5,i),i+=10,s.setFontSize(10),s.setTextColor(0,0,0),s.setFont("helvetica","normal"),s.text(`Passed: ${e.successfulRequests}`,g,i),s.text(`Avg Response: ${p}ms`,d+5,i),i+=6,s.text(`Failed: ${e.failedRequests}`,g,i),s.text(`Data Transfer: ${h(m)}`,d+5,i),i+=6,s.text(`Skipped: ${e.skippedRequests}`,g,i),i+=15,s.setDrawColor(200,200,200),s.line(r,i,c-r,i),i+=10,s.setFontSize(12),s.setFont("helvetica","bold"),s.setTextColor(0,0,0),s.text("Request Execution Details",r,i),i+=8,s.setFontSize(9),s.setFont("helvetica","bold"),s.text("#",r,i),s.text("Request Name",r+10,i),s.text("Status",r+90,i),s.text("Duration",r+120,i),s.text("Status Code",r+155,i),i+=5,s.setFont("helvetica","normal"),[...e.requestExecutions].sort((u,N)=>u.order-N.order).forEach((u,N)=>{i>o-30&&(s.addPage(),i=r);const E=u.status==="passed"?[76,175,80]:u.status==="failed"?[244,67,54]:[158,158,158];s.setTextColor(0,0,0),s.text(u.order.toString(),r,i);const $=u.name.length>35?u.name.substring(0,32)+"...":u.name;s.text($,r+10,i),s.setTextColor(E[0],E[1],E[2]),s.text(u.status.toUpperCase(),r+90,i),s.setTextColor(0,0,0),s.text(`${u.duration}ms`,r+120,i),s.text(u.responseStatusCode.toString(),r+155,i),i+=6}),i+=10,i>o-30&&(s.addPage(),i=r),s.setDrawColor(200,200,200),s.line(r,i,c-r,i),i+=5,s.setFontSize(8),s.setTextColor(150,150,150),s.text(`Generated on ${Re(new Date,"MM/dd/yyyy 'at' h:mm a")} • OptraFlow API Testing Platform`,r,i);const k=`${e.name.replace(/[^a-z0-9]/gi,"_")}_Summary_${Date.now()}.pdf`;s.save(k),a({title:"PDF Summary Ready",description:`${k} has been downloaded.`})}catch(s){console.error("PDF export error:",s),a({title:"Export Failed",description:"There was an error generating the PDF. Please try again.",variant:"destructive"})}};return t.jsx(Q,{children:t.jsxs(L,{children:[t.jsx(I,{asChild:!0,children:t.jsx("button",{onClick:n,"data-testid":"export-html-button",className:"p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors group",children:t.jsx(re,{className:"w-5 h-5"})})}),t.jsx(A,{children:"Download PDF Summary"})]})})}const gt=({metrics:e})=>{const a=p=>{const m=Number(p??0);return m<1e3?`${m.toFixed(0)}ms`:`${(m/1e3).toFixed(2)}s`},n=e.reduce((p,m)=>p+(m.total||0),0),s=e.reduce((p,m)=>p+(m.success||0),0);e.reduce((p,m)=>p+(m.failed||0),0);const c=n>0?Math.round(e.reduce((p,m)=>p+(m.avgDurationMs||0)*(m.total||0),0)/n):0,o=e.length>0?Math.max(...e.map(p=>p.p95DurationMs||0)):0,r=n>0?s/n*100:0,i=`${r.toFixed(1)}%`,l=r>=80?"bg-green-100 text-green-700":r>=60?"bg-yellow-100 text-yellow-700":"bg-red-100 text-red-700";return!e||e.length===0?t.jsxs("div",{className:"bg-white rounded-lg border border-gray-200 p-6 mb-3",children:[t.jsxs("h2",{className:"text-xl font-bold text-gray-900 mb-2 flex items-center",children:[t.jsx(oe,{className:"w-6 h-6 mr-2 text-blue-600"}),"Request-Level Metrics"]}),t.jsx("p",{className:"text-gray-500 text-sm",children:"No metrics available."})]}):t.jsx("div",{className:"space-y-3 mb-3",children:t.jsxs("div",{className:"bg-white rounded-lg border border-gray-200 p-6",children:[t.jsxs("h2",{className:"text-xl font-bold text-gray-900 mb-6 flex items-center",children:[t.jsx(oe,{className:"w-6 h-6 mr-2 text-blue-600"}),"Request-Level Metrics"]}),t.jsxs("div",{className:"grid grid-cols-2 md:grid-cols-4 gap-6",children:[t.jsxs("div",{className:"text-center",children:[t.jsx("div",{className:"flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mx-auto mb-2",children:t.jsx(ge,{className:"w-6 h-6 text-blue-600"})}),t.jsx("p",{className:"text-2xl font-bold text-gray-900",children:n}),t.jsx("p",{className:"text-sm text-gray-500",children:"Total Requests"})]}),t.jsxs("div",{className:"text-center",children:[t.jsx("div",{className:`flex items-center justify-center w-12 h-12 rounded-full mx-auto mb-2 ${l}`,children:t.jsx(J,{className:"w-6 h-6"})}),t.jsx("p",{className:"text-2xl font-bold text-gray-900",children:i}),t.jsxs("p",{className:"text-sm text-gray-500",children:["Success (",s," / ",n,")"]})]}),t.jsxs("div",{className:"text-center",children:[t.jsx("div",{className:"flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mx-auto mb-2",children:t.jsx(_,{className:"w-6 h-6 text-purple-600"})}),t.jsx("p",{className:"text-2xl font-bold text-gray-900",children:a(c)}),t.jsx("p",{className:"text-sm text-gray-500",children:"Avg Response Time"})]}),t.jsxs("div",{className:"text-center",children:[t.jsx("div",{className:"flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mx-auto mb-2",children:t.jsx(X,{className:"w-6 h-6 text-green-600"})}),t.jsx("p",{className:"text-2xl font-bold text-gray-900",children:a(o)}),t.jsx("p",{className:"text-sm text-gray-500",children:"p95 Response Time"})]})]})]})})},B=()=>({total:0,passed:0,failed:0,skipped:0,apis:[]}),O=(e,a)=>{a&&(e.total+=a.total??0,e.passed+=a.passed??0,e.failed+=a.failed??0,e.skipped+=a.skipped??0,Array.isArray(a.testCases)&&a.testCases.forEach(n=>{const s={id:n.id,name:n.name,method:n.method,url:n.url,status:n.status,severity:n.severity,duration:n.duration,responseSize:n.responseSize,requestCurl:n.requestCurl,response:n.response};e.apis.push(s)}))},ht=e=>{const a=B(),n=B(),s=B(),c=B(),o=B(),r=B(),i=B();let l=0,p=0,m=0,h=0;(e.requests??[]).forEach(y=>{l+=y.totalTestCases??0,p+=y.successfulTestCases??0,m+=y.failedTestCases??0,h+=y.skippedTestCases??0,O(a,y.positiveTests),O(n,y.negativeTests),O(s,y.functionalTests),O(c,y.semanticTests),O(o,y.edgeCaseTests),O(r,y.securityTests),O(i,y.advancedSecurityTests)});const g=[...a.apis,...n.apis,...s.apis,...c.apis,...o.apis,...r.apis,...i.apis],d=g.map(y=>y.duration??0),x=g.map(y=>y.responseSize??0),f=d.length?Math.min(...d):0,T=d.length?Math.max(...d):0,k=d.length?d.reduce((y,M)=>y+M,0)/d.length:0,u=x.reduce((y,M)=>y+M,0),N=new Set(g.map(y=>`${y.method} ${y.url}`)).size,E=l>0?Math.round(p/l*100):0;return{id:e.id,name:e.name,description:e.description??"",environment:e.environment??e.environmentId??"Unknown",lastExecutionDate:e.lastExecutionDate,duration:e.duration??0,executedBy:e.executedBy??"Unknown",successRate:E,totalTestCases:l,successfulTestCases:p,failedTestCases:m,skippedTestCases:h,requestMetrics:{minResponseTime:f,maxResponseTime:T,averageResponseTime:k,totalRequests:g.length,totalDataTransferred:u,uniqueEndpoints:N},positiveTests:a,negativeTests:n,functionalTests:s,semanticTests:c,edgeCaseTests:o,securityTests:r,advancedSecurityTests:i}},ft=e=>{var r,i,l,p,m,h;const a=g=>new Date(g).toLocaleDateString("en-US",{year:"numeric",month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"}),n=g=>`${(g/1e3).toFixed(1)}s`,s=g=>{if(g===0)return"0 B";const d=1024,x=["B","KB","MB"],f=Math.floor(Math.log(g)/Math.log(d));return parseFloat((g/Math.pow(d,f)).toFixed(1))+" "+x[f]},c=[{title:"Positive Tests",category:e.positiveTests},{title:"Negative Tests",category:e.negativeTests},{title:"Functional Tests",category:e.functionalTests},{title:"Semantic Tests",category:e.semanticTests},{title:"Edge Case Tests",category:e.edgeCaseTests},{title:"Security Tests",category:e.securityTests},{title:"Advanced Security Tests",category:e.advancedSecurityTests}],o=yt(c);return`
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
            <div style="font-size: 20px; font-weight: 700; color: #111827;">${n(e.duration)}</div>
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
            ${Object.entries(o).slice(0,15).map(([g,d],x)=>{const f=Math.round(d.passedTests/d.totalTests*100);return`
                <tr style="background: ${x%2===0?"#ffffff":"#f9fafb"}; border-bottom: 1px solid #f3f4f6;">
                  <td style="padding: 8px; color: #374151; max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${d.endpoint}</td>
                  <td style="text-align: center; padding: 8px;">
                    <span style="background: ${bt(d.method)}; color: white; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 500;">${d.method}</span>
                  </td>
                  <td style="text-align: center; padding: 8px; color: #374151;">${d.totalTests}</td>
                  <td style="text-align: center; padding: 8px; color: ${f>=80?"#059669":f>=60?"#d97706":"#dc2626"}; font-weight: 600;">${f}%</td>
                  <td style="text-align: center; padding: 8px; color: #374151;">${d.avgDuration}ms</td>
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
              <tr><td style="padding: 4px 0; color: #059669;">Fastest:</td><td style="text-align: right; font-weight: 600;">${(r=e==null?void 0:e.requestMetrics)==null?void 0:r.minResponseTime}ms</td></tr>
              <tr><td style="padding: 4px 0; color: #2563eb;">Average:</td><td style="text-align: right; font-weight: 600;">${Math.round((i=e==null?void 0:e.requestMetrics)==null?void 0:i.averageResponseTime)}ms</td></tr>
              <tr><td style="padding: 4px 0; color: #dc2626;">Slowest:</td><td style="text-align: right; font-weight: 600;">${(l=e==null?void 0:e.requestMetrics)==null?void 0:l.maxResponseTime}ms</td></tr>
            </table>
          </div>
          <div>
            <h3 style="font-size: 14px; font-weight: 600; color: #374151; margin: 0 0 10px 0;">Data Transfer</h3>
            <table style="width: 100%; font-size: 12px;">
              <tr><td style="padding: 4px 0;">Total Requests:</td><td style="text-align: right; font-weight: 600;">${(p=e==null?void 0:e.requestMetrics)==null?void 0:p.totalRequests}</td></tr>
              <tr><td style="padding: 4px 0;">Data Transferred:</td><td style="text-align: right; font-weight: 600;">${s((m=e==null?void 0:e.requestMetrics)==null?void 0:m.totalDataTransferred)}</td></tr>
              <tr><td style="padding: 4px 0;">Unique Endpoints:</td><td style="text-align: right; font-weight: 600;">${(h=e==null?void 0:e.requestMetrics)==null?void 0:h.uniqueEndpoints}</td></tr>
            </table>
          </div>
        </div>
      </div>

      <!-- Test Categories -->
      <div style="margin-bottom: 30px;">
        <h2 style="font-size: 18px; font-weight: 600; color: #111827; margin: 0 0 15px 0;">Test Categories</h2>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;">
          ${c.filter(g=>{var d;return((d=g==null?void 0:g.category)==null?void 0:d.total)>0}).map(({title:g,category:d})=>{const x=Math.round(d.passed/d.total*100);return`
              <div style="padding: 12px; border: 1px solid #e5e7eb; border-radius: 6px; background: #fafafa;">
                <div style="font-size: 13px; font-weight: 600; color: #374151; margin-bottom: 4px;">${g}</div>
                <div style="font-size: 11px; color: #6b7280;">
                  ${d.total} tests • ${x}% success
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
  `},bt=e=>({GET:"#2563eb",POST:"#059669",PUT:"#d97706",DELETE:"#dc2626",PATCH:"#7c3aed",OPTIONS:"#6b7280"})[e]||"#6b7280",vt=async(e,a)=>{if(!document.getElementById(e))return;const s=window.__REPORT_DATA__;if(!s){alert("Report data not available for export");return}const[{default:c},{default:o}]=await Promise.all([V(()=>import("./pdf-utils-C2-73oHn.js").then(i=>i.h),__vite__mapDeps([0,1,2])),V(()=>import("./pdf-utils-C2-73oHn.js").then(i=>i.j),__vite__mapDeps([0,1,2]))]),r=document.createElement("div");r.style.cssText="position:absolute;left:-9999px;top:0;width:800px;background:#fff;",r.innerHTML=ft(s),document.body.appendChild(r);try{const i=await c(r,{allowTaint:!0,useCORS:!0,backgroundColor:"#ffffff",scale:1,logging:!1,width:800,height:r.scrollHeight}),l=i.toDataURL("image/png"),p=new o({orientation:"portrait",unit:"mm",format:"a4",compress:!0}),m=210,h=295,g=i.height*m/i.width;let d=g,x=0;for(p.addImage(l,"PNG",0,x,m,g),d-=h;d>=0;)x=-(g-d),p.addPage(),p.addImage(l,"PNG",0,x,m,g),d-=h;p.save(a)}catch(i){console.error("Error generating PDF:",i),alert("Failed to generate PDF. Please try again.")}finally{document.body.removeChild(r)}},yt=e=>{const a={};return e==null||e.forEach(({title:n,category:s})=>{if(!s)return;(s.apis??s.testCases??[]).forEach(o=>{const r=`${o.method} ${o.url}`;a[r]||(a[r]={endpoint:o.url,method:o.method,testCases:[],totalTests:0,passedTests:0,failedTests:0,skippedTests:0,avgDuration:0}),a[r].testCases.push({...o,category:n}),a[r].totalTests++,o.status==="passed"?a[r].passedTests++:o.status==="failed"?a[r].failedTests++:o.status==="skipped"&&a[r].skippedTests++})}),Object.values(a).forEach(n=>{const s=n.testCases.reduce((c,o)=>c+(o.duration??0),0);n.avgDuration=n.testCases.length?Math.round(s/n.testCases.length):0}),a},Ce=({openJiraModal:e,setOpenJiraModal:a,testSuiteData:n})=>{const[s,c]=j.useState(""),[o,r]=j.useState(""),[i,l]=j.useState("Bug"),[p,m]=j.useState(!1),[h,g]=j.useState(null),[d,x]=j.useState(null),[f,T]=j.useState(!1),k=typeof window<"u"?window.location.href:"";j.useEffect(()=>(e?document.body.style.overflow="hidden":document.body.style.overflow="unset",()=>{document.body.style.overflow="unset"}),[e]),j.useEffect(()=>{const w=R=>{R.key==="Escape"&&e&&!p&&v()};return document.addEventListener("keydown",w),()=>document.removeEventListener("keydown",w)},[e,p]);const u=w=>{try{const R=new Date(w);return isNaN(R.getTime())?"Invalid Date":R.toLocaleString("en-US",{year:"numeric",month:"short",day:"numeric",hour:"2-digit",minute:"2-digit",timeZone:"UTC",timeZoneName:"short"})}catch{return"Invalid Date"}},N=()=>{const{name:w,lastExecutionDate:R,environment:D}=n;return`Name: ${w},
Executed date: ${u(R)},
Environment: ${D||"N/A"},
Execution url: ${k}

Additional Description :
${o.trim()}

To access the report:
Click the above mentioned report link
If you have access by providing the valid credentials you will be able to access the report.`},[E,$]=j.useState(!1),[y,M]=j.useState([]),{currentWorkspace:S}=Z(),z=S==null?void 0:S.id,q=async()=>{try{$(!0),x(null);const R=await await Ne(z||"");M(R)}catch(w){console.error(w),x(w.message||"Failed to fetch integrations")}finally{$(!1)}};j.useEffect(()=>{z&&q()},[z]);const b=y==null?void 0:y.find(w=>w.type==="jira"&&w.isActive),F=b==null?void 0:b.id,P=async w=>{if(w.preventDefault(),!s.trim()){x("Summary is required");return}m(!0),x(null);try{const R={summary:s.trim(),description:N(),issueType:i},D=await Ae(F||"",R,z||"");if(!(D!=null&&D.issueKey)||!(D!=null&&D.issueUrl))throw new Error("Invalid response from server");g(D)}catch(R){console.error("Jira API Error:",R),x(R instanceof Error?R.message:"Failed to create Jira issue. Please try again.")}finally{m(!1)}},H=async()=>{if(h!=null&&h.issueUrl)try{if(navigator.clipboard&&window.isSecureContext)await navigator.clipboard.writeText(h.issueUrl);else{const w=document.createElement("textarea");w.value=h.issueUrl,w.style.position="fixed",w.style.left="-999999px",document.body.appendChild(w),w.select(),document.execCommand("copy"),document.body.removeChild(w)}T(!0),setTimeout(()=>T(!1),2e3)}catch(w){console.error("Failed to copy:",w),x("Failed to copy URL. Please copy manually.")}},v=()=>{p||(c(""),r(""),l("Bug"),g(null),x(null),T(!1),a())},G=w=>{w.target===w.currentTarget&&!p&&v()};return e?t.jsxs("div",{className:"fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn",onClick:G,role:"dialog","aria-modal":"true","aria-labelledby":"modal-title",children:[t.jsxs("div",{className:"relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-slideUp",style:{maxHeight:"90vh"},children:[t.jsx("div",{className:"relative px-4 sm:px-6 py-4 sm:py-5",children:t.jsxs("div",{className:"flex items-center justify-between gap-4",children:[t.jsxs("div",{className:"flex-1 min-w-0",children:[t.jsx("h2",{id:"modal-title",className:"text-xl sm:text-2xl font-bold text-black tracking-tight truncate",children:h?"Issue Created Successfully":"Create Jira Issue"}),t.jsx("p",{className:"text-black text-xs sm:text-sm mt-1",children:h?"Your bug report has been submitted":"Report a bug from test suite execution"})]}),t.jsx("button",{onClick:v,disabled:p,className:"p-2 rounded-lg hover:bg-white/20 transition-all duration-200 text-white disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0","aria-label":"Close modal",type:"button",children:t.jsx(ze,{size:24,className:"text-black"})})]})}),t.jsx("div",{className:"overflow-y-auto",style:{maxHeight:"calc(90vh - 100px)"},children:h?t.jsxs("div",{className:"p-4 sm:p-6 space-y-4 sm:space-y-6",children:[t.jsxs("div",{className:"text-center py-6 sm:py-8",children:[t.jsx("div",{className:"inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 mb-4 animate-scaleIn",children:t.jsx(de,{size:40,className:"text-white"})}),t.jsx("h3",{className:"text-xl sm:text-2xl font-bold text-slate-800 mb-2",children:h.message}),t.jsx("p",{className:"text-slate-600 text-sm sm:text-base px-4",children:"Your bug report has been successfully submitted to Jira"})]}),t.jsx("div",{className:"bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-4 sm:p-6 border border-indigo-100",children:t.jsxs("div",{className:"space-y-4",children:[t.jsxs("div",{children:[t.jsx("label",{className:"text-sm font-medium text-slate-600 block mb-2",children:"Issue Key"}),t.jsxs("div",{className:"flex items-center gap-3 flex-wrap",children:[t.jsx("span",{className:"text-2xl sm:text-3xl font-bold text-indigo-600 break-all",children:h.issueKey}),t.jsx("span",{className:"px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full",children:"Created"})]})]}),t.jsxs("div",{children:[t.jsx("label",{className:"text-sm font-medium text-slate-600 block mb-2",children:"Issue URL"}),t.jsxs("div",{className:"flex flex-col sm:flex-row gap-2",children:[t.jsxs("a",{href:h.issueUrl,target:"_blank",rel:"noopener noreferrer",className:"flex-1 px-4 py-3 bg-white rounded-lg border border-indigo-200 text-indigo-600 hover:bg-indigo-50 transition-all duration-200 flex items-center justify-between group overflow-hidden min-w-0",children:[t.jsx("span",{className:"text-sm font-medium truncate mr-2",children:h.issueUrl}),t.jsx(Fe,{size:18,className:"flex-shrink-0 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-200"})]}),t.jsx(te,{onClick:H,size:"lg",type:"button",children:f?t.jsxs(t.Fragment,{children:[t.jsx(de,{size:18}),t.jsx("span",{children:"Copied!"})]}):t.jsxs(t.Fragment,{children:[t.jsx(he,{size:18}),t.jsx("span",{children:"Copy URL"})]})})]})]})]})}),t.jsx("div",{className:"bg-blue-50 border border-blue-200 rounded-lg p-4",children:t.jsxs("div",{className:"flex gap-3",children:[t.jsx(ee,{className:"text-blue-600 flex-shrink-0 mt-0.5",size:20}),t.jsxs("div",{className:"text-sm text-blue-800 min-w-0",children:[t.jsx("p",{className:"font-medium mb-1",children:"Share with your team"}),t.jsx("p",{className:"text-blue-700",children:"Copy the issue URL and share it with your team members. They can access the full report using their Jira credentials."})]})]})}),t.jsx("div",{className:"flex justify-end pt-2",children:t.jsx(te,{onClick:v,type:"button",children:"Close"})})]}):t.jsxs("form",{onSubmit:P,className:"p-4 sm:p-6 space-y-4 sm:space-y-6",children:[t.jsxs("div",{className:"bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-4 sm:p-5 border border-slate-200",children:[t.jsxs("h3",{className:"text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2",children:[t.jsx(ee,{size:16,className:"text-indigo-600 flex-shrink-0"}),t.jsx("span",{children:"Test Suite Information (Auto-populated)"})]}),t.jsxs("div",{className:"space-y-2 text-sm",children:[t.jsxs("div",{className:"flex flex-col sm:flex-row sm:gap-2",children:[t.jsx("span",{className:"font-medium text-slate-600 sm:min-w-[140px]",children:"Suite Name:"}),t.jsx("span",{className:"text-slate-800 break-words",children:n==null?void 0:n.name})]}),t.jsxs("div",{className:"flex flex-col sm:flex-row sm:gap-2",children:[t.jsx("span",{className:"font-medium text-slate-600 sm:min-w-[140px]",children:"Executed Date:"}),t.jsx("span",{className:"text-slate-800 break-words",children:u(n==null?void 0:n.lastExecutionDate)})]}),t.jsxs("div",{className:"flex flex-col sm:flex-row sm:gap-2",children:[t.jsx("span",{className:"font-medium text-slate-600 sm:min-w-[140px]",children:"Environment:"}),t.jsx("span",{className:"text-slate-800 break-words",children:(n==null?void 0:n.environment)||"N/A"})]}),t.jsxs("div",{className:"flex flex-col sm:flex-row sm:gap-2",children:[t.jsx("span",{className:"font-medium text-slate-600 sm:min-w-[140px]",children:"Executed By:"}),t.jsx("span",{className:"text-slate-800 break-words",children:n==null?void 0:n.executedBy})]})]})]}),t.jsxs("div",{className:"space-y-2",children:[t.jsxs("label",{htmlFor:"summary",className:"block text-sm font-semibold text-slate-700",children:["Summary ",t.jsx("span",{className:"text-red-500",children:"*"})]}),t.jsx(Pe,{id:"summary",type:"text",value:s,onChange:w=>c(w.target.value),placeholder:"Brief description of the bug",required:!0,maxLength:200,disabled:p,"aria-required":"true"}),t.jsxs("p",{className:"text-xs text-slate-500",children:[s.length,"/200 characters"]})]}),t.jsxs("div",{className:"space-y-2",children:[t.jsx("label",{htmlFor:"userDescription",className:"block text-sm font-semibold text-slate-700",children:"Additional Description"}),t.jsx(Be,{id:"userDescription",value:o,onChange:w=>r(w.target.value),placeholder:"Add any additional details about the bug (steps to reproduce, expected vs actual behavior, etc.)",rows:3,maxLength:2e3,disabled:p}),t.jsxs("p",{className:"text-xs text-slate-500",children:[o.length,"/2000 characters"]})]}),t.jsxs("div",{className:"space-y-2",children:[t.jsx("label",{htmlFor:"issueType",className:"block text-sm font-semibold text-slate-700",children:"Issue Type"}),t.jsxs("select",{id:"issueType",value:i,onChange:w=>l(w.target.value),disabled:p,className:"w-full px-4 py-3 rounded-lg border-2 border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all duration-200 text-slate-800 bg-white cursor-pointer disabled:bg-slate-100 disabled:cursor-not-allowed",children:[t.jsx("option",{value:"Bug",children:"Bug"}),t.jsx("option",{value:"Task",children:"Task"}),t.jsx("option",{value:"Story",children:"Story"}),t.jsx("option",{value:"Epic",children:"Epic"})]})]}),d&&t.jsxs("div",{className:"p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3",role:"alert",children:[t.jsx(ee,{className:"text-red-600 flex-shrink-0 mt-0.5",size:20}),t.jsxs("div",{className:"flex-1 min-w-0",children:[t.jsx("p",{className:"text-sm font-medium text-red-800",children:"Error creating issue"}),t.jsx("p",{className:"text-sm text-red-600 mt-1 break-words",children:d})]})]}),t.jsx("div",{className:"flex justify-end flex-col-reverse sm:flex-row gap-3 pt-4",children:t.jsx(te,{type:"submit",disabled:p||!s.trim(),size:"lg",children:p?t.jsxs("span",{className:"flex items-center justify-center gap-2",children:[t.jsxs("svg",{className:"animate-spin h-5 w-5",viewBox:"0 0 24 24","aria-hidden":"true",children:[t.jsx("circle",{className:"opacity-25",cx:"12",cy:"12",r:"10",stroke:"currentColor",strokeWidth:"4",fill:"none"}),t.jsx("path",{className:"opacity-75",fill:"currentColor",d:"M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"})]}),"Creating..."]}):"Create Issue"})})]})})]}),t.jsx("style",{children:`
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
      `})]}):null},wt={low:"bg-green-100 text-green-700 border-green-200",medium:"bg-yellow-100 text-yellow-700 border-yellow-200",high:"bg-red-100 text-red-700 border-red-200"},ce=(e,a)=>[a?`AI Summary — ${a}`:"AI Summary",`Risk Level: ${e.riskLevel}`,`Generated: ${new Date(e.generatedAt).toLocaleString()}`,`Generated By: ${e.generatedByEmail}`,"","What's Working Well",e.workingWell,"","What Might Be Broken",e.broken,"","Impact",e.impact,"","Next Step",e.nextStep].join(`
`),jt=(e,a)=>[`# AI Summary${a?` — ${a}`:""}`,"",`**Risk Level:** ${e.riskLevel}`,`**Generated:** ${new Date(e.generatedAt).toLocaleString()}`,`**Generated By:** ${e.generatedByEmail}`,"","## What's Working Well",e.workingWell,"","## What Might Be Broken",e.broken,"","## Impact",e.impact,"","## Next Step",e.nextStep].join(`
`),xe=(e,a,n)=>{const s=new Blob([e],{type:n}),c=URL.createObjectURL(s),o=document.createElement("a");o.href=c,o.download=a,document.body.appendChild(o),o.click(),document.body.removeChild(o),URL.revokeObjectURL(c)};function Nt({open:e,onClose:a,suiteName:n,summary:s}){var p;const[c,o]=j.useState(!1);if(!s)return null;const r=async()=>{await navigator.clipboard.writeText(ce(s,n)),o(!0),setTimeout(()=>o(!1),1500)},i=()=>{const m=n?n.replace(/\s+/g,"_"):"test-suite";xe(ce(s,n),`${m}_ai_summary.txt`,"text/plain")},l=()=>{const m=n?n.replace(/\s+/g,"_"):"test-suite";xe(jt(s,n),`${m}_ai_summary.md`,"text/markdown")};return t.jsx(Oe,{open:e,onOpenChange:a,children:t.jsxs(Ue,{className:"max-w-2xl max-h-[80vh] overflow-y-auto",children:[t.jsx(_e,{children:t.jsxs(qe,{className:"flex items-center justify-between gap-2",children:[t.jsx("span",{children:"AI Summary"}),t.jsxs("span",{className:`text-xs font-medium px-2 py-0.5 rounded-full border capitalize ${wt[(p=s.riskLevel)==null?void 0:p.toLowerCase()]||"bg-gray-100 text-gray-700 border-gray-200"}`,children:[s.riskLevel," risk"]})]})}),t.jsxs("div",{className:"space-y-4 text-sm",children:[t.jsxs("div",{children:[t.jsx("h4",{className:"font-semibold text-green-700 mb-1",children:"What's Working Well"}),t.jsx("p",{className:"text-gray-700 leading-relaxed",children:s.workingWell})]}),t.jsxs("div",{children:[t.jsx("h4",{className:"font-semibold text-amber-700 mb-1",children:"What Might Be Broken"}),t.jsx("p",{className:"text-gray-700 leading-relaxed",children:s.broken})]}),t.jsxs("div",{children:[t.jsx("h4",{className:"font-semibold text-red-700 mb-1",children:"Impact"}),t.jsx("p",{className:"text-gray-700 leading-relaxed",children:s.impact})]}),t.jsxs("div",{children:[t.jsx("h4",{className:"font-semibold text-blue-700 mb-1",children:"Next Step"}),t.jsx("p",{className:"text-gray-700 leading-relaxed",children:s.nextStep})]}),t.jsxs("div",{className:"text-xs text-gray-400 pt-2 border-t",children:["Generated ",new Date(s.generatedAt).toLocaleString()," by"," ",s.generatedByEmail]})]}),t.jsxs("div",{className:"flex items-center gap-2 pt-4 border-t mt-2",children:[t.jsxs("button",{onClick:r,className:"flex items-center gap-1.5 px-3 py-2 text-sm border rounded-lg hover:bg-gray-50 transition-colors",children:[c?t.jsx(De,{className:"w-4 h-4 text-green-600"}):t.jsx(he,{className:"w-4 h-4"}),c?"Copied":"Copy"]}),t.jsxs("button",{onClick:i,className:"flex items-center gap-1.5 px-3 py-2 text-sm border rounded-lg hover:bg-gray-50 transition-colors",children:[t.jsx(ne,{className:"w-4 h-4"}),"Download .txt"]}),t.jsxs("button",{onClick:l,className:"flex items-center gap-1.5 px-3 py-2 text-sm border rounded-lg hover:bg-gray-50 transition-colors",children:[t.jsx(re,{className:"w-4 h-4"}),"Download .md"]})]})]})})}const Tt=U.lazy(()=>V(()=>import("./RequestChainExecutionFlow-BsuK6kFW.js"),__vite__mapDeps([3,1,2,4,5,6,7,8,0,9,10,11,12,13,14,15]))),$t=U.lazy(()=>V(()=>import("./VariablesAndDataFlow-wfl5qyMN.js"),__vite__mapDeps([16,1,2,17,5,6,7,8,0,9,10,11,12,4]))),kt=U.lazy(()=>V(()=>import("./RequestGrouping-DQm6okbg.js"),__vite__mapDeps([18,1,2,15,8])).then(e=>({default:e.RequestGrouping}))),Ct=e=>{var c,o;const a=((c=e==null?void 0:e.response)==null?void 0:c.status)??(e==null?void 0:e.status),n=((o=e==null?void 0:e.response)==null?void 0:o.data)??(e==null?void 0:e.data),s=typeof n=="string"?n:n==null?void 0:n.error;return a===429||s==="quota exceeded"?"You've reached your AI summary limit for the month. Consider upgrade your plan.":a===401||a===403?"You are not authorized to generate a summary.":a>=500?"The server ran into a problem generating the summary. Please try again in a moment.":!(e!=null&&e.response)&&(e!=null&&e.request)?"Network error. Please check your connection and try again.":"Could not generate the summary. Please try again."},St=()=>{const e=typeof window<"u"?window.location.search:"";return U.useMemo(()=>new URLSearchParams(e),[e])},Rt=e=>{var s,c;const a=[];if(Array.isArray(e==null?void 0:e.requests)){const o=["positiveTests","negativeTests","functionalTests","semanticTests","edgeCaseTests","securityTests","advancedSecurityTests"];for(const r of e.requests)for(const i of o){const l=r==null?void 0:r[i];(s=l==null?void 0:l.testCases)!=null&&s.length&&a.push(...l.testCases)}if(a.length)return a}const n=["positiveTests","negativeTests","functionalTests","semanticTests","edgeCaseTests","securityTests","advancedSecurityTests"];for(const o of n){const r=e==null?void 0:e[o];(c=r==null?void 0:r.apis)!=null&&c.length&&a.push(...r.apis)}return a},Et=e=>{const a=Rt(e),n=a.length||Number((e==null?void 0:e.totalTestCases)||0),s=(a.length?a.filter(l=>l.status==="passed").length:0)||Number((e==null?void 0:e.successfulTestCases)||0),c=(a.length?a.filter(l=>l.status==="failed").length:0)||Number((e==null?void 0:e.failedTestCases)||0),o=(a.length?a.filter(l=>l.status==="skipped").length:0)||Number((e==null?void 0:e.skippedTestCases)||0),r=n>0?Math.round(s/n*100):Number((e==null?void 0:e.successRate)||0),i=a.length>0?Math.round(a.reduce((l,p)=>l+Number((p==null?void 0:p.duration)||0),0)/a.length):Number.isFinite(e==null?void 0:e.duration)?Number(e.duration):0;return{total:n,passed:s,failed:c,skipped:o,successRate:r,avgDuration:i}},Mt=({data:e,integrations:a,integrationsLoading:n})=>{const s=j.useMemo(()=>Et(e),[e]),c=j.useMemo(()=>mt(e),[e]),o=v=>`${(v/1e3).toFixed(2)}s`,r=j.useMemo(()=>[{title:"Success Rate",value:`${s.successRate}%`,icon:J,color:s.successRate>=80?"text-green-600 bg-green-100":s.successRate>=60?"text-yellow-600 bg-yellow-100":"text-red-600 bg-red-100"},{title:"Total Test Cases",value:s.total.toString(),icon:_,color:"text-blue-600 bg-blue-100"},{title:"Passed",value:s.passed.toString(),icon:fe,color:"text-green-600 bg-green-100"},{title:"Failed",value:s.failed.toString(),icon:be,color:"text-red-600 bg-red-100"}],[s]),l=new URLSearchParams(window.location.search).get("executionId"),{type:p,entityId:m}=ae(),h=()=>{Te(m,l||"")},g=async()=>{const v=ht(e);window.__REPORT_DATA__=v,await vt("report-content",`${v.name}_report.pdf`)},d=()=>He("report-content",`${e.name}_report.html`),x=a==null?void 0:a.find(v=>v.type==="jira"&&v.isActive);x==null||x.id;const[f,T]=j.useState(!1),[k,u]=j.useState({summary:"",description:"",issueType:""}),[N,E]=j.useState(!1),{toast:$}=Y(),[,y]=me(),{currentWorkspace:M}=Z(),[S,z]=j.useState(!1),[q,b]=j.useState(null),[F,P]=j.useState(!1),H=async()=>{if(!(!m||!(M!=null&&M.id)))try{z(!0);const v=await ie.getTestSuiteAISummary(m,M.id,l||void 0);b(v.data),P(!0)}catch(v){console.error("Failed to fetch AI summary",v),$({title:"Could not generate summary",description:Ct(v),variant:"destructive"})}finally{z(!1)}};return t.jsxs("div",{id:"report-content",children:[t.jsxs("div",{className:"border border-gray-200 bg-background rounded-lg px-6 py-3 animate-fade-in mt-3",children:[t.jsxs("div",{className:"flex justify-between items-start mb-6",children:[t.jsxs("div",{children:[t.jsx("h1",{className:"text-lg md:text-3xl font-bold text-gray-900 mb-2",children:e.name}),t.jsx("p",{className:"text-sm md:text-md text-gray-600",children:e.description})]}),t.jsx("div",{children:t.jsx("img",{src:pe,alt:"Optraflow logo",className:"max-h-[50px] w-auto object-contain"})})]}),t.jsxs("div",{className:"grid grid-cols-2 md:grid-cols-4 gap-6 mb-3",children:[t.jsxs("div",{className:"flex items-center space-x-3",children:[t.jsx(ve,{className:"w-5 h-5 text-blue-500"}),t.jsxs("div",{children:[t.jsx("p",{className:"text-xs md:text-sm text-gray-500",children:"Execution Date"}),t.jsx("p",{className:"text-xs md:text-sm font-semibold",children:(()=>{const{dateTime:v,tz:G}=W(e.lastExecutionDate);return`${v}, ${G}`})()})]})]}),t.jsxs("div",{className:"flex items-center space-x-3",children:[t.jsx(_,{className:"w-5 h-5 text-green-500"}),t.jsxs("div",{children:[t.jsx("p",{className:"text-xs md:text-sm text-gray-500",children:"Duration"}),t.jsx("p",{className:"text-xs md:text-sm font-semibold",children:o(e.duration)})]})]}),t.jsxs("div",{className:"flex items-center space-x-3",children:[t.jsx(ye,{className:"w-5 h-5 text-purple-500"}),t.jsxs("div",{children:[t.jsx("p",{className:"text-xs md:text-sm text-gray-500",children:"Executed By"}),t.jsx("p",{className:"text-xs md:text-sm font-semibold text-xs",children:e.executedBy})]})]}),t.jsxs("div",{className:"flex items-center space-x-3",children:[t.jsx(X,{className:"w-5 h-5 text-orange-500"}),t.jsxs("div",{children:[t.jsx("p",{className:"text-xs md:text-sm text-gray-500",children:"Environment"}),t.jsx("p",{className:"text-xs md:text-sm font-semibold text-xs",children:e.environment})]})]})]}),t.jsxs("div",{className:"flex items-center gap-4",children:[t.jsxs(Q,{children:[t.jsxs(L,{children:[t.jsx(I,{asChild:!0,children:t.jsx("button",{onClick:d,className:"p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors group",children:t.jsx(ne,{className:"w-5 h-5"})})}),t.jsx(A,{children:"Download html Report"})]}),t.jsxs(L,{children:[t.jsx(I,{asChild:!0,children:t.jsx("button",{onClick:g,className:"p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors group",children:t.jsx(re,{className:"w-5 h-5"})})}),t.jsx(A,{children:"Download pdf Summary"})]}),t.jsxs(L,{children:[t.jsx(I,{asChild:!0,children:t.jsx("button",{onClick:h,className:"p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors group",children:t.jsx(we,{className:"w-5 h-5"})})}),t.jsx(A,{children:"Share Report"})]}),n?t.jsx("div",{className:"p-2",children:t.jsx("div",{className:"w-6 h-6 rounded bg-gray-200 animate-pulse"})}):t.jsxs(L,{children:[t.jsx(I,{asChild:!0,children:t.jsxs("button",{onClick:()=>{x?T(!0):y("/settings/account?tab=external-tools")},className:`p-2 rounded-lg transition-colors relative ${x?"hover:bg-blue-50 cursor-pointer":"opacity-40 cursor-not-allowed grayscale"}`,"aria-label":x?"Create Jira issue":"Connect Jira to enable",children:[t.jsx(je,{}),x&&t.jsx("span",{className:"absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full ring-1 ring-white"})]})}),t.jsx(A,{side:"bottom",children:x?"Create Jira issue":t.jsxs("span",{className:"flex items-center gap-1.5",children:[t.jsx("span",{className:"w-1.5 h-1.5 rounded-full bg-gray-400"}),"Jira not connected — click to configure"]})})]}),t.jsxs("button",{onClick:H,disabled:S,title:"Summarize the report","aria-label":"Summarize the test suite report",className:"shrink-0 flex items-center justify-center gap-2 p-2 sm:px-3 sm:py-1.5 text-sm text-gray-700 border border-gray-300 rounded-full hover:bg-purple-50 hover:border-purple-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed",children:[t.jsx(Le,{className:`w-5 h-5 sm:w-4 sm:h-4 text-purple-600 ${S?"animate-pulse":""}`}),t.jsx("span",{className:"hidden sm:inline whitespace-nowrap",children:S?"Summarizing...":"Summarize the report"})]})]}),t.jsx(Ce,{openJiraModal:f,setOpenJiraModal:()=>T(!1),testSuiteData:e}),t.jsx(Nt,{open:F,onClose:()=>P(!1),suiteName:e.name,summary:q})]})]}),t.jsx("div",{className:"grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-6 mb-3 mt-3",children:r.map((v,G)=>t.jsx("div",{className:"border border-gray-200 bg-background rounded-lg px-6 py-6 animate-fade-in",children:t.jsxs("div",{className:"flex items-center justify-between",children:[t.jsxs("div",{children:[t.jsx("p",{className:"text-xs md:text-sm text-gray-500 mb-1",children:v.title}),t.jsx("p",{className:"text-md md:text-2xl font-bold text-gray-900",children:v.value})]}),t.jsx("div",{className:`p-3 rounded-full ${v.color}`,children:t.jsx(v.icon,{className:"w-4 h-4 md:w-6 md:h-6"})})]})},G))}),t.jsx(xt,{metrics:c}),t.jsx(U.Suspense,{fallback:t.jsx(ue,{message:"Loading..."}),children:t.jsx(kt,{report:e})})]})};function zt(e){var i;const a=Number(e==null?void 0:e.totalRequests)||((i=e==null?void 0:e.requestExecutions)==null?void 0:i.length)||0,n=Number(e==null?void 0:e.successfulRequests)||0,s=Number(e==null?void 0:e.failedRequests)||0,c=Number(e==null?void 0:e.skippedRequests)||0,o=a||n+s+c,r=o?Math.round(n/o*100):0;return{total:o,successful:n,failed:s,skipped:c,successRate:r}}function Ft(e,a){if(!e.length)return 0;const n=[...e].sort((c,o)=>c-o),s=Math.min(n.length-1,Math.max(0,Math.ceil(a/100*n.length)-1));return n[s]}function Dt(e){const a=(e==null?void 0:e.requestExecutions)||[],n=new Map;a.forEach(o=>{const r=(o.method||"GET").toUpperCase();n.has(r)||n.set(r,[]),n.get(r).push(o)});const s=[];for(const[o,r]of n.entries()){const i=r.map(d=>Number(d.duration||0)).filter(d=>Number.isFinite(d)),l=r.length,p=r.filter(d=>d.status==="passed").length,m=r.filter(d=>d.status==="failed").length,h=i.length?Math.round(i.reduce((d,x)=>d+x,0)/i.length):0,g=Math.round(Ft(i,95));s.push({method:o,total:l,success:p,failed:m,avgDurationMs:h,p95DurationMs:g})}const c=["GET","POST","PUT","PATCH","DELETE"];return s.sort((o,r)=>{const i=c.indexOf(o.method),l=c.indexOf(r.method);return i===-1&&l===-1?o.method.localeCompare(r.method):i===-1?1:l===-1?-1:i-l}),s}const Lt=({data:e,environment:a,startedQS:n,integrations:s,integrationsLoading:c})=>{var z,q;const o=((z=e.requestExecutions)==null?void 0:z.map((b,F)=>{var P,H;return{step:b.order||F+1,method:b.method,name:b.name,url:b.url,statusCode:b.responseStatusCode,requestCurl:b.requestCurl,response:b.response,responseSize:`${b.responseSize||0} bytes`,duration:`${b.duration}ms`,substitutedVariables:b.substitutedVariables||[],assertionResults:((P=b==null?void 0:b.assertionResults)==null?void 0:P.map(v=>({status:v.status,category:v.category,description:v.description,field:v.field,responseSize:v.responseSize,responseStatus:v.responseStatus,responseTime:v.responseTime,type:v.type,actualValue:v.actualValue,operator:v.operator,expectedValue:v.expectedValue})))??[],status:b.status==="passed"?"success":b.status==="failed"?"fail":"skipped",extractedVars:((H=b.extractedVariables)==null?void 0:H.map(v=>({key:v.name,value:v.value})))||[],errorMessage:b.status==="failed"?"Request failed":void 0}}))||[],r=e.globalVariables||{},i=((q=e.extractedVariables)==null?void 0:q.reduce((b,F)=>(b[F.name]=F.value,b),{}))||{},l=U.useMemo(()=>zt(e),[e]),p=U.useMemo(()=>Dt(e),[e]),m=l.successRate>=80?"text-green-600 bg-green-100":l.successRate>=60?"text-yellow-600 bg-yellow-100":"text-red-600 bg-red-100",h=[{title:"Success Rate",value:`${l.successRate}%`,icon:J,color:m},{title:"Total Requests",value:l.total.toString(),icon:_,color:"text-blue-600 bg-blue-100"},{title:"Successful",value:l.successful.toString(),icon:fe,color:"text-green-600 bg-green-100"},{title:"Failed",value:l.failed.toString(),icon:be,color:"text-red-600 bg-red-100"},{title:"Skipped",value:l.skipped.toString(),icon:Ie,color:"text-red-600 bg-orange-100"}],g=b=>b<1e3?`${b}ms`:`${(b/1e3).toFixed(2)}s`,{currentWorkspace:d}=Z();d==null||d.id;const x=s==null?void 0:s.find(b=>b.type==="jira");x==null||x.id;const[f,T]=j.useState(!1),[k,u]=j.useState({summary:"",description:"",issueType:""}),[N,E]=j.useState(!1);Y();const[,$]=me(),{type:y,entityId:M}=ae(),S=new URLSearchParams(window.location.search).get("executionId");return t.jsxs("div",{children:[t.jsxs("div",{className:"border border-gray-200 bg-background rounded-lg px-6 py-3 animate-fade-in mt-3",children:[t.jsxs("div",{className:"flex justify-between items-start mb-6",children:[t.jsxs("div",{children:[t.jsx("h1",{className:"text-xl md:text-3xl font-bold text-gray-900 mb-2 break-words",children:e.name}),t.jsx("p",{className:"text-gray-600",children:e.description||"Request chain execution flow with variable extraction and data flow analysis"})]}),t.jsx("div",{children:t.jsx("img",{src:pe,alt:"Optraflow logo",className:"max-h-[50px] w-auto object-contain"})})]}),t.jsxs("div",{className:"grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-3",children:[t.jsxs("div",{className:"flex items-center space-x-3",children:[t.jsx(ve,{className:"w-5 h-5 text-blue-500"}),t.jsxs("div",{children:[t.jsx("p",{className:"text-sm text-gray-500",children:"Execution Date"}),t.jsx("p",{className:"text-sm font-semibold",children:(()=>{const{dateTime:b,tz:F}=W(e.lastExecutionDate);return`${b}, ${F}`})()})]})]}),t.jsxs("div",{className:"flex items-center space-x-3",children:[t.jsx(_,{className:"w-5 h-5 text-green-500"}),t.jsxs("div",{children:[t.jsx("p",{className:"text-sm text-gray-500",children:"Duration"}),t.jsx("p",{className:"font-semibold",children:g((e==null?void 0:e.duration)||0)})]})]}),t.jsxs("div",{className:"flex items-center space-x-3",children:[t.jsx(ye,{className:"w-5 h-5 text-purple-500"}),t.jsxs("div",{children:[t.jsx("p",{className:"text-sm text-gray-500",children:"Executed By"}),t.jsx("p",{className:"font-semibold text-xs",children:e.executedBy})]})]}),t.jsxs("div",{className:"flex items-center space-x-3",children:[t.jsx(X,{className:"w-5 h-5 text-orange-500"}),t.jsxs("div",{children:[t.jsx("p",{className:"text-sm text-gray-500",children:"Environment"}),t.jsx("p",{className:"font-semibold text-xs",children:e==null?void 0:e.environment})]})]})]}),t.jsxs("div",{className:"flex flex-wrap items-center gap-2",children:[t.jsxs(Q,{children:[t.jsx(pt,{reportData:e}),t.jsx(ut,{reportData:e}),t.jsxs(L,{children:[t.jsx(I,{asChild:!0,children:t.jsx("button",{onClick:()=>Te(M,S||""),className:"p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors group",children:t.jsx(we,{className:"w-5 h-5"})})}),t.jsx(A,{children:"Share Report"})]}),t.jsxs(L,{children:[t.jsx(I,{asChild:!0,children:t.jsxs("button",{onClick:()=>{x?T(!0):$("/settings/account?tab=external-tools")},className:`p-2 rounded-lg transition-colors relative ${x?"hover:bg-blue-50 cursor-pointer":"opacity-40 cursor-not-allowed grayscale"}`,"aria-label":x?"Create Jira issue":"Connect Jira to enable",children:[t.jsx(je,{}),x&&t.jsx("span",{className:"absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full ring-1 ring-white"})]})}),t.jsx(A,{side:"bottom",children:x?"Create Jira issue":t.jsxs("span",{className:"flex items-center gap-1.5",children:[t.jsx("span",{className:"w-1.5 h-1.5 rounded-full bg-gray-400"}),"Jira not connected — click to configure"]})})]})]}),t.jsx(Ce,{openJiraModal:f,setOpenJiraModal:()=>T(!1),testSuiteData:e})]})]}),t.jsx("div",{className:"grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 md:gap-6 mb-3 mt-3",children:h.map((b,F)=>t.jsx("div",{className:"border border-gray-200 bg-background rounded-lg px-6 py-6 animate-fade-in",children:t.jsxs("div",{className:"flex items-center justify-between",children:[t.jsxs("div",{children:[t.jsx("p",{className:"text-sm text-gray-500 mb-1",children:b.title}),t.jsx("p",{className:"text-2xl font-bold text-gray-900",children:b.value})]}),t.jsx("div",{className:`p-3 rounded-full ${b.color}`,children:t.jsx(b.icon,{className:"w-6 h-6"})})]})},F))}),t.jsx(gt,{metrics:p}),t.jsx(Tt,{steps:o}),t.jsx("div",{className:"bg-[#FAFAFA]",children:t.jsx($t,{globalVariables:r,extractedVariables:i})})]})},Zt=()=>{const{type:e,entityId:a}=ae(),n=St(),s=n.get("env")||"Unknown",c=n.get("started"),o=n.get("executionId"),{currentWorkspace:r}=Z(),i=j.useRef(null),{data:l,isLoading:p}=Ee({queryKey:["execution-report",a,e,o],queryFn:async()=>{if(!a||!e||!o||!(r!=null&&r.id))throw new Error("Missing required parameters");return e==="test_suite"?ie.getTestSuiteReport(a,o,r.id):ie.getRequestChainReport(a,o,r.id)},enabled:!!a&&!!e&&!!o&&!!(r!=null&&r.id)}),m=r==null?void 0:r.id,[h,g]=j.useState([]),[d,x]=j.useState(null),[f,T]=j.useState(!0);return j.useEffect(()=>{m&&(T(!0),Ne(m).then(k=>g(k)).catch(k=>x(k.message)).finally(()=>T(!1)))},[m]),j.useEffect(()=>{typeof window>"u"||e==="test_suite"&&(l!=null&&l.data)&&(window.__REPORT_DATA__=l.data)},[e,l]),t.jsxs("div",{className:"mx-auto p-1 sm:p-1",ref:i,children:[t.jsx("header",{className:"border border-gray-200 bg-background rounded-lg px-6 py-4 animate-fade-in",children:t.jsx("div",{className:"flex items-center justify-between",children:t.jsx("div",{children:t.jsx("h2",{className:"text-2xl font-semibold text-foreground",children:e==="test_suite"?"Test Suite Report":"Request Chain Report"})})})}),p?t.jsx(ue,{message:"Loading Report"}):l!=null&&l.data?e==="test_suite"?t.jsx(Mt,{data:l.data,integrations:h,integrationsLoading:f}):t.jsx(Lt,{data:l.data,environment:s,startedQS:c,integrations:h,integrationsLoading:f}):t.jsx("div",{className:"text-center py-8",children:t.jsx("p",{className:"text-gray-500",children:"No report data available"})})]})};export{Zt as default};
