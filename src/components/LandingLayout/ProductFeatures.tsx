import { useEffect, useRef, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  MoveRight,
  LockKeyhole,
  StepForward,
} from 'lucide-react';

import RadipTest from '../../assests/images/QuickTest.gif';
import Security from '../../assests/images/securityScan.gif';
import { Link } from 'wouter';
import { motion } from 'framer-motion';
import CICD from '../../assests/images/CICD.gif';
import Integration from '../../assests/images/IntegrationTesting.gif';

const features = [
  {
    title: 'Rapid Test Creation',
    subtitle:
      'Record live app traffic with our Network Interceptor to build production-ready suites instantly.',
    icon: (
      <svg
        viewBox='0 0 100 100'
        fill='none'
        xmlns='http://www.w3.org/2000/svg'
        className='w-[25px] h-[25px]'
      >
        <circle
          cx='50'
          cy='50'
          r='40'
          stroke='#1e3a5f'
          strokeWidth='3'
          fill='none'
        />
        <path d='M 40 30 L 40 70 L 70 50 Z' fill='#1e3a5f' />
        <path
          d='M 10 25 L 25 25'
          stroke='#0d9488'
          strokeWidth='2'
          strokeLinecap='round'
        />
        <path
          d='M 10 50 L 28 50'
          stroke='#0d9488'
          strokeWidth='2'
          strokeLinecap='round'
        />
        <path
          d='M 10 75 L 25 75'
          stroke='#0d9488'
          strokeWidth='2'
          strokeLinecap='round'
        />
      </svg>
    ),
    image: RadipTest,
    to: '/member-management',
  },
  {
    title: 'Integration & Flow Testing',
    subtitle:
      'Map complex API chains automatically with our Smart Correlation Engine.',
    icon: (
      <svg
        viewBox='0 0 100 100'
        fill='none'
        xmlns='http://www.w3.org/2000/svg'
        className='w-[25px] h-[25px]'
      >
        <circle
          cx='30'
          cy='30'
          r='12'
          stroke='#1e3a5f'
          strokeWidth='3'
          fill='none'
        />
        <circle
          cx='70'
          cy='30'
          r='12'
          stroke='#1e3a5f'
          strokeWidth='3'
          fill='none'
        />
        <circle
          cx='50'
          cy='70'
          r='12'
          stroke='#0d9488'
          strokeWidth='3'
          fill='none'
        />

        <path d='M 35 40 L 45 60' stroke='#1e3a5f' strokeWidth='2.5' />
        <path d='M 65 40 L 55 60' stroke='#1e3a5f' strokeWidth='2.5' />

        <circle cx='30' cy='30' r='4' fill='#1e3a5f' />
        <circle cx='70' cy='30' r='4' fill='#1e3a5f' />
        <circle cx='50' cy='70' r='4' fill='#0d9488' />
      </svg>
    ),
    image: Integration,
    to: '/course-management',
  },
  {
    title: 'Security at the Source',
    subtitle:
      'Native OWASP ZAP integration allows you to run top 10 security scans as part of your standard testing workflow.',
    icon: <LockKeyhole size={25} />,
    image: Security,
    to: '/event-management',
  },
  {
    title: 'Continuous Execution',
    subtitle:
      'Plug into GitHub Actions or GitLab CI for fully automated Go/No-Go triggers on every push.',
    icon: <StepForward size={25} />,
    image: CICD,
    to: '/subscription-management',
  },
];

const ProductFeatures = () => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [userInteracted, setUserInteracted] = useState(false);

  const goToNext = () => {
    setActiveIndex((prev) => (prev + 1) % features.length);
    setUserInteracted(true);
  };

  const goToPrev = () => {
    setActiveIndex((prev) => (prev === 0 ? features.length - 1 : prev - 1));
    setUserInteracted(true);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      if (!userInteracted) {
        setActiveIndex((prev) => (prev + 1) % features.length);
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [userInteracted]);

  useEffect(() => {
    if (!userInteracted) return;
    const timeout = setTimeout(() => setUserInteracted(false), 8000);
    return () => clearTimeout(timeout);
  }, [userInteracted]);

  return (
    <section className='w-full py-10 md:py-20 flex flex-col justify-center items-center md:px-20 px-6  bg-gradient-to-b from-blue-50 to-white'>
      <div className='text-center mb-16'>
        <motion.h2
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className='text-3xl sm:text-4xl font-bold text-slate-900 mb-4'
        >
          Core Features Available Now
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
          className='text-lg text-slate-600'
        >
          Everything you need to ship quality APIs with confidence.
        </motion.p>
      </div>
      {/* Tabs - Desktop Only */}
      <div className='relative items-center w-fit mx-6 md:mx-20 mb-8 hidden md:flex'>
        {/* <button
          onClick={() => {
            scrollTabs("left");
            setUserInteracted(true);
          }}
          className="absolute -left-2 z-10 bg-white shadow p-1.5 rounded-full "
        >
          <ChevronLeft size={20} />
        </button> */}

        <div
          ref={scrollRef}
          className='flex overflow-x-auto gap-2 md:justify-center py-2 w-full px-10 scrollbar-hide scroll-smooth'
        >
          {features.map((tab, index) => {
            const isActive = index === activeIndex;
            return (
              <button
                key={index}
                onClick={() => {
                  setActiveIndex(index);
                  setUserInteracted(true);
                }}
                className={`whitespace-nowrap cursor-pointer flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition ${
                  isActive
                    ? 'text-black border-transparent'
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-100'
                }`}
                style={
                  isActive
                    ? {
                        background:
                          'linear-gradient(180.02deg, rgba(29, 129, 217, 0.08) 25.36%, rgba(18, 6, 254, 0.05) 147.72%, rgba(254, 127, 6, 0.08) 147.72%)',
                      }
                    : {}
                }
              >
                {tab.icon}
                {tab.title.replace('Manage ', '')}
              </button>
            );
          })}
        </div>

        {/* <button
          onClick={() => {
            scrollTabs("right");
            setUserInteracted(true);
          }}
          className="absolute -right-2 z-10 bg-white shadow p-1.5 rounded-full"
        >
          <ChevronRight size={20} />
        </button> */}
      </div>

      {/* Feature Content */}
      <div className='relative w-full  rounded-[20px] border border-[#e7ebf1] mx-6 md:mx-20 overflow-hidden grid grid-cols-1 md:grid-cols-2 bg-white'>
        {/* Arrows for Mobile Only */}
        <button
          onClick={goToPrev}
          className='absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-white p-2 rounded-full shadow md:hidden'
        >
          <ChevronLeft size={20} />
        </button>

        <div className='flex flex-col items-center justify-center p-10 text-center'>
          <h2 className='text-[32px] md:text-[50px] font-bold text-gray-800 leading-tight'>
            {features[activeIndex].title}
          </h2>
          <p className='mt-3'>{features[activeIndex].subtitle}</p>
          <Link
            to={features[activeIndex].to}
            className='font-semibold mt-2 flex items-center gap-2 hover:underline'
          >
            🔗 View More
            <MoveRight />
          </Link>
        </div>

        <div className='flex items-center justify-center'>
          <img
            src={features[activeIndex].image}
            alt={features[activeIndex].title}
            className='w-full h-full object-cover  rounded-tl-[20px] rounded-bl-[20px] md:rounded-l-[20px] md:rounded-r-0'
          />
        </div>

        <button
          onClick={goToNext}
          className='absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-white p-2 rounded-full shadow md:hidden'
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </section>
  );
};

export default ProductFeatures;
