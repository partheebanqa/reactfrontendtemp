import { useEffect, useRef, useState } from "react";
import {
    ChevronLeft,
    ChevronRight,
    Users,
    BookOpen,
    CalendarDays,
    User,
    ClipboardList,
    Video,
    // FileText,
    Megaphone,
    MoveRight,
    Bug,
    TestTubeDiagonal,
    LockKeyhole,
    StepForward,
} from "lucide-react";

import MemberGIF from "../../assests/images/Members.gif";
import Appointments from "../../assests/images/Members.gif";
import Courses from "../../assests/images/Coursess.gif";
import Events from "../../assests/images/Eventss.gif";
import Meetings from "../../assests/images/Meetingss.gif";
import Posts from "../../assests/images/Posts.gif";
// import Reports from "../assets/images/Reports.gif";
import Subscribers from "../../assests/images/Subscriberss.gif";
import { Link } from "wouter";
import { motion } from "framer-motion";
import CICD from "../../assests/images/cicd.jpeg";
import Integration from "../../assests/images/integration.jpeg";

const features = [
    {
        title: "Rapid Test Creation",
        subtitle: "Record live app traffic with our Network Interceptor to build production-ready suites instantly.",
        icon: <Bug size={25} />,
        image: MemberGIF,
        to: "/member-management",
    },
    {
        title: "Integration & Flow Testing",
        subtitle: "Map complex API chains automatically with our Smart Correlation Engine.",
        icon: <TestTubeDiagonal size={25} />,
        image: Integration,
        to: "/course-management",
    },
    {
        title: "Security at the Source",
        subtitle: "Native OWASP ZAP integration allows you to run top 10 security scans as part of your standard testing workflow.",
        icon: <LockKeyhole size={25} />,
        image: Events,
        to: "/event-management",
    },
    {
        title: "Continuous Execution",
        subtitle: "Plug into GitHub Actions or GitLab CI for fully automated Go/No-Go triggers on every push.",
        icon: <StepForward size={25} />,
        image: CICD,
        to: "/subscription-management",
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
        <section className="w-full py-10 md:py-20 flex flex-col justify-center items-center md:px-20 px-6  bg-gradient-to-b from-blue-50 to-white">

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
            {/* Tabs - Desktop Only */}
            <div className="relative items-center w-fit mx-6 md:mx-20 mb-8 hidden md:flex">
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
                    className="flex overflow-x-auto gap-2 md:justify-center py-2 w-full px-10 scrollbar-hide scroll-smooth"
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
                                className={`whitespace-nowrap cursor-pointer flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition ${isActive
                                    ? "text-black border-transparent"
                                    : "bg-white border-gray-200 text-gray-600 hover:bg-gray-100"
                                    }`}
                                style={
                                    isActive
                                        ? {
                                            background:
                                                "linear-gradient(180.02deg, rgba(29, 129, 217, 0.08) 25.36%, rgba(18, 6, 254, 0.05) 147.72%, rgba(254, 127, 6, 0.08) 147.72%)",
                                        }
                                        : {}
                                }
                            >
                                {tab.icon}
                                {tab.title.replace("Manage ", "")}
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
            <div className="relative w-full  rounded-[20px] border border-[#e7ebf1] mx-6 md:mx-20 overflow-hidden grid grid-cols-1 md:grid-cols-2 bg-white">
                {/* Arrows for Mobile Only */}
                <button
                    onClick={goToPrev}
                    className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-white p-2 rounded-full shadow md:hidden"
                >
                    <ChevronLeft size={20} />
                </button>

                <div className="flex flex-col items-center justify-center p-10 text-center">
                    <h2 className="text-[32px] md:text-[50px] font-bold text-gray-800 leading-tight">
                        {features[activeIndex].title}
                    </h2>
                    <p className="mt-3">{features[activeIndex].subtitle}</p>
                    <Link
                        to={features[activeIndex].to}
                        className="font-semibold mt-2 flex items-center gap-2 hover:underline"
                    >
                        🔗{" "}View More
                        <MoveRight />
                    </Link>
                </div>

                <div className="flex items-center justify-center">
                    <img
                        src={features[activeIndex].image}
                        alt={features[activeIndex].title}
                        className="w-full h-full object-cover max-h-[550px]"
                    />
                </div>

                <button
                    onClick={goToNext}
                    className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-white p-2 rounded-full shadow md:hidden"
                >
                    <ChevronRight size={20} />
                </button>
            </div>
        </section>
    );
};

export default ProductFeatures;