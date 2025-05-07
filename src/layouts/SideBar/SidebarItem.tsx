import React from 'react';
import { DivideIcon as LucideIcon } from 'lucide-react';

interface SidebarItemProps {
  icon: LucideIcon;
  label: string;
  isExpanded: boolean;
  hasSubmenu?: boolean;
  active?: boolean;
  onClick?: () => void;
}

const SidebarItem: React.FC<SidebarItemProps> = ({
  icon: Icon,
  label,
  isExpanded,
  hasSubmenu = false,
  active = false,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`
        flex items-center py-3 px-4 cursor-pointer transition-all duration-200
        ${active ? 'bg-gray-800' : 'hover:bg-gray-800'}
        ${isExpanded ? 'justify-start' : 'justify-center'}
      `}
    >
      <div className="text-gray-400">
        <Icon size={20} />
      </div>
      {isExpanded && (
        <div className="flex justify-between items-center w-full">
          <span className="ml-3 text-sm text-white">{label}</span>
          {hasSubmenu && (
            <span className="text-gray-400">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default SidebarItem;