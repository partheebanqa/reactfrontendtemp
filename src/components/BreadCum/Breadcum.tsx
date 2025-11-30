import { Button } from '@/components/ui/button';
import { Info, Link2, Plus } from 'lucide-react';
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ReportsHeaderProps {
  title?: string;
  subtitle?: string;
  buttonTitle?: string;
  onClickCreateNew?: () => void;
  showCreateButton?: boolean;
  quickTitle?: string;
  onClickQuickGuide?: () => void;
  showQuickGuide?: boolean;
  icon?: React.ElementType;
  iconBgClass?: string;
  iconColor?: string;
  iconSize?: number;
  quickGuideTitle?: string;
  quickGuideContent?: React.ReactNode;
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
  icon: Icon = Link2,
  iconBgClass = 'bg-[#f9e3fc]',
  iconColor = '#660275',
  iconSize = 40,
  quickGuideTitle = 'Quick Guide',
  quickGuideContent = <p>This is a default guide. Add dynamic content per page.</p>,
}) => {
  const [open, setOpen] = useState(false);

  return (
    <header className="border border-gray-200 bg-background rounded-lg px-3 py-3 sm:px-4 sm:py-4 animate-fade-in">
      {/* column on mobile, row on desktop */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Left section */}
        <div className="flex items-start gap-3 sm:items-center">
          <div className={`flex items-center justify-center rounded ${iconBgClass}`}>
            <Icon className="p-2" color={iconColor} size={iconSize} />
          </div>
          <div>
            <h2 className="text-md font-bold text-foreground sm:text-2xl">
              {title}
            </h2>
            <p className="text-[12px] text-muted-foreground sm:text-[14px]">
              {subtitle}
            </p>
          </div>
        </div>

        {/* Right section: always a single row of 2 buttons */}
        <div className="mt-1 flex w-full gap-2 sm:mt-0 sm:w-auto sm:justify-end">
          {showCreateButton && (
            <Button
              className="hover-scale bg-[#136fb0] text-white flex-1 sm:flex-none"
              onClick={onClickCreateNew}
            >
              <Plus className="mr-2" size={16} />
              {buttonTitle}
            </Button>
          )}

          {showQuickGuide && (
            <>
              <Button
                variant="outline"
                className="hover-scale flex-none min-w-[120px]"
                onClick={() => {
                  onClickQuickGuide?.();
                  setOpen(true);
                }}
              >
                <Info className="mr-2" size={16} />
                {quickTitle}
              </Button>

              {/* Quick Guide Modal */}
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-3xl">
                  <DialogHeader>
                    <DialogTitle>{quickGuideTitle}</DialogTitle>
                    <DialogDescription className="max-h-[80vh] overflow-y-auto pr-2">
                      {quickGuideContent}
                    </DialogDescription>
                  </DialogHeader>
                </DialogContent>
              </Dialog>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default BreadCum;
