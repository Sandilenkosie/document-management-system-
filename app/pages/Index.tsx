import { useEffect } from "react";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import ScrollToTop from "@/components/ScrollToTop";
import useScrollAnimation from "@/utils/useScrollAnimation";

const Index = () => {
  // Initialize scroll animations
  useScrollAnimation();

  // Set page title
  useEffect(() => {
    document.title = "CryptoFlow | Modern Cryptocurrency Trading";
  }, []);

  return (
    <div className="min-h-screen overflow-x-hidden">
      <Navbar />
      <Hero />
      <ScrollToTop />
    </div>
  );
};

export default Index;
