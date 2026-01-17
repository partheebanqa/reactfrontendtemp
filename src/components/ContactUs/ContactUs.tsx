import React, { useState } from 'react';
import { ContactForm } from './ContactForm';
import LandingLayout from '../LandingLayout/LandingLayout';






const ContactUs: React.FC = () => {

  const [submitted, setSubmitted] = useState(false);

  return (
    <LandingLayout>
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-indigo-900 via-purple-900 to-purple-800">
        <div className="flex flex-col-reverse lg:flex-row min-h-screen">
          {/* Left: Contact Form */}
          <div className="flex-1 flex items-center justify-center px-4 py-8 lg:p-16">
            <div className="w-full max-w-xl bg-white/5 rounded-2xl shadow-xl p-8 backdrop-blur-md border border-white/10">
              {!submitted && (
                <>
                  <h1 className="text-3xl lg:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-300 mb-4 text-center">
                    Contact Us
                  </h1>
                  {/* <p className="text-purple-200 text-lg mb-8 text-center">
                    Ready to start your next project? We'd love to hear from you.<br />
                    Send us a message and we'll respond as soon as possible.
                  </p> */}
                  <p className="text-purple-200 text-lg mb-8 text-center">
                    Have Questions about Optraflow?
                    <br />   We’re Here to Help You Scale Your Testing.
                  </p>
                </>
              )}
              <ContactForm setSubmitted={setSubmitted} submitted={submitted} />
            </div>
          </div>
          {/* Right: Hero Image & Icons */}
          <div className="flex-1 relative overflow-hidden lg:block hidden">
            <img
              src="https://images.pexels.com/photos/3184360/pexels-photo-3184360.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
              alt="Modern office workspace with team collaboration and communication"
              className="w-full h-full object-cover scale-105"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-l from-transparent via-indigo-900/70 to-purple-900/90 z-10"></div>
            <div className="absolute inset-0 flex items-center justify-center z-20">
              <div className="text-white/90 text-center space-y-6">
                <div className="flex justify-center space-x-16">
                  {/* Email */}
                  <div className="flex flex-col items-center space-y-2">
                    <div className="bg-white backdrop-blur-md rounded-full p-5 animate-bounce">
                      <svg
                        className="w-8 h-8"
                        fill="#136fb0"
                        viewBox="0 0 20 20"
                      >
                        <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"></path>
                        <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"></path>
                      </svg>
                    </div>
                    <p className="text-md text-white">
                      <a href="mailto:support@optraflow.com" className="hover:underline">
                        support@optraflow.com
                      </a>
                    </p>

                  </div>

                  {/* Location */}
                  <div className="flex flex-col items-center space-y-2">
                    <div
                      className="bg-white backdrop-blur-md rounded-full p-5 animate-bounce"
                      style={{ animationDelay: '0.4s' }}
                    >
                      <svg
                        className="w-8 h-8"
                        fill="#136fb0"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          fillRule="evenodd"
                          d="M12 2C8.134 2 5 5.134 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.866-3.134-7-7-7zm0 9.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <p className="text-md text-white max-w-[250px]">
                      {/* No 38, SLV Layout Phase-2,<br />
                      Naganathapura,  */}
                      Bangalore - 560100
                    </p>
                  </div>
                </div>

                <p className="text-[25px] font-semibold tracking-wide">
                  Get in touch with us
                </p>
              </div>
            </div>

          </div>
        </div>
        {/* Mobile Hero Section */}
        <div className="lg:hidden relative h-64 overflow-hidden">
          <img
            src="https://images.pexels.com/photos/3184360/pexels-photo-3184360.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
            alt="Professional team meeting and business communication"
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      </div>
    </LandingLayout>
  );
};

export default ContactUs;