import { Collection } from '@/shared/types/collection';
import { Save, X } from 'lucide-react';
import React, { useState } from 'react'

interface CreateCollectionModelProps {
    selectedCollection: Collection | null;
    handleClose: () => void;
    handleSaveCollection: (name: string) => void;
}

function CreateCollectionModel({ selectedCollection, handleClose, handleSaveCollection }: CreateCollectionModelProps) {
    const [name, setName] = useState(selectedCollection?.name || '');
    const [error, setError] = useState('');
    const handleSave = () => {
        if (name.trim() === "") {
            setError("Collection name is required.");
            return;
        }
        setError("");
        handleSaveCollection(name);
    };
    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg w-full max-w-md border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-semibold">
                        {selectedCollection ? "Edit Collection" : "New Collection"}
                    </h2>
                    <button
                        onClick={handleClose}
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-4 space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => {
                                setName(e.target.value);
                                if (e.target.value.trim() !== "") setError("");
                            }}
                            id="collectionName"
                            className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-800 ${error ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                            placeholder="Collection name"
                        />
                        {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
                    </div>
                </div>

                <div className="flex justify-end gap-2 p-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                        onClick={handleClose}
                        className="px-4 py-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
                    >
                        <Save size={16} />
                        Save
                    </button>
                </div>
            </div>
        </div>
    )
}

export default CreateCollectionModel