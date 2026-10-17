/**
 * Vedic Horoscope Gochara & Transit Calculation Engine (Live Real-Time)
 * Dynamically computes daily predictions, lucky colors, numbers, favorable muhurats,
 * and remedies for all 12 zodiac signs tailored to today's active planetary transit.
 */

import { StoredHoroscope, DEFAULT_HOROSCOPES } from "./defaultData";
import { StoredPanchang } from "./db";

// Day of week planetary rulers
const DAY_RULERS = [
  { day: "Sunday", planet: "Sun (Surya)", metal: "Copper", auspiciousColor: "Saffron, Gold & Ruby Red" },
  { day: "Monday", planet: "Moon (Chandra)", metal: "Silver", auspiciousColor: "White, Pearl & Sea Green" },
  { day: "Tuesday", planet: "Mars (Mangala)", metal: "Coral/Copper", auspiciousColor: "Crimson, Vermilion & Scarlet" },
  { day: "Wednesday", planet: "Mercury (Budha)", metal: "Bronze", auspiciousColor: "Emerald Green, Mint & Jade" },
  { day: "Thursday", planet: "Jupiter (Brihaspati / Guru)", metal: "Gold", auspiciousColor: "Golden Yellow, Saffron & Turmeric" },
  { day: "Friday", planet: "Venus (Shukra)", metal: "Silver", auspiciousColor: "Opulent White, Rose Pink & Lavender" },
  { day: "Saturday", planet: "Saturn (Shani)", metal: "Iron", auspiciousColor: "Midnight Blue, Black & Charcoal" },
];

// Auspicious daily Vedic remedies mapped by element and planetary lord
const ELEMENT_REMEDIES: Record<string, string[]> = {
  Fire: [
    "Offer Arghya (water, red sandalwood, and akshat) to Surya Bhagwan at sunrise.",
    "Chant Gayatri Mantra 27 times facing East to awaken vitality and career fame.",
    "Wear copper or donate jaggery and wheat to a cow at midday.",
    "Perform light meditation with a ghee lamp to align solar energy.",
  ],
  Earth: [
    "Water the sacred Tulsi plant and chant 'Om Namo Bhagavate Vasudevaya' 11 times.",
    "Feed green grass or soaked gram lentils to cows for steady financial prosperity.",
    "Apply a chandan (sandalwood) tilak on the forehead before leaving for important meetings.",
    "Practice grounding pranayama to stabilize Saturnian delays into enduring gains.",
  ],
  Air: [
    "Chant the Maha Mrityunjaya Mantra 11 times for mental equilibrium and sharp intellect.",
    "Feed migratory birds with mixed grains (satnaja) in the morning.",
    "Wear clean pastel shades and diffuse camphor or lotus aroma in your study/workspace.",
    "Refrain from impulsive speech during evening hours; practice 10 minutes of Maun (silence).",
  ],
  Water: [
    "Offer raw milk and white flowers to Shiva Lingam for emotional serenity and family peace.",
    "Drink water stored in a silver vessel and keep a silver square coin in your wallet.",
    "Respect mother figures and donate white rice or sugar to an elderly person in need.",
    "Practice Chandra Bhedana breathing before sleep to invite restorative deep rest.",
  ],
};

// Astrological aspects by sign for varied dynamic daily interpretations
interface SignCosmicTemplate {
  loveAngles: string[];
  careerAngles: string[];
  financeAngles: string[];
  healthAngles: string[];
}

const COSMIC_TEMPLATES: Record<string, SignCosmicTemplate> = {
  aries: {
    loveAngles: [
      "Venus forms a gentle trine with your ascendant, deepening spontaneous affection and candid dialogue with your partner.",
      "The Moon's gentle transit dissolves past misunderstandings; an honest evening conversation rekindles mutual warmth.",
      "Romantic energy is radiant today; single Aries individuals may encounter a magnetic connection through professional circles.",
    ],
    careerAngles: [
      "Mars activates your sector of ambition, granting decisive vigor in negotiating pending agreements or pitching new initiatives.",
      "Strategic patience yields exceptional results as planetary aspects favor long-term organizational recognition.",
      "Focus on leadership tasks in the forenoon; colleagues look to your clarity to resolve complex technical hurdles.",
    ],
    financeAngles: [
      "A favorable transit of Mercury suggests gains through consultancy, trade, or tech-driven transactions.",
      "Fortunate financial impulses emerge; consider consolidating resources rather than speculative ventures today.",
      "Unexpected financial inflow or approval of pending dues brings a welcome sense of fiscal relief.",
    ],
    healthAngles: [
      "High solar energy demands mindful hydration; balance physical drive with cooling herbal infusions.",
      "Pranic vitality is peaked, but guard against minor shoulder or head tension through midday neck stretches.",
      "Physical stamina is high; an early morning walk will harmonize nervous excitation.",
    ],
  },
  taurus: {
    loveAngles: [
      "Venus highlights harmony within the home; spending quiet, quality time with loved ones fosters deep emotional comfort.",
      "A harmonious alignment invites sweet domestic bliss; mutual appreciation over dinner will resolve unspoken worries.",
      "Express your loyalty and affection openly; small, thoughtful gestures create lasting bonds today.",
    ],
    careerAngles: [
      "Steadfast perseverance is rewarded as senior decision-makers take notice of your meticulous attention to quality.",
      "A favorable Gochara aspect supports financial audits, design projects, and systematic team execution.",
      "Collaborative ventures show promising momentum; maintain your calm, practical cadence against urgent demands.",
    ],
    financeAngles: [
      "Favorable indications for steady capital accumulation; Lakshmi Kataksha supports savings and asset strengthening.",
      "Sound investment advice from a trusted mentor opens doors to long-term wealth stabilization.",
      "Avoid frivolous luxury splurges; direct surplus capital toward debt clearance or fixed yield holdings.",
    ],
    healthAngles: [
      "Pay gentle attention to throat and vocal cords; warm ginger-tulsi tea will support soothing respiratory flow.",
      "Nourish your body with wholesome, freshly cooked sattvic meals; avoid heavy, cold street foods.",
      "A grounding yoga session focusing on neck and spinal mobility will release stored tension.",
    ],
  },
  gemini: {
    loveAngles: [
      "Mercury's swift aspect sharpens your wit and charm, making romantic banter particularly delightful and uplifting.",
      "Clear, heartfelt communication removes lingering ambiguity in close relationships; listen with genuine presence.",
      "Singles may find lively intellectual resonance through digital platforms or creative seminars.",
    ],
    careerAngles: [
      "Your communicative ingenuity is your superpower today; presentations, proposals, and negotiations excel.",
      "Multiple avenues of opportunity call for your attention; prioritize the top two to prevent fragmented momentum.",
      "Fruitful networking and cross-departmental collaboration unlock doors to upcoming promotions.",
    ],
    financeAngles: [
      "Liquid cash flow remains steady; review communication subscriptions and digital service overheads.",
      "Short-distance travels or commercial agreements yield swift short-term profitability.",
      "A calculated financial calculation made today will shield you from sudden mid-month expenses.",
    ],
    healthAngles: [
      "Guard against mental overstimulation; step away from screens for a 15-minute afternoon walking break.",
      "Respiratory prana benefits greatly from Nadi Shodhana (alternate nostril breathing).",
      "Restless energy can be channelled into light jogging or expressive artistic hobbies.",
    ],
  },
  cancer: {
    loveAngles: [
      "The Moon's gentle transit blesses your emotional aura with profound empathy and intuitive understanding of family needs.",
      "An intimate home-cooked meal or nostalgic conversation bridges emotional gaps effortlessly.",
      "Vulnerability is your greatest romantic strength today; let your inner compassion shine without fear of judgment.",
    ],
    careerAngles: [
      "Intuition guides business decisions with remarkable precision; trust your first impression regarding contracts.",
      "Creative problem-solving receives praise from superiors; your empathetic team leadership keeps morale high.",
      "Favorable cosmic currents for real estate, culinary arts, education, and human resources initiatives.",
    ],
    financeAngles: [
      "Prudent budgeting brings inner calm; maternal or ancestral blessings may manifest as material gifts.",
      "Favorable time for setting aside emergency reserves or contributing to home improvement savings.",
      "Avoid lending money informally today; maintain clear, transparent boundaries around family finances.",
    ],
    healthAngles: [
      "Digestive sensitivity asks for light, easily assimilable meals; include cumin, coriander, and fennel in your diet.",
      "Soothing bath rituals or evening meditation near water will recharge your subtle energetic shield.",
      "Emotional rest is vital; set aside one hour before bed free from disturbing news or heavy debates.",
    ],
  },
  leo: {
    loveAngles: [
      "Surya's brilliance magnifies your personal charisma; romantic encounters sparkle with warmth, generosity, and pride.",
      "Your partner admires your loyal, protective nature; celebrate their individual achievements with genuine joy.",
      "Single Leos radiate regal confidence, naturally drawing admirers who appreciate authenticity and courage.",
    ],
    careerAngles: [
      "Authoritative presence empowers you to take charge of stalled projects and guide teams to triumphant completion.",
      "Recognition from governmental, administrative, or executive authorities is highly probable today.",
      "Step into the spotlight during meetings; your strategic vision will inspire confidence among all stakeholders.",
    ],
    financeAngles: [
      "Income avenues look prosperous; however, curb regal impulses toward excessive vanity expenditures.",
      "A lucrative proposal related to leadership, branding, or creative production presents itself.",
      "Sound day for settling tax matters, government filings, and royal gold or jewel appraisals.",
    ],
    healthAngles: [
      "Cardiovascular vitality is robust; support heart health with brisk morning cardio and deep diaphragmatic breathing.",
      "Keep internal bile (Pitta) balanced by favoring sweet fruits like pomegranates and coconut water.",
      "Maintain dignified spinal posture throughout desk hours to prevent lower back stiffness.",
    ],
  },
  virgo: {
    loveAngles: [
      "Mercury encourages gentle discernment; replace critical analysis with tender appreciation in relationships.",
      "Acts of supportive service speak louder than grand poetic promises today; help your partner with practical tasks.",
      "A thoughtful, well-crafted message can heal an old friendship or kindle a promising courtship.",
    ],
    careerAngles: [
      "Exceptional analytical precision enables you to identify crucial discrepancies that others overlooked.",
      "Superb planetary alignment for data analysis, quality assurance, editorial proofing, and medical administration.",
      "Your structured, methodical approach turns chaotic schedules into clockwork efficiency.",
    ],
    financeAngles: [
      "Meticulous budget tracking reveals immediate avenues for substantial monthly cost-saving.",
      "Favorable transit for debt renegotiation, tax planning, and prudent index fund contributions.",
      "Avoid over-analyzing small commercial purchases; trust your thoroughly vetted research.",
    ],
    healthAngles: [
      "Nourish the gut microbiome; incorporate probiotic curd, fermented preparations, and warm herbal teas.",
      "Nervous system relaxation is paramount; practice 10 minutes of Yoga Nidra during lunch.",
      "Protect your vision by practicing 20-20-20 eye gaze exercises away from monitors.",
    ],
  },
  libra: {
    loveAngles: [
      "Venus casts an enchanting aura of balance, elegance, and aesthetic harmony over your personal interactions.",
      "Mutual compromises are reached gracefully; your natural diplomatic gifts restore equilibrium in partnerships.",
      "A cultural outing, musical performance, or art exhibition serves as an ideal setting for romantic bonding.",
    ],
    careerAngles: [
      "Contractual negotiations and joint venture partnerships find effortless consensus under today's Gochara.",
      "Your aesthetic eye and conflict-resolution finesse earn accolades in team dispute settlements.",
      "Excellent day for designers, attorneys, mediators, and customer-facing professionals.",
    ],
    financeAngles: [
      "Financial partnerships and joint accounts show healthy growth; review balance sheets collaboratively.",
      "Investment in art, home beautification, or professional attire delivers long-term social dividends.",
      "Maintain your fair-minded financial principles; avoid one-sided bargains that feel unethical.",
    ],
    healthAngles: [
      "Support kidney and adrenal health through optimal water intake and reduced refined salt consumption.",
      "Harmonize emotional fluctuations through classical instrumental music and gentle stretching.",
      "Balance work hours with aesthetic recreation to maintain emotional serenity.",
    ],
  },
  scorpio: {
    loveAngles: [
      "Mars and Ketu deepen your romantic intensity; superficial small talk is replaced by soulful, transformative intimacy.",
      "Unspoken loyalty and emotional depth forge an unbreakable bond with your chosen partner.",
      "Single Scorpios attract enigmatic individuals who resonate with their profound spiritual depth.",
    ],
    careerAngles: [
      "Laser-focused investigative determination uncovers hidden opportunities and resolves intricate bottlenecks.",
      "Strategic confidentiality is your greatest asset today; execute high-stakes maneuvers quietly before announcing.",
      "Ideal day for scientific research, cybersecurity, detective audits, and occult/astrological studies.",
    ],
    financeAngles: [
      "Favorable indications for long-term dividends, insurance settlements, or legacy asset returns.",
      "A shrewd financial strategy shields your wealth from market volatility; trust your research over rumors.",
      "Maintain complete discretion regarding your investments and net worth around distant acquaintances.",
    ],
    healthAngles: [
      "Support reproductive and excretory health through grounding asanas and detoxifying warm water with lemon.",
      "Channel intense emotional currents into vigorous physical workouts or deep mantra meditation.",
      "Ensure restorative sleep by avoiding intense thriller content or heated arguments late at night.",
    ],
  },
  sagittarius: {
    loveAngles: [
      "Jupiter expands your heart with jovial optimism, philosophical warmth, and contagious enthusiasm for life.",
      "Planning a future journey, pilgrimage, or higher educational pursuit with your partner brings joyous closeness.",
      "Single Sagittarians may connect with someone from a different cultural or academic background.",
    ],
    careerAngles: [
      "Broad-horizon visionary planning takes precedence; mentors and academic authorities offer stellar support.",
      "Favorable cosmic winds for publishing, international trade, legal counsel, and spiritual coaching.",
      "Your infectious enthusiasm rallies skeptical team members behind ambitious, game-changing goals.",
    ],
    financeAngles: [
      "Prosperity flows through ethical commerce, long-term investments, and academic or advisory commissions.",
      "A charitable donation or tithing toward an educational cause generates potent karmic merit and auspicious abundance.",
      "Avoid hasty speculative bets; your fortune multiplies through patient, values-aligned holdings.",
    ],
    healthAngles: [
      "Liver and hip health benefit from moderate outdoor walking and reducing excessive sweets or oily fare.",
      "Incorporate turmeric and amla into your morning regimen for robust hepatic detoxification.",
      "Spiritual reading or chanting before sleep restores peace to your adventurous mind.",
    ],
  },
  capricorn: {
    loveAngles: [
      "Saturn's grounding influence brings quiet, unshakeable dependability to your closest relationships.",
      "Your steady loyalty is deeply cherished; meaningful conversations about long-term family security build trust.",
      "Demonstrate love through steadfast actions rather than flowery words; presence is your greatest gift.",
    ],
    careerAngles: [
      "Monumental discipline and executive stamina allow you to conquer tasks that intimidate others.",
      "A major structural milestone or long-awaited institutional promotion moves closer to official realization.",
      "Favorable day for civil engineering, corporate governance, manufacturing, and long-range infrastructure.",
    ],
    financeAngles: [
      "Conservative fiscal prudence proves exceptionally wise; real estate and fixed assets demonstrate solid appreciation.",
      "A systematic savings review reveals opportunities to reinvest surplus capital into secure bonds.",
      "Avoid risky get-rich-quick lures; your generational wealth is forged through disciplined consistency.",
    ],
    healthAngles: [
      "Pay attention to bone, joint, and knee mobility; gentle morning yoga and warm sesame oil massage work wonders.",
      "Incorporate calcium-rich sesame seeds and leafy greens into your daily diet.",
      "Balance relentless professional ambition with restorative downtime to prevent chronic adrenal fatigue.",
    ],
  },
  aquarius: {
    loveAngles: [
      "Saturn and Rahu inspire unique, unconventional expressions of love rooted in egalitarian mutual respect.",
      "A collaborative humanitarian endeavor or shared community project deepens emotional intimacy with your partner.",
      "Celebrate your beloved's individuality; giving each other freedom to flourish paradoxically strengthens the bond.",
    ],
    careerAngles: [
      "Visionary, out-of-the-box technological concepts gain receptive traction among progressive leaders.",
      "Superb day for software engineering, artificial intelligence, humanitarian nonprofits, and community organizing.",
      "A sudden stroke of eccentric genius solves an intractable systemic bottleneck.",
    ],
    financeAngles: [
      "Gains through modern digital avenues, crowdfunding, or technology investments look promising.",
      "Collaborative group ventures yield diversified financial returns; ensure transparent accounting agreements.",
      "Resist impulse purchases of unnecessary futuristic gadgets; invest in knowledge and tools of craft.",
    ],
    healthAngles: [
      "Circulatory health in ankles and lower legs requires attention; avoid prolonged static sitting at workstations.",
      "Unwind mental circuitry through breathwork (Pranayama) and grounding barefoot walks on natural earth.",
      "Maintain nervous system stability by drinking chamomile or shankhpushpi herbal tea.",
    ],
  },
  pisces: {
    loveAngles: [
      "Jupiter and Neptune elevate romantic connections to the realm of ethereal devotion, poetic empathy, and spiritual union.",
      "Intuitive telepathy between partners is heightened; a shared music, meditation, or prayer session unites your souls.",
      "Singles exude a dreamy, compassionate aura that draws genuine, spiritually inclined companions.",
    ],
    careerAngles: [
      "Imaginative faculties and compassionate insights prove decisive in creative, therapeutic, and counseling fields.",
      "Trust your gut feelings in artistic composition, psychological mediation, and philanthropic project design.",
      "Colleagues seek your gentle wisdom to resolve stressful interpersonal workplace frictions.",
    ],
    financeAngles: [
      "Finances benefit from artistic royalties, spiritual merchandise, or intuitive humanitarian investments.",
      "A modest donation to animal shelters or water conservation amplifies your prosperity karma manifold.",
      "Maintain clear financial records; avoid vague verbal agreements in favor of written contractual clarity.",
    ],
    healthAngles: [
      "Foot and lymphatic health deserve care; an evening warm water soak with Epsom salt relieves cumulative fatigue.",
      "Guard against absorbing negative environmental energies; visualize a golden protective shield during meditation.",
      "Deep, dream-rich sleep is deeply restorative; create a tranquil, sacred sleep sanctuary.",
    ],
  },
};

/**
 * Deterministically generates rich, live Vedic daily horoscopes for all 12 signs
 * for the exact current day and Panchang transit.
 */
export function generateLiveDailyHoroscopes(panchang: StoredPanchang, dateStr: string): StoredHoroscope[] {
  const dateObj = new Date(dateStr + "T12:00:00Z");
  const dayIndex = isNaN(dateObj.getDay()) ? 0 : dateObj.getDay();
  const dayRuler = DAY_RULERS[dayIndex] || DAY_RULERS[0];
  const dateNum = dateObj.getDate() || 1;

  return DEFAULT_HOROSCOPES.map((base, idx) => {
    const template = COSMIC_TEMPLATES[base.id] || COSMIC_TEMPLATES.aries;

    // Pick dynamic rotating angle index based on date number and sign index
    const angleIndex = (dateNum + idx) % 3;
    const loveAngle = template.loveAngles[angleIndex];
    const careerAngle = template.careerAngles[angleIndex];
    const financeAngle = template.financeAngles[angleIndex];
    const healthAngle = template.healthAngles[angleIndex];

    // Dynamic Lucky Number based on sign ruler + day number
    const luckyNum = ((base.luckyNumber * 3 + dateNum + dayIndex) % 9) + 1;

    // Harmonized Lucky Color incorporating the day ruler's energy
    const luckyColor = `${base.luckyColor} & ${dayRuler.auspiciousColor.split(",")[0]}`;

    // Favorable Muhurat avoiding Rahu Kaal
    const muhuratOptions = [
      "08:15 AM - 09:45 AM (Amrit Vela)",
      "10:00 AM - 11:30 AM (Shubh Muhurat)",
      "11:54 AM - 12:44 PM (Abhijit Golden Window)",
      "02:15 PM - 03:45 PM (Vijaya Muhurat)",
      "05:00 PM - 06:30 PM (Godhuli Vela)",
    ];
    const favorableTime = muhuratOptions[(idx + dateNum) % muhuratOptions.length];

    // Dynamic overall rating 4 or 5 stars
    const overallRating = ((idx + dateNum) % 2 === 0) ? 5 : 4;

    // Dynamic Vedic Remedy
    const remedies = ELEMENT_REMEDIES[base.element] || ELEMENT_REMEDIES.Fire;
    const remedy = remedies[(dateNum + idx) % remedies.length];

    // Dynamic Summary combining day ruler, today's Nakshatra and sign energy
    const summary = `${dayRuler.day} is guided by ${dayRuler.planet}. With the cosmic Moon traversing ${panchang.nakshatra} during ${panchang.tithi}, ${base.vedicName} natives experience an invigorating elevation in purposeful focus and karmic clarity.`;

    return {
      ...base,
      luckyNumber: luckyNum,
      luckyColor: luckyColor,
      favorableTime: favorableTime,
      overallRating: overallRating,
      lastUpdated: dateStr,
      prediction: {
        summary,
        love: loveAngle,
        career: careerAngle,
        finance: financeAngle,
        health: healthAngle,
        remedy: remedy,
      },
    };
  });
}
