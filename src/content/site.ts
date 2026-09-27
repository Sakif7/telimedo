/* Every string on the site. Components render from here and never hardcode
   marketing copy. Anything that still needs real data from the owner is a
   Placeholder ({ placeholder: true }): it renders with the dotted coral underline
   (.ph) and carries a note saying what to replace. */

export type Placeholder = {
  text: string;
  placeholder: true;
  /** What the owner needs to supply (shown as the element's title). */
  note: string;
  /** Big figures use the lighter underline-only style. */
  soft?: boolean;
};
export type Bold = { b: string };
export type Segment = string | Placeholder | Bold;
export type Rich = string | readonly Segment[];

const ph = (text: string, note: string, soft = false): Placeholder => ({ text, placeholder: true, note, ...(soft ? { soft } : {}) });

export type Link = { label: string; href: string; placeholder?: { note: string } };
/** A spec row: DM Mono label, then the value. */
export type Spec = { label: string; value: Rich };
/** Leading element of a glass card: real product content, never an icon tile. */
export type Lead = { kind: 'video' } | { kind: 'rx' } | { kind: 'initials'; text: string } | { kind: 'time'; day: string; time: string };
/** A row in the security section's visit record: who (as a Lead), what, a tag, when. `tone` colours the tag:
    safeguards in aqua, the prescription in coral. */
export type RecordRow = { lead: Lead; action: string; who: string; tag: string; tone: 'safe' | 'rx' | 'plain'; time: string };

export const site = {
  meta: {
    title: 'Telimedo, the virtual care platform for clinics',
    description:
      'Telimedo is the telemedicine platform for clinics and hospitals: online booking, video visits, e-prescriptions and live analytics in one HIPAA and GDPR compliant workspace.',
    siteName: 'Telimedo',
    /** The production domain isn't confirmed yet. Override with NEXT_PUBLIC_SITE_URL. */
    siteUrl: ph('https://telimedo.com', 'Placeholder: the production domain'),
  },

  a11y: {
    skip: 'Skip to content',
    home: 'Telimedo home',
    mainNav: 'Main',
    openMenu: 'Open menu',
    closeMenu: 'Close menu',
    darkTheme: 'Dark theme',
  },

  nav: {
    links: [
      { label: 'How it works', href: '/how-it-works' },
      { label: 'Product', href: '/product' },
      { label: 'Solutions', href: '/solutions' },
      { label: 'Security', href: '/security' },
      { label: 'Pricing', href: '/pricing' },
    ] as Link[],
    signIn: { label: 'Sign in', href: '#signin', placeholder: { note: "Placeholder: link to your app's sign-in page" } } as Link,
    demo: { label: 'Book a demo', href: '/#demo' } as Link,
  },

  hero: {
    title: { line1: 'Care closer to', line2: 'every', pulseWord: 'patient.' },
    lede: 'Telimedo is the virtual care platform for your clinic. Patients book, join and get their prescriptions from any phone, and your team runs it all from one workspace.',
    primary: { label: 'Book a demo', href: '#demo' },
    secondary: { label: 'See a visit', href: '#how' },
    trustLabel: 'Compliance and customers',
    trust: [
      { badge: 'HIPAA', label: 'compliant' },
      { badge: 'GDPR', label: 'compliant' },
    ],
    trustCount: ['Trusted by ', ph('120+ clinics', 'Placeholder: replace with your real number')] as Rich,
    /** One line at a time in a speech bubble above the buddy's head; the engine anchors it to a 3D point (at, off). */
    says: {
      lines: ['Dr. Rivera is ready for you.', 'I sent your prescription to Riverside Pharmacy.', 'Your follow-up is booked for Tuesday at 10:30.'],
      at: '-0.56,1.98,0',
      off: '0,0',
    },
  },

  logos: {
    label: ['Chosen by care teams at ', ph('these sample clinics', "Placeholder: sample names. Replace with your customers' logos")] as Rich,
    /** Made-up clinics, set as plain text until real customer logos exist. */
    placeholder: true,
    items: ['Northside Family Practice', 'Riverside Clinic', 'Harbor Pediatrics', 'Cedar Valley Health', "Lumen Women's Health", 'Oakview Medical', 'Bayfront Hospital', 'Summit Physio'],
  },

  manifesto: {
    label: 'Why Telimedo',
    text: "A ten-minute follow-up shouldn't cost a patient half a day off work. Telimedo brings the visit to their phone, and gives your team one calm place to run it.",
    facts: [
      { figure: '0' as Rich, label: 'apps to install', body: 'Patients join from a link in a text or email.' },
      { figure: [ph('2 weeks', 'Placeholder: your real onboarding time', true)] as Rich, label: 'to go live', body: 'We import your schedule, services and patient list.' },
      { figure: 'HIPAA & GDPR' as Rich, label: 'compliant', body: 'Visits, records and messages are encrypted.' },
    ],
  },

  story: {
    title: 'One visit, from the first message to the follow-up.',
    sub: 'Follow a video visit from both sides of the screen: what the patient does, and what your team sees.',
    readout: 'Follow a visit',
    count: (step: number) => `0${step + 1} / 04`,
    navLabel: 'Steps of a visit',
    steps: [
      { n: '01', label: 'Listen' },
      { n: '02', label: 'See' },
      { n: '03', label: 'Care' },
      { n: '04', label: 'Together' },
    ],
    panels: [
      {
        n: '01',
        title: 'It starts with listening.',
        body: "Patients book online and describe what's wrong in their own words, by text or voice. Telimedo turns it into a structured intake, so the clinician starts every visit already up to speed.",
        specs: [
          { label: 'Booking', value: 'Online, with live availability' },
          { label: 'Captured up front', value: 'Symptoms, medications and allergies' },
          { label: 'Before the visit', value: 'Insurance details and consent' },
        ] as Spec[],
      },
      {
        n: '02',
        title: 'Then you see each other.',
        body: "One tap opens the visit in the browser. Patients don't install an app or remember a password, and the clinician keeps the chart and notes beside the video.",
        specs: [
          { label: 'Joins from', value: 'Any phone, tablet or computer' },
          { label: 'Built in', value: 'Virtual waiting room and live captions' },
          { label: 'Next to the call', value: 'Chart, history and notes' },
        ] as Spec[],
      },
      {
        n: '03',
        title: 'Care that follows them home.',
        body: "Send the prescription to the patient's pharmacy, share a care plan and book the follow-up before the call ends. Reminders keep patients on track.",
        specs: [
          { label: 'Prescriptions', value: 'Sent straight to the pharmacy' },
          { label: 'Care plans', value: 'Shared, with automatic reminders' },
          { label: 'Follow-ups', value: 'Booked in one click' },
        ] as Spec[],
      },
    ],
    together: {
      n: '04',
      label: 'Together',
      title: 'Your whole clinic on one screen.',
      body: 'Appointments, doctors, services and revenue update live, so the whole team works from the same picture of the day.',
    },
    viewfinder: { rec: 'Rec', meta: 'Visit 2291 · HD' },
    intake: {
      initials: 'PN',
      title: 'New intake',
      meta: 'Priya Nair · voice note',
      quote: '“Dry cough for five days. It\'s worse at night.”',
      tags: ['Cough · 5 days', 'No allergies'],
      ok: 'Insured',
    },
    careNotes: [
      { lead: { kind: 'rx' } as Lead, title: 'Prescription sent', meta: 'Riverside Pharmacy · 10:42' },
      { lead: { kind: 'time', day: 'Tue', time: '10:30' } as Lead, title: 'Follow-up booked', meta: 'Video visit' },
      { lead: { kind: 'initials', text: 'PN' } as Lead, title: 'Care plan shared', meta: '3 reminders scheduled' },
    ],
    call: {
      live: 'Live',
      title: 'Video visit',
      timer: '04:12',
      room: 'Private room',
      name: 'Dr. Sam Rivera · Family medicine',
      self: 'You',
      captionTag: 'CC',
      caption: 'How long has the cough been bothering you?',
    },
    deviceLabel: 'Interactive Telimedo workspace (sample data)',
    hint: {
      desk: 'Try it: switch the period, open Appointments or turn on dark mode. Sample data.',
      phone: "The clinic's day on a phone. Sample data.",
    },
  },

  product: {
    title: 'Booking, video, prescriptions and payments in one workspace.',
    intro: 'Replace the patchwork of booking tools, video apps and spreadsheets with one system your front desk, clinicians and managers share.',
    booking: {
      title: 'Online booking',
      body: 'Patients pick a real slot from your live schedule, and text and email reminders mean fewer missed visits.',
      doctor: { initials: 'SR', name: 'Dr. Sam Rivera', meta: 'Family medicine · video visit', length: '30 min' },
      days: [
        { day: 'Monday 28', short: 'Mon', date: '28', slots: [{ t: '9:00' }, { t: '9:30', taken: true }, { t: '11:15' }] },
        { day: 'Tuesday 29', short: 'Tue', date: '29', slots: [{ t: '8:30' }, { t: '10:00' }, { t: '14:00', taken: true }] },
        { day: 'Wednesday 30', short: 'Wed', date: '30', slots: [{ t: '9:00', taken: true }, { t: '13:45' }, { t: '16:30' }] },
        { day: 'Thursday 1', short: 'Thu', date: '1', slots: [{ t: '10:30' }, { t: '12:00' }, { t: '15:15' }] },
        { day: 'Friday 2', short: 'Fri', date: '2', slots: [{ t: '9:15' }, { t: '11:00', taken: true }, { t: '14:30' }] },
      ],
      prompt: 'Pick a time to see the confirmation patients get.',
      booked: (day: string, time: string) => `Booked for ${day} at ${time}. Confirmation sent by text and email.`,
    },
    waiting: {
      title: 'Waiting room and video',
      body: 'Clinicians see who is waiting in the virtual room and let them in with one click.',
      rows: [
        { initials: 'LS', name: 'Lucas Silva', status: 'Follow-up · waiting 2 min', admit: true },
        { initials: 'PN', name: 'Priya Nair', status: 'New patient · checked in', admit: true },
        { initials: 'SR', name: 'Sofia Rossi', status: 'Refill · intake done', time: '13:30' },
      ],
      admit: 'Admit',
      live: 'Live',
      inVisit: (secs: number) => `In visit · 00:${String(secs).padStart(2, '0')}`,
    },
    rx: {
      title: 'E-prescriptions',
      body: "Prescribe during the visit, with allergy and interaction checks, and send it to the patient's pharmacy.",
      mark: 'Rx',
      drug: 'Amoxicillin 500 mg',
      dose: '1 capsule, 3 times a day · 7 days',
      rows: [
        { label: 'Pharmacy', value: 'Riverside Pharmacy', good: false },
        { label: 'Checks', value: 'No interactions', good: true },
      ],
      status: 'Sent at 10:42',
    },
    analytics: {
      title: 'Live analytics',
      body: 'Appointments, completion rates, busy hours and revenue per doctor, updated as the day happens.',
      label: 'Appointments this week',
      value: '328',
      delta: '12%',
      chartLabel: 'Appointments per day this week, rising from 38 to 61',
    },
    reminders: {
      title: 'Reminders',
      body: 'Automatic reminders for visits, refills and follow-ups keep care plans moving between appointments.',
      meta: 'Text message · 9:00',
      text: 'Hi Priya, your video visit with Dr. Rivera is tomorrow at 10:30. Tap the link to join from your phone.',
      link: 'telimedo.app/v/2291',
    },
    records: {
      title: 'Patient records',
      body: 'History, notes, files and past visits in one timeline that everyone on the case can see.',
      items: [
        { title: 'Video visit', meta: 'Today · cough, 5 days' },
        { title: 'Lab results', meta: 'Mar 12 · blood count normal' },
        { title: 'Prescription refill', meta: 'Jan 30 · inhaler' },
      ],
    },
    payments: {
      title: 'Payments',
      body: 'Take card payments at booking, check insurance and send invoices without a separate system.',
      rows: [
        { label: 'Video visit, 30 min', value: '$65.00', good: false, total: false },
        { label: 'Insurance', value: 'Verified', good: true, total: false },
        { label: 'Paid by card ···· 4242', value: '$20.00', good: false, total: true },
      ],
    },
    team: {
      title: 'Team and roles',
      body: "Front desk, clinicians and managers each see what they need, and nothing they shouldn't.",
      people: [
        { initials: 'RC', name: 'Rosa Chen', role: 'Front desk', coral: false },
        { initials: 'SR', name: 'Dr. Sam Rivera', role: 'Clinician', coral: true },
        { initials: 'AM', name: 'Ana Moreno', role: 'Manager', coral: false },
      ],
    },
  },

  solutions: {
    title: 'Built for everyone in the visit.',
    tabsLabel: 'Who Telimedo is for',
    tabs: [
      {
        id: 'clinics',
        label: 'Clinics and hospitals',
        short: 'Clinics',
        title: 'Add virtual care without adding work.',
        body: 'Run video visits from the schedule you already have. Telimedo handles booking, intake, reminders and payments, so your team spends its time on patients.',
        more: ['Setup takes ', ph('two weeks', 'Placeholder: replace with your real onboarding time'), ', and we import your schedule and patient list. Front desk, clinicians and managers share one workspace, with live analytics for every location and doctor.'] as Rich,
        cta: { label: 'Book a demo', href: '#demo', kind: 'primary' as const },
        metricsLabel: 'Results clinics report (placeholder figures)',
        metrics: [
          { value: ph('38%', 'Placeholder', true), label: 'fewer no-shows', note: 'after automatic reminders' },
          { value: ph('6 min', 'Placeholder', true), label: 'saved per visit', note: 'with intake done before the call' },
          { value: ph('4.8/5', 'Placeholder', true), label: 'average patient rating', note: 'across video visits' },
        ],
      },
      {
        id: 'employers',
        label: 'Employers and health plans',
        short: 'Employers',
        title: 'Care your people can reach between meetings.',
        body: 'Offer Telimedo as a health benefit. Employees and members see a clinician from their phone, often the same day, and you get usage reports without personal health data.',
        more: 'Visits happen with partner clinics, and sign-up is simple for employees and their families. Satisfaction reports are anonymised too.' as Rich,
        cta: { label: 'Talk to our team', href: '#demo', kind: 'primary' as const },
        metricsLabel: 'Employer results (placeholder figures)',
        metrics: [
          { value: ph('71%', 'Placeholder', true), label: 'of visits handled without a trip', note: 'across employer plans' },
          { value: ph('2.4 h', 'Placeholder', true), label: 'less time away from work', note: 'per visit, on average' },
          { value: ph('89%', 'Placeholder', true), label: 'of members would use it again', note: 'in post-visit surveys' },
        ],
      },
      {
        id: 'patients',
        label: 'Patients',
        short: 'Patients',
        title: 'See your clinician without the waiting room.',
        body: 'Book a visit, join from a link and get your prescription and care plan on your phone. Your records stay in one place, and only your care team can see them.',
        more: "There's no app to install and no password to remember. You get reminders for follow-ups and refills." as Rich,
        cta: { label: 'Questions patients ask', href: '#faq', kind: 'ghost' as const },
        metricsLabel: 'What patients get',
        points: [
          { label: 'Any phone', note: 'A link by text or email opens the visit.' },
          { label: 'Your pharmacy', note: 'Prescriptions go to the one you choose, during the visit.' },
          { label: 'Private', note: 'Only your care team can see your records.' },
        ],
      },
    ],
  },

  results: {
    title: 'What changes when visits move online.',
    stats: [
      { value: ph('120+', 'Placeholder', true), label: 'clinics and practices' },
      { value: ph('250k', 'Placeholder', true), label: 'video visits completed' },
      { value: ph('38%', 'Placeholder', true), label: 'fewer no-shows on average' },
      { value: ph('4.8/5', 'Placeholder', true), label: 'patient satisfaction' },
    ],
    quote: {
      text: ph(
        'Our patients used to take half a day off for a ten-minute follow-up. Now they join from their kitchen, and our doctors see two more patients every morning.',
        'Placeholder: replace with a real customer quote',
        true,
      ),
      initials: 'AM',
      name: ph('Dr. Amelia Moreno', 'Placeholder'),
      role: ph('Medical director, Northside Family Practice', 'Placeholder'),
    },
  },

  security: {
    title: 'Every view, change and prescription is on the record.',
    intro: 'Patients trust you with their health information, and Telimedo protects it at every step of the visit.',
    badges: [
      { badge: 'HIPAA', label: 'compliant', note: 'For clinics serving US patients' },
      { badge: 'GDPR', label: 'compliant', note: 'For clinics serving EU patients' },
    ],
    /** The visit's audit trail, shown as a screen from the app. The safeguards appear where they happen. */
    record: {
      title: 'Visit record',
      id: 'P-2291',
      meta: 'Every view and change is logged',
      sample: 'Sample data',
      rows: [
        { lead: { kind: 'initials', text: 'SR' }, action: 'Chart opened', who: 'Dr. S. Rivera, clinician', tag: 'P-2291', tone: 'plain', time: '10:42:08' },
        { lead: { kind: 'rx' }, action: 'Prescription signed', who: 'Dr. S. Rivera', tag: 'Rx-8812', tone: 'rx', time: '10:42:31' },
        { lead: { kind: 'rx' }, action: 'Sent to Riverside Pharmacy', who: 'System', tag: 'Encrypted', tone: 'safe', time: '10:43:02' },
        { lead: { kind: 'initials', text: 'RC' }, action: 'Follow-up booked', who: 'R. Chen, front desk', tag: 'Tuesday', tone: 'plain', time: '10:43:40' },
        { lead: { kind: 'initials', text: 'PN' }, action: 'Care plan viewed', who: 'Patient', tag: 'Consent on file', tone: 'safe', time: '10:44:15' },
      ] as RecordRow[],
    },
    note: [
      'Video, messages and records are encrypted in transit and at rest. Each person sees only what their role needs, from front desk to medical director, and consent is captured before the first visit. Patient data is hosted in ',
      ph('the US and the EU', 'Placeholder: your hosting regions'),
      ', close to your patients. ',
      ph('We sign a BAA with every US clinic on any plan.', 'Placeholder: confirm your BAA terms'),
    ] as Rich,
  },

  pricing: {
    title: 'Priced per clinician. Patients and staff are free.',
    billingLabel: 'Billing period',
    monthly: 'Monthly',
    annual: 'Annual',
    save: ph('save 15%', 'Placeholder: confirm your annual discount'),
    per: { m: 'per clinician / month', a: 'per clinician / month, billed yearly' },
    priceNote: 'Placeholder price',
    featuresLabel: (plan: string) => `What ${plan} includes`,
    plans: [
      {
        name: 'Starter',
        tag: null as string | null,
        for: 'For small practices starting with virtual care.',
        price: { m: 49, a: 42 } as { m: number; a: number } | null,
        custom: null as { label: string; per: string } | null,
        cta: { label: 'Book a demo', href: '#demo', kind: 'ghost' as 'ghost' | 'primary' },
        features: ['Online booking and reminders', 'Video visits with waiting room', 'E-prescriptions', 'Email support'],
      },
      {
        name: 'Clinic',
        tag: 'Most popular' as string | null,
        for: 'For growing clinics with several doctors.',
        price: { m: 89, a: 76 } as { m: number; a: number } | null,
        custom: null as { label: string; per: string } | null,
        cta: { label: 'Book a demo', href: '#demo', kind: 'primary' as 'ghost' | 'primary' },
        features: ['Everything in Starter', 'Live analytics dashboard', 'Care plans and payments', 'Multiple locations', 'Priority support'],
      },
      {
        name: 'Enterprise',
        tag: null as string | null,
        for: 'For hospitals, networks and health plans.',
        price: null as { m: number; a: number } | null,
        custom: { label: 'Custom', per: 'annual agreement' } as { label: string; per: string } | null,
        cta: { label: 'Talk to sales', href: '#demo', kind: 'ghost' as 'ghost' | 'primary' },
        features: ['Everything in Clinic', 'Single sign-on (SSO)', 'Integrations with your EHR', 'Dedicated success manager'],
      },
    ],
    fine: 'Prices in USD. Front desk staff, managers and patients are always free.',
  },

  faq: {
    title: 'Questions clinics ask us.',
    ask: { title: 'Still deciding?', body: 'Book a 30-minute demo and ask us anything, from setup to billing.', cta: { label: 'Book a demo', href: '#demo' } },
    items: [
      { q: 'Do patients need to download an app?', a: 'No. Patients get a link by text or email and join the visit in their browser on any phone, tablet or computer.' as Rich },
      { q: 'Is Telimedo HIPAA and GDPR compliant?', a: 'Yes. Telimedo is HIPAA and GDPR compliant. Visits and records are encrypted, access is role-based and every action on a record is written to the audit log.' as Rich },
      { q: 'How long does it take to get started?', a: ['Most clinics are live within ', ph('two weeks', 'Placeholder'), '. We import your schedule and patient list, set up your services and train your team.'] as Rich },
      { q: 'Does it work with our EHR?', a: [ph("Telimedo connects to common EHR systems on the Enterprise plan. Tell us which one you use and we'll confirm during the demo.", 'Placeholder: list your real integrations')] as Rich },
      { q: 'How is pricing calculated?', a: 'You pay per clinician per month. Front desk staff, managers and patients are free, and you can add or remove clinicians at any time.' as Rich },
      { q: 'Can patients see a doctor on the same day?', a: "That depends on your clinic's availability. Patients see open slots in real time, and you can reserve slots for same-day visits." as Rich },
    ],
  },

  demo: {
    title: 'Bring care closer.',
    lede: 'See a visit from both sides of the screen, and how Telimedo would fit your clinic.',
    fields: {
      name: { label: 'Full name', error: 'Enter your name.' },
      email: { label: 'Work email', error: 'Enter an email address like name@clinic.com.' },
      org: { label: 'Clinic or organisation' },
      size: { label: 'Number of clinicians', options: ['1 to 5', '6 to 20', '21 to 100', 'More than 100'] },
    },
    submit: 'Book my demo',
    done: "Thanks. We'll email you within one business day to pick a time.",
    doneFor: (first: string, email: string) => `Thanks, ${first}. We'll email ${email} within one business day to pick a time.`,
    failed: "We couldn't send your request. Check your connection and try again.",
    note: ["We'll only use your details to arrange the demo. ", ph('This form is not connected yet.', 'Connect this form to your inbox or CRM before launch')] as Rich,
  },

  footer: {
    line: 'The telemedicine platform for clinics, hospitals and the people they care for.',
    contact: [ph('hello@telimedo.com', 'Placeholder contact email'), ph('+1 (555) 010-2030', 'Placeholder phone number')],
    columns: [
      {
        title: 'Product',
        links: [
          { label: 'How it works', href: '/how-it-works' },
          { label: 'Features', href: '/product' },
          { label: 'Security', href: '/security' },
          { label: 'Pricing', href: '/pricing' },
        ] as Link[],
      },
      {
        title: 'Solutions',
        links: [
          { label: 'Clinics and hospitals', href: '/solutions#clinics' },
          { label: 'Employers and health plans', href: '/solutions#employers' },
          { label: 'Patients', href: '/solutions#patients' },
        ] as Link[],
      },
      {
        title: 'Company',
        links: [
          { label: 'About', href: '#about', placeholder: { note: 'Placeholder: link to your About page' } },
          { label: 'Careers', href: '#careers', placeholder: { note: 'Placeholder: link to your Careers page' } },
          { label: 'Contact', href: '/#demo' },
        ] as Link[],
      },
      {
        title: 'Legal',
        links: [
          { label: 'Privacy policy', href: '#privacy', placeholder: { note: 'Placeholder: link to your privacy policy' } },
          { label: 'Terms of service', href: '#terms', placeholder: { note: 'Placeholder: link to your terms of service' } },
          { label: 'HIPAA notice', href: '#hipaa', placeholder: { note: 'Placeholder: link to your HIPAA notice' } },
        ] as Link[],
      },
    ],
    rights: (year: number) => `© ${year} Telimedo. All rights reserved.`,
    tagline: 'Care closer to you',
  },

  sayHi: 'Say hi',

  pages: {
    underConstruction: {
      body: 'This page is still being built. The short version is on the home page, and we can walk you through the rest in a demo.',
      back: 'Read the short version',
      demo: 'Book a demo',
    },
    list: {
      'how-it-works': {
        title: 'How it works',
        description: 'How a Telimedo video visit works, from the first message to the follow-up.',
        section: '/#how',
      },
      product: {
        title: 'Product',
        description: 'Booking, video visits, e-prescriptions, reminders, records and payments in one workspace.',
        section: '/#product',
      },
      solutions: {
        title: 'Solutions',
        description: 'Telimedo for clinics and hospitals, employers and health plans, and patients.',
        section: '/#solutions',
      },
      security: {
        title: 'Security',
        description: 'How Telimedo protects patient data, with encryption, role-based access and a full audit trail.',
        section: '/#security',
      },
      pricing: {
        title: 'Pricing',
        description: 'Telimedo is priced per clinician. Patients and staff are free.',
        section: '/#pricing',
      },
    },
  },

  notFound: {
    metaTitle: 'Page not found',
    title: "This page isn't here.",
    body: 'The link may be out of date, or the page has moved.',
    home: 'Go to the home page',
  },
} as const;

export type Site = typeof site;
