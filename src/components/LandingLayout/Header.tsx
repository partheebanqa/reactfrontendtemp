import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import LogoFull from '../../assests/images/OptraLogo-removebg-preview_bg.webp';
import { Link } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { navigate } from 'wouter/use-browser-location';

interface HeaderProps {
  onTrialClick: () => void;
  onBetaClick: () => void;
}

export function LayoutHeader({ onTrialClick, onBetaClick }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { isAuthenticated } = useAuth();

  const navItems = [
    { label: 'Pricing', href: '/pricing' },
    { label: 'Contact Us', href: '/contact-us' },
    // { label: 'Collaboration', href: '#collaboration' },
  ];

  return (
    <header className='bg-white/95 backdrop-blur-md border-b border-slate-200/50 shadow-sm'>
      <div className='w-full bg-gradient-to-r from-[#0b1220] to-[#0f1b35] text-white text-sm'>
        <div className='max-w-7xl mx-auto px-4 h-10 flex items-center justify-center'>
          <div className='flex items-center gap-6'>
            <p className='text-gray-300 hidden md:block'>
              Power Up Testing Efficiency by 60% in just 4 weeks.
              <Link
                to='/pilot-program'
                className='ml-1 text-cyan-400 hover:underline font-medium'
              >
                Join the Pilot Program
              </Link>
            </p>
          </div>
        </div>
      </div>
      <nav className='max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between'>
        {/* Logo */}
        <motion.a
          href='/'
          className='flex items-center gap-2 group'
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.2 }}
        >
          <img src={LogoFull} alt='OptraFlow Logo' className='h-10 w-auto' />
        </motion.a>

        {/* Desktop Navigation */}
        <div className='hidden md:flex items-center gap-8'>
          {navItems.map((item) => (
            <motion.a
              key={item.label}
              href={item.href}
              className='text-slate-700 font-medium hover:text-blue-600 transition-colors'
              whileHover={{ y: -2 }}
            >
              {item.label}
            </motion.a>
          ))}
        </div>

        {/* Desktop CTAs */}
        <div className='hidden md:flex items-center gap-4'>
          {/* <button
            onClick={onBetaClick}
            className="px-4 py-2 text-slate-700 font-medium hover:text-blue-600 transition-colors"
          >
            Beta Access
          </button> */}

          <button
            onClick={
              isAuthenticated ? () => navigate('/dashboard') : onTrialClick
            }
            className='px-6 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-blue-500/50 transition-all duration-300'
          >
            {isAuthenticated ? 'Go to Dashboard' : ' Sign In'}
          </button>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className='md:hidden p-2 hover:bg-slate-100 rounded-lg transition-colors'
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label='Toggle menu'
        >
          {mobileMenuOpen ? (
            <X className='w-6 h-6 text-slate-700' />
          ) : (
            <Menu className='w-6 h-6 text-slate-700' />
          )}
        </button>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className='md:hidden border-t border-slate-200 bg-white/98 backdrop-blur-md'
          >
            <div className='px-4 py-4 space-y-3'>
              {navItems.map((item) => (
                <motion.a
                  key={item.label}
                  href={item.href}
                  className='block px-4 py-2 text-slate-700 font-medium hover:bg-slate-100 rounded-lg transition-colors'
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </motion.a>
              ))}
              {/* <button
                                onClick={() => {
                                    onBetaClick();
                                    setMobileMenuOpen(false);
                                }}
                                className="w-full px-4 py-2 text-slate-700 font-medium hover:bg-slate-100 rounded-lg transition-colors text-left"
                            >
                                Beta Access
                            </button> */}
              <button
                onClick={() => {
                  onTrialClick();
                  setMobileMenuOpen(false);
                }}
                className='w-full px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-blue-500/50 transition-all duration-300'
              >
                Sign In
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
