import React from "react";
import Navbar from "../components/home/Navbar";
import HeroSection from "../components/home/HeroSection";
import VideoSection from "../components/home/VideoSection";
import Marquee from "../components/home/Marquee";
import InstinctsSection from "../components/home/InstinctsSection";
import ConceptsSection from "../components/home/ConceptsSection";
import HowItWorksSection from "../components/home/HowItWorksSection";
import QuoteBreak from "../components/home/QuoteBreak";
import CTASection from "../components/home/CTASection";
import Footer from "../components/home/Footer";

export default function Home() {
  return (
    <div style={{ background: "#080810", minHeight: "100vh", color: "#e8e8f0" }}>
      <Navbar />
      <HeroSection />
      <VideoSection />
      <Marquee />
      <InstinctsSection />
      <ConceptsSection />
      <HowItWorksSection />
      <QuoteBreak />
      <CTASection />
      <Footer />
    </div>
  );
}