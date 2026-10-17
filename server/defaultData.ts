export interface StoredHoroscope {
  id: string;
  name: string;
  vedicName: string;
  symbol: string;
  element: "Fire" | "Earth" | "Air" | "Water";
  dates: string;
  rulingPlanet: string;
  gemstone: string;
  luckyColor: string;
  luckyNumber: number;
  favorableTime: string;
  overallRating: number;
  prediction: {
    summary: string;
    love: string;
    career: string;
    finance: string;
    health: string;
    remedy: string;
  };
  lastUpdated?: string;
}

export interface StoredPlan {
  id: "trial" | "monthly" | "three_months" | "six_months" | "yearly";
  name: string;
  price: number;
  originalPrice?: number;
  durationLabel: string;
  billingText: string;
  badge?: string;
  popular?: boolean;
  isFree?: boolean;
  savings?: string;
  features: string[];
  ctaText: string;
}

export interface StoredTestimonial {
  id: string;
  name: string;
  city: string;
  text: string;
  sign: string;
  plan: string;
  rating: number;
  verified?: boolean;
}

export interface StoredFaq {
  id: string;
  q: string;
  a: string;
  category?: "trial" | "pricing" | "delivery" | "consultation" | "general";
}

export const DEFAULT_HOROSCOPES: StoredHoroscope[] = [
  {
    id: "aries",
    name: "Aries",
    vedicName: "Mesha (मेष)",
    symbol: "♈",
    element: "Fire",
    dates: "Mar 21 - Apr 19",
    rulingPlanet: "Mars (Mangal)",
    gemstone: "Red Coral (Moonga)",
    luckyColor: "Crimson & Saffron",
    luckyNumber: 9,
    favorableTime: "08:15 AM - 10:00 AM",
    overallRating: 5,
    prediction: {
      summary: "Mars infuses you with dynamic vitality today. High-impact negotiations and physical vigor lead to significant progress in pending karma.",
      love: "Open communication dissolves misunderstandings. An unexpected heartfelt message warms your evening.",
      career: "Leadership opportunities emerge. Your bold proposals will receive enthusiastic endorsement from senior mentors.",
      finance: "Promising developments in investments. Avoid speculative impulse purchases during Rahu Kaal.",
      health: "High stamina, but ensure adequate hydration. Guard against minor headaches from excessive screen glare.",
      remedy: "Offer water to Surya Dev with a pinch of red kumkum and chant 'Om Kram Kreem Kroum Sah Bhaumaya Namaha'."
    }
  },
  {
    id: "taurus",
    name: "Taurus",
    vedicName: "Vrishabha (वृषभ)",
    symbol: "♉",
    element: "Earth",
    dates: "Apr 20 - May 20",
    rulingPlanet: "Venus (Shukra)",
    gemstone: "Diamond / White Opal",
    luckyColor: "Lotus White & Cream",
    luckyNumber: 6,
    favorableTime: "11:30 AM - 01:15 PM",
    overallRating: 4,
    prediction: {
      summary: "Venus illuminates your domestic and creative sectors. Calm deliberation brings aesthetic delight and financial steadiness.",
      love: "Deep emotional intimacy flourishes. A home-cooked meal or quiet stroll deepens your romantic bond.",
      career: "Artistic and design projects gain recognition. Team members seek your patient counsel.",
      finance: "Steady wealth accumulation. A past loan or dividend may return to your savings account today.",
      health: "Throat and vocal cords require care. Warm herbal tea with honey brings soothing relief.",
      remedy: "Feed cows green fodder or donate milk to the needy on Friday to enhance Venusian blessings."
    }
  },
  {
    id: "gemini",
    name: "Gemini",
    vedicName: "Mithuna (मिथुन)",
    symbol: "♊",
    element: "Air",
    dates: "May 21 - Jun 20",
    rulingPlanet: "Mercury (Budha)",
    gemstone: "Emerald (Panna)",
    luckyColor: "Emerald Green & Mint",
    luckyNumber: 5,
    favorableTime: "02:00 PM - 03:45 PM",
    overallRating: 4,
    prediction: {
      summary: "Mercury sharpens your communicative intellect. Ideal transit for negotiations, writing, publishing, and technology ventures.",
      love: "Lively conversations spark mutual curiosity. Single Geminis might meet someone intellectually stimulating.",
      career: "Networking efforts bear immediate fruit. Pitching ideas today yields remarkable engagement.",
      finance: "Multiple micro-sources of revenue look promising. Double check paperwork before digital signatures.",
      health: "Respiratory system is sensitive. Practice Pranayama to clear mind fog and balance breath.",
      remedy: "Chant 'Om Budhaya Namaha' 21 times and donate green moong dal to a temple or birds."
    }
  },
  {
    id: "cancer",
    name: "Cancer",
    vedicName: "Karka (कर्क)",
    symbol: "♋",
    element: "Water",
    dates: "Jun 21 - Jul 22",
    rulingPlanet: "Moon (Chandra)",
    gemstone: "Natural Pearl (Moti)",
    luckyColor: "Silvery Pearl & Ocean White",
    luckyNumber: 2,
    favorableTime: "07:00 PM - 08:30 PM",
    overallRating: 5,
    prediction: {
      summary: "The Moon enhances your intuitive empathy and familial harmony. Trust your gut instincts regarding personal relationships.",
      love: "Compassion dissolves past grievances. Quality family moments bring immense emotional security.",
      career: "Careful planning protects your workspace from external turbulence. A trusted elder offers wise direction.",
      finance: "Favorable stars for real estate or home improvement. Wealth conservation should be your primary mantra.",
      health: "Emotional balance directly supports digestive wellbeing. Avoid heavy, oily dinners.",
      remedy: "Offer milk mixed with water on a Shiva Lingam on Mondays and wear silver ornaments."
    }
  },
  {
    id: "leo",
    name: "Leo",
    vedicName: "Simha (सिंह)",
    symbol: "♌",
    element: "Fire",
    dates: "Jul 23 - Aug 22",
    rulingPlanet: "Sun (Surya)",
    gemstone: "Ruby (Manik)",
    luckyColor: "Royal Gold & Amber",
    luckyNumber: 1,
    favorableTime: "09:00 AM - 11:00 AM",
    overallRating: 5,
    prediction: {
      summary: "Surya Deva crowns your endeavors with authority and respect. Your charisma inspires peers to rally behind your vision.",
      love: "Generosity and warmth captivate your partner. Plan a celebration or thoughtful surprise.",
      career: "Executive decisions will be received with acclaim. Government or institutional work moves ahead swiftly.",
      finance: "Lucrative avenues open up. Invest in long-term blue-chip assets or ancestral property.",
      health: "Robust vitality and cardiac stamina. Channel your high energy into purposeful physical exercise.",
      remedy: "Recite the Aditya Hridaya Stotra in the morning facing East for unshakeable confidence."
    }
  },
  {
    id: "virgo",
    name: "Virgo",
    vedicName: "Kanya (कन्या)",
    symbol: "♍",
    element: "Earth",
    dates: "Aug 23 - Sep 22",
    rulingPlanet: "Mercury (Budha)",
    gemstone: "Emerald (Panna)",
    luckyColor: "Forest Green & Khaki",
    luckyNumber: 5,
    favorableTime: "03:30 PM - 05:15 PM",
    overallRating: 4,
    prediction: {
      summary: "Meticulous analysis solves a complex operational puzzle. Your attention to detail prevents costly mistakes today.",
      love: "Helpfulness and acts of service express your devotion more loudly than flamboyant words.",
      career: "Financial auditing, programming, and documentation flow effortlessly. Colleagues commend your precision.",
      finance: "Calculated budgeting yields peace of mind. Excellent transit for clearing outstanding balances.",
      health: "Nurture your digestive flora. Incorporate fresh curd, cumin water, and fiber-rich meals.",
      remedy: "Feed birds soaked green moong and chant 'Om Brim Brihaspataye Namaha' or Budha mantra."
    }
  },
  {
    id: "libra",
    name: "Libra",
    vedicName: "Tula (तुला)",
    symbol: "♎",
    element: "Air",
    dates: "Sep 23 - Oct 22",
    rulingPlanet: "Venus (Shukra)",
    gemstone: "Blue Sapphire / Diamond",
    luckyColor: "Sky Blue & Rose Pink",
    luckyNumber: 6,
    favorableTime: "04:00 PM - 06:00 PM",
    overallRating: 5,
    prediction: {
      summary: "Diplomatic grace restores equilibrium to all your interactions. Collaborative agreements signed today prove mutually prosperous.",
      love: "Romance sparkles with sweet harmony. Singles may encounter magnetic charm at a social gathering.",
      career: "Mediation and client diplomacy shine brightly. Your balanced perspective wins critical consensus.",
      finance: "Gains through artistic ventures, luxury goods, or legal settlements look exceptionally auspicious.",
      health: "Maintain kidney hydration. Drink adequate water infused with fresh mint or lemon.",
      remedy: "Donate white sweets (kheer or rasgulla) to young girls or elderly persons on Fridays."
    }
  },
  {
    id: "scorpio",
    name: "Scorpio",
    vedicName: "Vrischika (वृश्चिक)",
    symbol: "♏",
    element: "Water",
    dates: "Oct 23 - Nov 21",
    rulingPlanet: "Mars & Ketu",
    gemstone: "Red Coral & Cat's Eye",
    luckyColor: "Deep Maroon & Rust",
    luckyNumber: 9,
    favorableTime: "01:00 PM - 02:30 PM",
    overallRating: 4,
    prediction: {
      summary: "Deep transformational energy awakens your investigative acumen. Hidden truths and occult insights reveal strategic advantages.",
      love: "Passionate intensity deepens emotional authenticity. Avoid possessiveness; cultivate trust.",
      career: "Research, forensic problem-solving, and competitive strategy yield triumphant breakthroughs.",
      finance: "Inheritance, passive royalties, or insurance claims make sudden favorable movements.",
      health: "Detoxify your system. Light fasting or herbal infusions aid cellular rejuvenation.",
      remedy: "Chant Hanuman Chalisa facing South and offer vermilion (sindoor) to Lord Hanuman."
    }
  },
  {
    id: "sagittarius",
    name: "Sagittarius",
    vedicName: "Dhanu (धनु)",
    symbol: "♐",
    element: "Fire",
    dates: "Nov 22 - Dec 21",
    rulingPlanet: "Jupiter (Guru)",
    gemstone: "Yellow Sapphire (Pukhraj)",
    luckyColor: "Golden Yellow & Ochre",
    luckyNumber: 3,
    favorableTime: "10:00 AM - 12:00 PM",
    overallRating: 5,
    prediction: {
      summary: "Brihaspati blesses your higher mind with philosophical expansion. Travel, spiritual discourse, and mentorship bring joy.",
      love: "Spontaneous adventures and laughter rekindle your bond. Mutual philosophical alignment inspires.",
      career: "Higher education, international business, and academic pursuits gain stellar momentum.",
      finance: "Fortune favors ethical and disciplined investments. Guidance from a spiritual guru brings abundance.",
      health: "Keep your liver healthy. Avoid excessive sweets and embrace yellow turmeric milk before sleep.",
      remedy: "Apply a tilak of saffron or sandalwood paste on your forehead and offer yellow flowers to Lord Vishnu."
    }
  },
  {
    id: "capricorn",
    name: "Capricorn",
    vedicName: "Makara (मकर)",
    symbol: "♑",
    element: "Earth",
    dates: "Dec 22 - Jan 19",
    rulingPlanet: "Saturn (Shani)",
    gemstone: "Blue Sapphire (Neelam)",
    luckyColor: "Midnight Navy & Charcoal",
    luckyNumber: 8,
    favorableTime: "05:30 PM - 07:15 PM",
    overallRating: 4,
    prediction: {
      summary: "Shani Deva rewards disciplined perseverance. Foundational structures you build today will endure with legendary stability.",
      love: "Steadfast loyalty and practical care speak volumes. A long-term commitment solidifies.",
      career: "Corporate milestones and organizational management proceed flawlessly under your watchful eye.",
      finance: "Solid long-term wealth strategy. Real estate and industrial commodities show resilient upside.",
      health: "Joints and knees need gentle stretching. Practice yoga postures that align the spine.",
      remedy: "Light a mustard oil lamp under a Peepal tree on Saturday evening and assist manual laborers."
    }
  },
  {
    id: "aquarius",
    name: "Aquarius",
    vedicName: "Kumbha (कुम्भ)",
    symbol: "♒",
    element: "Air",
    dates: "Jan 20 - Feb 18",
    rulingPlanet: "Saturn & Rahu",
    gemstone: "Blue Sapphire / Amethyst",
    luckyColor: "Electric Blue & Violet",
    luckyNumber: 4,
    favorableTime: "11:00 AM - 01:00 PM",
    overallRating: 4,
    prediction: {
      summary: "Visionary innovations and humanitarian connections open revolutionary doors. Your progressive ideas find ready resonance.",
      love: "Friendship forms the bedrock of romance. Shared ideals spark profound camaraderie.",
      career: "Tech breakthroughs, community initiatives, and AI-driven workflows showcase your inventive edge.",
      finance: "Unconventional income streams or decentralized digital investments bring pleasant surprises.",
      health: "Circulatory and nervous system balance. Minimize late-night screen scrolling for restful sleep.",
      remedy: "Donate black blankets or iron utensils to the needy and chant 'Om Sham Shanaishcharaya Namaha'."
    }
  },
  {
    id: "pisces",
    name: "Pisces",
    vedicName: "Meena (मीन)",
    symbol: "♓",
    element: "Water",
    dates: "Feb 19 - Mar 20",
    rulingPlanet: "Jupiter (Guru)",
    gemstone: "Yellow Sapphire / Topaz",
    luckyColor: "Sea Green & Radiant Saffron",
    luckyNumber: 7,
    favorableTime: "06:15 AM - 08:00 AM",
    overallRating: 5,
    prediction: {
      summary: "Spiritual synchronicity and heightened psychic awareness guide your path today. Meditative stillness unlocks miraculous clarity.",
      love: "Poetic and soulful communion with your beloved. Compassionate forgiveness heals old wounds.",
      career: "Intuitive decision-making surpasses raw logic. Healing, counseling, and musical arts soar.",
      finance: "Charitable deeds return to you multiplied as divine grace. Avoid hurried financial co-signings.",
      health: "Foot reflexology and sound sleep restore your aura. Salt-water foot baths bring deep tranquility.",
      remedy: "Chant 'Om Namo Bhagavate Vasudevaya' and donate yellow bananas to devotees or monks."
    }
  }
];

export const DEFAULT_PLANS: StoredPlan[] = [
  {
    id: "trial",
    name: "3-Day Free Trial",
    price: 0,
    durationLabel: "3 Days",
    billingText: "100% Free • No Payment Upfront",
    badge: "Try Risk-Free",
    isFree: true,
    features: [
      "3 Days of Personalized Daily Horoscope delivered to your Email",
      "Exact Daily Rahu Kaal & Auspicious Muhurat alert",
      "Lucky Numbers, Auspicious Colors & Mantras",
      "3 Complimentary AI Astrologer Queries",
      "Instant activation via devotee email"
    ],
    ctaText: "Start 3-Day Free Trial"
  },
  {
    id: "monthly",
    name: "Monthly Plan",
    price: 150,
    originalPrice: 200,
    durationLabel: "1 Month",
    billingText: "Billed at ₹150 every month",
    savings: "Save 25%",
    features: [
      "Everything in 3-Day Free Trial",
      "Delivered every morning directly to your Email inbox",
      "Weekly & Monthly Transit Forecast PDFs",
      "Daily Rahu Kaal & Auspicious Timings alerts",
      "15 AI Vedic Oracle queries / month",
      "10% discount on 1-on-1 Astrologer consults",
      "Cancel anytime with 1-click in Email"
    ],
    ctaText: "Choose Monthly (₹150)"
  },
  {
    id: "three_months",
    name: "Quarterly Plan",
    price: 400,
    originalPrice: 450,
    durationLabel: "3 Months",
    billingText: "Billed at ₹400 for 3 months (~₹133/mo)",
    savings: "Save ₹50",
    features: [
      "Daily Email Horoscope (90 days)",
      "Detailed Sade Sati & Dasha transition analysis",
      "Personalized Gemstone & Rudraksha recommendations",
      "Unlimited AI Vedic Astrologer queries",
      "₹200 voucher for 1-on-1 Video consultation",
      "Auspicious Muhurat planning for marriage & business",
      "Priority customer care via Email & Kendra Helpdesk"
    ],
    ctaText: "Choose 3 Months (₹400)"
  },
  {
    id: "six_months",
    name: "Half-Yearly Plan",
    price: 500,
    originalPrice: 900,
    durationLabel: "6 Months",
    billingText: "Billed at ₹500 for 6 months (~₹83/mo)",
    badge: "Most Popular",
    popular: true,
    savings: "Save 44%",
    features: [
      "Daily Horoscope for 180 uninterrupted days",
      "Deep Kundali Matching & Gun Milan guide",
      "Lal Kitab & Vedic Upayas for planetary peace",
      "Unlimited AI Vedic Oracle chat access",
      "1 FREE 15-min Video Consultation with verified Acharya",
      "Family Horoscopes (Add up to 2 family members)",
      "Daily Festival & Panchang morning bulletin"
    ],
    ctaText: "Get 6 Months (₹500)"
  },
  {
    id: "yearly",
    name: "Annual Devotee Plan",
    price: 1000,
    originalPrice: 1800,
    durationLabel: "1 Year",
    billingText: "Billed at ₹1,000 for 12 months (~₹83/mo)",
    badge: "Best Value • Huge Savings",
    savings: "Save ₹800",
    features: [
      "365 Days Premium Daily Horoscope Delivery",
      "Complete 25-Page Personalized Janam Kundali PDF",
      "Full Year Planetary Transit & Eclipse alerts",
      "Unlimited 24/7 AI Astrology Chat with memory",
      "1 FREE 30-min Video Call OR Offline Visit consultation",
      "Vastu Shastra home audit consultation discount",
      "Family Horoscopes (Up to 4 members included)",
      "VIP Fast-Track Astrologer booking"
    ],
    ctaText: "Get Yearly Pass (₹1,000)"
  }
];

export const DEFAULT_TESTIMONIALS: StoredTestimonial[] = [
  {
    id: "test-1",
    name: "Vikram Malhotra",
    city: "Mumbai",
    text: "Getting my personalized horoscope right in my email inbox at 7:00 AM every morning with my morning chai has transformed how I structure my day. The Rahu Kaal warnings alone saved me from two disastrous client meeting timings!",
    sign: "Leo",
    plan: "Yearly Subscriber",
    rating: 5,
    verified: true
  },
  {
    id: "test-2",
    name: "Pooja Venkatesh",
    city: "Bengaluru",
    text: "The 3-day free trial was effortless—just entered my email address and started receiving my sacred morning transit email immediately. Later, I upgraded to the 6-month plan and took a video call with Acharya Vidyadhar. Truly divine guidance!",
    sign: "Libra",
    plan: "6-Month Plan",
    rating: 5,
    verified: true
  },
  {
    id: "test-3",
    name: "Sanjay Singhania",
    city: "New Delhi",
    text: "I visited the offline clinic in Connaught Place after booking via this portal. Panditji reviewed my Janam Kundali in detail and recommended simple remedies that resolved our family property impasse in 45 days.",
    sign: "Capricorn",
    plan: "Offline Clinic Visit",
    rating: 5,
    verified: true
  },
  {
    id: "test-4",
    name: "Meenakshi Sundaram",
    city: "Chennai",
    text: "The exact Muhurat timings and daily Nakshatra guidance in the morning email helped our family plan my daughter's wedding events with total astrological alignment and peace of mind.",
    sign: "Cancer",
    plan: "Yearly Subscriber",
    rating: 5,
    verified: true
  }
];

export const DEFAULT_FAQS: StoredFaq[] = [
  {
    id: "faq-1",
    q: "How does the 3-Day Free Trial work?",
    a: "You simply register with your email address. For 3 full days, you will receive your personalized daily horoscope, lucky numbers, and auspicious muhurat every morning at 7:00 AM directly in your email inbox with zero payment upfront. No credit card is required.",
    category: "trial"
  },
  {
    id: "faq-2",
    q: "What are the subscription prices after the trial?",
    a: "We offer 4 highly affordable plans tailored to your needs: Monthly at ₹150, 3 Months at ₹400 (saves ₹50), 6 Months at ₹500 (our most popular value tier), and 1 Year at ₹1,000 (includes complete 25-page Kundali PDF report and consultation perks).",
    category: "pricing"
  },
  {
    id: "faq-3",
    q: "Can I choose my preferred delivery time for the email?",
    a: "Yes! During registration or anytime in your preferences, your daily email brief is delivered right to your inbox every morning at 7:00 AM, filled with detailed Gochara insights, Muhurat, and Upaya.",
    category: "delivery"
  },
  {
    id: "faq-4",
    q: "How does the AI Astrology Chat work?",
    a: "Our AI Oracle is trained on authentic Vedic principles (Parashara, Jaimini, and KP systems). You can type specific questions about your job, marriage, Sade Sati, or gemstones, and receive instant, personalized astrological guidance and remedies.",
    category: "consultation"
  },
  {
    id: "faq-5",
    q: "How do 1-on-1 Astrologer Video Calls and Offline Visits work?",
    a: "You can book directly on this landing page. For Video Calls, you receive a private, high-definition video meeting link to consult face-to-face with our certified Acharyas. For Offline Visits, you receive a confirmed clinic appointment pass with address and reception token for our Jyotish Kendras in Delhi, Mumbai, Bengaluru, Pune, and other cities.",
    category: "consultation"
  },
  {
    id: "faq-6",
    q: "Is my birth data kept confidential?",
    a: "Absolutely. Your birth details, mobile number, and consultation logs are encrypted and never shared with any third party. Your charts are only accessed by you and the astrologer during your session.",
    category: "general"
  }
];
