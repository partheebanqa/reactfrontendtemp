import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const TestSuitePagination = ({
  totalItems,
  itemsPerPage,
  currentPage,
  setCurrentPage,
}: any) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);

  return (
    <div className='flex flex-col items-center justify-between px-6 py-4 border-t overflow-auto'>
      <div className='mb-1 text-sm text-slate-500'>
        Showing {startIndex + 1} to {endIndex} of {totalItems} test suites
      </div>

      <div className='flex items-center space-x-2'>
        <Button
          variant='outline'
          size='sm'
          onClick={() =>
            setCurrentPage((prev: number) => Math.max(1, prev - 1))
          }
          disabled={currentPage === 1}
          className='hidden md:flex'
        >
          <ChevronLeft size={16} />
          Previous
        </Button>
        <Button
          variant='outline'
          size='sm'
          onClick={() =>
            setCurrentPage((prev: number) => Math.max(1, prev - 1))
          }
          disabled={currentPage === 1}
          className='flex md:hidden'
        >
          <ChevronLeft size={16} />
        </Button>
        <div className='flex items-center space-x-1'>
          {[...Array(Math.min(5, totalPages))].map((_, index) => {
            const pageNumber =
              Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + index;
            if (pageNumber > totalPages) return null;

            return (
              <Button
                key={pageNumber}
                variant={currentPage === pageNumber ? 'active' : 'outline'}
                size='sm'
                className='w-8 h-8 p-0'
                onClick={() => setCurrentPage(pageNumber)}
              >
                {pageNumber}
              </Button>
            );
          })}
          {totalPages > 5 && currentPage < totalPages - 2 && (
            <>
              <span className='text-slate-400'>...</span>
              <Button
                variant='outline'
                size='sm'
                className='w-8 h-8 p-0'
                onClick={() => setCurrentPage(totalPages)}
              >
                {totalPages}
              </Button>
            </>
          )}
        </div>
        <Button
          variant='outline'
          size='sm'
          onClick={() =>
            setCurrentPage((prev: number) => Math.min(totalPages, prev + 1))
          }
          disabled={currentPage === totalPages}
          className='hidden md:flex'
        >
          Next
          <ChevronRight size={16} />
        </Button>
        <Button
          variant='outline'
          size='sm'
          onClick={() =>
            setCurrentPage((prev: number) => Math.min(totalPages, prev + 1))
          }
          disabled={currentPage === totalPages}
          className='flex md:hidden'
        >
          <ChevronRight size={16} />
        </Button>
      </div>
    </div>
  );
};
