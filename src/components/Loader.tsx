import Logo from '../assests/images/OptraLogo-removebg-preview_bg.webp';

interface LoaderProps {
  message?: string;
}

export function Loader({ message = 'Loading API test...' }: LoaderProps) {
  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
      <div className='bg-white rounded-xl shadow-2xl p-8 max-w-sm w-full mx-4'>
        <div className='text-center'>
          {/* Logo and Brand */}
          <div className='mb-6 relative flex justify-center'>
            <img src={Logo} alt='Optra Logo' className='h-16 mx-auto' />
            {/* <div className="absolute top-2 right-2 w-4 h-4 bg-green-500 rounded-full animate-pulse"></div> */}
          </div>

          {/* Animated Progress Indicator */}
          <div className='mb-6'>
            <div className='relative w-16 h-16 mx-auto'>
              {/* Outer ring */}
              <div className='absolute inset-0 border-4 border-gray-200 rounded-full'></div>
              {/* Animated ring */}
              <div className='absolute inset-0 border-4 border-transparent border-t-[#136fb0] rounded-full animate-spin'></div>
              {/* Inner pulse */}
              <div className='absolute inset-2 bg-blue-100 rounded-full animate-pulse'></div>
              {/* Center dot */}
              <div className='absolute inset-6 bg-[#136fb0] rounded-full'></div>
            </div>
          </div>

          {/* Loading Message */}
          <div className='space-y-2'>
            <p className='text-gray-800 font-medium'>{message}</p>
            <div className='flex justify-center space-x-1'>
              <div
                className='w-2 h-2 bg-[#136fb0] rounded-full animate-bounce'
                style={{ animationDelay: '0ms' }}
              ></div>
              <div
                className='w-2 h-2 bg-[#136fb0] rounded-full animate-bounce'
                style={{ animationDelay: '150ms' }}
              ></div>
              <div
                className='w-2 h-2 bg-[#136fb0] rounded-full animate-bounce'
                style={{ animationDelay: '300ms' }}
              ></div>
            </div>
          </div>

          {/* Progress Steps */}
          {/* <div className="mt-6 space-y-2">
                        <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>Preparing request</span>
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>Sending to endpoint</span>
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>Processing response</span>
                            <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                        </div>
                    </div> */}
        </div>
      </div>
    </div>
  );
}
