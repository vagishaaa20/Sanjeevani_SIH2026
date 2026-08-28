import Navbar from "../components/landing/Navbar";
import HeroSection from "../components/landing/HeroSection";
import AIExplanationSection from "../components/landing/AIExplanationSection";
import HITLSection from "../components/landing/HITLSection";
import HowItWorksSection from "../components/landing/HowItWorksSection";
import BenefitsSection from "../components/landing/BenefitsSection";
import DoctorDiscoverySection from "../components/landing/DoctorDiscoverySection";
import TrustSecuritySection from "../components/landing/TrustSecuritySection";
import CTASection from "../components/landing/CTASection";
import Footer from "../components/landing/Footer";

export default function Landing() {
  return (
    <main>
      <Navbar />
      <HeroSection />
      <AIExplanationSection />
      <HITLSection />
      <HowItWorksSection />
      <BenefitsSection />
      <DoctorDiscoverySection />
      <TrustSecuritySection />
      <CTASection />
      <Footer />
    </main>
  );
}