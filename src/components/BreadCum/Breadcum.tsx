import { Button } from '@/components/ui/button';
import { Info, Plus } from 'lucide-react';
import React from 'react';

interface ReportsHeaderProps {
  title?: string;
  subtitle?: string;
  buttonTitle?: string;
  onClickCreateNew?: () => void;
  showCreateButton?: boolean;
  quickTitle?: string;
  onClickQuickGuide?: () => void;
  showQuickGuide?: boolean;
}

const BreadCum: React.FC<ReportsHeaderProps> = ({
  title = 'Reports',
  subtitle = 'Analyze test performance and generate reports',
  buttonTitle = 'Create New',
  onClickCreateNew,
  showCreateButton = true,
  quickTitle = 'Quick Guide',
  onClickQuickGuide,
  showQuickGuide = true,
 
}) => {
  return (
    <header className="border border-gray-200 bg-background rounded-lg px-6 py-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">{title}</h2>
           <p className='text-muted-foreground text-md'>
            {subtitle}
          </p>
        </div>
        <div className="flex items-center space-x-4">
            {showCreateButton && (
            <Button className="hover-scale bg-[#136fb0] text-white" onClick={onClickCreateNew}>
                <Plus className="mr-2" size={16} />
              {buttonTitle}
            </Button>
          )}
          {showQuickGuide && (
            <Button
              variant="outline"
              className="hover-scale"
              onClick={onClickQuickGuide}
            >
              <Info className="mr-2" size={16} />
              {quickTitle}
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};

export default BreadCum;
