'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Shield, Lock, Zap, FileText, Lightbulb, RotateCcw, ArrowRight, Sparkles } from 'lucide-react';

export default function ClaimVerifyLanding() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [visibleSections, setVisibleSections] = useState<string[]>([]);
  const [problemsInView, setProblemsInView] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.target.id === 'problems') {
            setProblemsInView(entry.isIntersecting);
          }
          if (entry.target.id === 'how-works-container') {
            if (entry.isIntersecting) {
              entry.target.classList.add('how-it-works-trigger');
            } else {
              entry.target.classList.remove('how-it-works-trigger');
            }
          }
        });
      },
      { threshold: 0.3 }
    );

    const problemsSection = document.getElementById('problems');
    const howWorksSection = document.getElementById('how-works-container');
    
    if (problemsSection) {
      observer.observe(problemsSection);
    }
    if (howWorksSection) {
      observer.observe(howWorksSection);
    }

    return () => {
      if (problemsSection) {
        observer.unobserve(problemsSection);
      }
      if (howWorksSection) {
        observer.unobserve(howWorksSection);
      }
    };
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    element?.scrollIntoView({ behavior: 'smooth' });
    setMobileMenuOpen(false);
  };

  const navigateToLogin = () => {
    router.push('/login');
  };

  const observeElement = (id: string) => {
    if (!visibleSections.includes(id)) {
      setVisibleSections([...visibleSections, id]);
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 relative overflow-hidden">
      <style jsx global>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        @keyframes slideInDown {
          from {
            opacity: 0;
            transform: translateY(-30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes bounceIn {
          0% {
            opacity: 0;
            transform: scale(0.8);
          }
          50% {
            opacity: 1;
          }
          100% {
            transform: scale(1);
          }
        }
        @keyframes shimmer {
          0% { background-position: -1000px 0; }
          100% { background-position: 1000px 0; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes glow {
          0%, 100% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.5), inset 0 0 20px rgba(59, 130, 246, 0.2); }
          50% { box-shadow: 0 0 40px rgba(16, 185, 129, 0.8), inset 0 0 30px rgba(16, 185, 129, 0.3); }
        }
        @keyframes pulse-ring {
          0% {
            box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7);
          }
          70% {
            box-shadow: 0 0 0 20px rgba(59, 130, 246, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(59, 130, 246, 0);
          }
        }
        .animate-slide-in-down {
          animation: slideInDown 0.6s ease-out;
        }
        .animate-slide-in-up {
          animation: slideInUp 0.6s ease-out;
        }
        .animate-slide-in-left {
          animation: slideInLeft 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }
        .animate-slide-in-right {
          animation: slideInRight 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }
        .animate-fade-in-scale {
          animation: fadeInScale 0.6s ease-out;
        }
        .animate-bounce-in {
          animation: bounceIn 0.6s ease-out;
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        .animate-glow {
          animation: glow 3s ease-in-out infinite;
        }
        .animate-pulse-ring {
          animation: pulse-ring 2s infinite;
        }
      `}</style>

      {/* Subtle animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob" />
        <div className="absolute top-40 right-10 w-72 h-72 bg-teal-200 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000" />
        <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-cyan-200 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-4000" />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-sm border-b border-blue-100 px-6 py-4 z-50 animate-slide-in-down shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-teal-500 bg-clip-text text-transparent">
            ClaimVerify AI
          </div>
          
          <div className="hidden md:flex gap-8 items-center">
            <button onClick={() => scrollToSection('features')} className="text-slate-700 font-medium hover:text-blue-600 transition duration-300 relative group">
              Features
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-600 to-teal-500 group-hover:w-full transition-all duration-300" />
            </button>
            <button onClick={() => scrollToSection('how-it-works')} className="text-slate-700 font-medium hover:text-blue-600 transition duration-300 relative group">
              How It Works
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-600 to-teal-500 group-hover:w-full transition-all duration-300" />
            </button>
            <button onClick={() => scrollToSection('value')} className="text-slate-700 font-medium hover:text-blue-600 transition duration-300 relative group">
              Business Value
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-600 to-teal-500 group-hover:w-full transition-all duration-300" />
            </button>
            <button onClick={navigateToLogin} className="bg-gradient-to-r from-blue-600 to-teal-500 text-white px-6 py-2.5 rounded-lg font-semibold hover:shadow-lg hover:shadow-blue-600/30 transition transform hover:-translate-y-0.5 duration-300">
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-32 px-6 relative z-10 bg-gradient-to-br from-blue-50 to-teal-50">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-6xl md:text-7xl font-bold mb-8 leading-tight animate-slide-in-up text-slate-900" style={{ animationDelay: '0.2s' }}>
            AI-Powered Insurance Claim <span className="bg-gradient-to-r from-blue-600 via-blue-500 to-teal-500 bg-clip-text text-transparent">Verification System</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-slate-700 mb-12 max-w-2xl mx-auto leading-relaxed animate-slide-in-up" style={{ animationDelay: '0.3s' }}>
            AI-powered claim verification that catches errors early, boosts approvals, and speeds up your revenue cycle.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-in-up" style={{ animationDelay: '0.4s' }}>
            <button onClick={navigateToLogin} className="group relative px-8 py-4 rounded-lg font-semibold text-lg overflow-hidden bg-gradient-to-r from-blue-600 to-teal-500 text-white hover:shadow-xl hover:shadow-blue-600/40 transition transform hover:-translate-y-1 duration-300">
              <span className="relative z-10 flex items-center justify-center gap-2">
                Try Demo <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition" />
              </span>
            </button>
            <button onClick={() => scrollToSection('how-it-works')} className="px-8 py-4 rounded-lg font-semibold text-lg border-2 border-blue-600 text-blue-600 hover:bg-blue-50 transition transform hover:-translate-y-1 duration-300">
              See How It Works
            </button>
          </div>

          {/* Animated metrics */}
          <div className="mt-16 grid md:grid-cols-3 gap-8 max-w-2xl mx-auto">
            {[
              { num: '99.8%', label: 'Accuracy Rate' },
              { num: '60%', label: 'Faster Processing' },
              { num: '5–15%', label: 'Less Rejections' }
            ].map((metric, i) => (
              <div key={i} className="animate-fade-in-scale" style={{ animationDelay: `${0.5 + i * 0.1}s` }}>
                <div className="text-3xl font-bold text-blue-600">{metric.num}</div>
                <div className="text-slate-600 text-sm mt-2">{metric.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-20 px-6 relative z-10 bg-slate-50" id="problems">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 animate-slide-in-up text-slate-900">The Problem: Preventable Claim Rejections</h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto animate-slide-in-up" style={{ animationDelay: '0.1s' }}>
              Healthcare organizations lose millions annually due to claim rejections caused by documentation gaps and policy mismatches.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { stat: '5–15%', title: 'Claims Rejected', desc: 'A significant percentage of insurance claims face rejection due to missing documentation.' },
              { stat: '$$$', title: 'Revenue Delays', desc: 'Rejected claims cause cash flow interruptions and revenue cycle delays.' },
              { stat: '😞', title: 'Patient Dissatisfaction', desc: 'Claim rejections lead to unexpected bills and reduced patient trust.' },
              { stat: '🕐', title: 'Manual Review Burden', desc: 'Staff spend hours manually reviewing documents and policies.' }
            ].map((item, i) => {
              const isLeft = i < 2;
              return (
                <div 
                  key={i} 
                  className={`relative group ${problemsInView ? (isLeft ? 'animate-slide-in-left' : 'animate-slide-in-right') : 'opacity-0'} transition-all duration-1000 ease-out`}
                  style={{ 
                    animationDelay: problemsInView ? `${0.15 + (i % 2) * 0.25}s` : '0s',
                    transform: problemsInView ? 'translateX(0)' : (isLeft ? 'translateX(-50px)' : 'translateX(50px)')
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-200/20 to-teal-200/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition duration-300" />
                  <div className="relative bg-white border border-blue-200 p-8 rounded-xl hover:border-blue-400 transition duration-300 transform group-hover:-translate-y-2 shadow-sm hover:shadow-md">
                    <div className="text-4xl font-bold text-blue-600 mb-3">{item.stat}</div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">{item.title}</h3>
                    <p className="text-slate-600 text-sm leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="py-20 px-6 relative z-10 bg-white" id="solution">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="animate-slide-in-left">
              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-slate-900">AI-Powered Pre-Submission Verification</h2>
              <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                ClaimVerify AI analyzes claims in real-time, identifying and fixing issues before submission. Your documentation gaps and policy mismatches are caught automatically.
              </p>

              <div className="space-y-5">
                {[
                  { title: 'Detect Issues Early', desc: 'AI scans for missing documents, coding errors, and policy violations instantly.' },
                  { title: 'Reduce Rejections', desc: 'Fix problems before submission to maximize approval rates and first-pass success.' },
                  { title: 'Accelerate Revenue', desc: 'Fewer rejections mean faster claims processing and improved cash flow.' },
                  { title: 'Save Staff Time', desc: 'Automate manual reviews and free up billing teams for higher-value work.' }
                ].map((feature, i) => (
                  <div key={i} className="flex gap-4 animate-slide-in-up" style={{ animationDelay: `${0.2 + i * 0.1}s` }}>
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-600 to-teal-500 text-white flex items-center justify-center flex-shrink-0 mt-1 shadow-md">
                      <Check size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 mb-1">{feature.title}</h4>
                      <p className="text-slate-600 text-sm">{feature.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative animate-slide-in-right">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-200/30 to-teal-200/30 rounded-2xl blur-2xl" />
              <div className="relative bg-gradient-to-br from-blue-50 to-teal-50 border border-blue-200 rounded-2xl p-12 flex items-center justify-center min-h-[400px] overflow-hidden shadow-lg">
                <div className="relative z-10 text-center">
                  <div className="text-6xl mb-4 animate-float">🤖</div>
                  <h3 className="text-2xl font-bold text-blue-600 mb-3">Smart Claim Analysis</h3>
                  <p className="text-slate-700">Real-time AI verification that catches issues before they become rejections</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-6 relative z-10 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 animate-slide-in-up text-slate-900">How It Works</h2>
            <p className="text-xl text-slate-600 animate-slide-in-up" style={{ animationDelay: '0.1s' }}>Four simple steps to error-free claims</p>
          </div>

          {/* Sequential Reveal Container */}
          <div className="relative max-w-5xl mx-auto">
            <style>{`
              @keyframes revealBox {
                0% {
                  opacity: 0;
                  transform: scale(0.8) translateY(20px);
                }
                100% {
                  opacity: 1;
                  transform: scale(1) translateY(0);
                }
              }

              .how-it-works-trigger .step-box-1 {
                animation: revealBox 0.8s ease-out 0.2s both;
              }
              .how-it-works-trigger .step-box-2 {
                animation: revealBox 0.8s ease-out 1.2s both;
              }
              .how-it-works-trigger .step-box-3 {
                animation: revealBox 0.8s ease-out 2.2s both;
              }
              .how-it-works-trigger .step-box-4 {
                animation: revealBox 0.8s ease-out 3.2s both;
              }

              @keyframes connectingLine {
                0% {
                  width: 0;
                }
                100% {
                  width: 25%;
                }
              }

              .connector {
                position: absolute;
                height: 3px;
                background: linear-gradient(to right, #2563eb, #14b8a6);
                top: 50%;
                transform: translateY(-50%);
                width: 0;
              }

              .line-1 {
                left: 12.5%;
                width: 0;
              }
              .line-2 {
                left: 37.5%;
                width: 0;
              }
              .line-3 {
                left: 62.5%;
                width: 0;
              }

              .how-it-works-trigger .line-1 {
                animation: connectingLine 0.6s ease-out 0.8s forwards !important;
                width: 25%;
              }
              .how-it-works-trigger .line-2 {
                animation: connectingLine 0.6s ease-out 1.8s forwards !important;
                width: 25%;
              }
              .how-it-works-trigger .line-3 {
                animation: connectingLine 0.6s ease-out 2.8s forwards !important;
                width: 20%;
              }
            `}</style>

            {/* Container that triggers animation on scroll */}
            <div className="relative" id="how-works-container">
              {/* Connectors (lines between boxes) - Only 3 lines for 4 boxes */}
              <div className="hidden md:block">
                <div className="connector line-1"></div>
                <div className="connector line-2"></div>
                <div className="connector line-3"></div>
              </div>

              {/* Steps Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative z-10">
                {[
                  { num: '1', title: 'Upload', desc: 'Submit claim documents and patient information to the platform.' },
                  { num: '2', title: 'AI Check', desc: 'AI instantly analyzes documents, policies, and coverage for errors.' },
                  { num: '3', title: 'Fix', desc: 'Get actionable insights and auto-corrected recommendations.' },
                  { num: '4', title: 'Submit', desc: 'Send verified, error-free claims with confidence.' }
                ].map((step, i) => (
                  <div key={i} className={`step-box-${i + 1}`}>
                    <div className="relative bg-white border border-blue-200 p-8 rounded-xl hover:border-blue-400 transition duration-300 text-center group hover:shadow-md shadow-sm h-full">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-600 to-teal-500 text-white flex items-center justify-center font-bold text-3xl mx-auto mb-4 group-hover:scale-110 transition shadow-md">
                        {step.num}
                      </div>
                      <h3 className="text-lg font-bold mb-3 text-slate-900">{step.title}</h3>
                      <p className="text-slate-600 text-sm leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 relative z-10 bg-white">
        <div className="px-6 max-w-6xl mx-auto mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 animate-slide-in-up text-slate-900 text-center">Powerful Features</h2>
          <p className="text-xl text-slate-600 animate-slide-in-up text-center" style={{ animationDelay: '0.1s' }}>Enterprise-grade AI capabilities designed for healthcare</p>
        </div>

        {/* Full Width Infinite Carousel */}
        <div className="w-full overflow-hidden bg-white">
          <style>{`
            @keyframes infiniteScroll {
              0% { transform: translateX(0); }
              100% { transform: translateX(-50%); }
            }
            .carousel-track {
              display: flex;
              width: 200%;
              animation: infiniteScroll 60s linear infinite;
              gap: 24px;
              padding: 24px;
            }
            .carousel-track:hover {
              animation-play-state: paused;
            }
          `}</style>
          
          <div className="carousel-track">
            {/* First set */}
            {[
              { icon: FileText, title: 'AI Document Parsing', desc: 'Automatically extract and verify data from medical records, lab reports, and authorization forms.' },
              { icon: Check, title: 'Policy-Aware Verification', desc: 'Cross-reference claims against insurance policies to ensure coverage alignment and eligibility.' },
              { icon: Zap, title: 'Risk Scoring', desc: 'Get instant risk ratings for each claim, prioritizing high-risk submissions for review.' },
              { icon: Lock, title: 'Privacy-First Data Handling', desc: 'HIPAA-compliant, encrypted processing with no data retention beyond verification.' },
              { icon: Lightbulb, title: 'Policy Recommendation AI', desc: 'Get smart suggestions for code corrections and document completeness improvements.' },
              { icon: RotateCcw, title: 'Re-Submission Validation', desc: 'Support resubmission workflows with confidence that corrections address rejection reasons.' }
            ].map((feature, i) => {
              const Icon = feature.icon;
              return (
                <div key={`first-${i}`} className="flex-shrink-0 w-96">
                  <div className="relative group h-full">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-200/30 to-teal-200/30 rounded-xl blur opacity-0 group-hover:opacity-100 transition duration-300" />
                    <div className="relative bg-white border border-blue-200 p-8 rounded-xl hover:border-blue-400 transition duration-300 transform group-hover:-translate-y-2 shadow-sm hover:shadow-md h-full flex flex-col">
                      <div className="w-14 h-14 rounded-lg bg-gradient-to-r from-blue-600 to-teal-500 text-white flex items-center justify-center mb-4 group-hover:scale-110 transition shadow-md">
                        <Icon size={28} />
                      </div>
                      <h3 className="text-lg font-bold mb-3 text-slate-900">{feature.title}</h3>
                      <p className="text-slate-600 text-sm leading-relaxed flex-grow">{feature.desc}</p>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Duplicate set */}
            {[
              { icon: FileText, title: 'AI Document Parsing', desc: 'Automatically extract and verify data from medical records, lab reports, and authorization forms.' },
              { icon: Check, title: 'Policy-Aware Verification', desc: 'Cross-reference claims against insurance policies to ensure coverage alignment and eligibility.' },
              { icon: Zap, title: 'Risk Scoring', desc: 'Get instant risk ratings for each claim, prioritizing high-risk submissions for review.' },
              { icon: Lock, title: 'Privacy-First Data Handling', desc: 'HIPAA-compliant, encrypted processing with no data retention beyond verification.' },
              { icon: Lightbulb, title: 'Policy Recommendation AI', desc: 'Get smart suggestions for code corrections and document completeness improvements.' },
              { icon: RotateCcw, title: 'Re-Submission Validation', desc: 'Support resubmission workflows with confidence that corrections address rejection reasons.' }
            ].map((feature, i) => {
              const Icon = feature.icon;
              return (
                <div key={`second-${i}`} className="flex-shrink-0 w-96">
                  <div className="relative group h-full">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-200/30 to-teal-200/30 rounded-xl blur opacity-0 group-hover:opacity-100 transition duration-300" />
                    <div className="relative bg-white border border-blue-200 p-8 rounded-xl hover:border-blue-400 transition duration-300 transform group-hover:-translate-y-2 shadow-sm hover:shadow-md h-full flex flex-col">
                      <div className="w-14 h-14 rounded-lg bg-gradient-to-r from-blue-600 to-teal-500 text-white flex items-center justify-center mb-4 group-hover:scale-110 transition shadow-md">
                        <Icon size={28} />
                      </div>
                      <h3 className="text-lg font-bold mb-3 text-slate-900">{feature.title}</h3>
                      <p className="text-slate-600 text-sm leading-relaxed flex-grow">{feature.desc}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Business Value Section */}
      <section id="value" className="py-20 px-6 relative z-10 bg-blue-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 animate-slide-in-up text-slate-900">Business Value</h2>
            <p className="text-xl text-slate-600 animate-slide-in-up" style={{ animationDelay: '0.1s' }}>Measurable impact across your organization</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { emoji: '🏥', title: 'For Hospitals', desc: 'Increase approval rates and reduce manual billing work. Reclaim staff hours previously lost to claim corrections and get faster reimbursement.' },
              { emoji: '🛡️', title: 'For Insurers', desc: 'Streamline claim processing with pre-verified submissions. Reduce operational costs, catch fraud patterns, and improve settlement speed.' },
              { emoji: '👤', title: 'For Patients', desc: 'Fewer surprise bills and billing confusion. Get faster claim resolution and greater transparency into coverage and reimbursement.' }
            ].map((value, i) => (
              <div key={i} className="relative group animate-fade-in-scale" style={{ animationDelay: `${0.2 + i * 0.1}s` }}>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-200/30 to-teal-200/30 rounded-xl blur opacity-0 group-hover:opacity-100 transition duration-300" />
                <div className="relative bg-white border border-blue-200 p-8 rounded-xl hover:border-blue-400 transition duration-300 text-center transform group-hover:-translate-y-2 shadow-sm hover:shadow-md">
                  <div className="text-5xl mb-4 group-hover:animate-float">{value.emoji}</div>
                  <h3 className="text-xl font-bold mb-3 text-slate-900">{value.title}</h3>
                  <p className="text-slate-600 leading-relaxed">{value.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-24 px-6 relative z-10 bg-gradient-to-r from-blue-600 to-teal-500">
        <div className="max-w-3xl mx-auto text-center text-white">
          <h2 className="text-4xl md:text-6xl font-bold mb-6 animate-slide-in-up">Stop Leaving Revenue on the Table</h2>
          <p className="text-xl text-blue-100 mb-12 animate-slide-in-up" style={{ animationDelay: '0.1s' }}>
            Start verifying claims with AI today. Reduce rejections, accelerate revenue, and improve patient satisfaction.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-gray-400 py-16 px-6 relative z-10 border-t border-blue-100">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            {[
              {
                title: 'Product',
                links: ['Features', 'Pricing', 'Security', 'Documentation']
              },
              {
                title: 'Company',
                links: ['About', 'Blog', 'Careers', 'Contact']
              },
              {
                title: 'Legal',
                links: ['Privacy Policy', 'Terms of Service', 'HIPAA', 'Compliance']
              },
              {
                title: 'Connect',
                links: ['Twitter', 'LinkedIn', 'GitHub', 'Support']
              }
            ].map((section, i) => (
              <div key={i}>
                <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-4">{section.title}</h4>
                <ul className="space-y-2">
                  {section.links.map((link, j) => (
                    <li key={j}>
                      <a href="#" className="hover:text-blue-400 transition duration-300">
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="border-t border-slate-700 pt-8 text-center text-sm">
            <p>&copy; 2024 ClaimVerify AI. All rights reserved. Healthcare claim verification powered by AI.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}