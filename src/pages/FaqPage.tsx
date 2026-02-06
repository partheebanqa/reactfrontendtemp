import { motion } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";
import React, { useState } from "react";

// FAQ data (could be fetched via TanStack Query if you prefer)
const faqData = [
    {
        category: "Getting Started",
        items: [
            {
                question: "How long does it take to see results?",
                answer: "Run your first test in under 5 minutes — no code required."
            },
            {
                question: "Can I try Optraflow before purchasing?",
                answer:
                    "Yes. Enjoy a 14‑day free trial with full access, no credit card required. We also offer a pilot program to help your team set up confidently."
            },
            {
                question: "Do I need technical expertise to use Optraflow?",
                answer:
                    "No coding required. Optraflow is designed for both developers and non‑technical team members."
            },
            {
                question: "What makes Optraflow different from other testing tools?",
                answer:
                    "Optraflow is fully no‑code and AI‑powered. Key differentiators:\n- AI‑driven test case generation\n- Smart object mapping\n- Collaborative reporting"
            }
        ]
    },
    {
        category: "Features & Integration",
        items: [
            {
                question: "Does it support my existing stack (e.g., Postman imports)?",
                answer:
                    "Yes. Optraflow supports Postman collections, Swagger/Open-API specifications, and cURL imports. You can also manually add your own API configurations."
            },
            {
                question: "Can I automate my test runs?",
                answer:
                    "Absolutely. With our built-in scheduler and CI/CD integration, you can automate test execution at defined intervals, making it ideal for continuous testing workflows."
            },
            {
                question: "Which CI/CD platforms do you support?",
                answer:
                    "We offer native integration with GitHub, and our team can assist in setting up other custom integrations to ensure Optraflow fits seamlessly into your existing CI/CD pipeline."
            },
            {
                question: "Does Optraflow integrate with Jira, Slack, or Microsoft Teams?",
                answer:
                    "Yes, you can share reports directly with your team via Slack and Microsoft Teams. Native Jira integration for bug reporting is in development and will be available for pilot shortly."
            },
            {
                question: "Can I export my test results?",
                answer:
                    "Yes. You can export detailed test reports in HTML & PDF formats to share with stakeholders or for internal auditing."
            },
            {
                question: "Can I manage different permissions for my team members?",
                answer:
                    "Yes. Optraflow supports role-based access control (RBAC), allowing you to define who can create, edit, or simply view test reports."
            }
        ]
    },
    {
        category: "Technical & Security",
        items: [
            {
                question: "How does Optraflow reduce testing effort?",
                answer:
                    "By leveraging auto-generated test cases and reusable scenarios, users save up to 70% on test setup and maintenance. Additionally, our platform can reduce infrastructure and DevOps costs by 60% and overall testing time by 50%."
            },
            {
                question: "What API protocols are supported?",
                answer:
                    "We primarily support HTTP/HTTPS for RESTful APIs using Bearer token authentication. OAuth support is currently in development and will enter pilot testing soon."
            },
            {
                question: "Does Optraflow handle security, load, or performance testing?",
                answer:
                    "Yes, we provide a security scanner for the OWASP Top 10 vulnerabilities. For performance testing: we are working on it, piloting rate limit testing soon. Load and performance is in our pipeline."
            },
            {
                question: "Is Optraflow suitable for microservices?",
                answer:
                    "Yes. Optraflow allows you to validate individual service behaviors and complex service-to-service interactions."
            },
            {
                question: "Where is my data stored and is it secure?",
                answer:
                    "We take security seriously. All data is encrypted at rest and in transit. We follow industry-standard security protocols to ensure your API keys and test data remain private."
            }
        ]
    },
    {
        category: "Subscriptions & Support",
        items: [
            {
                question: "Can I change or cancel my subscription?",
                answer:
                    "Yes. You can upgrade, downgrade, or cancel your plan at any time directly through your account settings. For further assistance, contact our support team at support@optraflow.com."
            },
            {
                question: "Is it suitable for both small and large teams?",
                answer:
                    "Optraflow is built to scale, whether you are a single developer testing one API or a large enterprise managing a complex microservices ecosystem."
            },
            {
                question: "What if I need help during setup?",
                answer:
                    "Our documentation covers most scenarios, and our support team is available to guide you through onboarding."
            }
        ]
    }
];

// Accordion component
const AccordionItem: React.FC<{ q: string; a: string }> = ({ q, a }) => {
    const [open, setOpen] = useState(false);

    return (
        <div
            className={`border rounded-lg p-4 shadow-sm transition-colors duration-200
        ${open ? "bg-blue-50 border-blue-300" : "bg-white"}
      `}
        >
            <button
                className={`w-full text-left font-semibold text-md flex justify-between items-center
          ${open ? "text-blue-700" : "text-[#0f172a]"}
        `}
                onClick={() => setOpen(!open)}
            >
                {q}
                <span>{open ? <ChevronUp /> : <ChevronDown />}</span>
            </button>

            {open && (
                <p className="mt-3 text-[#475569] whitespace-pre-line">
                    {a}
                </p>
            )}
        </div>
    );
};


const FaqPage: React.FC = () => {
    // Build JSON-LD schema
    const faqSchema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": faqData.flatMap(cat =>
            cat.items.map(item => ({
                "@type": "Question",
                "name": item.question,
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": item.answer
                }
            }))
        )
    };

    return (
        <main className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
            <div className="text-center mb-16">
                <motion.h2
                    initial={{ opacity: 0, y: -20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    viewport={{ once: true }}
                    className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4"
                >
                    FAQ's
                </motion.h2>
                <motion.p
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    viewport={{ once: true }}
                    className="text-lg text-slate-600"
                >
                    Everything you need to know, at a glance
                </motion.p>
            </div>
            {faqData.map((cat, idx) => (
                <section key={idx} className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">{cat.category}</h2>
                    <div className="space-y-4">
                        {cat.items.map((faq, i) => (
                            <AccordionItem key={i} q={faq.question} a={faq.answer} />
                        ))}
                    </div>
                </section>
            ))}

            {/* Inject FAQ schema markup */}
            <script type="application/ld+json">
                {JSON.stringify(faqSchema)}
            </script>
        </main>
    );
};

export default FaqPage;
