import { motion } from 'framer-motion';
import { Eye, Bell, Bug } from 'lucide-react';

export function CollaborationSection() {
    const features = [
        {
            icon: Eye,
            title: 'Unified Visibility',
            description: 'Centralized result management with side-by-side historical comparisons.',
            items: ['Real-time result tracking', 'Historical trend analysis', 'Team collaboration dashboards'],
        },
        {
            icon: Bell,
            title: 'Real-time Alerts',
            description: 'Keep the team in sync via Slack and Microsoft Teams.',
            items: ['Instant Slack notifications', 'MS Teams integration', 'Custom alert rules'],
        },
        {
            icon: Bug,
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
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-50 to-white">
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-16">
                    <motion.h2
                        initial={{ opacity: 0, y: -20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        viewport={{ once: true }}
                        className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4"
                    >
                        Built for Team Collaboration
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        viewport={{ once: true }}
                        className="text-lg text-slate-600"
                    >
                        Keep everyone in the loop with seamless integrations and real-time notifications.
                    </motion.p>
                </div>

                <motion.div
                    className="grid sm:grid-cols-1 lg:grid-cols-3 gap-8"
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                >
                    {features.map((feature, index) => {
                        const Icon = feature.icon;
                        return (
                            <motion.div
                                key={index}
                                variants={cardVariants}
                                className={`group relative rounded-xl p-8 border transition-all duration-300 ${feature.comingSoon
                                    ? 'bg-gradient-to-br from-slate-100 to-slate-50 border-slate-200 opacity-75'
                                    : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-lg'
                                    }`}
                            >
                                {feature.comingSoon && (
                                    <div className="absolute top-4 right-4">
                                        <span className="px-3 py-1 bg-slate-200 text-slate-700 rounded-full text-xs font-semibold">
                                            Coming Soon
                                        </span>
                                    </div>
                                )}

                                <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <Icon className="w-6 h-6 text-blue-600" />
                                </div>

                                <h3 className="text-xl font-bold text-slate-900 mb-2">{feature.title}</h3>
                                <p className="text-slate-600 mb-6">{feature.description}</p>

                                <ul className="space-y-2">
                                    {feature.items.map((item, itemIndex) => (
                                        <li key={itemIndex} className="flex items-start gap-3 text-slate-600">
                                            <span className="text-blue-500 font-bold mt-1">✓</span>
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