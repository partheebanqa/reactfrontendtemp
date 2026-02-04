import { motion } from 'framer-motion';
import { Zap, Brain } from 'lucide-react';

interface RoadmapSectionProps {
    onBetaClick: () => void;
}

export function RoadmapSection({ onBetaClick }: RoadmapSectionProps) {
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.2 },
        },
    };

    const cardVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
    };

    return (
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-16">
                    <motion.h2
                        initial={{ opacity: 0, y: -20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        viewport={{ once: true }}
                        className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4"
                    >
                        Coming Soon: The Future of API Testing
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        viewport={{ once: true }}
                        className="text-lg text-slate-600"
                    >
                        Get early access to powerful features that will transform how you test APIs.
                    </motion.p>
                </div>

                <motion.div
                    className="grid md:grid-cols-2 gap-8"
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                >
                    {/* Performance Engineering */}
                    <motion.div
                        variants={cardVariants}
                        className="group relative bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-8 border border-amber-200 hover:border-amber-300 transition-all duration-300 hover:shadow-lg overflow-hidden"
                    >
                        <div className="absolute top-8 right-8 w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center group-hover:bg-amber-200 transition-colors">
                            <Zap className="w-6 h-6 text-amber-600" />
                        </div>

                        <div className="mb-6">
                            <div className="inline-block px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-semibold mb-3">
                                Q2 2024
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 mb-2">Next-Gen Performance Engineering</h3>
                        </div>

                        <div className="space-y-3 mb-8 text-slate-700">
                            <p className="font-medium">Deep-tier analysis of:</p>
                            <ul className="space-y-2">
                                <li className="flex items-start gap-3">
                                    <span className="text-amber-600 font-bold">→</span>
                                    <span>Database Connection Pooling optimization</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-amber-600 font-bold">→</span>
                                    <span>Payload Compression strategies</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-amber-600 font-bold">→</span>
                                    <span>Caching layer performance</span>
                                </li>
                            </ul>
                            <p className="pt-3 border-t border-amber-200">
                                <strong>One-click Collection Health Checks</strong> for instant system heartbeats.
                            </p>
                        </div>

                        <div className="text-sm text-slate-600 italic">
                            Automated insights into your API's performance profile.
                        </div>
                    </motion.div>

                    {/* AI Diagnostics */}
                    <motion.div
                        variants={cardVariants}
                        className="group relative bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl p-8 border border-indigo-200 hover:border-indigo-300 transition-all duration-300 hover:shadow-lg overflow-hidden"
                    >
                        <div className="absolute top-8 right-8 w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center group-hover:bg-indigo-200 transition-colors">
                            <Brain className="w-6 h-6 text-indigo-600" />
                        </div>

                        <div className="mb-6">
                            <div className="inline-block px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-semibold mb-3">
                                Q3 2024 (Beta)
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 mb-2">AI-Powered Diagnostics</h3>
                            <p className="text-indigo-700 font-semibold text-sm">Powered by Anthropic Claude</p>
                        </div>

                        <div className="space-y-4 mb-8">
                            <p className="text-slate-700">
                                Move beyond status codes. Use Anthropic's Claude AI to perform semantic analysis of response payloads and provide human-readable root-cause explanations for every failure.
                            </p>
                            <div className="bg-white/50 rounded-lg p-4 border border-indigo-100">
                                <p className="text-sm text-slate-700">
                                    <span className="font-semibold text-indigo-700">Example:</span> Instead of "500 Internal Server Error", get "Your database connection pool is exhausted due to a cascading timeout in the payment service. Recommended action: increase pool size or implement circuit breaker."
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={onBetaClick}
                            className="w-full py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-indigo-500/50 transition-all duration-300"
                            aria-label="Join Beta Waitlist"
                        >
                            Join the Beta Waitlist
                        </button>
                    </motion.div>
                </motion.div>
            </div>
        </section>
    );
}