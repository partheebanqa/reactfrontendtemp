import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CodeBlockProps {
  code: string;
  language?: string;
  maxHeight?: string;
  testId?: string;
}

export default function CodeBlock({
  code,
  language = 'bash',
  maxHeight = 'max-h-96',
  testId,
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className='relative group' data-testid={testId}>
      <div
        className={`bg-muted/50 rounded-md p-4 overflow-x-auto scrollbar-thin ${maxHeight} overflow-y-auto scrollbar-thin border`}
      >
        <pre className='text-xs font-mono text-foreground whitespace-pre-wrap break-all'>
          {code}
        </pre>
      </div>
      <Button
        size='icon'
        variant='ghost'
        className='absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity'
        onClick={handleCopy}
        data-testid={`${testId}-copy`}
      >
        {copied ? <Check className='w-4 h-4' /> : <Copy className='w-4 h-4' />}
      </Button>
    </div>
  );
}
