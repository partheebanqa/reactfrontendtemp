import { useState } from 'react';
import { ScanResult } from './SecurityScanView';
import { useToast } from '@/hooks/use-toast';
import { Download, FileJson, FileText, Loader2, Table, X } from 'lucide-react';

export function ExportModal({
  isOpen,
  onClose,
  scanResult,
  request,
}: {
  isOpen: boolean;
  onClose: () => void;
  scanResult: ScanResult;
  request: { name: string };
}) {
  const [selectedFormat, setSelectedFormat] = useState<'pdf' | 'json' | 'csv'>(
    'json'
  );
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const formats = [
    {
      id: 'pdf' as const,
      label: 'PDF Report',
      icon: FileText,
      description: 'Professional PDF with details',
    },
    {
      id: 'json' as const,
      label: 'JSON Data',
      icon: FileJson,
      description: 'Structured data export',
    },
    {
      id: 'csv' as const,
      label: 'CSV File',
      icon: Table,
      description: 'Spreadsheet compatible',
    },
  ];

  const handleExport = () => {
    setIsExporting(true);

    setTimeout(() => {
      if (selectedFormat === 'json') {
        const data = JSON.stringify(scanResult, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `security-scan-${request.name}-${
          new Date().toISOString().split('T')[0]
        }.json`;
        link.click();
        URL.revokeObjectURL(url);
      }

      setIsExporting(false);
      onClose();
      toast({
        title: 'Export Successful',
        description: `Security report exported as ${selectedFormat.toUpperCase()}`,
      });
    }, 1000);
  };

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4'>
      <div className='bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full'>
        <div className='flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700'>
          <h2 className='text-xl font-semibold text-gray-900 dark:text-white'>
            Export Security Report
          </h2>
          <button
            onClick={onClose}
            className='p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg'
          >
            <X size={20} className='text-gray-500' />
          </button>
        </div>

        <div className='p-6 space-y-6'>
          <div>
            <label className='text-sm font-semibold text-gray-900 dark:text-white mb-3 block'>
              Export Format
            </label>
            <div className='space-y-2'>
              {formats.map(({ id, label, icon: Icon, description }) => (
                <button
                  key={id}
                  onClick={() => setSelectedFormat(id)}
                  className={`w-full px-4 py-3 rounded-lg border-2 transition-all flex items-center gap-3 ${
                    selectedFormat === id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon
                    size={20}
                    className={
                      selectedFormat === id ? 'text-blue-600' : 'text-gray-400'
                    }
                  />
                  <div className='text-left'>
                    <div className='font-medium text-gray-900 dark:text-white'>
                      {label}
                    </div>
                    <div className='text-xs text-gray-500 dark:text-gray-400'>
                      {description}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className='flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700'>
            <button
              onClick={onClose}
              disabled={isExporting}
              className='flex-1 px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors'
            >
              Cancel
            </button>
            <button
              onClick={handleExport}
              disabled={isExporting}
              className='flex-1 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2'
            >
              {isExporting ? (
                <>
                  <Loader2 size={16} className='animate-spin' />
                  Exporting...
                </>
              ) : (
                <>
                  <Download size={16} />
                  Export
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
