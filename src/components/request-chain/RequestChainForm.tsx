import { Save} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Collection } from '../../types';
import ChainRequestComponent from './ChainRequest';

interface RequestChainFormProps {
  initialName?: string;
  initialDescription?: string;
}

const COLLECTIONS_STORAGE_KEY = 'api_collections';

const RequestChainForm: React.FC<RequestChainFormProps> = ({
  initialName = '',
  initialDescription = '',
//   collections = [],
//   onSubmit,
}) => {
  const navigate = useNavigate();
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [collections, setCollections] = useState<Collection[]>([]);
  
  const handleCollectionsUpdate = (newCollections:any) => {
    setCollections(newCollections);
    console.log('Received from child:', newCollections);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Saving with collections:', collections);
    // onSubmit({ name, description });
  };

  
    useEffect(() => {
    const savedCollections = localStorage.getItem(COLLECTIONS_STORAGE_KEY);
    if (savedCollections) {
        setCollections(JSON.parse(savedCollections));
    }
    }, []);

  return (
    <div className="space-y-6 py-6 px-4">
        <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Create Request Chain</h1>
        </div>
        <form onSubmit={handleSubmit}>
        <div className="bg-white shadow rounded-lg overflow-hidden">
            {/* Basic Information */}
            <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h2>
            <div className="space-y-4">
                <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Request Chain Name
                </label>
                <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    placeholder="e.g., User Authentication API Tests"
                    required
                />
                </div>
                <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    Description
                </label>
                <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    placeholder="Describe the purpose of this Request Chain"
                />
                </div>
            </div>
            </div>
        </div>
      </form>
        <div className="space-x-2 w-full">
            <ChainRequestComponent onCollectionsChange={handleCollectionsUpdate}/>
        </div>
        <div className="px-6 py-4 flex justify-end">
            <button
              type="button"
              onClick={() => navigate('/request-chain')}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 mr-3"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center px-4 py-2 rounded-md shadow-sm text-sm font-medium text-white bg-blue-500 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Request Chain
            </button>
          </div>
    </div>
    
  );
};

export default RequestChainForm;
