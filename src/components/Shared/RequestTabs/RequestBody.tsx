'use client';
import { HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '@/components/ui/tooltip';
import JsonVariableSubstitution from '@/components/RequestBuilder/RequestEditor/JsonVariableSubstitution';
import KeyValueEditor from '@/components/ui/KeyValueEditor';
import KeyValueEditorWithFileUpload, {
  type KeyValuePairWithFile,
} from '@/components/ui/KeyValueEditorWithFileUpload';
import { BodyType, FormField } from '@/shared/types/request';

interface KeyValueField {
  id: string;
  key: string;
  value: string;
}

interface RequestBodyProps {
  bodyType: BodyType;
  bodyContent: string;
  formFields: FormField[];
  urlEncodedFields: KeyValueField[];
  staticVariables: any[];
  dynamicVariables: any[];
  initialVariable: any[];
  onBodyTypeChange: (type: BodyType) => void;
  onBodyContentChange: (content: string) => void;
  onBeautify: () => void;
  onVariableSelect: (variable: any) => void;
  onConfirmSubstitution: (substitutions: any[]) => void;
  onAddFormField: () => void;
  onUpdateFormField: (id: string, field: Partial<FormField>) => void;
  onRemoveFormField: (id: string) => void;
  onAddUrlEncodedField: () => void;
  onUpdateUrlEncodedField: (id: string, field: Partial<KeyValueField>) => void;
  onRemoveUrlEncodedField: (id: string) => void;
  showSubstituteButton?: boolean;
}

export default function RequestBody({
  bodyType,
  bodyContent,
  formFields,
  urlEncodedFields,
  staticVariables,
  dynamicVariables,
  initialVariable,
  onBodyTypeChange,
  onBodyContentChange,
  onBeautify,
  onVariableSelect,
  onConfirmSubstitution,
  onAddFormField,
  onUpdateFormField,
  onRemoveFormField,
  onAddUrlEncodedField,
  onUpdateUrlEncodedField,
  onRemoveUrlEncodedField,
  showSubstituteButton,
}: RequestBodyProps) {
  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <TooltipProvider>
          <div className='flex items-center gap-2'>
            <h4 className='text-xs md:text-lg font-medium text-gray-900 dark:text-white'>
              Request Body
            </h4>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type='button'
                  className='p-1 text-gray-500 hover:text-[rgb(19,111,176)] transition-colors'
                >
                  <HelpCircle className='w-4 h-4' />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                Request body can include both static and dynamic values.
              </TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
        <div className='flex items-center gap-2'>
          {(bodyType === 'json' || bodyType === 'raw') &&
            bodyContent.trim() && (
              <button
                onClick={onBeautify}
                className='px-3 py-2 bg-[rgb(19,111,176)] hover:bg-[rgb(15,90,144)] text-white text-sm rounded-md transition-colors font-medium'
                title='Format JSON with proper indentation'
              >
                Beautify
              </button>
            )}
          {/* <select
            value={bodyType}
            onChange={(e) => onBodyTypeChange(e.target.value as BodyType)}
            className='border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-sm font-medium hover:border-blue-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all duration-150'
          >
            <option value='none'>None</option>
            <option value='json'>JSON</option>
            <option value='form-data'>Form Data</option>
            <option value='urlencoded'>URL Encoded</option>{' '}
            <option value='raw'>Raw</option>
            <option value='binary'>Binary</option>
          </select> */}
        </div>
      </div>

      {bodyType === 'none' && (
        <div className='text-gray-500 dark:text-gray-400 text-center p-8'>
          This request does not have a body. Select a body type from the
          dropdown above to add one.
        </div>
      )}

      {bodyType === 'form-data' && (
        <>
          <div className='mb-2 text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-3 rounded-md border border-gray-200 dark:border-gray-700'>
            <p>
              Form fields support both text values and file uploads. Click the
              "File" button next to any field to upload a file.
            </p>
          </div>
          <KeyValueEditorWithFileUpload
            items={formFields}
            onAdd={onAddFormField}
            onUpdate={onUpdateFormField}
            onRemove={onRemoveFormField}
            title='Form fields'
            addButtonLabel='Add Field'
            emptyMessage='No form fields added yet.'
          />
        </>
      )}

      {bodyType === 'urlencoded' && (
        <KeyValueEditor
          items={urlEncodedFields}
          onAdd={onAddUrlEncodedField}
          onUpdate={onUpdateUrlEncodedField}
          onRemove={onRemoveUrlEncodedField}
          title='URL encoded fields'
          addButtonLabel='Add Field'
          emptyMessage='No URL encoded fields added yet.'
        />
      )}

      {bodyType === 'raw' && (
        <JsonVariableSubstitution
          onChange={onBodyContentChange}
          value={bodyContent}
          onVariableSelect={onVariableSelect}
          onConfirmSubstitution={onConfirmSubstitution}
          mode='raw'
          staticVariables={staticVariables}
          dynamicVariables={dynamicVariables}
          initialVariable={initialVariable}
          readOnly={false}
          showSubstituteButton={showSubstituteButton}
        />
      )}

      {bodyType === 'binary' && (
        <div className='text-center p-8 border border-dashed border-gray-300 dark:border-gray-700 rounded-md'>
          <p className='text-gray-500 dark:text-gray-400 mb-4'>
            Select a file to upload
          </p>
          <Button>Choose File</Button>
        </div>
      )}
    </div>
  );
}
