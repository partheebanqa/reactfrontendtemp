import React from 'react';
import PilotImage from '../../assests/images/PilotHero.webp';

export default function HeroPilotProgram() {
  return (
    <section className='relative w-full overflow-hidden bg-gradient-to-br from-[#136fb0] via-[#0a355c] to-[#061f36]'>
      {/* Background network effect */}
      <div className='pointer-events-none absolute inset-0 opacity-30'>
        <svg
          className='h-full w-full'
          viewBox='0 0 1200 600'
          preserveAspectRatio='xMidYMid slice'
        >
          <defs>
            <linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
              <stop offset='0%' stopColor='#3aa0ff' stopOpacity='0.6' />
              <stop offset='100%' stopColor='#00e5ff' stopOpacity='0.2' />
            </linearGradient>
          </defs>
          {[...Array(18)].map((_, i) => (
            <line
              key={i}
              x1={Math.random() * 1200}
              y1={Math.random() * 600}
              x2={Math.random() * 1200}
              y2={Math.random() * 600}
              stroke='url(#g)'
              strokeWidth='1'
            />
          ))}
          {[...Array(22)].map((_, i) => (
            <circle
              key={`c-${i}`}
              cx={Math.random() * 1200}
              cy={Math.random() * 600}
              r='3'
              fill='#4fc3f7'
            />
          ))}
        </svg>
      </div>

      <div className='relative mx-auto max-w-7xl px-6 py-20'>
        <div className='grid items-center gap-12 md:grid-cols-2'>
          {/* Left content */}
          <div className='text-white'>
            <p className='mb-4 text-sm font-semibold tracking-widest text-[#ffffff]'>
              JOIN THE PILOT PROGRAM
            </p>
            <h1 className='text-4xl font-bold leading-tight md:text-4xl lg:text-4xl'>
              Power Up Testing Efficiency
              <br />
              <span className='text-white'>by 60% in just 4 weeks.</span>
            </h1>
          </div>

          {/* Right illustration */}
          <div className='flex justify-center md:justify-end'>
            <div className='relative w-full max-w-lg rounded-2xl bg-slate-50 p-1 shadow-2xl'>
              <img
                src={PilotImage}
                alt='Testing efficiency illustration'
                className='w-full rounded-xl'
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
