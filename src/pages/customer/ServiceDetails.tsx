import React, { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Star, Clock, Check, X, ShieldCheck, HelpCircle, ChevronDown, Calendar } from "lucide-react";
import { useServices } from "../../contexts/ServicesContext";
import { ALL_170_SERVICES } from "../../data/seedServices";
import { generateServiceDetails } from "../../data/serviceDetailsGenerator";

function ServiceHeroImage({ src, alt }: { src: string; alt: string }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fallbackImage = "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80";

  return (
    <div className="relative w-full aspect-square sm:aspect-[4/3] md:aspect-[16/9] md:w-1/2 bg-zinc-150 dark:bg-zinc-800 shrink-0 overflow-hidden rounded-t-3xl md:rounded-l-3xl md:rounded-tr-none">
      {loading && (
        <div className="absolute inset-0 animate-pulse bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
        </div>
      )}
      
      <img
        src={error ? fallbackImage : src || fallbackImage}
        alt={alt}
        className={`w-full h-full object-cover transition-opacity duration-300 ${loading ? "opacity-0" : "opacity-100"}`}
        onLoad={() => setLoading(false)}
        onError={() => {
          setError(true);
          setLoading(false);
        }}
        loading="lazy"
      />
      
      <div className="absolute top-4 left-4 bg-emerald-500 text-white font-extrabold text-[9px] px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm z-10">
        Available Today
      </div>
    </div>
  );
}

export default function ServiceDetails() {
  const { serviceId } = useParams<{ serviceId: string }>();
  const navigate = useNavigate();
  const { docs } = useServices();

  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [isBooking, setIsBooking] = useState(false);
  const [isHeroHovered, setIsHeroHovered] = useState(false);
  const [isStickyHovered, setIsStickyHovered] = useState(false);

  // Find the service definition
  const service = useMemo(() => {
    if (!serviceId) return null;
    const activeDocs = docs.length > 0 ? docs : ALL_170_SERVICES;
    return activeDocs.find((d) => d.id === serviceId || d.slug === serviceId) || null;
  }, [docs, serviceId]);

  // Generate detailed content
  const details = useMemo(() => {
    if (!service) return null;
    return generateServiceDetails(service);
  }, [service]);

  if (!service || !details) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-brand-500 border-t-transparent" />
        <p className="text-xs text-ink-soft">Service details not found. Redirecting to home...</p>
        <button onClick={() => navigate("/customer/home")} className="text-xs text-brand-500 underline">
          Go back home
        </button>
      </div>
    );
  }

  const toggleFaq = (index: number) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  const handleBookNow = () => {
    setIsBooking(true);
    setTimeout(() => {
      navigate("/customer/new-request", { state: { service } });
      setIsBooking(false);
    }, 850);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 pb-24 relative">
      {/* Back Header navigation */}
      <div className="max-w-4xl mx-auto px-4 pt-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-ink-soft hover:text-ink text-xs font-bold bg-white dark:bg-zinc-900 border border-black/5 dark:border-white/5 px-3.5 py-2 rounded-2xl shadow-sm transition-all"
        >
          <ArrowLeft size={14} />
          <span>Back</span>
        </button>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Hero Section */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl overflow-hidden border border-black/5 dark:border-white/5 shadow-md flex flex-col md:flex-row">
          <ServiceHeroImage
            src={service.imageUrl || service.image || ""}
            alt={service.name}
          />

          <div className="p-6 md:p-8 flex flex-col justify-between flex-1 space-y-4">
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-brand-500 bg-brand-500/10 dark:bg-brand-500/20 px-2.5 py-1 rounded-full uppercase tracking-wider">
                {service.category}
              </span>
              <h1 className="text-2xl md:text-3xl font-display font-black text-ink dark:text-zinc-100 leading-tight">
                {service.name}
              </h1>
              <p className="text-xs text-ink-soft dark:text-zinc-400 font-medium">
                {details.tagline}
              </p>
            </div>

            <div className="flex flex-wrap gap-4 py-2 border-y border-black/5 dark:border-white/5">
              <div className="flex items-center gap-1.5">
                <div className="flex items-center gap-0.5 text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-lg text-[10px] font-bold">
                  <Star size={11} className="fill-amber-500" />
                  {service.rating.toFixed(1)}
                </div>
                <span className="text-[11px] text-ink-muted">Rating</span>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold text-ink dark:text-zinc-300 bg-gray-100 dark:bg-zinc-800 px-2 py-0.5 rounded-lg">
                  {service.totalBookings}+
                </span>
                <span className="text-[11px] text-ink-muted">Jobs Completed</span>
              </div>

              <div className="flex items-center gap-1.5">
                <Clock size={13} className="text-brand-500" />
                <span className="text-[11px] font-semibold text-ink dark:text-zinc-300">{service.estimatedTime || "45 mins"}</span>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-ink-muted uppercase">Starting Price</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-ink dark:text-zinc-100">₹{service.startingPrice}</span>
                <span className="text-xs text-ink-soft">({service.priceUnit || "per visit"})</span>
              </div>
            </div>

            <button
              onClick={handleBookNow}
              onMouseEnter={() => setIsHeroHovered(true)}
              onMouseLeave={() => setIsHeroHovered(false)}
              disabled={isBooking}
              className="w-full sm:w-[220px] h-[52px] sm:h-[56px] flex items-center justify-center rounded-[16px] text-white font-bold text-base sm:text-[18px] transition-all duration-200 cursor-pointer hover:scale-[1.02] active:scale-[0.98] disabled:bg-zinc-200 disabled:text-zinc-400 disabled:shadow-none hover:brightness-105 self-start mt-2"
              style={{
                background: isBooking ? "#e4e4e7" : "linear-gradient(to right, #C2185B, #E91E63)",
                boxShadow: isBooking 
                  ? "none" 
                  : isHeroHovered 
                    ? "0 18px 40px rgba(233, 30, 99, 0.35)" 
                    : "0 12px 30px rgba(233, 30, 99, 0.25)"
              }}
            >
              {isBooking ? (
                <>
                  <div className="w-5 h-5 rounded-full border-2 border-zinc-400 border-t-transparent animate-spin mr-2" />
                  <span className="text-zinc-500">Booking...</span>
                </>
              ) : (
                <>
                  <Calendar size={18} className="mr-2 shrink-0" />
                  <span>Book Now</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* About & Inclusions Exclusions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Details */}
          <div className="md:col-span-2 space-y-6">
            {/* About this Service */}
            <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-black/5 dark:border-white/5 shadow-sm space-y-4">
              <h2 className="text-base font-display font-extrabold text-ink dark:text-zinc-100">About this Service</h2>
              <p className="text-xs text-ink-soft dark:text-zinc-400 leading-relaxed">
                {details.description}
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                {details.aboutSections.map((sec, idx) => (
                  <div key={idx} className="space-y-1">
                    <h3 className="text-xs font-bold text-ink dark:text-zinc-300">{sec.title}</h3>
                    <p className="text-[11px] text-ink-soft dark:text-zinc-400 leading-relaxed">{sec.content}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Checklist: What's Included & Not Included */}
            <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-black/5 dark:border-white/5 shadow-sm space-y-5">
              <h2 className="text-base font-display font-extrabold text-ink dark:text-zinc-100">Service Coverage Checklist</h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Inclusions */}
                <div className="space-y-3">
                  <h3 className="text-xs font-extrabold text-emerald-650 dark:text-emerald-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Check size={14} className="stroke-[3]" />
                    <span>What's Included</span>
                  </h3>
                  <ul className="space-y-2.5">
                    {details.inclusions.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-ink dark:text-zinc-300">
                        <Check size={12} className="text-emerald-500 shrink-0 mt-0.5 stroke-[2.5]" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Exclusions */}
                <div className="space-y-3">
                  <h3 className="text-xs font-extrabold text-rose-650 dark:text-rose-500 uppercase tracking-wider flex items-center gap-1.5">
                    <X size={14} className="stroke-[3]" />
                    <span>What's Not Included</span>
                  </h3>
                  <ul className="space-y-2.5">
                    {details.exclusions.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-ink-soft dark:text-zinc-400">
                        <X size={12} className="text-rose-500 shrink-0 mt-0.5 stroke-[2.5]" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* How It Works */}
            <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-black/5 dark:border-white/5 shadow-sm space-y-5">
              <h2 className="text-base font-display font-extrabold text-ink dark:text-zinc-100">How It Works</h2>
              <div className="relative border-l-2 border-brand-500/20 dark:border-brand-500/10 pl-6 ml-3.5 space-y-6">
                {details.howItWorksSteps.map((step, idx) => (
                  <div key={idx} className="relative">
                    {/* Circle Indicator */}
                    <div className="absolute -left-[35px] top-0 w-6 h-6 rounded-full bg-brand-500 text-white font-extrabold text-xs flex items-center justify-center shadow-md">
                      {idx + 1}
                    </div>
                    <div className="space-y-0.5">
                      <h3 className="text-xs font-bold text-ink dark:text-zinc-200">{step.title}</h3>
                      <p className="text-[11px] text-ink-soft dark:text-zinc-400">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* FAQs Accordion */}
            <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-black/5 dark:border-white/5 shadow-sm space-y-4">
              <h2 className="text-base font-display font-extrabold text-ink dark:text-zinc-100 flex items-center gap-2">
                <HelpCircle size={18} className="text-brand-500" />
                <span>Frequently Asked Questions</span>
              </h2>
              <div className="divide-y divide-black/5 dark:divide-white/5">
                {details.faqs.map((faq, idx) => {
                  const isOpen = expandedFaq === idx;
                  return (
                    <div key={idx} className="py-3 first:pt-0 last:pb-0">
                      <button
                        onClick={() => toggleFaq(idx)}
                        className="w-full flex items-center justify-between gap-4 text-left focus:outline-none"
                      >
                        <span className="text-xs font-bold text-ink dark:text-zinc-200 hover:text-brand-500 transition-colors">
                          {faq.q}
                        </span>
                        <ChevronDown
                          size={15}
                          className={`text-ink-muted transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                        />
                      </button>
                      {isOpen && (
                        <p className="text-[11px] text-ink-soft dark:text-zinc-400 mt-2 leading-relaxed bg-gray-50 dark:bg-zinc-800/40 p-3 rounded-xl border border-black/[0.03] dark:border-white/[0.03]">
                          {faq.a}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Pricing Summary */}
            <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-black/5 dark:border-white/5 shadow-sm space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-ink-muted">Pricing Overview ({service.priceUnit || "per visit"})</h2>
              
              <div className="grid grid-cols-3 gap-3 p-3 bg-gray-50 dark:bg-zinc-800/40 rounded-2xl border border-black/[0.03] dark:border-white/[0.03]">
                <div className="text-center">
                  <span className="text-[9px] font-bold text-ink-muted uppercase">Starting From</span>
                  <div className="text-xs font-black text-brand-500 mt-0.5">₹{service.startingPrice}</div>
                </div>
                <div className="text-center border-x border-black/5 dark:border-white/5">
                  <span className="text-[9px] font-bold text-ink-muted uppercase">Average Cost</span>
                  <div className="text-xs font-black text-ink dark:text-zinc-200 mt-0.5">₹{service.averagePrice || Math.round(service.startingPrice * 1.35)}</div>
                </div>
                <div className="text-center">
                  <span className="text-[9px] font-bold text-ink-muted uppercase">Max Estimated</span>
                  <div className="text-xs font-black text-ink dark:text-zinc-200 mt-0.5">₹{service.maxPrice || Math.round(service.startingPrice * 2.1)}</div>
                </div>
              </div>

              <div className="space-y-2.5 pt-2">
                <div className="flex justify-between text-xs">
                  <span className="text-ink-soft">Inspection / Visit Fee</span>
                  <span className="font-bold text-ink dark:text-zinc-200">
                    {service.inspectionFee && service.inspectionFee > 0 ? `₹${service.inspectionFee}` : "FREE"}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-ink-soft">GST Rate</span>
                  <span className="font-bold text-ink dark:text-zinc-200">{details.pricingDetails.gstPercent}%</span>
                </div>
                <div className="pt-2 border-t border-black/5 dark:border-white/5 flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-ink-muted uppercase">Spare Parts & Materials</span>
                  <span className="text-[10px] text-ink-soft leading-tight">{service.pricingNote || details.pricingDetails.partsChargeInfo}</span>
                </div>
                <div className="pt-2 border-t border-black/5 dark:border-white/5 flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-ink-muted uppercase">Cancellation Policy</span>
                  <span className="text-[10px] text-rose-500 font-medium leading-tight">{details.pricingDetails.cancellationPolicy}</span>
                </div>
              </div>
            </div>

            {/* Why Choose PickPal */}
            <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-black/5 dark:border-white/5 shadow-sm space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-ink-muted">Why Choose PickPal?</h2>
              <div className="space-y-3.5">
                {details.whyChooseUs.slice(0, 4).map((item, idx) => (
                  <div key={idx} className="flex gap-2.5 items-start">
                    <ShieldCheck size={16} className="text-brand-500 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <h3 className="text-xs font-bold text-ink dark:text-zinc-300 leading-tight">{item.title}</h3>
                      <p className="text-[10px] text-ink-soft dark:text-zinc-500 leading-normal">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Customer Reviews */}
            <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-black/5 dark:border-white/5 shadow-sm space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-ink-muted">Recent Reviews</h2>
              <div className="space-y-4">
                {details.reviews.map((rev, idx) => (
                  <div key={idx} className="space-y-1.5 pb-3 border-b border-black/5 dark:border-b-white/5 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <img src={rev.avatar} alt={rev.name} className="w-6 h-6 rounded-full object-cover" />
                        <span className="text-[11px] font-bold text-ink dark:text-zinc-200">{rev.name}</span>
                      </div>
                      <div className="flex items-center gap-0.5 text-amber-500 text-[10px] font-bold">
                        <Star size={10} className="fill-amber-500 text-amber-500" />
                        {rev.rating.toFixed(1)}
                      </div>
                    </div>
                    <p className="text-[10px] text-ink-soft dark:text-zinc-400 leading-normal italic">
                      "{rev.comment}"
                    </p>
                    <div className="text-[9px] text-ink-muted">{rev.date}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Book Now Bottom Section */}
      <div className="sticky bottom-[58px] md:bottom-6 left-0 right-0 z-40 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border border-black/5 dark:border-white/5 py-4 px-6 md:px-8 shadow-xl md:shadow-lg md:rounded-[18px] max-w-[1400px] mx-auto md:h-[88px] flex flex-col sm:flex-row items-center justify-between gap-4 mt-8">
        <div className="flex flex-col w-full sm:w-auto">
          <span className="text-[10px] font-bold text-brand-500 uppercase tracking-wider">Starting Price ({service.priceUnit || "per visit"})</span>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-2xl font-black text-ink dark:text-zinc-100">₹{service.startingPrice}</span>
            <span className="text-xs text-ink-soft">Average ₹{service.averagePrice} • Max ₹{service.maxPrice}</span>
          </div>
        </div>
        <button
          onClick={handleBookNow}
          onMouseEnter={() => setIsStickyHovered(true)}
          onMouseLeave={() => setIsStickyHovered(false)}
          disabled={isBooking}
          className="w-full sm:w-[220px] h-[52px] sm:h-[56px] flex items-center justify-center rounded-[16px] text-white font-bold text-base sm:text-[18px] transition-all duration-200 cursor-pointer hover:scale-[1.02] active:scale-[0.98] disabled:bg-zinc-200 disabled:text-zinc-400 disabled:shadow-none hover:brightness-105"
          style={{
            background: isBooking ? "#e4e4e7" : "linear-gradient(to right, #C2185B, #E91E63)",
            boxShadow: isBooking 
              ? "none" 
              : isStickyHovered 
                ? "0 18px 40px rgba(233, 30, 99, 0.35)" 
                : "0 12px 30px rgba(233, 30, 99, 0.25)"
          }}
        >
          {isBooking ? (
            <>
              <div className="w-5 h-5 rounded-full border-2 border-zinc-400 border-t-transparent animate-spin mr-2" />
              <span className="text-zinc-500">Booking...</span>
            </>
          ) : (
            <>
              <Calendar size={18} className="mr-2 shrink-0" />
              <span>Book Now</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
