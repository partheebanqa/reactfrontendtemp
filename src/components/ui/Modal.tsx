import React, { ReactNode } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  maxWidth = 'md',
}) => {
  if (!isOpen) return null;

  const maxWidthClass = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    full: 'max-w-full',
  }[maxWidth];

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full ${maxWidthClass} mx-4`}>
        <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-4'>
          {title}
        </h3>

        <div className='space-y-4'>{children}</div>

        {footer && <div className='mt-6'>{footer}</div>}
      </div>
    </div>
  );
};

export default Modal;
