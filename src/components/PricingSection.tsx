import React, { useState, useEffect, useMemo } from "react";
import { Check, Sparkles, ShieldCheck, HeartHandshake, Zap, HelpCircle } from "lucide-react";
import { SUBSCRIPTION_PLANS } from "../data/astrologyData";
import { SubscriptionPlan, SubscriptionPlanId, DynamicSettings } from "../types";
import { safeFetchJson } from "../utils/apiClient";

interface PricingSectionProps {
  onSelectPlan: (planId: SubscriptionPlanId) => void;
  activePlanId?: SubscriptionPlanId;
  dynamicSettings?: DynamicSettings | null;
}

export const PricingSection: React.FC<PricingSectionProps> = ({
  onSelectPlan,
  activePlanId,
  dynamicSettings,
}) => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>(SUBSCRIPTION_PLANS);

  useEffect(() => {
    let isMounted = true;
    safeFetchJson<{ success?: boolean; plans?: SubscriptionPlan[] }>(`/api/plans?t=${Date.now()}`).then((data) => {
      if (isMounted && data?.success && Array.isArray(data.plans) && data.plans.length > 0) {
        setPlans(data.plans);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  // Compute effective plans dynamically whenever dynamicSettings or plans update
  const effectivePlans = useMemo(() => {
    const prices = dynamicSettings?.planPrices;
    if (!prices) return plans;
    return plans.map((p) => {
      const idKey = p.id as keyof typeof prices;
      const rawPrice = prices[idKey];
      const newPrice = typeof rawPrice === "number" ? rawPrice : Number(rawPrice);
      if (!isNaN(newPrice) && newPrice !== undefined) {
        return {
          ...p,
          price: newPrice,
          billingText:
            p.id === "trial"
              ? "100% Free • No Payment Upfront"
              : p.id === "monthly"
              ? `Billed at ₹${newPrice} every month`
              : p.id === "three_months"
              ? `Billed at ₹${newPrice} for 3 months (~₹${Math.round(newPrice / 3)}/mo)`
              : p.id === "six_months"
              ? `Billed at ₹${newPrice} for 6 months (~₹${Math.round(newPrice / 6)}/mo)`
              : `Billed at ₹${newPrice.toLocaleString("en-IN")} for 12 months (~₹${Math.round(newPrice / 12)}/mo)`,
          ctaText:
            p.id === "trial"
              ? "Start 3-Day Free Trial"
              : p.id === "monthly"
              ? `Choose Monthly (₹${newPrice})`
              : p.id === "three_months"
              ? `Choose 3 Months (₹${newPrice})`
              : p.id === "six_months"
              ? `Get 6 Months (₹${newPrice})`
              : `Get Yearly Pass (₹${newPrice.toLocaleString("en-IN")})`,
        };
      }
      return p;
    });
  }, [plans, dynamicSettings?.planPrices]);

  return (
    <section id="pricing-section" className="py-16 sm:py-20 bg-[#FAF9F6] relative overflow-hidden border-t border-b border-[#E8E6DF]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F0EDDF] border border-[#E8E6DF] text-[#8B9D83] text-xs font-bold uppercase tracking-[0.2em] mb-3">
            <Sparkles className="w-3.5 h-3.5 text-[#CB997E]" />
            <span>Accessible Vedic Wisdom for Everyone</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-[#3D3D3D] tracking-tight">
            Simple, Transparent Plans
          </h2>
          <p className="mt-4 text-sm sm:text-base text-[#7A7A7A] leading-relaxed font-sans">
            Begin with a <strong>100% Free 3-Day Trial</strong>. Continue with flexible monthly, quarterly, half-yearly, or yearly plans delivered every morning directly to your Email inbox.
          </p>
        </div>

        {/* 5 Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 lg:gap-4 items-stretch">
          {effectivePlans.map((plan) => {
            const isPopular = plan.popular;
            const isYearly = plan.id === "yearly";
            const isFree = plan.isFree;
            const isActive = activePlanId === plan.id;

            return (
              <div
                key={plan.id}
                className={`relative rounded-3xl flex flex-col justify-between transition-all duration-300 ${
                  isPopular
                    ? "bg-[#F0EDDF] border-2 border-[#8B9D83] shadow-md lg:-translate-y-2 z-20"
                    : isYearly
                    ? "bg-white border-2 border-[#CB997E]/70 shadow-sm"
                    : isFree
                    ? "bg-white border-2 border-[#8B9D83]/40 shadow-sm"
                    : "bg-white border border-[#E8E6DF] hover:border-[#CB997E] shadow-xs"
                } p-5 sm:p-6`}
              >
                {/* Popular or Savings Badge */}
                {plan.badge && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap">
                    <span
                      className={`text-[10px] font-bold px-3 py-1 rounded-full shadow-xs uppercase tracking-wider ${
                        isPopular
                          ? "bg-[#8B9D83] text-white"
                          : isFree
                          ? "bg-[#F0EDDF] text-[#8B9D83] border border-[#8B9D83]"
                          : "bg-[#CB997E] text-white"
                      }`}
                    >
                      {plan.badge}
                    </span>
                  </div>
                )}

                {/* Card Header */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-serif text-base font-bold text-[#3D3D3D]">
                      {plan.name}
                    </h3>
                    {plan.savings && (
                      <span className="text-[10px] font-bold text-[#5C6B5A] bg-[#F0EDDF] px-2 py-0.5 rounded-full border border-[#8B9D83]/30">
                        {plan.savings}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-[#7A7A7A] min-h-[32px] font-sans">
                    {plan.durationLabel} duration
                  </p>

                  {/* Price Display */}
                  <div className="my-4 pb-4 border-b border-[#E8E6DF]">
                    <div className="flex items-baseline gap-1.5">
                      {plan.price === 0 ? (
                        <span className="text-3xl font-bold text-[#8B9D83] font-serif">
                          FREE
                        </span>
                      ) : (
                        <>
                          <span className="text-sm font-semibold text-[#7A7A7A]">₹</span>
                          <span className="text-3xl font-bold text-[#3D3D3D] font-serif">
                            {plan.price}
                          </span>
                        </>
                      )}
                      {plan.originalPrice && (
                        <span className="text-xs text-[#AFAFAF] line-through">
                          ₹{plan.originalPrice}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[#7A7A7A] mt-1 font-sans">
                      {plan.billingText}
                    </p>
                  </div>

                  {/* Features List */}
                  <ul className="space-y-2.5 mb-6 text-xs text-[#4A4A4A] font-sans">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 mt-0.5 shrink-0 text-[#8B9D83]" />
                        <span className="leading-snug">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* CTA Button */}
                <div>
                  <button
                    onClick={() => onSelectPlan(plan.id)}
                    className={`w-full py-2.5 px-4 rounded-full text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5 ${
                      isPopular
                        ? "bg-[#8B9D83] hover:bg-[#7A8C73] text-white shadow-sm"
                        : isFree
                        ? "bg-[#8B9D83] hover:bg-[#7A8C73] text-white shadow-sm"
                        : isYearly
                        ? "bg-[#CB997E] hover:bg-[#B8856B] text-white shadow-sm"
                        : "bg-[#F5F5F0] hover:bg-[#E8E6DF] text-[#3D3D3D] border border-[#E8E6DF]"
                    }`}
                  >
                    {isActive ? (
                      <span>Current Active Plan</span>
                    ) : (
                      <span>{plan.ctaText}</span>
                    )}
                  </button>

                  <p className="text-[10px] text-center text-[#AFAFAF] mt-2 italic font-sans">
                    {isFree ? "Zero card required" : "1-click cancel anytime"}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Value Reassurance Footer */}
        <div className="mt-12 rounded-3xl bg-[#F5F5F0] border border-[#E8E6DF] p-6 sm:p-8 grid grid-cols-1 md:grid-cols-3 gap-6 text-center md:text-left">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-[#F0EDDF] text-[#8B9D83] shrink-0 border border-[#E8E6DF]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-serif text-sm font-bold text-[#3D3D3D]">100% Privacy Guarantee</h4>
              <p className="text-xs text-[#7A7A7A] mt-0.5 font-sans">Your email and devotee details are strictly sacred and never shared or spammed.</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-[#F0EDDF] text-[#8B9D83] shrink-0 border border-[#E8E6DF]">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-serif text-sm font-bold text-[#3D3D3D]">Effortless Management</h4>
              <p className="text-xs text-[#7A7A7A] mt-0.5 font-sans">Pause or stop delivery anytime with a simple 1-click link in your daily horoscope email.</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-[#F0EDDF] text-[#CB997E] shrink-0 border border-[#E8E6DF]">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-serif text-sm font-bold text-[#3D3D3D]">Delivered 365 Mornings</h4>
              <p className="text-xs text-[#7A7A7A] mt-0.5 font-sans">Consistent daily planetary transits and timely Rahu Kaal alerts.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
