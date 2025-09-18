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
    <header className="border border-gray-200 bg-background rounded-lg px-4 py-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center justify-between gap-4">
          <div>
            <Icon className={`${iconBgClass} p-2 rounded`} color={iconColor} size={iconSize} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">{title}</h2>
            <p className="text-muted-foreground text-md">{subtitle}</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          {showCreateButton && (
            <Button className="hover-scale bg-[#136fb0] text-white" onClick={onClickCreateNew}>
              <Plus className="mr-2" size={16} />
              {buttonTitle}
            </Button>
          )}
          {showQuickGuide && (
            <>
              <Button
                variant="outline"
                className="hover-scale"
                onClick={() => setOpen(true)}
              >
                <Info className="mr-2" size={16} />
                {quickTitle}
              </Button>

              {/* 🔹 Quick Guide Modal */}
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
