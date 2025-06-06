import React, { useState } from 'react';
import { useApiStore } from '../../shared/store/apiStore';
import { Database, Trash2, Plus, Variable, RefreshCw, Edit2, Copy } from 'lucide-react';
import { faker } from '@faker-js/faker';
import Select from 'react-select';

const DataManager: React.FC = () => {
  const { extractedData, deleteExtractedData, variables, addVariable, deleteVariable, updateVariable, requests } = useApiStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDynamicModal, setShowDynamicModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [newVariable, setNewVariable] = useState({ name: '', value: '', type: 'string' });
  const [dynamicVariable, setDynamicVariable] = useState({ name: '', type: 'string' });
  const [editingVariable, setEditingVariable] = useState<any>(null);
  const [listValues, setListValues] = useState<string[]>([]);

  const generateDynamicValue = (type: string): string => {
    switch (type) {
      case 'string':
        return faker.lorem.word();
      case 'number':
        return faker.number.int({ min: 1, max: 1000 }).toString();
      case 'date':
        return faker.date.recent().toISOString();
      case 'phone':
        return faker.phone.number();
      case 'firstname':
        return faker.person.firstName();
      case 'lastname':
        return faker.person.lastName();
      case 'country':
        return faker.location.country();
      case 'city':
        return faker.location.city();
      case 'state':
        return faker.location.state();
      case 'stateLabel':
        return faker.location.state({ abbreviated: true });
      case 'address':
        return faker.location.streetAddress(true);
      case 'fullAddress':
        return `${faker.location.streetAddress(true)}, ${faker.location.city()}, ${faker.location.state({ abbreviated: true })} ${faker.location.zipCode()}`;
      case 'list':
        return JSON.stringify(Array.from({ length: 3 }, () => faker.lorem.word()));
      case 'json':
        return JSON.stringify({
          id: faker.string.uuid(),
          name: faker.person.fullName(),
          email: faker.internet.email()
        });
      default:
        return '';
    }
  };

  const handleAddStatic = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVariable.name) return;

    const id = crypto.randomUUID();
    const value = newVariable.type === 'list' 
      ? JSON.stringify(listValues)
      : newVariable.value;

    addVariable({
      id,
      ...newVariable,
      value,
      description: '',
      isSecret: false
    });

    setNewVariable({ name: '', value: '', type: 'string' });
    setListValues([]);
    setShowAddModal(false);
  };

  const handleEditVariable = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVariable) return;

    const value = editingVariable.type === 'list'
      ? JSON.stringify(listValues)
      : editingVariable.value;

    updateVariable(editingVariable.id, {
      ...editingVariable,
      value
    });

    setEditingVariable(null);
    setListValues([]);
    setShowEditModal(false);
  };

  const startEdit = (variable: any) => {
    setEditingVariable(variable);
    if (variable.type === 'list') {
      try {
        setListValues(JSON.parse(variable.value));
      } catch (e) {
        setListValues([]);
      }
    }
    setShowEditModal(true);
  };

  const handleAddListValue = () => {
    setListValues([...listValues, '']);
  };

  const handleUpdateListValue = (index: number, value: string) => {
    const newValues = [...listValues];
    newValues[index] = value;
    setListValues(newValues);
  };

  const handleRemoveListValue = (index: number) => {
    setListValues(listValues.filter((_, i) => i !== index));
  };

  const handleAddDynamic = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dynamicVariable.name || !dynamicVariable.type) return;

    const id = crypto.randomUUID();
    addVariable({
      id,
      name: dynamicVariable.name,
      type: dynamicVariable.type,
      value: generateDynamicValue(dynamicVariable.type),
      description: 'Dynamic variable',
      isSecret: false
    });

    setDynamicVariable({ name: '', type: 'string' });
    setShowDynamicModal(false);
  };

  const regenerateValue = (id: string, type: string) => {
    const variable = variables.find((v:any) => v.id === id);
    if (variable) {
      const newValue = generateDynamicValue(type);
      updateVariable(id, {
        ...variable,
        value: newValue
      });
    }
  };

  const handleCopyValue = (value: string) => {
    navigator.clipboard.writeText(value);
  };

  const handleCopyVariableName = (name: string) => {
    navigator.clipboard.writeText(`${name}`);
  };

  const handleDuplicateVariable = (variable: any) => {
    const id = crypto.randomUUID();
    const newVariable = {
      ...variable,
      id,
      name: `${variable.name} (Copy)`,
    };
    addVariable(newVariable);
  };

  const dataTypeOptions = [
    { value: 'string', label: 'String' },
    { value: 'number', label: 'Number' },
    { value: 'date', label: 'Date' },
    { value: 'phone', label: 'Phone Number' },
    { value: 'firstname', label: 'First Name' },
    { value: 'lastname', label: 'Last Name' },
    { value: 'country', label: 'Country' },
    { value: 'city', label: 'City' },
    { value: 'state', label: 'State' },
    { value: 'stateLabel', label: 'State Label (Abbreviated)' },
    { value: 'address', label: 'Street Address' },
    { value: 'fullAddress', label: 'Full Address' },
    { value: 'list', label: 'List' },
    { value: 'json', label: 'JSON' }
  ];

  const staticVariables = variables.filter((v:any) => !v.description?.includes('Dynamic'));
  const dynamicVariables = variables.filter((v:any) => v.description?.includes('Dynamic'));

  const renderListEditor = (values: string[], onChange: (index: number, value: string) => void, onRemove: (index: number) => void) => (
    <div className="space-y-2">
      {values.map((value, index) => (
        <div key={index} className="flex items-center space-x-2">
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(index, e.target.value)}
            className="flex-1 px-4 py-2 bg-white dark:bg-[#323232] border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 text-sm"
            placeholder={`Value ${index + 1}`}
          />
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="text-red-500 hover:text-red-600"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={handleAddListValue}
        className="inline-flex items-center px-4 py-2 bg-white dark:bg-[#323232] border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Value
      </button>
    </div>
  );

  const renderVariableCard = (variable: any, isDynamic: boolean) => (
    <div 
      key={variable.id} 
      className="group bg-white dark:bg-[#323232] rounded-lg border border-gray-100 dark:border-gray-700 p-4 hover:shadow-md transition-all duration-200"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white">{variable.name}</h3>
          <button
            onClick={() => handleCopyVariableName(variable.name)}
            className="p-1 text-gray-400 hover:text-indigo-500 rounded-full hover:bg-gray-50 dark:hover:bg-gray-700"
            title="Copy variable name"
          >
            <Variable className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => handleCopyValue(variable.value)}
            className="p-1 text-gray-400 hover:text-indigo-500 rounded-full hover:bg-gray-50 dark:hover:bg-gray-700"
            title="Copy value"
          >
            <Copy className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => handleDuplicateVariable(variable)}
            className="p-1 text-gray-400 hover:text-indigo-500 rounded-full hover:bg-gray-50 dark:hover:bg-gray-700"
            title="Duplicate variable"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
          {isDynamic ? (
            <button
              onClick={() => regenerateValue(variable.id, variable.type)}
              className="p-1 text-gray-400 hover:text-indigo-500 rounded-full hover:bg-gray-50 dark:hover:bg-gray-700"
              title="Regenerate value"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          ) : (
            <button
              onClick={() => startEdit(variable)}
              className="p-1 text-gray-400 hover:text-indigo-500 rounded-full hover:bg-gray-50 dark:hover:bg-gray-700"
              title="Edit variable"
            >
              <Edit2 className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            onClick={() => deleteVariable(variable.id)}
            className="p-1 text-gray-400 hover:text-red-500 rounded-full hover:bg-gray-50 dark:hover:bg-gray-700"
            title="Delete variable"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      <div className="text-sm text-gray-600 dark:text-gray-300 break-all font-mono bg-gray-50 dark:bg-gray-800/50 rounded-md p-2">
        {variable.type === 'list' 
          ? JSON.parse(variable.value).join(', ')
          : variable.value}
      </div>
      <div className="mt-2">
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
          isDynamic 
            ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
        }`}>
          {variable.type}
        </span>
      </div>
    </div>
  );

  const renderModal = (type: 'static' | 'dynamic') => (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white dark:bg-[#2c2c2c] rounded-xl shadow-xl w-full max-w-md m-4 p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Add {type === 'static' ? 'Static' : 'Dynamic'} Variable
        </h3>
        <form onSubmit={type === 'static' ? handleAddStatic : handleAddDynamic} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Name</label>
            <input
              type="text"
              value={type === 'static' ? newVariable.name : dynamicVariable.name}
              onChange={(e) => type === 'static' 
                ? setNewVariable({ ...newVariable, name: e.target.value })
                : setDynamicVariable({ ...dynamicVariable, name: e.target.value })
              }
              className="block w-full px-4 py-2 bg-white dark:bg-[#323232] border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Type</label>
            <Select
              value={{ 
                value: type === 'static' ? newVariable.type : dynamicVariable.type,
                label: type === 'static' ? newVariable.type : dynamicVariable.type
              }}
              onChange={(option) => type === 'static'
                ? setNewVariable({ ...newVariable, type: option?.value || 'string' })
                : setDynamicVariable({ ...dynamicVariable, type: option?.value || 'string' })
              }
              options={dataTypeOptions}
              className="react-select-container"
              classNames={{
                control: (state) => 'dark:bg-[#323232] dark:border-gray-600',
                menu: () => 'dark:bg-[#323232]',
                option: (state) => state.isFocused ? 'dark:bg-gray-700' : 'dark:bg-[#323232]'
              }}
            />
          </div>
          {type === 'static' && newVariable.type === 'list' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Values</label>
              {renderListEditor(listValues, handleUpdateListValue, handleRemoveListValue)}
            </div>
          ) : type === 'static' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Value</label>
              <input
                type="text"
                value={newVariable.value}
                onChange={(e) => setNewVariable({ ...newVariable, value: e.target.value })}
                className="block w-full px-4 py-2 bg-white dark:bg-[#323232] border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                required
              />
            </div>
          ) : null}
          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={() => type === 'static' ? setShowAddModal(false) : setShowDynamicModal(false)}
              className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:text-gray-500 dark:hover:text-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Add Variable
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return (
    <div className="h-full bg-gray-50 dark:bg-[#1e1e1e] p-6 space-y-6">
      {/* Static Variables Section */}
      <div className="bg-white/80 dark:bg-[#1e1e1e] backdrop-blur-xl rounded-xl shadow-sm border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200/50 dark:border-gray-700/50">
          <div className="flex justify-between items-center">
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Static Variables</h2>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center px-3 py-1.5 bg-indigo-500/10 dark:bg-indigo-500/20 hover:bg-indigo-500/20 dark:hover:bg-indigo-500/30 text-indigo-600 dark:text-indigo-300 text-sm font-medium rounded-full transition-colors"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Variable
            </button>
          </div>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {staticVariables.map((variable:any) => renderVariableCard(variable, false))}
        </div>
      </div>

      {/* Dynamic Variables Section */}
      <div className="bg-white/80 dark:bg-[#1e1e1e] backdrop-blur-xl rounded-xl shadow-sm border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200/50 dark:border-gray-700/50">
          <div className="flex justify-between items-center">
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Dynamic Variables</h2>
            <button
              onClick={() => setShowDynamicModal(true)}
              className="inline-flex items-center px-3 py-1.5 bg-indigo-500/10 dark:bg-indigo-500/20 hover:bg-indigo-500/20 dark:hover:bg-indigo-500/30 text-indigo-600 dark:text-indigo-300 text-sm font-medium rounded-full transition-colors"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Dynamic
            </button>
          </div>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {dynamicVariables.map((variable:any) => renderVariableCard(variable, true))}
        </div>
      </div>

      {/* Extracted Data Section */}
      <div className="bg-white/80 dark:bg-[#1e1e1e] backdrop-blur-xl rounded-xl shadow-sm border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200/50 dark:border-gray-700/50">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Extracted API Data</h2>
        </div>
        
        <div className="p-6">
          {Object.keys(extractedData).length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead>
                  <tr>
                    <th className="px-6 py-3 bg-gray-50 dark:bg-gray-800/50 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Application Name
                    </th>
                    <th className="px-6 py-3 bg-gray-50 dark:bg-gray-800/50 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      API Name
                    </th>
                    <th className="px-6 py-3 bg-gray-50 dark:bg-gray-800/50 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      API Path
                    </th>
                    <th className="px-6 py-3 bg-gray-50 dark:bg-gray-800/50 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      XPath/JSONPath
                    </th>
                    <th className="px-6 py-3 bg-gray-50 dark:bg-gray-800/50 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Variable Name
                    </th>
                    <th className="px-6 py-3 bg-gray-50 dark:bg-gray-800/50 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Value
                    </th>
                    <th className="px-6 py-3 bg-gray-50 dark:bg-gray-800/50 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Date Added
                    </th>
                    <th className="px-6 py-3 bg-gray-50 dark:bg-gray-800/50"></th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-[#1e1e1e] divide-y divide-gray-200 dark:divide-gray-700">
                  {Object.entries(extractedData).map(([key, value], index) => {
                    const request = requests.find((r:any) => r.url.includes(value));
                    const appName = request?.category || 'Unknown App';
                    const apiName = request?.name || 'Unknown API';
                    const apiPath = request?.url || 'Unknown Path';
                    
                    return (
                      <tr key={key} className={index % 2 === 0 ? 'bg-white dark:bg-[#1e1e1e]' : 'bg-gray-50 dark:bg-gray-800/50'}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          {appName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          {apiName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 font-mono">
                          {apiPath}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 font-mono">
                          {key.includes('$') ? key : `$.${key}`}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-indigo-600 dark:text-indigo-400">
                          <div className="flex items-center space-x-2">
                            <span>{key}</span>
                            <button
                              onClick={() => handleCopyVariableName(key)}
                              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                              title="Copy variable name"
                            >
                              <Copy className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 font-mono">
                          <div className="flex items-center space-x-2">
                            <span className="truncate max-w-xs">{value}</span>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(value);
                              }}
                              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                              title="Copy value"
                            >
                              <Copy className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {new Date().toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => deleteExtractedData(key)}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Database className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-700 mb-3" />
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">No extracted data</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Extract data from API responses using the extraction tools
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showAddModal && renderModal('static')}
      {showDynamicModal && renderModal('dynamic')}
      {showEditModal && editingVariable && renderModal('static')}
    </div>
  );
};

export default DataManager;