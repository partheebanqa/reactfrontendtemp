// import React, { useState } from 'react';
// import ResponsePanel from './ResponsePanel';
// import PrimarySchemaPanel from './schema/PrimarySchemaPanel';
// import SchemaGeneratorPanel from './schema/SchemaGeneratorPanel';
// import { RequestProvider, useRequest } from '../../context/RequestContext';
// import { SchemaProvider, useSchema } from '../../context/SchemaContext';
// import RequestForm from './RequestForm';
// import CollectionsSidebar from '../CollectionsSidebar';
// import {
//   Request,
//   Collection,
//   CollectionRequest,
// } from "../../types";
// import ImportModal from '../ImportModal';

// const RequestBuilderPage: React.FC = () => {
//   const { requestData, responseData } = useRequest();
//   const { primarySchema } = useSchema();
//   const [showSchemaPanel, setShowSchemaPanel] = useState(false);

//   const [collections, setCollections] = useState<Collection[]>([]);
//   const [showImportModal, setShowImportModal] = useState(false);
//   const [activeRequest, setActiveRequest] = useState<Request>({
//       method: "GET",
//       url: "",
//       headers: {},
//       params: {},
//       body: "",
//       isGraphQL: false,
//       graphQLQuery: "",
//       graphQLVariables: "",
//     });

//   const handleCollectionCreate = (collection: Collection) => {
//       setCollections((prev) => [...prev, collection]);
//     };
  
//     const handleCollectionUpdate = (collection: Collection) => {
//       setCollections((prev) =>
//         prev.map((c) => (c.id === collection.id ? collection : c))
//       );
//     };
  
//     const handleCollectionDelete = (collectionId: string) => {
//       setCollections((prev) => prev.filter((c) => c.id !== collectionId));
//     };

//     const handleRequestSelect = (request: CollectionRequest) => {
//         setActiveRequest(request.request);
//       };

//     const handleImport = (importedCollections: Collection[]) => {
//     setCollections(prev => [...prev, ...importedCollections]);
//   };
  
//   return (
//     <div className="h-full">
//       <div className="flex overflow-y-auto h-full">
//         <CollectionsSidebar
//           collections={collections}
//           onCollectionCreate={handleCollectionCreate}
//           onCollectionUpdate={handleCollectionUpdate}
//           onCollectionDelete={handleCollectionDelete}
//           onRequestSelect={handleRequestSelect}
//           onImport={() => setShowImportModal(true)}
//           currentRequest={activeRequest}
//         />
//         <ImportModal
//           isOpen={showImportModal}
//           onClose={() => setShowImportModal(false)}
//           onImport={handleImport}/>
          
//         <div className="flex-1 overflow-auto p-4">
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6 px-4">
//             <div className="md:col-span-2 space-y-6">
//               <div className="bg-white rounded-lg shadow-md p-4">
//                 <h2 className="text-xl font-semibold mb-4">Request Builder</h2>
//                 <RequestForm />
//               </div>
              
//               {responseData && (
//                 <div className="bg-white rounded-lg shadow-md p-4">
//                   <div className="flex justify-between items-center mb-4">
//                     <h2 className="text-xl font-semibold">Response</h2>
//                     <button 
//                       className="px-3 py-1 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
//                       onClick={() => setShowSchemaPanel(true)}
//                     >
//                       Generate Schema
//                     </button>
//                   </div>
//                   <ResponsePanel />

//                   {showSchemaPanel && (
//                     <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//                       <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full relative">
//                         <button
//                           onClick={() => setShowSchemaPanel(false)}
//                           className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-2xl"
//                         >
//                           ✕
//                         </button>
//                         <SchemaGeneratorPanel 
//                           response={responseData.data}
//                           onClose={() => setShowSchemaPanel(false)}
//                         />
//                       </div>
//                     </div>
//                   )}

//                 </div>
//               )}
//             </div>
            
//             {/* <div className="md:col-span-1">
//               <div className="bg-white rounded-lg shadow-md p-4 sticky top-4">
//                 <h2 className="text-xl font-semibold mb-4">Primary Schema</h2>
//                 {primarySchema ? (
//                   <PrimarySchemaPanel />
//                 ) : (
//                   <div className="p-4 border border-dashed border-gray-300 rounded-md text-center text-gray-500">
//                     <p>No primary schema selected</p>
//                     <p className="mt-2 text-sm">Upload or create a schema and mark it as primary</p>
//                   </div>
//                 )}
//               </div>
//             </div> */}
//           </div>
//         </div>
//       </div>
//     </div>
        
//   );
// };

// export default RequestBuilderPage;