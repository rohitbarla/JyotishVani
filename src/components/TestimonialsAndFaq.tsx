import React, { useState, useEffect } from "react";
import { Star, ChevronDown, ChevronUp, Quote, CheckCircle2, ShieldCheck, Heart } from "lucide-react";
import { TESTIMONIALS, FAQS } from "../data/astrologyData";
import { StoredTestimonial, StoredFaq } from "../types";
import { safeFetchJson } from "../utils/apiClient";

export const TestimonialsAndFaq: React.FC = () => {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [testimonials, setTestimonials] = useState<any[]>(TESTIMONIALS);
  const [faqs, setFaqs] = useState<any[]>(FAQS);

  useEffect(() => {
    let isMounted = true;

    safeFetchJson<{ success?: boolean; testimonials?: any[] }>("/api/testimonials").then((data) => {
      if (isMounted && data?.success && Array.isArray(data.testimonials) && data.testimonials.length > 0) {
        setTestimonials(data.testimonials);
      }
    });

    safeFetchJson<{ success?: boolean; faqs?: any[] }>("/api/faqs").then((data) => {
      if (isMounted && data?.success && Array.isArray(data.faqs) && data.faqs.length > 0) {
        setFaqs(data.faqs);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  return (
    <section className="py-16 sm:py-20 bg-[#FAF9F6] relative border-b border-[#E8E6DF]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Testimonials Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F0EDDF] border border-[#E8E6DF] text-[#8B9D83] text-xs font-bold uppercase tracking-[0.2em] mb-3">
            <Heart className="w-3.5 h-3.5 text-[#CB997E]" />
            <span>Devotee Experiences</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#3D3D3D] tracking-tight">
            Trusted by Over 250,000+ Daily Seekers
          </h2>
          <p className="mt-2 text-sm text-[#7A7A7A] font-sans">
            Hear from subscribers who begin every morning peaceful and grounded in authentic planetary wisdom.
          </p>
        </div>

        {/* Testimonials Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
          {testimonials.map((item, idx) => (
            <div
              key={item.id || idx}
              className="rounded-3xl bg-white border border-[#E8E6DF] p-6 sm:p-7 flex flex-col justify-between shadow-sm relative"
            >
              <Quote className="w-8 h-8 text-[#E8E6DF] absolute top-4 right-4" />

              <div>
                <div className="flex items-center gap-1 text-[#CB997E] mb-3.5">
                  {[...Array(item.rating || 5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-[#CB997E]" />
                  ))}
                </div>

                <p className="text-xs sm:text-sm text-[#4A4A4A] leading-relaxed italic font-serif">
                  "{item.text}"
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-[#E8E6DF] flex items-center justify-between text-xs font-sans">
                <div>
                  <h4 className="font-serif font-bold text-[#3D3D3D]">{item.name}</h4>
                  <p className="text-[11px] text-[#7A7A7A]">{item.city} &bull; Sign: {item.sign}</p>
                </div>
                <span className="text-[10px] bg-[#F0EDDF] text-[#5C6B5A] px-2.5 py-0.5 rounded-full border border-[#8B9D83]/30 font-semibold">
                  {item.plan}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* FAQs Header */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#3D3D3D] tracking-tight">
            Frequently Asked Questions
          </h3>
          <p className="mt-2 text-xs sm:text-sm text-[#7A7A7A] font-sans">
            Everything you need to know about our daily horoscope delivery, transparent pricing, and 1-on-1 consultations.
          </p>
        </div>

        {/* FAQ Accordion */}
        <div className="max-w-3xl mx-auto space-y-3 font-sans">
          {faqs.map((faq, index) => {
            const isOpen = openFaqIndex === index;
            return (
              <div
                key={faq.id || index}
                className="rounded-2xl bg-white border border-[#E8E6DF] overflow-hidden transition-colors shadow-xs"
              >
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 text-sm font-semibold text-[#3D3D3D] hover:text-[#CB997E] cursor-pointer"
                >
                  <span className="font-serif text-sm sm:text-base font-bold">{faq.q}</span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-[#8B9D83] shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-[#AFAFAF] shrink-0" />
                  )}
                </button>

                {isOpen && (
                  <div className="px-5 pb-4 text-xs sm:text-sm text-[#7A7A7A] leading-relaxed border-t border-[#E8E6DF] pt-3 font-sans">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
