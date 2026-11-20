export interface ServiceDetailedContent {
  id: string;
  name: string;
  tagline: string;
  description: string;
  aboutSections: { title: string; content: string }[];
  inclusions: string[];
  exclusions: string[];
  pricingDetails: {
    startingPrice: number;
    inspectionFee: number;
    gstPercent: number;
    partsChargeInfo: string;
    cancellationPolicy: string;
  };
  howItWorksSteps: { title: string; desc: string }[];
  whyChooseUs: { title: string; desc: string }[];
  reviews: { name: string; rating: number; date: string; comment: string; avatar: string }[];
  faqs: { q: string; a: string }[];
}

export function generateServiceDetails(service: any): ServiceDetailedContent {
  const name = service.name || service.title || service.label || "Untitled Service";
  const cat = (service.category || "").trim();
  const price = service.price ?? service.startingPrice ?? 299;
  const duration = service.estimatedTime || "45 mins";
  
  // Taglines
  let tagline = `Professional, verified doorstep ${name.toLowerCase()} experts.`;
  if (cat.includes("Cleaning")) tagline = `Spotless, hygienic, and eco-friendly deep cleaning for your peace of mind.`;
  else if (cat.includes("Appliance")) tagline = `Certified mechanics to diagnose, inspect, and repair your home appliances.`;
  else if (cat.includes("Repairs") || cat.includes("Improvement")) tagline = `Highly skilled background-verified technicians at your doorstep.`;
  else if (cat.includes("Technology")) tagline = `Certified tech support agents for hardware diagnostics and configurations.`;
  else if (cat.includes("Health")) tagline = `Professional healthcare providers and certified nursing assistance at home.`;
  else if (cat.includes("Lifestyle")) tagline = `Verified personal helpers and lifestyle assistants to ease your daily tasks.`;
  else if (cat.includes("Professional")) tagline = `Expert legal consultants, tax professionals, and corporate assistance.`;
  else if (cat.includes("Education")) tagline = `Experienced home tutors and specialized skill mentors for all age groups.`;
  else if (cat.includes("Events")) tagline = `Top-rated event planners, decorators, and photographers for your celebrations.`;

  // About & Description
  let description = `Our certified ${name.toLowerCase()} service is designed to offer a seamless, high-quality, and completely stress-free experience. We deploy top-tier professionals who carry state-of-the-art tools, follow strict health/safety protocols, and guarantee complete customer satisfaction.`;
  
  if (name.includes("AC")) {
    description = `Our certified AC technicians inspect, diagnose, and repair cooling issues, gas leakage, water leakage, strange noises, compressor problems, thermostat faults, and electrical failures. Every technician is background verified and carries professional tools.`;
  } else if (name.includes("Cleaning")) {
    description = `Get deep-sanitized, spotless spaces with our eco-friendly ${name.toLowerCase()} experts. We use premium biodegradable cleaning agents, industrial grade vacuums, and deep-scrubbing machines to remove tough stains, grime, and allergens from every corner.`;
  } else if (name.includes("Electrician")) {
    description = `Professional electrical solutions for your residence or office. Our certified electricians inspect, diagnose, and repair short circuits, wiring faults, switchboard issues, MCB trips, and fixture installations using insulated safety gear and standard copper fittings.`;
  } else if (name.includes("Plumber")) {
    description = `Solve all drainage, leakage, and fixture plumbing worries. Our expert plumbers diagnose pipeline blockages, tap leaks, toilet flush faults, and install premium faucets, washbasins, and water filter connections with zero mess.`;
  } else if (name.includes("Carpenter")) {
    description = `Premium wood craftsmanship and repairs. From cabinet hinge alignments, door locks fitting, and custom furniture assembly to detailed woodwork repairs, our carpenters deliver precise cuts and seamless alignments.`;
  } else if (name.includes("Tutor")) {
    description = `Tailored 1-on-1 home tutoring to accelerate learning. Our certified educators customize lesson plans, prepare mock tests, solve doubts step-by-step, and provide consistent feedback report tracking for parents.`;
  }

  // About Sections
  const aboutSections = [
    {
      title: "What this service includes",
      content: `A complete end-to-end ${name.toLowerCase()} session performed by a background-verified specialist. Includes detailed inspection, custom troubleshooting, minor alignments, and cleanup of the workspace post-job.`
    },
    {
      title: "Who should book this?",
      content: `Homeowners and business operators looking for professional, time-efficient, and guaranteed ${name.toLowerCase()} work without having to run around looking for unverified technicians.`
    },
    {
      title: "Common problems solved",
      content: `Our experts address typical issues like operational failures, age-related wear, mounting misalignment, system inefficiencies, and structural safety checkups.`
    },
    {
      title: "Benefits of professional service",
      content: `Ensure safety, double the lifespan of your fixtures, protect warranties, and save hours of DIY hassle. We offer a 30-day service warranty for your peace of mind.`
    }
  ];

  // Inclusions & Exclusions
  let inclusions = [
    "Inspection & Diagnostic checkup",
    "Use of specialized professional toolkits",
    "Safe, standardized mounting/assembly",
    "Post-service operational test run",
    "Workspace cleanup post work completion",
    "30-day service warranty protection",
    "Digital invoices & secure billing"
  ];
  if (cat.includes("Cleaning")) {
    inclusions = [
      "Deep vacuuming & dust extraction",
      "Stain removal & sanitization treatment",
      "Use of certified eco-friendly cleaning fluids",
      "Disinfection of heavy contact surfaces",
      "Polishing of metal fixtures & mirrors",
      "Disposal of accumulated trash",
      "Post-cleaning quality inspection"
    ];
  } else if (cat.includes("Education")) {
    inclusions = [
      "Diagnostic student skill assessment",
      "Tailored curriculum & lesson plans",
      "Weekly test preparation & reviews",
      "In-depth query resolving sessions",
      "Regular homework & practice worksheets",
      "Parent-tutor alignment updates"
    ];
  }

  let exclusions = [
    "Cost of spare parts or replacement materials",
    "Structural masonry/civil modifications",
    "Scaffolding for inaccessible heights",
    "Utility-company grid repairs (external)",
    "Clean-up of pre-existing construction debris"
  ];
  if (cat.includes("Cleaning")) {
    exclusions = [
      "Moving of massive heavy furniture (e.g. wardrobes, safes)",
      "Removal of hard chemical paint splatters",
      "Structural mold remediation or painting repairs",
      "Polishing of aged, damaged marble surfaces"
    ];
  } else if (cat.includes("Education")) {
    exclusions = [
      "Cost of external textbooks or test papers",
      "Official school board registration charges",
      "Direct writing of projects/assignments for the student"
    ];
  }

  // FAQs
  const faqs = [
    {
      q: `How long does the ${name} service take?`,
      a: `Typically, a standard session is completed in about ${duration}. For complex works or large setups, our worker will provide a precise time estimate before starting.`
    },
    {
      q: `Do I need to supply the tools or cleaning supplies?`,
      a: `No, our PickPal professionals arrive fully equipped with advanced heavy-duty tools, testing meters, and safety equipment needed for the job.`
    },
    {
      q: "Can I reschedule or cancel the booking?",
      a: "Yes! You can reschedule or cancel your booking for free up to 2 hours before the scheduled time slot via the app."
    },
    {
      q: "Is there a service warranty on the job?",
      a: "Absolutely. PickPal offers a complimentary 30-day warranty. If any issue arises from our service, we will inspect and resolve it for free."
    },
    {
      q: "What if replacement spare parts are required?",
      a: "The worker will inspect and give you an estimate for the parts. You can either buy them yourself or authorize the worker to procure genuine parts with a proper GST receipt."
    },
    {
      q: "Are the workers background-verified and safe?",
      a: "Yes, every worker on PickPal undergoes police verification, professional skill training tests, and strict background checks before onboarding."
    }
  ];

  // Reviews
  const firstNames = ["Rahul", "Anjali", "Vikram", "Sneha", "Amit", "Priyanka", "Sanjay", "Deepa"];
  const lastNames = ["Sharma", "Nair", "Reddy", "Sen", "Joshi", "Patel", "Das", "Murthy"];
  const comments = [
    "Very professional work! The expert arrived right on time, explained the issue, and fixed it within 30 minutes. High-quality work.",
    "Outstanding service. Cleaned up the place completely after completing the job. Highly recommend PickPal!",
    "Polite, skilled, and very efficient. The spare parts replaced were genuine, and the pricing was clear. Excellent.",
    "Decent service, though the worker arrived 10 minutes late. The work itself was very neat and solved my issues.",
    "Excellent diagnostic skill. Resolved a complex issue that two other local technicians could not solve."
  ];

  const reviews = Array.from({ length: 4 }).map((_, idx) => {
    const fn = firstNames[(name.length + idx) % firstNames.length];
    const ln = lastNames[(name.length * 3 + idx) % lastNames.length];
    const r = parseFloat((4.5 + (idx % 2) * 0.3 + (idx % 3) * 0.1).toFixed(1));
    const d = new Date();
    d.setDate(d.getDate() - (idx * 2 + 1));
    
    return {
      name: `${fn} ${ln}`,
      rating: r > 5 ? 5 : r,
      date: d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }),
      comment: comments[(name.length + idx) % comments.length],
      avatar: `https://images.unsplash.com/photo-${1500648767791 + idx * 1000}?auto=format&fit=crop&w=80&h=80&q=80`
    };
  });

  return {
    id: service.id || service.key || "service_id",
    name,
    tagline,
    description,
    aboutSections,
    inclusions,
    exclusions,
    pricingDetails: {
      startingPrice: price,
      inspectionFee: Math.round(price * 0.15) || 99,
      gstPercent: 18,
      partsChargeInfo: "Charged extra as per actual market rates / GST invoices.",
      cancellationPolicy: "Free cancellation or rescheduling up to 2 hours before the job starts."
    },
    howItWorksSteps: [
      { title: "Book Service", desc: "Select your preferred slot and request a service in 1-click." },
      { title: "Worker Assigned", desc: "A top-rated verified PickPal partner gets matched for your request." },
      { title: "Safe Arrival", desc: "Worker arrives at your location with proper gear and tools." },
      { title: "Approval & Start", desc: "Inspection is done, work starts after you approve the final estimate." },
      { title: "Post-Job Payment", desc: "Pay securely after checking the completed work." }
    ],
    whyChooseUs: [
      { title: "Background Verified Workers", desc: "100% police and reference checked professionals." },
      { title: "Live GPS Tracking", desc: "Track your worker's location live on the map." },
      { title: "Secure Payments", desc: "Integrated payment gateways and digital receipts." },
      { title: "OTP Job Verification", desc: "Job starts and ends only after your secure OTP confirmation." },
      { title: "Real Reviews", desc: "Authentic feedback from verified local customers." },
      { title: "Service Warranty", desc: "Complimentary 30-day warranty protection on all repairs." }
    ],
    reviews,
    faqs
  };
}
