import React from 'react';
import { LayoutHeader } from './Header';
import { navigate } from 'wouter/use-browser-location';
import { Footer } from './Footer';

interface LandingLayoutProps {
  children: React.ReactNode;
}

const LandingLayout: React.FC<LandingLayoutProps> = ({ children }) => {
  const year = new Date();

  const hanldeClick = () => {
    navigate('/signin');
  };
  try {
    return (
      <div className='min-h-screen'>
        <div className='sticky top-0 z-50 bg-white'>
          {/* Header */}
          {/* <header className='container mx-auto px-2 py-2 '>

            <nav className='flex items-center justify-between'>
              <Link to='/' className='flex items-center space-x-2'>
                <img
                  src={LogoFull}
                  alt='Optraflow'
                  className=''
                  style={{ width: '100%', height: '60px' }}
                />
              </Link>

              <div className='flex items-center space-x-4'>
                <Button variant='ghost' asChild>
                  <Link to='/pricing'>Pricing</Link>
                </Button>
                <Button variant='ghost' asChild>
                  <Link to='/contact-us'>Contact Us</Link>
                </Button>
                <Button onClick={() => (window.location.href = '/signin')}>
                  Sign In
                </Button>
              </div>
            </nav>
          </header> */}
          <LayoutHeader onBetaClick={hanldeClick} onTrialClick={hanldeClick} />
        </div>
        {children}

        {/* Footer */}
        {/* <footer className='bg-white text-white py-10 border-t border-gray-200'>
          <div className='container mx-auto px-4'>
            <div className='grid grid-cols-1 md:grid-cols-5 gap-8'>
              <div>
                <Link to='/' className='flex items-center space-x-2'>
                  <img
                    src={LogoFull}
                    alt='Optraflow'
                    className=''
                    style={{ width: '70%' }}
                  />
                </Link>
                <div className='flex gap-5 mt-3'>
                  <InstagramIcon size={20} strokeWidth={1.5} color='#000000' />
                  <LinkedinIcon size={20} strokeWidth={1.5} color='#000000' />
                </div>


              </div>

              <div>
                <h3 className='font-semibold mb-4 text-black'>Solutions</h3>
                <div className='space-y-2 text-gray-400'>
                  <div>API Testing</div>
                  <div>Integration Testing</div>
                  <div>E2E Integrations</div>
                  <div>Browser Extension</div>
                </div>
              </div>

              <div>
                <h3 className='font-semibold mb-4 text-black'>Resources</h3>
                <div className='space-y-2 text-gray-400'>
                  <div>Help Docs</div>
                  <div>How-to Demo</div>
                  <div>Book a demo</div>
                  <div>Integrations</div>
                </div>
              </div>
              <div>
                <h3 className='font-semibold mb-4 text-black'>Company</h3>
                <div className='space-y-2 text-gray-400'>
                  <div>
                    <Link to='/privacy'>About us</Link>
                  </div>

                  <div>
                    <Link to='/contact-us'>Contact Us</Link>
                  </div>

                </div>
              </div>
              <div>
                <h3 className='font-semibold mb-4 text-black'>Legal</h3>
                <div className='space-y-2 text-gray-400'>
                  <div>
                    <Link to='/privacy'>Privacy Policy</Link>
                  </div>
                  <div>
                    <Link to='/terms'>Terms of Service</Link>
                  </div>
                </div>
              </div>

            </div>

            <div className='border-t border-gray-200 mt-12 pt-4  text-gray-400'>
              <p>Copyright &copy; {year.getFullYear()} OptraFlow Inc.</p>
            </div>
          </div>
        </footer> */}

        <Footer />
      </div>
    );
  } catch (error) {
    console.error('LandingLayout error:', error);
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='text-center'>
          <h2 className='text-xl font-semibold mb-2'>Something went wrong</h2>
          <p className='text-gray-600 mb-4'>Please refresh the page</p>
          <button
            onClick={() => window.location.reload()}
            className='px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700'
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }
};

export default LandingLayout;
