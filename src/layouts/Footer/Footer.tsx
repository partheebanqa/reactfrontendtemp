import React from 'react';
import { Facebook, Twitter, Instagram, Linkedin } from 'lucide-react';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer-theme border-t border-gray-200">
      <div className="mx-auto py-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 px-4">
          <div>
            <h3 className="text-lg font-bold mb-4">MyApp</h3>
            <p className="text-sm">
              Empowering your workflow, one tool at a time.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Company</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-sm hover:opacity-75">About Us</a></li>
              <li><a href="#" className="text-sm hover:opacity-75">Careers</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Support</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-sm hover:opacity-75">Help Center</a></li>
              <li><a href="#" className="text-sm hover:opacity-75">Contact</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Follow Us</h4>
            <div className="flex space-x-4">
              <a href="#" className="hover:opacity-75">
                <Facebook size={20} />
              </a>
              <a href="#" className="hover:opacity-75">
                <Twitter size={20} />
              </a>
              <a href="#" className="hover:opacity-75">
                <Instagram size={20} />
              </a>
              <a href="#" className="hover:opacity-75">
                <Linkedin size={20} />
              </a>
            </div>
          </div>
        </div>
        
        <div className="mt-2 pt-2 border-t border-gray-200">
          <p className="text-sm text-center">
            © {currentYear} MyApp. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;