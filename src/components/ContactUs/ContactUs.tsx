import React from 'react';
import { ContactForm } from './ContactForm';

 const ContactUs: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900">
      <div className="flex flex-col lg:flex-row min-h-screen">
        {/* Contact Form Section */}
        <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
          <div className="w-full max-w-2xl">
            <div className="mb-8">
              <h1 className="text-4xl lg:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-300 mb-4">
                Contact Us
              </h1>
              <p className="text-purple-200 text-lg">
                Ready to start your next project? We'd love to hear from you.
                Send us a message and we'll respond as soon as possible.
              </p>
            </div>
            
            <ContactForm />
          </div>
        </div>

        {/* Hero Image Section */}
        <div className="flex-1 relative overflow-hidden lg:block hidden">
          <div className="absolute inset-0 bg-gradient-to-l from-transparent via-purple-900/30 to-purple-900/60 z-10"></div>
          <img
            src="https://images.pexels.com/photos/3184360/pexels-photo-3184360.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
            alt="Modern office workspace with team collaboration and communication"
            className="w-full h-full object-cover"
            loading="lazy"
          />
          
          {/* Floating Contact Icons Overlay */}
          <div className="absolute inset-0 flex items-center justify-center z-20">
            <div className="text-white/80 text-center space-y-4">
              <div className="flex justify-center space-x-8">
                <div className="bg-white/20 backdrop-blur-sm rounded-full p-4 animate-bounce">
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"></path>
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"></path>
                  </svg>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-full p-4 animate-bounce" style={{ animationDelay: '0.2s' }}>
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"></path>
                  </svg>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-full p-4 animate-bounce" style={{ animationDelay: '0.4s' }}>
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd"></path>
                  </svg>
                </div>
              </div>
              <p className="text-sm font-medium">Get in touch with us</p>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Hero Section */}
      <div className="lg:hidden relative h-64 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-purple-900 via-purple-900/60 to-transparent z-10"></div>
        <img
          src="https://images.pexels.com/photos/3184360/pexels-photo-3184360.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
          alt="Professional team meeting and business communication"
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>
    </div>
  );
};

export default ContactUs;