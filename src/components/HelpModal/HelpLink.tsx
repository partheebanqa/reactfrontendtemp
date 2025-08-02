import { Info } from 'lucide-react'
import React, { useState } from 'react'
import { HelpModal } from './HelpModal'

export default function HelpLink() {
    const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);

    const handleClick = () => {
        window.location.href = 'https://example.com';
    }

    return (
        <>
            <div
                className='flex items-center space-x-1 cursor-pointer'
                onClick={handleClick}
            >
                <Info className='h-4 w-4 text-blue-600 hover:text-blue-700 dark:text-blue-500 dark:hover:text-blue-400' />
                <span className='text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300'>Quick Guide</span>
            </div>
        </>
    )
}
