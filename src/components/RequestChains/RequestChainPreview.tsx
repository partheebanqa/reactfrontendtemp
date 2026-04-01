import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dot } from 'lucide-react';
import { RequestChain } from '@/shared/types/requestChain.model';

type PreviewProps = {
  open: boolean;
  onClose: () => void;
  chain: RequestChain | null;
};

const envClasses = (name?: string) => {
  const n = (name ?? '').toLowerCase();
  if (!name || name === 'No Environment')
    return 'bg-gray-100 text-gray-700 border-gray-200';
  if (n.includes('prod')) return 'bg-green-100 text-green-800 border-green-200';
  if (n.includes('stage'))
    return 'bg-yellow-100 text-yellow-800 border-yellow-200';
  if (n.includes('dev')) return 'bg-blue-100 text-blue-800 border-blue-200';
  return 'bg-muted text-muted-foreground border-border';
};

const envDot = (name?: string) => {
  const n = (name ?? '').toLowerCase();
  if (!name || name === 'No Environment') return 'bg-gray-500';
  if (n.includes('prod')) return 'bg-green-600';
  if (n.includes('stage')) return 'bg-yellow-600';
  if (n.includes('dev')) return 'bg-blue-600';
  return 'bg-muted-foreground';
};

const methodBadge = (method?: string) => {
  const m = (method ?? '').toUpperCase();
  switch (m) {
    case 'GET':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    case 'POST':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'PUT':
      return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'DELETE':
      return 'bg-rose-100 text-rose-800 border-rose-200';
    default:
      return 'bg-slate-100 text-slate-800 border-slate-200';
  }
};

export function RequestChainPreviewDialog({
  open,
  onClose,
  chain,
}: PreviewProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className='max-w-lg w-full'>
        <DialogHeader>
          <DialogTitle className='text-base font-medium'>
            {chain ? chain.name : 'Request chain'}
          </DialogTitle>
          <DialogDescription />
        </DialogHeader>

        {chain && (
          <div className='space-y-6'>
            {/* Top meta row */}
            <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
              <div>
                <p className='text-xs text-muted-foreground mb-1'>Name</p>
                <p className='text-sm font-medium text-foreground'>
                  {chain.name}
                </p>
              </div>
              <div>
                <p className='text-xs text-muted-foreground mb-1'>Status</p>
                <Badge
                  variant='outline'
                  className={
                    chain.enabled
                      ? 'bg-green-100 text-green-800 border-green-200'
                      : 'bg-muted text-muted-foreground border-border'
                  }
                >
                  {chain.enabled ? 'Enabled' : 'Disabled'}
                </Badge>
              </div>
              <div className='sm:text-right'>
                <p className='text-xs text-muted-foreground mb-1'>
                  Environment
                </p>
                <Badge
                  variant='outline'
                  className={`inline-flex items-center gap-1 ${envClasses(
                    chain.environment?.name,
                  )}`}
                >
                  <span
                    className={`h-2 w-2 rounded-full ${envDot(
                      chain.environment?.name,
                    )}`}
                  />
                  {chain.environment?.name || 'No Environment'}
                </Badge>
              </div>
            </div>

            {/* Description */}
            <div>
              <p className='text-xs text-muted-foreground mb-1'>Description</p>
              <p className='text-sm text-foreground break-words line-clamp-3'>
                {chain.description || '—'}
              </p>{' '}
            </div>

            {/* Request sequence */}
            <div>
              <p className='text-xs text-muted-foreground mb-3'>
                Request sequence
              </p>
              <div className='space-y-3 max-h-72 overflow-y-auto scrollbar-thin pr-1'>
                {chain.chainRequests?.map((req, idx) => {
                  const method = req?.method;
                  const url = req?.url ?? '';
                  return (
                    <div
                      key={req.id ?? idx}
                      className='flex items-start gap-3 min-w-0'
                    >
                      {/* Index pill */}
                      <div className='h-5 w-5 flex items-center justify-center rounded-full bg-muted text-muted-foreground text-xs font-medium mt-0.5 shrink-0'>
                        {idx + 1}
                      </div>

                      {/* Row content */}
                      <div className='flex items-center gap-2 min-w-0'>
                        <div className='flex items-center gap-2'>
                          <Badge
                            variant='outline'
                            className={methodBadge(method)}
                          >
                            {method?.toUpperCase() || 'REQ'}
                          </Badge>
                          <p className='text-sm font-medium text-foreground truncate min-w-0'>
                            {req.name || 'Untitled step'}
                          </p>
                        </div>
                        <p className='text-xs text-muted-foreground truncate w-0 min-w-full'>
                          {url}
                        </p>
                      </div>
                    </div>
                  );
                })}

                {(!chain.chainRequests || chain.chainRequests.length === 0) && (
                  <p className='text-sm text-muted-foreground text-center py-4'>
                    No steps in this chain.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
      <DialogFooter className='mt-2'>
        <Button variant='outline' size='sm' onClick={onClose}>
          Close
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
