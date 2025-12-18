import React, { useState, useRef, useEffect } from 'react';
import { Plus, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AddRequestMenuProps {
  onAddRequest: () => void;
  onImport: () => void;
  disabled?: boolean; // Add disabled prop
}

export const AddRequestMenu: React.FC<AddRequestMenuProps> = ({
  onAddRequest,
  onImport,
  disabled = false, // Default to false
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState<'top' | 'bottom'>(
    'bottom'
  );
  const menuRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (disabled) return; // Don't open menu if disabled

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (buttonRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      const dropdownHeight = 130;
      const spaceBelow = window.innerHeight - buttonRect.bottom;
      const spaceAbove = buttonRect.top;

      if (spaceBelow < dropdownHeight && spaceAbove > dropdownHeight) {
        setDropdownPosition('top');
      } else {
        setDropdownPosition('bottom');
      }
    }

    setIsMenuOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsMenuOpen(false);
    }, 150);
  };

  const handleMenuMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  const handleMenuMouseLeave = () => {
    setIsMenuOpen(false);
  };

  const handleAddRequest = () => {
    if (disabled) return; // Prevent action if disabled
    onAddRequest();
    setIsMenuOpen(false);
  };

  const handleImport = () => {
    if (disabled) return; // Prevent action if disabled
    onImport();
    setIsMenuOpen(false);
  };

  const handleButtonClick = () => {
    if (disabled) return; // Don't open menu if disabled

    if (!isMenuOpen && buttonRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      const dropdownHeight = 130;
      const spaceBelow = window.innerHeight - buttonRect.bottom;
      const spaceAbove = buttonRect.top;

      if (spaceBelow < dropdownHeight && spaceAbove > dropdownHeight) {
        setDropdownPosition('top');
      } else {
        setDropdownPosition('bottom');
      }
    }
    setIsMenuOpen(!isMenuOpen);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (
        menuRef.current &&
        buttonRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isMenuOpen]);

  // Close menu when component becomes disabled
  useEffect(() => {
    if (disabled && isMenuOpen) {
      setIsMenuOpen(false);
    }
  }, [disabled, isMenuOpen]);

  return (
    <div className='relative inline-block' ref={menuRef}>
      {isMenuOpen && !disabled && (
        <div
          ref={dropdownRef}
          onMouseEnter={handleMenuMouseEnter}
          onMouseLeave={handleMenuMouseLeave}
          className={`absolute right-0 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-[9999] ${
            dropdownPosition === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'
          }`}
          style={{
            animation: 'fadeIn 0.2s ease-out',
          }}
        >
          <div className='py-1'>
            <button
              onClick={handleAddRequest}
              className='w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 active:bg-gray-100 flex items-center gap-3 transition-colors'
            >
              <Plus className='w-4 h-4 text-gray-600' />
              <div>
                <div className='font-medium text-gray-900'>New Request</div>
                <div className='text-xs text-gray-500'>Add a blank request</div>
              </div>
            </button>

            <div className='border-t border-gray-100' />

            <button
              onClick={handleImport}
              className='w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 active:bg-gray-100 flex items-center gap-3 transition-colors'
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

      <Button
        ref={buttonRef}
        onClick={handleButtonClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        disabled={disabled}
        className='gap-2'
      >
        <Plus className='w-4 h-4' />
        Add Step
      </Button>
    </div>
  );
};
