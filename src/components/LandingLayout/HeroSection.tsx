import { useState } from 'react';
import { ArrowRight, ArrowRightIcon } from 'lucide-react';
import { motion } from 'framer-motion';

import { cn } from '@/lib/utils';
import { AnimatedShinyText } from '../ui/magicui/animated-shiny-text';
import { navigate } from 'wouter/use-browser-location';

export function HeroSection() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2, delayChildren: 0.3 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: 'easeOut' },
    },
  };

  return (
    <section className='relative min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden'>
      {/* Animated background elements */}
      <div className='absolute inset-0 overflow-hidden'>
        <motion.div
          className='absolute top-20 left-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl'
          animate={{ x: [0, 30, 0], y: [0, -30, 0] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          className='absolute bottom-20 right-10 w-96 h-96 bg-slate-500/10 rounded-full blur-3xl'
          animate={{ x: [0, -30, 0], y: [0, 30, 0] }}
          transition={{ duration: 10, repeat: Infinity }}
        />
      </div>

      <div className='relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-center min-h-[calc(100vh-80px)]'>
        <motion.div
          className='max-w-4xl mx-auto text-center'
          variants={containerVariants}
          initial='hidden'
          animate='visible'
        >
          <div className='flex items-center justify-center mb-5'>
            <button
              onClick={() => navigate('/signin')}
              className={cn(
                'group rounded-full border border-black/5 bg-neutral-100 text-base transition-all ease-in hover:cursor-pointer hover:bg-neutral-200 dark:border-white/5 dark:bg-neutral-900 dark:hover:bg-neutral-800',
              )}
              aria-label='Go to Sign In'
            >
              <AnimatedShinyText className='inline-flex items-center justify-center px-4 py-1 transition ease-out hover:text-neutral-600 hover:duration-300 hover:dark:text-neutral-400'>
                <span className='text-black'>
                  ✨ 2 Minutes for your first test
                </span>
                <ArrowRightIcon className='text-black ml-1 size-3 transition-transform duration-300 ease-in-out group-hover:translate-x-0.5' />
              </AnimatedShinyText>
            </button>
          </div>

          <motion.h1
            variants={itemVariants}
            className='text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white mb-6'
          >
            Engineer API{' '}
            <span className='bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent'>
              Confidence
            </span>{' '}
            from Development to Deployment
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className='text-lg sm:text-xl text-slate-300 mb-8 max-w-2xl mx-auto leading-relaxed'
          >
            The first unified platform for rapid test creation, security
            scanning, and intelligent performance engineering.
          </motion.p>

          <motion.div
            variants={itemVariants}
            className='flex flex-col sm:flex-row gap-4 justify-center items-center'
          >
            <button
              onClick={() => navigate('/signup')}
              className='group relative px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-lg hover:shadow-2xl hover:shadow-blue-500/50 transition-all duration-300 flex items-center gap-2'
              aria-label='Start Free Trial'
            >
              Get started for free
              <ArrowRight className='w-5 h-5 group-hover:translate-x-1 transition-transform' />
            </button>

            <button
              onClick={() => navigate('/signin')}
              className='group relative px-8 py-4 bg-white text-black font-semibold rounded-lg hover:shadow-2xl hover:shadow-blue-500/50 transition-all duration-300 flex items-center gap-2'
              aria-label='Start Free Trial'
            >
              Start Testing
              <ArrowRight className='w-5 h-5 group-hover:translate-x-1 transition-transform' />
            </button>
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        {/* <motion.div
                    className="absolute bottom-8 left-1/2 -translate-x-1/2"
                    animate={{ y: [0, 8, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                >
                    <div className="text-slate-400 text-sm flex flex-col items-center gap-2">
                        <span>Scroll to explore</span>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                        </svg>
                    </div>
                </motion.div> */}
      </div>
    </section>
  );
}
