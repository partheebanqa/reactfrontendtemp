import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

export const ExecutionDetailsDialog = ({ open, onClose, execution }: any) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Execution Details</DialogTitle>
          <DialogDescription>
            Detailed information about execution #{execution?.id}
          </DialogDescription>
        </DialogHeader>
        {execution && (
          <pre className='text-xs whitespace-pre-wrap'>
            {JSON.stringify(execution, null, 2)}
          </pre>
        )}
      </DialogContent>
    </Dialog>
  );
};
