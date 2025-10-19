import { Link } from 'react-router-dom';
import { Facebook, Instagram, Twitter, Mail, Phone, MapPin } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="text-2xl font-bold text-primary-400 font-display mb-4">
              🎂 Ebake
            </div>
            <p className="text-gray-300 mb-6 max-w-md">
              Your premium destination for delicious, custom-made cakes in Hyderabad. 
              We deliver happiness with every order, made with love and the finest ingredients.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-primary-400 transition-colors">
                <Facebook size={24} />
              </a>
              <a href="#" className="text-gray-400 hover:text-primary-400 transition-colors">
                <Instagram size={24} />
              </a>
              <a href="#" className="text-gray-400 hover:text-primary-400 transition-colors">
                <Twitter size={24} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-gray-300 hover:text-primary-400 transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/orders" className="text-gray-300 hover:text-primary-400 transition-colors">
                  My Orders
                </Link>
              </li>
              <li>
                <Link to="/profile" className="text-gray-300 hover:text-primary-400 transition-colors">
                  Profile
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact Info</h3>
            <div className="space-y-3">
              <div className="flex items-center text-gray-300">
                <Phone size={16} className="mr-3 text-primary-400" />
                <span>+91 9876543210</span>
              </div>
              <div className="flex items-center text-gray-300">
                <Mail size={16} className="mr-3 text-primary-400" />
                <span>info@ebake.in</span>
              </div>
              <div className="flex items-start text-gray-300">
                <MapPin size={16} className="mr-3 mt-1 text-primary-400 flex-shrink-0" />
                <span>
                  Hyderabad, Telangana<br />
                  India - 500001
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; 2024 Ebake. All rights reserved. Made with ❤️ for cake lovers.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
