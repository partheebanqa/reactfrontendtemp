// import React, { useState } from 'react';
// import { Send, Plus, Trash2 } from 'lucide-react';
// import { useRequest } from '../../context/RequestContext';
// import { RequestMethod } from '../../shared/types/request';
// import SchemaPage from './SchemaPage';

// const RequestForm: React.FC = () => {
//   const { requestData, updateRequestData, executeRequest } = useRequest();
//   const [activeTab, setActiveTab] = useState<'params' | 'headers' | 'body' | 'schemas'>('params');

//   const handleMethodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
//     updateRequestData({ method: e.target.value as RequestMethod });
//   };

//   const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     updateRequestData({ url: e.target.value });
//   };

//   const handleAddParam = () => {
//     updateRequestData({
//       params: [...requestData.params, { key: '', value: '' }]
//     });
//   };

//   const handleAddHeader = () => {
//     updateRequestData({
//       headers: [...requestData.headers, { key: '', value: '' }]
//     });
//   };

//   const handleParamChange = (index: number, field: 'key' | 'value', value: string) => {
//     const newParams = [...requestData.params];
//     newParams[index][field] = value;
//     updateRequestData({ params: newParams });
//   };

//   const handleHeaderChange = (index: number, field: 'key' | 'value', value: string) => {
//     const newHeaders = [...requestData.headers];
//     newHeaders[index][field] = value;
//     updateRequestData({ headers: newHeaders });
//   };

//   const handleRemoveParam = (index: number) => {
//     const newParams = [...requestData.params];
//     newParams.splice(index, 1);
//     updateRequestData({ params: newParams });
//   };

//   const handleRemoveHeader = (index: number) => {
//     const newHeaders = [...requestData.headers];
//     newHeaders.splice(index, 1);
//     updateRequestData({ headers: newHeaders });
//   };

//   const handleBodyChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
//     updateRequestData({ body: e.target.value });
//   };

//   const handleSubmit = (e: React.FormEvent) => {
//     e.preventDefault();
//     executeRequest();
//   };

//   return (
//     <form onSubmit={handleSubmit} className="space-y-4">
//       {/* URL and Method */}
//       <div className="flex flex-col md:flex-row gap-2">
//         <div className="w-full md:w-32">
//           <select
//             value={requestData.method}
//             onChange={handleMethodChange}
//             className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
//           >
//             <option value="GET">GET</option>
//             <option value="POST">POST</option>
//             <option value="PUT">PUT</option>
//             <option value="DELETE">DELETE</option>
//             <option value="PATCH">PATCH</option>
//           </select>
//         </div>
//         <div className="flex-1">
//           <input
//             type="text"
//             value={requestData.url}
//             onChange={handleUrlChange}
//             placeholder="https://api.example.com/endpoint"
//             className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
//             required
//           />
//         </div>
//         <div>
//           <button
//             type="submit"
//             className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors flex items-center gap-1"
//           >
//             <Send size={16} />
//             <span>Send</span>
//           </button>
//         </div>
//       </div>

//       {/* Tabs */}
//       <div className="border-b border-gray-200">
//         <nav className="flex -mb-px">
//           {['params', 'headers', 'body', 'schemas'].map((tab) => (
//             <button
//               key={tab}
//               type="button"
//               className={`py-2 px-4 font-medium text-sm border-b-2 focus:outline-none ${
//                 activeTab === tab
//                   ? 'border-indigo-500 text-indigo-600'
//                   : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
//               }`}
//               onClick={() => setActiveTab(tab as any)}
//             >
//               {tab.charAt(0).toUpperCase() + tab.slice(1)}
//             </button>
//           ))}
//         </nav>
//       </div>

//       {/* Tab Content */}
//       <div className="py-2">
//         {/* Params Tab */}
//         {activeTab === 'params' && (
//           <div className="space-y-2">
//             {requestData.params.map((param, index) => (
//               <div key={index} className="flex gap-2 items-center">
//                 <input
//                   type="text"
//                   value={param.key}
//                   onChange={(e) => handleParamChange(index, 'key', e.target.value)}
//                   placeholder="Key"
//                   className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
//                 />
//                 <input
//                   type="text"
//                   value={param.value}
//                   onChange={(e) => handleParamChange(index, 'value', e.target.value)}
//                   placeholder="Value"
//                   className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
//                 />
//                 <button
//                   type="button"
//                   onClick={() => handleRemoveParam(index)}
//                   className="p-2 text-red-500 hover:text-red-700"
//                 >
//                   <Trash2 size={18} />
//                 </button>
//               </div>
//             ))}
//             <div>
//               <button
//                 type="button"
//                 onClick={handleAddParam}
//                 className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800"
//               >
//                 <Plus size={16} />
//                 <span>Add Parameter</span>
//               </button>
//             </div>
//           </div>
//         )}

//         {/* Headers Tab */}
//         {activeTab === 'headers' && (
//           <div className="space-y-2">
//             {requestData.headers.map((header, index) => (
//               <div key={index} className="flex gap-2 items-center">
//                 <input
//                   type="text"
//                   value={header.key}
//                   onChange={(e) => handleHeaderChange(index, 'key', e.target.value)}
//                   placeholder="Key"
//                   className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
//                 />
//                 <input
//                   type="text"
//                   value={header.value}
//                   onChange={(e) => handleHeaderChange(index, 'value', e.target.value)}
//                   placeholder="Value"
//                   className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
//                 />
//                 <button
//                   type="button"
//                   onClick={() => handleRemoveHeader(index)}
//                   className="p-2 text-red-500 hover:text-red-700"
//                 >
//                   <Trash2 size={18} />
//                 </button>
//               </div>
//             ))}
//             <div>
//               <button
//                 type="button"
//                 onClick={handleAddHeader}
//                 className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800"
//               >
//                 <Plus size={16} />
//                 <span>Add Header</span>
//               </button>
//             </div>
//           </div>
//         )}

//         {/* Body Tab */}
//         {activeTab === 'body' && (
//           <div>
//             <textarea
//               value={requestData.body || ''}
//               onChange={handleBodyChange}
//               placeholder="Request body (JSON)"
//               rows={8}
//               className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
//             />
//           </div>
//         )}

//         {activeTab === 'schemas' && (
//           <div>
//             <SchemaPage/>
//           </div>
//         )}

//       </div>
//     </form>
//   );
// };

// export default RequestForm;