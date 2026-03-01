import { motion } from 'framer-motion';
import { Eye, Bell, Bug } from 'lucide-react';

const JiraIcon = () => (
  <svg
    viewBox='0 0 48 48'
    xmlns='http://www.w3.org/2000/svg'
    className='w-6 h-6'
    fill='none'
  >
    <path
      d='M0 24C0 10.7452 10.7452 0 24 0C37.2548 0 48 10.7452 48 24C48 37.2548 37.2548 48 24 48C10.7452 48 0 37.2548 0 24Z'
      fill='white'
    />
    <path
      d='M34.9367 12H23.41C23.41 13.38 23.9582 14.7035 24.934 15.6793C25.9098 16.6551 27.2333 17.2033 28.6133 17.2033H30.7367V19.2533C30.7385 22.1245 33.0656 24.4515 35.9367 24.4533V13C35.9367 12.4477 35.489 12 34.9367 12Z'
      fill='#2684FF'
    />
    <path
      d='M29.2333 17.7433H17.7067C17.7085 20.6144 20.0355 22.9414 22.9067 22.9433H25.03V25C25.0337 27.8711 27.3622 30.1966 30.2333 30.1966V18.7433C30.2333 18.191 29.7856 17.7433 29.2333 17.7433Z'
      fill='url(#paint0_linear)'
    />
    <path
      d='M23.5267 23.4833H12C12 26.357 14.3296 28.6866 17.2033 28.6866H19.3333V30.7366C19.3352 33.6051 21.6582 35.9311 24.5267 35.9366V24.4833C24.5267 23.931 24.079 23.4833 23.5267 23.4833Z'
      fill='url(#paint1_linear)'
    />
    <defs>
      <linearGradient
        id='paint0_linear'
        x1='27.4434'
        y1='15.326'
        x2='22.5699'
        y2='20.4112'
        gradientUnits='userSpaceOnUse'
      >
        <stop offset='0.18' stopColor='#0052CC' />
        <stop offset='1' stopColor='#2684FF' />
      </linearGradient>
      <linearGradient
        id='paint1_linear'
        x1='376.829'
        y1='349.939'
        x2='167.455'
        y2='557.146'
        gradientUnits='userSpaceOnUse'
      >
        <stop offset='0.18' stopColor='#0052CC' />
        <stop offset='1' stopColor='#2684FF' />
      </linearGradient>
    </defs>
  </svg>
);

export function CollaborationSection() {
  const features = [
    {
      icon: Eye,
      title: 'Unified Visibility',
      description:
        'Centralized result management with side-by-side historical comparisons.',
      items: [
        'Real-time result tracking',
        'Historical trend analysis',
        'Team collaboration dashboards',
      ],
    },
    {
      icon: Bell,
      title: 'Real-time Alerts',
      description: 'Keep the team in sync via Slack and Microsoft Teams.',
      items: [
        'Instant Slack notifications',
        'MS Teams integration',
        'Custom alert rules',
      ],
    },
    {
      icon: JiraIcon,
      title: 'Coming Soon: Jira Integration',
      description: 'Full bi-directional integration for seamless bug tracking.',
      items: ['Auto-create issues', 'Sync test results', 'Track fix progress'],
      comingSoon: true,
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  return (
    <section className='py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-50 to-white'>
      <div className='max-w-6xl mx-auto'>
        <div className='text-center mb-16'>
          <motion.h2
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className='text-3xl sm:text-4xl font-bold text-slate-900 mb-4'
          >
            Built for Team Collaboration
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className='text-lg text-slate-600'
          >
            Keep everyone in the loop with seamless integrations and real-time
            notifications.
          </motion.p>
        </div>

        <motion.div
          className='grid sm:grid-cols-1 lg:grid-cols-3 gap-8'
          variants={containerVariants}
          initial='hidden'
          whileInView='visible'
          viewport={{ once: true }}
        >
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={index}
                variants={cardVariants}
                className={`group relative rounded-xl p-8 border transition-all duration-300 ${
                  feature.comingSoon
                    ? 'bg-gradient-to-br from-slate-100 to-slate-50 border-slate-200 opacity-75'
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-lg'
                }`}
              >
                {feature.comingSoon && (
                  <div className='absolute top-4 right-4'>
                    <span className='px-3 py-1 bg-slate-200 text-slate-700 rounded-full text-xs font-semibold'>
                      Coming Soon
                    </span>
                  </div>
                )}

                <div className='w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform'>
                  <Icon className='w-6 h-6 text-blue-600' />
                </div>

                <h3 className='text-xl font-bold text-slate-900 mb-2'>
                  {feature.title}
                </h3>
                <p className='text-slate-600 mb-6'>{feature.description}</p>

                <ul className='space-y-2'>
                  {feature.items.map((item, itemIndex) => (
                    <li
                      key={itemIndex}
                      className='flex items-start gap-3 text-slate-600'
                    >
                      <span className='text-blue-500 font-bold mt-1'>✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
