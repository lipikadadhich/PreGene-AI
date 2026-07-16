import { motion } from "framer-motion";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Hero from "@/components/sections/Hero";
import StatsBanner from "@/components/sections/StatsBanner";
import Capabilities from "@/components/sections/Capabilities";
import Process from "@/components/sections/Process";
import About from "@/components/sections/About";
import Testimonials from "@/components/sections/Testimonials";
import Contact from "@/components/sections/Contact";

export default function LandingPage() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="min-h-screen bg-white"
    >
      <Header />
      <main>
        <Hero />
        <StatsBanner />
        <Capabilities />
        <Process />
        <About />
        <Testimonials />
        <Contact />
      </main>
      <Footer />
    </motion.div>
  );
}