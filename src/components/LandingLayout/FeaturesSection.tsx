import { motion } from 'framer-motion';
import { CircleDot, Link as LinkIcon, Lock, GitBranch } from 'lucide-react';

export function FeaturesSection() {
    const features = [
        {
            icon: CircleDot,
            title: 'Rapid Test Creation',
            description: 'Record live app traffic with our Network Interceptor to build production-ready suites instantly.',
            color: 'from-blue-500 to-blue-600',
            accent: 'bg-blue-100',
        },
        {
            icon: LinkIcon,
            title: 'Integration & Flow Testing',
            description: 'Map complex API chains automatically with our Smart Correlation Engine.',
            color: 'from-purple-500 to-purple-600',
            accent: 'bg-purple-100',
        },
        {
            icon: Lock,
            title: 'Security at the Source',
            description: 'Native OWASP ZAP integration allows you to run top 10 security scans as part of your standard testing workflow.',
            color: 'from-red-500 to-red-600',
            accent: 'bg-red-100',
        },
        {
            icon: GitBranch,
            title: 'Continuous Execution',
            description: 'Plug into GitHub Actions or GitLab CI for fully automated "Go/No-Go" triggers on every push.',
            color: 'from-green-500 to-green-600',
            accent: 'bg-green-100',
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
                        Core Features Available Now
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        viewport={{ once: true }}
                        className="text-lg text-slate-600"
                    >
                        Everything you need to ship quality APIs with confidence.
                    </motion.p>
                </div>

                <motion.div
                    className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6"
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
                                className="group bg-white rounded-xl p-6 border border-slate-200 hover:border-slate-300 hover:shadow-lg transition-all duration-300"
                            >
                                <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${feature.accent} group-hover:scale-110 transition-transform`}>
                                    <Icon className={`w-6 h-6 bg-gradient-to-r ${feature.color} bg-clip-text text-transparent`} />
                                </div>

                                <h3 className="text-lg font-bold text-slate-900 mb-3">{feature.title}</h3>
                                <p className="text-slate-600 leading-relaxed">{feature.description}</p>
                            </motion.div>
                        );
                    })}
                </motion.div>
            </div>
        </section>
    );
}