// import React from 'react';
// import { Plus, Trash2 } from 'lucide-react';
// import { KeyValuePair } from '../types';

// interface RequestParamsProps {
//   params: Record<string, string>;
//   onChange: (params: Record<string, string>) => void;
// }

// const RequestParams: React.FC<RequestParamsProps> = ({ params, onChange }) => {
//   const addParam = () => {
//     onChange({ ...params, '': '' });
//   };

//   const updateParam = (oldKey: string, newKey: string, value: string) => {
//     const newParams = { ...params };
//     if (oldKey !== newKey) {
//       delete newParams[oldKey];
//     }
//     newParams[newKey] = value;
//     onChange(newParams);
//   };

//   const removeParam = (key: string) => {
//     const newParams = { ...params };
//     delete newParams[key];
//     onChange(newParams);
//   };

//   console.log(params)

//   return (
//     <div className="space-y-2">
//       <div className="flex justify-between items-center">
//         <h3 className="text-sm font-medium">Query Parameters</h3>
//         <button
//           onClick={addParam}
//           className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
//         >
//           <Plus size={14} />
//           Add Parameter
//         </button>
//       </div>
      
//       <div className="space-y-2">
//         {Object.entries(params).map(([key, value], index) => (
//           <div key={index} className="flex items-center gap-2">
//             <input
//               type="text"
//               value={key}
//               onChange={(e) => updateParam(key, e.target.value, value)}
//               className="flex-1 text-sm px-2 py-1 border border-gray-200 rounded"
//               placeholder="Key"
//             />
//             <input
//               type="text"
//               value={value}
//               onChange={(e) => updateParam(key, key, e.target.value)}
//               className="flex-1 text-sm px-2 py-1 border border-gray-200 rounded"
//               placeholder="Value"
//             />
//             <button
//               onClick={() => removeParam(key)}
//               className="text-red-500 hover:text-red-600"
//             >
//               <Trash2 size={14} />
//             </button>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }

// export default RequestParams;

import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { KeyValuePair } from '../types';

interface RequestParamsProps {
  params?: KeyValuePair[];
  onChange: (params?: KeyValuePair[]) => void;
}

const RequestParams: React.FC<RequestParamsProps> = ({ params, onChange }) => {
  const addParam = () => {
    // Prevent adding another empty param
    const hasEmpty = params?.some(p => p.key.trim() === '' && p.value.trim() === '');
    if (!hasEmpty && params) {
      onChange([...params, { key: '', value: '' }]);
    }
  };

  const updateParam = (index: number, field: 'key' | 'value', newValue: string) => {
    if(params){
      const updated = [...params];
      updated[index] = { ...updated[index], [field]: newValue };
      onChange(updated);
    }
  };

  const removeParam = (index: number) => {
    if(params){
      const updatedParams = [...params];
      updatedParams.splice(index, 1);
      onChange(updatedParams);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium">Query Parameters</h3>
        <button
          onClick={addParam}
          className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
        >
          <Plus size={14} />
          Add Parameter
        </button>
      </div>

      <div className="space-y-2">
        {params?.map((param, index) => (
        <div key={index} className="flex items-center gap-2">
          <input
            type="text"
            value={param.key}
            onChange={(e) => updateParam(index, 'key', e.target.value)}
            className="flex-1 text-sm px-2 py-1 border border-gray-200 rounded"
            placeholder="Key"
          />
          <input
            type="text"
            value={param.value}
            onChange={(e) => updateParam(index, 'value', e.target.value)}
            className="flex-1 text-sm px-2 py-1 border border-gray-200 rounded"
            placeholder="Value"
          />
          <button
            onClick={() => removeParam(index)}
            className="text-red-500 hover:text-red-600"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ))}
      </div>
    </div>
  );
};

export default RequestParams;
