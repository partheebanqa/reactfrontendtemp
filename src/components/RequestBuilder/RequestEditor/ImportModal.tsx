import React, { useState, useRef } from 'react';
import {
    X,
    Upload,
    AlertCircle,
    Link as LinkIcon,
    FileText,
    Terminal,
} from 'lucide-react';
import { importCurlCommand } from '@/lib/importers/curlImporter';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

// Helper function to validate JSON
const isValidJson = (text: string): boolean => {
    try {
        JSON.parse(text);
        return true;
    } catch (e) {
        return false;
    }
};

// Helper function to check if it's a Postman collection
const isPostmanCollection = (json: any): boolean => {
    return json?.info?.schema?.includes('schema.getpostman.com');
};

// Helper function to check if it's a Swagger/OpenAPI specification
const isSwaggerSpec = (json: any): boolean => {
    return Boolean(json?.swagger || json?.openapi);
};

interface ImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCurlImport?: (parsedRequest: any) => void; // Callback for cURL import
}

const ImportModal: React.FC<ImportModalProps> = ({
    isOpen,
    onClose,
    onCurlImport,
}) => {
    const [importText, setImportText] = useState('');
    const [postmanUrl, setPostmanUrl] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [importing, setImporting] = useState(false);
    const [importType, setImportType] = useState<'file' | 'swagger' | 'curl'>(
        'curl' // Default to curl for your use case
    );
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    if (!isOpen) return null;

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            // Check file type - allow JSON and other formats that might be valid for import
            const isAcceptedType =
                file.type.includes('json') ||
                file.type.includes('application/x-yaml') ||
                file.type.includes('text/') ||
                file.name.endsWith('.json') ||
                file.name.endsWith('.yaml') ||
                file.name.endsWith('.yml');

            if (!isAcceptedType) {
                setError('Invalid file type. Please select a JSON, YAML, or text file');
                toast({
                    title: 'Invalid File Type',
                    description: 'Please select a supported file format',
                    variant: 'destructive',
                });
                setSelectedFile(null);
                // Reset the file input
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
                return;
            }

            // Check file size (5MB = 5 * 1024 * 1024 bytes)
            if (file.size > 5 * 1024 * 1024) {
                setError('File size exceeds 5MB limit');
                toast({
                    title: 'File Too Large',
                    description: 'Please select a file under 5MB',
                    variant: 'destructive',
                });
                setSelectedFile(null);
                // Reset the file input
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
                return;
            }

            setSelectedFile(file);
            setError(null);
        }
    };

    const handleOnClose = () => {
        setImportText('');
        setPostmanUrl('');
        setSelectedFile(null);
        setImporting(false);
        setError(null);
        onClose();
    };

    const handleImport = async () => {
        setImporting(true);
        setError(null);

        try {
            if (importType === 'curl') {
                // Handle cURL import
                if (!importText.trim()) {
                    throw new Error('Please enter a cURL command');
                }

                if (!importText.trim().toLowerCase().startsWith('curl')) {
                    throw new Error('Invalid cURL command. Must start with "curl"');
                }

                // Parse the cURL command
                const parsedRequest = importCurlCommand(importText.trim());

                // If onCurlImport callback is provided, use it (for direct request editor integration)
                if (onCurlImport) {
                    onCurlImport(parsedRequest);
                    // toast({
                    //     title: 'cURL Imported',
                    //     description: 'Request has been populated from cURL command',
                    // });
                    handleOnClose();
                } else {
                    // For now, just show success (can be extended to create collections later)
                    toast({
                        title: 'cURL Parsed',
                        description: 'cURL command has been successfully parsed',
                    });
                    console.log('Parsed cURL request:', parsedRequest);
                    handleOnClose();
                }
            } else if (importType === 'swagger') {
                // Placeholder for Swagger import
                toast({
                    title: 'Not Implemented',
                    description: 'Swagger import is not yet implemented',
                    variant: 'destructive',
                });
            } else if (importType === 'file') {
                // Placeholder for file import
                toast({
                    title: 'Not Implemented',
                    description: 'File import is not yet implemented',
                    variant: 'destructive',
                });
            }
        } catch (err) {
            console.error('Import error:', err);
            toast({
                title: 'Import Error',
                description: err instanceof Error ? err.message : 'Failed to import',
                variant: 'destructive',
            });
            setImporting(false);
        }
    };

    const isImportDisabled = () => {
        if (importing) return true;

        switch (importType) {
            case 'curl':
                return !importText.trim();
            case 'swagger':
                return !postmanUrl.trim() && !importText.trim();
            case 'file':
                return !selectedFile && !importText.trim();
            default:
                return true;
        }
    };

    return (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
            <div className='bg-background rounded-lg shadow-xl w-full max-w-2xl border border-border'>
                <div className='flex items-center justify-between p-4 border-b border-border'>
                    <h2 className='text-xl font-semibold text-foreground'>
                        Import Curl
                    </h2>
                    <button
                        onClick={handleOnClose}
                        className='text-muted-foreground hover:text-foreground'
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className='p-4'>
                    <div className='space-y-4'>
                        <div className='flex rounded-lg bg-muted p-1'>
                            {/* <button
                                className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 ${importType === 'file'
                                    ? 'bg-background text-foreground shadow'
                                    : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                onClick={() => setImportType('file')}
                            >
                                <FileText size={16} />
                                File Upload
                            </button> */}
                            {/* <button
                                className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 ${importType === 'swagger'
                                    ? 'bg-background text-foreground shadow'
                                    : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                onClick={() => setImportType('swagger')}
                            >
                                <LinkIcon size={16} />
                                Swagger URL
                            </button> */}
                            <button
                                className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 ${importType === 'curl'
                                    ? 'bg-background text-foreground shadow'
                                    : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                onClick={() => setImportType('curl')}
                            >
                                <Terminal size={16} />
                                cURL (bash)
                            </button>
                        </div>

                        {importType === 'swagger' && (
                            <div>
                                <Input
                                    type='url'
                                    value={postmanUrl}
                                    onChange={(e) => setPostmanUrl(e.target.value)}
                                    className='w-full'
                                    placeholder='https://api.example.com/swagger.json'
                                />
                                <p className='mt-1 text-xs text-muted-foreground'>
                                    Enter a URL to a Swagger/OpenAPI specification
                                </p>
                            </div>
                        )}

                        {importType === 'curl' && (
                            <div>
                                <Textarea
                                    value={importText}
                                    onChange={(e) => {
                                        setImportText(e.target.value);
                                        // Clear error if there was one when user starts typing
                                        if (error && e.target.value) {
                                            setError(null);
                                        }

                                        // Basic validation for cURL format
                                        if (
                                            e.target.value.trim() &&
                                            !e.target.value.trim().toLowerCase().startsWith('curl')
                                        ) {
                                            setError('Input should start with "curl"');
                                        } else {
                                            setError(null);
                                        }
                                    }}
                                    className={`w-full h-64 font-mono text-sm ${error && importText.trim()
                                        ? 'border-destructive focus:ring-destructive focus:border-destructive'
                                        : 'border-border focus:ring-primary focus:border-primary'
                                        }`}
                                    placeholder='Paste your cURL (bash) command here...'
                                />

                                {importText.trim().toLowerCase().startsWith('curl') && (
                                    <div className='mt-1'>
                                        <p className='text-xs text-success'>
                                            ✓ Valid cURL format detected
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        {importType === 'file' && (
                            <div>
                                <div
                                    className='flex flex-col items-center justify-center px-6 py-10 border border-dashed border-border rounded-lg'
                                    onDragOver={(e) => e.preventDefault()}
                                    onDrop={(e) => {
                                        e.preventDefault();
                                        if (
                                            e.dataTransfer.files &&
                                            e.dataTransfer.files.length > 0
                                        ) {
                                            const file = e.dataTransfer.files[0];
                                            // Check file type
                                            if (
                                                !file.type.includes('json') &&
                                                !file.name.endsWith('.json')
                                            ) {
                                                setError('Only JSON files are accepted');
                                                toast({
                                                    title: 'Invalid File Type',
                                                    description: 'Please select a JSON file',
                                                    variant: 'destructive',
                                                });
                                                return;
                                            }
                                            // Check file size
                                            if (file.size > 5 * 1024 * 1024) {
                                                setError('File size exceeds 5MB limit');
                                                toast({
                                                    title: 'File Too Large',
                                                    description: 'Please select a file under 5MB',
                                                    variant: 'destructive',
                                                });
                                            } else {
                                                setSelectedFile(file);
                                                setError(null);
                                            }
                                        }
                                    }}
                                >
                                    <div className='text-center'>
                                        <Upload
                                            size={36}
                                            className='mx-auto text-muted-foreground mb-4'
                                        />

                                        <p className='text-sm mb-2'>
                                            <label
                                                htmlFor='file-upload'
                                                className='cursor-pointer text-primary font-medium hover:text-primary/80'
                                            >
                                                Upload a file
                                                <Input
                                                    id='file-upload'
                                                    ref={fileInputRef}
                                                    type='file'
                                                    className='sr-only'
                                                    accept='application/json,.json,application/x-yaml,.yaml,.yml,text/plain'
                                                    onChange={handleFileSelect}
                                                />
                                            </label>
                                            <span className='text-muted-foreground'>
                                                {' '}
                                                or drag and drop
                                            </span>
                                        </p>

                                        <p className='text-xs text-muted-foreground'>
                                            Postman Collection & OpenAPI/Swagger.{' '}
                                        </p>

                                        {selectedFile && (
                                            <div className='mt-4 text-sm bg-muted px-3 py-2 rounded-md text-muted-foreground'>
                                                <span className='font-medium'>Selected:</span>{' '}
                                                {selectedFile.name} (
                                                {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {error && (
                            <div className='flex items-center gap-2 text-destructive bg-destructive/10 p-3 rounded border border-destructive/20'>
                                <AlertCircle size={16} />
                                <span className='text-sm'>{error}</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className='flex justify-between items-center p-4 border-t border-border'>
                    <div>
                        {importing && (
                            <p className='text-sm text-primary'>Importing... please wait</p>
                        )}
                    </div>
                    <div className='flex gap-2'>
                        <button
                            onClick={handleOnClose}
                            className='px-4 py-2 text-muted-foreground hover:text-foreground'
                            disabled={importing}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleImport}
                            disabled={isImportDisabled() || importing}
                            className='bg-[#136fb0] text-white px-3 sm:px-4 py-2 rounded-md text-sm'
                        >
                            {importing ? 'Importing...' : 'Import'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ImportModal;