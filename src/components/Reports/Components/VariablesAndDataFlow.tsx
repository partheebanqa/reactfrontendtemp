import { useState } from 'react';
import { ChevronDown, ChevronUp, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';

type KV =
  | Record<string, any>
  | Array<{ name: string; value: any }>
  | undefined
  | null;

function normalize(input: KV): Record<string, string> {
  if (!input) return {};
  if (Array.isArray(input)) {
    return input.reduce<Record<string, string>>((acc, item) => {
      const k = String(item?.name ?? '');
      const v = item?.value;
      acc[k] =
        v == null ? '' : typeof v === 'object' ? JSON.stringify(v) : String(v);
      return acc;
    }, {});
  }
  return Object.entries(input).reduce<Record<string, string>>((acc, [k, v]) => {
    acc[String(k)] =
      v == null ? '' : typeof v === 'object' ? JSON.stringify(v) : String(v);
    return acc;
  }, {});
}

interface VariablesAndDataFlowProps {
  globalVariables?: KV;
  extractedVariables?: KV;
}

const VariablesAndDataFlow = ({
  globalVariables,
  extractedVariables,
}: VariablesAndDataFlowProps) => {
  const [open, setOpen] = useState(true);
  const globals = normalize(globalVariables);
  const extracted = normalize(extractedVariables);

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {}
  };

  const Row = ({
    k,
    v,
    bg,
  }: {
    k: string;
    v: string;
    bg: string;
  }) => (
    <div className={`flex justify-between items-center ${bg} px-3 py-2 rounded-md`}>
      <span className='text-gray-700 font-medium mr-2 truncate'>{k}</span>
      <div className='flex items-center gap-1 min-w-0'>
        <span className='text-gray-600 truncate max-w-[60%] text-right'>{v}</span>
        <Button
          variant='ghost'
          size='icon'
          className='h-7 w-7'
          onClick={() => copy(v)}
          title='Copy value'
        >
          <Copy className='w-3.5 h-3.5' />
        </Button>
      </div>
    </div>
  );

  return (
    <div className='border border-gray-200 rounded-lg mt-5 p-2 bg-white'>
      <button
        className='w-full flex justify-between items-center px-5 py-3 hover:bg-gray-50 transition'
        onClick={() => setOpen(!open)}
      >
        <h2 className='text-1xl font-bold text-foreground mb-1'>
          Variables &amp; Data Flow
        </h2>
        {open ? (
          <ChevronUp className='w-5 h-5 text-gray-500' />
        ) : (
          <ChevronDown className='w-5 h-5 text-gray-500' />
        )}
      </button>

      {open && (
        <div className='flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x border-t text-sm'>
          {/* Global Variables */}
          <div className='w-full md:w-1/2 p-5'>
            <h3 className='font-semibold mb-2 text-gray-700'>Global Variables</h3>
            <div className='space-y-2'>
              {Object.keys(globals).length === 0 ? (
                <div className='text-xs text-gray-500 italic bg-gray-50 p-2 rounded border border-dashed'>
                  No global variables.
                </div>
              ) : (
                Object.entries(globals).map(([k, v]) => (
                  <Row key={`g-${k}`} k={k} v={v} bg='bg-blue-50' />
                ))
              )}
            </div>
          </div>

          {/* Extracted Variables */}
          <div className='w-full md:w-1/2 p-5'>
            <h3 className='font-semibold mb-2 text-gray-700'>Extracted Variables</h3>
            <div className='space-y-2'>
              {Object.keys(extracted).length === 0 ? (
                <div className='text-xs text-gray-500 italic bg-gray-50 p-2 rounded border border-dashed'>
                  No extracted variables.
                </div>
              ) : (
                Object.entries(extracted).map(([k, v]) => (
                  <Row key={`e-${k}`} k={k} v={v} bg='bg-green-50' />
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VariablesAndDataFlow;
