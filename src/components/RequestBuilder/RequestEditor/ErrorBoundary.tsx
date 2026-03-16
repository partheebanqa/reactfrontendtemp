import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('RequestEditor Error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className='flex items-center justify-center h-full p-8'>
          <div className='max-w-md w-full bg-red-50 border border-red-200 rounded-lg p-6'>
            <div className='flex items-center gap-3 mb-4'>
              <svg
                className='w-6 h-6 text-red-600'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
                />
              </svg>
              <h2 className='text-lg font-semibold text-red-800'>
                Something went wrong
              </h2>
            </div>

            <p className='text-red-700 mb-4'>
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>

            {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
              <details className='mb-4'>
                <summary className='text-sm text-red-600 cursor-pointer hover:text-red-800'>
                  View error details
                </summary>
                <pre className='mt-2 text-xs bg-red-100 p-2 rounded overflow-auto max-h-40'>
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}

            <div className='flex gap-2'>
              <button
                onClick={this.handleReset}
                className='px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors'
              >
                Try again
              </button>
              <button
                onClick={() => window.location.reload()}
                className='px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors'
              >
                Reload page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
