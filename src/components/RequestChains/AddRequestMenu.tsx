import React, { useState, useRef, useEffect } from 'react';
import { Plus, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AddRequestMenuProps {
  onAddRequest: () => void;
  onImport: () => void;
}

export const AddRequestMenu: React.FC<AddRequestMenuProps> = ({
  onAddRequest,
  onImport,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState<'top' | 'bottom'>(
    'bottom'
  );
  const menuRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleAddRequest = () => {
    onAddRequest();
    setIsMenuOpen(false);
  };

  const handleImport = () => {
    onImport();
    setIsMenuOpen(false);
  };

  const toggleMenu = () => {
    if (!isMenuOpen && menuRef.current) {
      const buttonRect = menuRef.current.getBoundingClientRect();
      const dropdownHeight = 130; // Approximate height of dropdown
      const spaceBelow = window.innerHeight - buttonRect.bottom;
      const spaceAbove = buttonRect.top;

      // If not enough space below and more space above, show dropdown above
      if (spaceBelow < dropdownHeight && spaceAbove > dropdownHeight) {
        setDropdownPosition('top');
      } else {
        setDropdownPosition('bottom');
      }
    }
    setIsMenuOpen(!isMenuOpen);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  return (
    <>
      <div className='relative' ref={menuRef}>
        <Button onClick={toggleMenu} className='gap-2'>
          <Plus className='w-4 h-4' />
          Add
        </Button>

        {isMenuOpen && (
          <div
            ref={dropdownRef}
            className={`absolute right-0 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-[9999] ${
              dropdownPosition === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'
            }`}
          >
            <div className='py-1'>
              <button
                onClick={handleAddRequest}
                className='w-full px-4 py-2.5 text-left hover:bg-gray-50 flex items-center gap-3 transition-colors'
              >
                <Plus className='w-4 h-4 text-gray-600' />
                <div>
                  <div className='font-medium text-gray-900'>New Request</div>
                  <div className='text-xs text-gray-500'>
                    Add a blank request
                  </div>
                </div>
              </button>

              <div className='border-t border-gray-100' />

              <button
                onClick={handleImport}
                className='w-full px-4 py-2.5 text-left hover:bg-gray-50 flex items-center gap-3 transition-colors'
              >
                <Download className='w-4 h-4 text-gray-600' />
                <div>
                  <div className='font-medium text-gray-900'>Import</div>
                  <div className='text-xs text-gray-500'>From collection</div>
                </div>
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};
