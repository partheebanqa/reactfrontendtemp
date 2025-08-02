import { Button } from '@/components/ui/button';
import { Download, Share2 } from 'lucide-react';
import React from 'react';

interface ReportsHeaderProps {
  title?: string;
  subtitle?: string;
  onExport?: () => void;
  onGenerateReport?: () => void;
  showExport?: boolean;
  showGenerateReport?: boolean;
}

const ReportsHeader: React.FC<ReportsHeaderProps> = ({
  title = 'Reports',
  subtitle = 'Analyze test performance and generate reports',
  onExport,
  onGenerateReport,
  showExport = true,
  showGenerateReport = true,
}) => {
  return (
    <header className="border border-gray-200 bg-background rounded-lg px-6 py-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">{title}</h2>
        </div>
        <div className="flex items-center space-x-4">
          {showExport && (
            <Button
              variant="outline"
              className="hover-scale"
              onClick={onExport}
            >
              <Share2 className="mr-2" size={16} />
              Share
            </Button>
          )}
          {showGenerateReport && (
            <Button className="hover-scale" onClick={onGenerateReport}>
              <Download className="mr-2" size={16} />
              Download
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};

export default ReportsHeader;
