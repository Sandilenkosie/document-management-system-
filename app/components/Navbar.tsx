import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "../store/Auth";

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, logout } = useAuthStore();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed w-full z-50 transition-all duration-300 ${isScrolled ? "bg-crypto-blue/80 backdrop-blur-md py-3 shadow-lg" : "py-6"}`}
    >
      <div className="container mx-auto px-4 flex justify-between items-center">
        <div className="flex items-center">
          <h1 className="text-2xl font-bold text-white">
            Crypto<span className="text-crypto-purple">Flow</span>
          </h1>
        </div>

        {/* Desktop menu */}
        <ul className="hidden lg:flex items-center space-x-8">
          <li>
            <a
              href="#features"
              className="text-gray-300 hover:text-white transition-colors"
            >
              Features
            </a>
          </li>
          <li>
            <a
              href="#how-it-works"
              className="text-gray-300 hover:text-white transition-colors"
            >
              How it works
            </a>
          </li>
          <li>
            <a
              href="#testimonials"
              className="text-gray-300 hover:text-white transition-colors"
            >
              Testimonials
            </a>
          </li>
          <li>
            <a
              href="#pricing"
              className="text-gray-300 hover:text-white transition-colors"
            >
              Pricing
            </a>
          </li>
          <li>
            <a
              href="#faq"
              className="text-gray-300 hover:text-white transition-colors"
            >
              FAQ
            </a>
          </li>
        </ul>

        <div className="hidden lg:flex items-center space-x-4">
          {user ? (
            <>
              <span className="text-gray-300">{user.email}</span>
              <Button
                variant="ghost"
                className="text-gray-300 hover:text-white w-full justify-start"
                onClick={logout}
              >
                Logout
              </Button>
            </>
          ) : (
            <>
              <Link to="/login">
                <Button
                  variant="ghost"
                  className="text-gray-300 hover:text-white w-full justify-start"
                >
                  Login
                </Button>
              </Link>
              <Link to="/register">
                <Button className="bg-crypto-purple hover:bg-crypto-dark-purple text-white w-full">
                  Register
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          className="lg:hidden text-white"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-crypto-blue/95 backdrop-blur-lg absolute top-full left-0 w-full py-4 shadow-lg">
          <div className="container mx-auto px-4">
            <ul className="flex flex-col space-y-4">
              <li>
                <a
                  href="#features"
                  className="text-gray-300 hover:text-white transition-colors block py-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Features
                </a>
              </li>
              <li>
                <a
                  href="#how-it-works"
                  className="text-gray-300 hover:text-white transition-colors block py-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  How it works
                </a>
              </li>
              <li>
                <a
                  href="#testimonials"
                  className="text-gray-300 hover:text-white transition-colors block py-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Testimonials
                </a>
              </li>
              <li>
                <a
                  href="#pricing"
                  className="text-gray-300 hover:text-white transition-colors block py-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Pricing
                </a>
              </li>
              <li>
                <a
                  href="#faq"
                  className="text-gray-300 hover:text-white transition-colors block py-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  FAQ
                </a>
              </li>
              <li className="pt-4 flex flex-col space-y-3">
                {user ? (
                  <>
                    <span className="text-gray-300 px-2">{user.email}</span>
                    <Button
                      variant="ghost"
                      className="text-gray-300 hover:text-white w-full justify-start"
                      onClick={() => {
                        logout();
                        setIsMobileMenuOpen(false);
                      }}
                    >
                      Logout
                    </Button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Button
                        variant="ghost"
                        className="text-gray-300 hover:text-white w-full justify-start"
                      >
                        Login
                      </Button>
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Button className="bg-crypto-purple hover:bg-crypto-dark-purple text-white w-full">
                        Register
                      </Button>
                    </Link>
                  </>
                )}
              </li>
            </ul>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
