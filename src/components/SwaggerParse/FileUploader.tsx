import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

import { Upload, File, X, CheckCircle2, AlertCircle } from 'lucide-react'
import * as yaml from 'js-yaml'

interface FileUploaderProps {
  onSpecParsed: (spec: any) => void
  loading: boolean
  setLoading: (loading: boolean) => void
}

export default function FileUploader({ onSpecParsed, loading, setLoading }: FileUploaderProps) {
  const [dragActive, setDragActive] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }

  const handleFile = (file: File) => {
    // Validate file type
    const validExtensions = ['.json', '.yaml', '.yml']
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'))
    
    if (!validExtensions.includes(fileExtension)) {
    //   toast.error('Please upload a JSON, YAML, or YML file')
      return
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
    //   toast.error('File size must be less than 10MB')
      return
    }

    setUploadedFile(file)
    parseUploadedFile(file)
  }

  const parseUploadedFile = async (file: File) => {
    setLoading(true)
    
    try {
      const text = await file.text()
      let spec: any

      // Determine file type and parse accordingly
      const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'))
      
      if (fileExtension === '.json') {
        try {
          spec = JSON.parse(text)
        } catch (error) {
          throw new Error('Invalid JSON format')
        }
      } else if (fileExtension === '.yaml' || fileExtension === '.yml') {
        try {
          spec = yaml.load(text)
        } catch (error) {
          throw new Error('Invalid YAML format')
        }
      } else {
        // Try to auto-detect format
        try {
          spec = JSON.parse(text)
        } catch {
          try {
            spec = yaml.load(text)
          } catch {
            throw new Error('Unable to parse file as JSON or YAML')
          }
        }
      }

      // Validate basic OpenAPI structure
      if (!spec.openapi && !spec.swagger) {
        throw new Error('Invalid OpenAPI/Swagger specification: missing version field')
      }
      
      if (!spec.info) {
        throw new Error('Invalid OpenAPI/Swagger specification: missing info object')
      }
      
      if (!spec.paths) {
        throw new Error('Invalid OpenAPI/Swagger specification: missing paths object')
      }

      // Validate components structure if present
      if (spec.components) {
        if (typeof spec.components !== 'object') {
          throw new Error('Invalid OpenAPI specification: components must be an object')
        }
        
        // Validate schemas structure
        if (spec.components.schemas && typeof spec.components.schemas !== 'object') {
          throw new Error('Invalid OpenAPI specification: components.schemas must be an object')
        }
      }

      onSpecParsed(spec)
    //   toast.success(`Successfully parsed OpenAPI specification from ${file.name}`)
    } catch (error) {
      console.error('Error parsing uploaded file:', error)
    //   toast.error(`Failed to parse file: ${error instanceof Error ? error.message : 'Unknown error'}`)
      setUploadedFile(null)
    } finally {
      setLoading(false)
    }
  }

  const removeFile = () => {
    setUploadedFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const openFileDialog = () => {
    fileInputRef.current?.click()
  }

  return (
    <Card className="border border-gray-200 bg-background rounded-lg mt-3 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5 text-[#136fb0]" />
          Upload OpenAPI Specification
        </CardTitle>
        <CardDescription>
          Upload a local OpenAPI/Swagger file (JSON, YAML, or YML format)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!uploadedFile ? (
          <div
            className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,.yaml,.yml"
              onChange={handleFileInput}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={loading}
            />
            
            <div className="space-y-4">
              <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                <Upload className="h-6 w-6 text-gray-400" />
              </div>
              
              <div>
                <p className="text-lg font-medium text-gray-900">
                  {dragActive ? 'Drop your file here' : 'Drag and drop your file here'}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  or{' '}
                  <button
                    type="button"
                    onClick={openFileDialog}
                    className="text-[#136fb0] hover:text-blue-700 font-medium"
                    disabled={loading}
                  >
                    browse to upload
                  </button>
                </p>
              </div>
              
              <div className="text-xs text-gray-400">
                Supports JSON, YAML, and YML files up to 10MB
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded">
                <File className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">{uploadedFile.name}</p>
                <p className="text-sm text-gray-500">
                  {(uploadedFile.size / 1024).toFixed(1)} KB
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {loading ? (
                <div className="flex items-center gap-2 text-blue-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-blue-600/20" />
                  <span className="text-sm">Parsing...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="text-sm">Parsed</span>
                </div>
              )}
              
              <Button
                variant="ghost"
                size="sm"
                onClick={removeFile}
                disabled={loading}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
        
        <div className="text-xs text-gray-500 space-y-1">
          <p>• Supported formats: OpenAPI 3.x and Swagger 2.0</p>
          <p>• File types: .json, .yaml, .yml</p>
          <p>• Maximum file size: 10MB</p>
        </div>
      </CardContent>
    </Card>
  )
}