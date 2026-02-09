import { motion } from 'framer-motion';
import { Github, Twitter, Linkedin, Youtube } from 'lucide-react';
import { Link, useLocation } from "wouter";


interface FooterProps {

}

export function Footer() {
    const currentYear = new Date().getFullYear();
    const [, navigate] = useLocation();

    return (
        <footer className="bg-slate-900 text-slate-100 py-16 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
                {/* CTA Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    viewport={{ once: true }}
                    className="mb-16 text-center"
                >
                    <h2 className="text-3xl sm:text-4xl font-bold mb-6">
                        Ready to automate the hard parts of API testing?
                    </h2>
                    <p className="text-lg text-slate-300 mb-8 max-w-2xl mx-auto">
                        Join teams at leading companies who are shipping APIs with confidence.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <a
                            href="/contact-us"
                            className="px-8 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-blue-500/50 transition-all duration-300"
                        >
                            Talk to an Expert
                        </a>
                        <a
                            href="/help-support "
                            className="px-8 py-3 border border-slate-400 text-slate-100 font-semibold rounded-lg hover:bg-slate-800 transition-colors duration-300"
                        >
                            View Documentation
                        </a>
                    </div>
                </motion.div>

                {/* Main Footer Content */}
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    viewport={{ once: true }}
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-8 mb-12 border-t border-slate-800 pt-12"
                >
                    {/* Brand */}
                    <div>
                        <h3 className="text-lg font-bold mb-4">OptraFlow</h3>
                        <p className="text-slate-400 text-sm">
                            The unified platform for API testing, security, and performance engineering.
                        </p>
                    </div>

                    {/* Product */}
                    <div>
                        <h4 className="font-semibold mb-4">Solutions</h4>
                        <ul className="space-y-2 text-sm text-slate-400">
                            <li><Link href="/features" className="hover:text-slate-100 transition-colors">API Testing</Link></li>
                            <li><Link href="/pricing" className="hover:text-slate-100 transition-colors">Integration Testing</Link></li>
                            <li><Link href="/roadmap" className="hover:text-slate-100 transition-colors">E2E Testing</Link></li>
                            <li><Link href="/security" className="hover:text-slate-100 transition-colors">Browser Extensions</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-semibold mb-4">Resources</h4>
                        <ul className="space-y-2 text-sm text-slate-400">
                            <li><Link href="/features" className="hover:text-slate-100 transition-colors">Help Docs</Link></li>
                            <li><Link href="/pricing" className="hover:text-slate-100 transition-colors">How to videos</Link></li>
                            <li><Link href="/roadmap" className="hover:text-slate-100 transition-colors">Book a demo</Link></li>
                            <li><Link href="/security" className="hover:text-slate-100 transition-colors">Integrations</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-semibold mb-4">Tools</h4>
                        <ul className="space-y-2 text-sm text-slate-400">
                            <li><a href="/json-viewer" className="hover:text-slate-100 transition-colors">JSON viewer</a></li>
                            <li>
                                <a
                                    href='/jwt-validator'
                                    className="hover:text-slate-100 transition-colors"
                                >
                                    JWT validator
                                </a>
                            </li>
                            <li><a href="/url-encoder" className="hover:text-slate-100 transition-colors">URL Encoder</a></li>
                            <li><a href="/utf-encoder-decoder" className="hover:text-slate-100 transition-colors">UTF8 Encoder & Decoder</a></li>
                            <li><a href="/bs64-encoder-decoder" className="hover:text-slate-100 transition-colors">Base64 Encoder & Decoder</a></li>
                        </ul>
                    </div>

                    {/* Company */}
                    <div>
                        <h4 className="font-semibold mb-4">Company</h4>
                        <ul className="space-y-2 text-sm text-slate-400">
                            <li><a href="/about" className="hover:text-slate-100 transition-colors">About</a></li>
                            <li><a href="/contact-us" className="hover:text-slate-100 transition-colors">Contact</a></li>
                        </ul>
                    </div>

                    {/* Legal & Social */}
                    <div>
                        <h4 className="font-semibold mb-4">Connect</h4>
                        <div className="flex gap-4 mb-6">
                            <a href="https://www.youtube.com/@optraflow" target='_blank' className="text-slate-400 hover:text-slate-100 transition-colors" aria-label="GitHub">
                                <Youtube className="w-5 h-5" />
                            </a>
                            <a href="https://www.linkedin.com/company/optraflow/?viewAsMember=true" target='_blank' className="text-slate-400 hover:text-slate-100 transition-colors" aria-label="LinkedIn">
                                <Linkedin className="w-5 h-5" />
                            </a>
                        </div>
                        <ul className="space-y-2 text-sm text-slate-400">
                            <li><a href="/privacy" className="hover:text-slate-100 transition-colors">Privacy</a></li>
                            <li><a href="/terms" className="hover:text-slate-100 transition-colors">Terms</a></li>
                        </ul>
                    </div>
                </motion.div>

                {/* Bottom */}
                <div className="border-t border-slate-800 pt-8 flex flex-col sm:flex-row justify-between items-center text-sm text-slate-400">
                    <p>&copy; {currentYear} OptraFlow. All rights reserved.</p>
                    {/* <p>Tested with OptraFlow.</p> */}
                </div>
            </div>
        </footer>
    );
}