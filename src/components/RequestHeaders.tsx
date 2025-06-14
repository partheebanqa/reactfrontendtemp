// import React from 'react';
// import { Plus, Trash2 } from 'lucide-react';
// import { KeyValuePair } from '../types';

// interface RequestHeadersProps {
//   headers: Record<string, string>;
//   onChange: (headers: Record<string, string>) => void;
// }

// const RequestHeaders: React.FC<RequestHeadersProps> = ({ headers, onChange }) => {
//   const addHeader = () => {
//     onChange({ ...headers, '': '' });
//   };

//   const updateHeader = (oldKey: string, newKey: string, value: string) => {
//     const newHeaders = { ...headers };
//     if (oldKey !== newKey) {
//       delete newHeaders[oldKey];
//     }
//     newHeaders[newKey] = value;
//     onChange(newHeaders);
//   };

//   const removeHeader = (key: string) => {
//     const newHeaders = { ...headers };
//     delete newHeaders[key];
//     onChange(newHeaders);
//   };

//   return (
//     <div className="space-y-2">
//       <div className="flex justify-between items-center">
//         <h3 className="text-sm font-medium">Headers</h3>
//         <button
//           onClick={addHeader}
//           className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
//         >
//           <Plus size={14} />
//           Add Header
//         </button>
//       </div>
      
//       <div className="space-y-2">
//         {Object.entries(headers).map(([key, value], index) => (
//           <div key={index} className="flex items-center gap-2">
//             <input
//               type="text"
//               value={key}
//               onChange={(e) => updateHeader(key, e.target.value, value)}
//               className="flex-1 text-sm px-2 py-1 border border-gray-200 rounded text-black"
//               placeholder="Key"
//             />
//             <input
//               type="text"
//               value={value}
//               onChange={(e) => updateHeader(key, key, e.target.value)}
//               className="flex-1 text-sm px-2 py-1 border border-gray-200 rounded text-black"
//               placeholder="Value"
//             />
//             <button
//               onClick={() => removeHeader(key)}
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

// export default RequestHeaders;

import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { KeyValuePair } from '../types';

interface RequestHeadersProps {
  headers?: KeyValuePair[];
  onChange: (headers: KeyValuePair[]) => void;
}

const RequestHeaders: React.FC<RequestHeadersProps> = ({ headers = [], onChange }) => {
  const addHeader = () => {
    onChange([...headers, { key: '', value: '', enabled: true }]);
  };

  const updateHeader = (index: number, field: 'key' | 'value' | 'enabled', value: string | boolean) => {
    const newHeaders = headers.map((header, i) =>
      i === index ? { ...header, [field]: value } : header
    );
    onChange(newHeaders);
  };

  const removeHeader = (index: number) => {
    const newHeaders = headers.filter((_, i) => i !== index);
    onChange(newHeaders);
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium">Headers</h3>
        <button
          onClick={addHeader}
          className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
          type="button"
        >
          <Plus size={14} />
          Add Header
        </button>
      </div>

      <div className="space-y-2">
        {headers.map((header, index) => (
          <div key={index} className="flex items-center gap-2">
            <input
              type="text"
              value={header.key}
              onChange={e => updateHeader(index, 'key', e.target.value)}
              className="flex-1 text-sm px-2 py-1 border border-gray-200 rounded text-black"
              placeholder="Key"
            />
            <input
              type="text"
              value={header.value}
              onChange={e => updateHeader(index, 'value', e.target.value)}
              className="flex-1 text-sm px-2 py-1 border border-gray-200 rounded text-black"
              placeholder="Value"
            />
            <input
              type="checkbox"
              checked={header.enabled !== false}
              onChange={e => updateHeader(index, 'enabled', e.target.checked)}
              title="Enabled"
            />
            <button
              onClick={() => removeHeader(index)}
              className="text-red-500 hover:text-red-600"
              type="button"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RequestHeaders;
