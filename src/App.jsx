import { useState, useEffect } from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';
import {
  Github,
  Linkedin,
  Mail,
  ChevronDown,
  Code2,
  Zap,
  Users,
  Trophy,
  GraduationCap,
  Rocket,
  Briefcase,
  Cpu,
  Database as DatabaseIcon
} from 'lucide-react';
import {
  SiPython,
  SiGo,
  SiJavascript,
  SiRust,
  SiRuby,
  SiReact,
  SiHtml5,
  SiCss3,
  SiRedux,
  SiNodedotjs,
  SiAndroid,
  SiNginx,
  SiMysql,
  SiMongodb,
  SiRedis,
  SiPostgresql,
  SiFirebase,
  SiDjango,
  SiKubernetes,
  SiRubyonrails,
  SiTensorflow,
  SiHeroku,
  SiSelenium,
  SiMocha,
  SiLinux,
  SiTailwindcss,
  SiGrafana,
  SiOpenjdk,
  SiGit,
  SiKaggle,
  SiYoutube,
  SiInstagram,
  SiClickhouse,
  SiPrometheus
} from 'react-icons/si';
import CosmicCanvas from './CosmicCanvas';
import TiltCard from './TiltCard';
import SideRails from './SideRails';
import './App.css';

const NAME = 'Victor Varian';

const ROLES = [
  'Backend Software Engineer',
  'Distributed Systems Builder',
  'Algorithmic Trader',
  'Android Developer',
  'Tech Enthusiast'
];

const SOCIALS = [
  { icon: Github, href: 'https://github.com/victorvic54', label: 'GitHub' },
  { icon: Linkedin, href: 'https://linkedin.com/in/victor-varian', label: 'LinkedIn' },
  { icon: SiKaggle, href: 'https://kaggle.com/victorvic', label: 'Kaggle' },
  { icon: SiInstagram, href: 'https://www.instagram.com/victor.varian/', label: 'Instagram' },
  { icon: SiYoutube, href: 'https://www.youtube.com/@victor.varian', label: 'YouTube' }
];

const STATS = [
  { number: '4+ Years', label: 'Professional Experience', icon: Briefcase },
  { number: '10B+', label: 'DB Rows Migrated Across 14 Regions', icon: DatabaseIcon },
  { number: '88%', label: 'Storage Saved with Clickhouse', icon: Zap },
  { number: 'Top 1%', label: 'of 20,389 Teams — IMC Prosperity 3.0', icon: Trophy }
];

const EXPERIENCES = [
  {
    company: 'Airwallex Singapore',
    role: 'Backend Software Engineer',
    period: 'Apr 2026 — Present',
    accent: 'pink',
    logo: 'airwallex',
    note: 'Recently joined — building and scaling backend systems in global fintech.'
  },
  {
    company: 'Shopee Singapore',
    role: 'Backend Software Engineer',
    period: 'June 2022 — Mar 2026',
    accent: 'orange',
    logo: 'shopee',
    highlights: [
      "Led a team of 4 and guided key business decisions driving ~80% of Shopee's quarterly revenue, involving 100+ stakeholders",
      'Designed a distributed counting service enabling high-availability delta updates with full audit and reconciliation support',
      "Boosted development time by 25%+ with config-based implementation for Shopee's tax compliance across 12 regions",
      'Built an automated campaign observability reporting service in Python, leveraging Prometheus/Thanos, Jenkins, and Seatalk',
      'Drove the migration of 10 billion rows and 3 TB of Settlement System primary databases across 14 regions from TiDB to MySQL',
      'Kickstarted Clickhouse as a secondary database for analytical and online queries, replacing Elasticsearch — saving up to 88% in storage with improved query performance'
    ]
  },
  {
    company: 'National University of Singapore',
    role: 'Graduated from NUS',
    period: 'May 2022',
    isGraduation: true
  },
  {
    company: 'Sensetime Singapore',
    role: 'Frontend Software Engineer Intern',
    period: 'Dec 2021 — Mar 2022',
    accent: 'violet',
    logo: 'sensetime',
    highlights: [
      'Built a commercial website from scratch showcasing Sensetime AI photo technology tools to stakeholders',
      'Designed a simplified Photoshop-like editor integrating Sensetime AI (image sharpening, generative fill) using React'
    ]
  },
  {
    company: 'Sea Singapore',
    role: 'Backend Software Engineer Intern',
    period: 'May 2021 — Aug 2021',
    accent: 'cyan',
    logo: 'sea',
    highlights: [
      'Created a filesystem implementing the Linux FUSE interface using JuiceFS with a custom filestore engine, in Golang',
      'Developed a filestore and blockstore CLI engine in Rust optimized for numerous small files, outperforming MinIO in CRUD performance'
    ]
  },
  {
    company: 'Shopee Singapore',
    role: 'Data Science Intern',
    period: 'Dec 2020 — Apr 2021',
    accent: 'orange',
    logo: 'shopee',
    highlights: [
      'Created a Named Entity Recognition neural network benchmarked against pretrained shopee-roBERTa models, with a 3% F1-score improvement',
      "Analyzed traditional and state-of-the-art neural machine translation against Shopee's human translation datasets",
      'Built a semantic similarity model with sentence-transformers to predict whether two product titles share the same category'
    ]
  },
  {
    company: 'SAP ML Foundation Singapore',
    role: 'Backend Software Engineer Intern',
    period: 'Jan 2020 — Jun 2020',
    accent: 'blue',
    logo: 'sap',
    highlights: [
      'Implemented a performance test tool (Vegeta) to load-test numerous model servers deployed in SAP DI Cloud',
      'Designed logging and statistics endpoints on profiled data enabling early error detection and live data analysis, in Python'
    ]
  }
];

const EDUCATION_HIGHLIGHTS = [
  'Led a team of engineers across 4 software engineering modules at NUS (CS2103, CS3219, CS4218, CS4225)',
  'Developed an Android & iOS online chat-drawing app with VoIP services and Google Firebase as the database',
  'Coached 10+ students and represented Computing to win 1st as a team in the Othello Inter-Faculty Games'
];

const TECH_STACK = {
  'Programming Languages': [
    { name: 'Python', icon: SiPython },
    { name: 'Golang', icon: SiGo },
    { name: 'Java', icon: SiOpenjdk },
    { name: 'JavaScript', icon: SiJavascript },
    { name: 'Ruby', icon: SiRuby },
    { name: 'Rust', icon: SiRust }
  ],
  'Backend & Infrastructure': [
    { name: 'Node.js', icon: SiNodedotjs },
    { name: 'Django', icon: SiDjango },
    { name: 'Ruby on Rails', icon: SiRubyonrails },
    { name: 'Kubernetes', icon: SiKubernetes },
    { name: 'Nginx', icon: SiNginx },
    { name: 'Prometheus', icon: SiPrometheus }
  ],
  'Databases': [
    { name: 'MySQL', icon: SiMysql },
    { name: 'Clickhouse', icon: SiClickhouse },
    { name: 'PostgreSQL', icon: SiPostgresql },
    { name: 'MongoDB', icon: SiMongodb },
    { name: 'Redis', icon: SiRedis },
    { name: 'Firebase', icon: SiFirebase }
  ],
  'Frontend & Mobile': [
    { name: 'React', icon: SiReact },
    { name: 'Redux', icon: SiRedux },
    { name: 'Android', icon: SiAndroid },
    { name: 'HTML5', icon: SiHtml5 },
    { name: 'CSS3', icon: SiCss3 },
    { name: 'Tailwind CSS', icon: SiTailwindcss }
  ],
  'ML & Tooling': [
    { name: 'TensorFlow', icon: SiTensorflow },
    { name: 'Grafana', icon: SiGrafana },
    { name: 'Selenium', icon: SiSelenium },
    { name: 'Mocha', icon: SiMocha },
    { name: 'Linux', icon: SiLinux },
    { name: 'Git', icon: SiGit },
    { name: 'Heroku', icon: SiHeroku }
  ]
};

const ACHIEVEMENTS = [
  {
    title: 'IMC Prosperity 3.0 World Trading Competition',
    description: 'Top 1% from 20,389 teams',
    year: "May 2025",
    category: 'Algorithmic Trading',
    featured: true
  },
  {
    title: 'IMC Prosperity 2.0 World Trading Competition',
    description: 'Top 4% from 10,007 teams',
    year: "May 2024",
    category: 'Algorithmic Trading',
    featured: true
  },
  {
    title: 'Grab Business Case Challenge',
    description: '3rd place team winner',
    year: "Apr 2021",
    category: 'Business'
  },
  {
    title: 'NUS Data Science Competition',
    description: '1st place team winner',
    year: "Jan 2021",
    category: 'Data Science',
    featured: true
  },
  {
    title: 'JP Morgan Code for Good',
    description: '1st place team winner',
    year: "Oct 2020",
    category: 'Hackathon',
    featured: true
  },
  {
    title: 'Shopee Code League — Sentiment Analysis',
    description: 'Top 2% from 350 teams',
    year: "Jul 2020",
    category: 'Machine Learning'
  },
  {
    title: 'Shopee Code League — Product Detection',
    description: 'Top 9% from 800 teams',
    year: "Jun 2020",
    category: 'Machine Learning'
  },
  {
    title: 'Singapore Mathematical Olympiad — Open Section',
    description: 'Silver Award',
    year: "Nov 2017",
    category: 'Mathematics'
  }
];

const NAV_ITEMS = [
  { id: 'home', label: 'Home' },
  { id: 'about', label: 'About' },
  { id: 'experience', label: 'Experience' },
  { id: 'achievements', label: 'Achievements' },
  { id: 'contact', label: 'Contact' }
];

const getArticle = (text) => {
  if (!text) return 'a';
  return 'aeiou'.includes(text.trim().charAt(0).toLowerCase()) ? 'an' : 'a';
};

const sectionReveal = {
  initial: { opacity: 0, y: 48 },
  whileInView: { opacity: 1, y: 0 },
  transition: { duration: 0.7, ease: 'easeOut' },
  viewport: { once: true, margin: '-80px' }
};

function CompanyLogo({ logo, company }) {
  if (!logo) return null;
  return (
    <div className="experience-logo" aria-hidden="true">
      <img src={`${import.meta.env.BASE_URL}logos/${logo}.png`} alt={company} width="64" height="64" loading="lazy" />
    </div>
  );
}

function OrbitSystem() {
  return (
    <div className="orbit-system" aria-hidden="true">
      <div className="orbit-glow" />
      <div className="orbit-core">VV</div>
      <div className="orbit-ring ring-a"><span className="orbit-dot dot-cyan" /></div>
      <div className="orbit-ring ring-b"><span className="orbit-dot dot-violet" /></div>
      <div className="orbit-ring ring-c"><span className="orbit-dot dot-pink" /></div>
    </div>
  );
}

function App() {
  const [activeSection, setActiveSection] = useState('home');
  const [headerVisible, setHeaderVisible] = useState(false);
  const { scrollYProgress } = useScroll();
  const progressX = useSpring(scrollYProgress, { stiffness: 120, damping: 28, restDelta: 0.001 });

  // Typewriter effect for rotating roles
  const [currentRole, setCurrentRole] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fullText = ROLES[currentRole];
    let timer;
    if (!isDeleting) {
      if (displayText.length < fullText.length) {
        timer = setTimeout(() => setDisplayText(fullText.substring(0, displayText.length + 1)), 85);
      } else {
        timer = setTimeout(() => setIsDeleting(true), 2200);
      }
    } else if (displayText.length > 0) {
      timer = setTimeout(() => setDisplayText(fullText.substring(0, displayText.length - 1)), 42);
    } else {
      setIsDeleting(false);
      setCurrentRole((prev) => (prev + 1) % ROLES.length);
    }
    return () => clearTimeout(timer);
  }, [displayText, isDeleting, currentRole]);

  // Header visibility + active section tracking
  useEffect(() => {
    const handleScroll = () => {
      setHeaderVisible(window.scrollY > 100);
      const sections = NAV_ITEMS.map((n) => n.id);
      for (let i = sections.length - 1; i >= 0; i--) {
        const el = document.getElementById(sections[i]);
        if (el && el.getBoundingClientRect().top <= 160) {
          setActiveSection(sections[i]);
          break;
        }
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (!element) return;
    const offsetPosition = element.getBoundingClientRect().top + window.pageYOffset - 80;
    window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
  };

  const letterContainer = {
    hidden: {},
    show: { transition: { staggerChildren: 0.045, delayChildren: 0.45 } }
  };
  const letterItem = {
    hidden: { opacity: 0, y: 34, rotateX: 90 },
    show: { opacity: 1, y: 0, rotateX: 0, transition: { type: 'spring', stiffness: 320, damping: 24 } }
  };

  return (
    <div className="app">
      {/* Layer 0: deep-space background */}
      <CosmicCanvas />
      <div className="aurora" aria-hidden="true">
        <div className="aurora-blob blob-1" />
        <div className="aurora-blob blob-2" />
        <div className="aurora-blob blob-3" />
      </div>
      <div className="grid-overlay" aria-hidden="true" />
      <div className="noise-overlay" aria-hidden="true" />

      {/* Desktop-only gutter fillers: asteroid mini-game (left), cosmic scene (right) */}
      <SideRails />

      {/* Scroll progress */}
      <motion.div className="scroll-progress" style={{ scaleX: progressX }} />

      {/* Floating navigation */}
      <motion.nav
        className="floating-header"
        initial={false}
        animate={{ y: headerVisible ? 0 : -110, opacity: headerVisible ? 1 : 0 }}
        transition={{ duration: 0.35, ease: 'easeInOut' }}
      >
        <div className="header-container">
          <button className="header-logo" onClick={() => scrollToSection('home')} aria-label="Back to top">
            VV
          </button>
          <div className="header-nav">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                className={`nav-link ${activeSection === item.id ? 'active' : ''}`}
                onClick={() => scrollToSection(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </motion.nav>

      {/* ============ HERO ============ */}
      <section className="hero-section" id="home">
        <div className="hero-content">
          <motion.div
            className="hero-badge"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
          >
            <span className="badge-dot" />
            Backend Software Engineer @ Airwallex Singapore
          </motion.div>

          <motion.p
            className="hero-greeting"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
          >
            Hi there, I&apos;m
          </motion.p>

          <motion.h1
            className="hero-name"
            variants={letterContainer}
            initial="hidden"
            animate="show"
            aria-label={NAME}
          >
            {NAME.split('').map((ch, i) => (
              <motion.span
                key={i}
                className="hero-letter"
                variants={letterItem}
                style={{ '--i': i }}
                aria-hidden="true"
              >
                {ch === ' ' ? ' ' : ch}
              </motion.span>
            ))}
          </motion.h1>

          <motion.div
            className="hero-role"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 1.15 }}
          >
            <span className="role-prefix">I&apos;m {getArticle(displayText)}&nbsp;</span>
            <span className="role-text">{displayText}</span>
            <span className="cursor-blink">▌</span>
          </motion.div>

          <motion.p
            className="hero-description"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 1.3 }}
          >
            A backend engineer who enjoys building reliable, scalable systems and solving
            tricky data and infrastructure problems.
          </motion.p>

          <motion.div
            className="hero-cta"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 1.45 }}
          >
            <a href="#contact" className="cta-button primary" onClick={(e) => { e.preventDefault(); scrollToSection('contact'); }}>
              <Rocket size={18} />
              <span>Let&apos;s Connect</span>
            </a>
            <a href="mailto:victor.vic11@yahoo.com" className="cta-button secondary">
              <Mail size={18} />
              <span>Email Me</span>
            </a>
          </motion.div>

          <motion.div
            className="social-links"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 1.65 }}
          >
            {SOCIALS.map((social) => {
              const Icon = social.icon;
              return (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-link-item"
                  title={social.label}
                  aria-label={social.label}
                >
                  <Icon size={22} />
                </a>
              );
            })}
          </motion.div>
        </div>

        <motion.button
          className="scroll-indicator"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
          onClick={() => scrollToSection('about')}
          aria-label="Scroll to About"
        >
          <span className="scroll-text">Scroll to explore</span>
          <motion.span
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
          >
            <ChevronDown size={26} />
          </motion.span>
        </motion.button>
      </section>

      {/* ============ STATS ============ */}
      <section className="stats-section">
        <div className="container">
          <div className="stats-grid">
            {STATS.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.55, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <TiltCard className="stat-card">
                    <Icon className="stat-icon" size={26} />
                    <div className="stat-number">{stat.number}</div>
                    <div className="stat-label">{stat.label}</div>
                  </TiltCard>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============ ABOUT ============ */}
      <section className="about-section" id="about">
        <div className="container">
          <motion.div {...sectionReveal}>
            <p className="section-kicker">01 · Who I Am</p>
            <h2 className="section-title">About Me</h2>

            <div className="about-grid">
              <div className="about-text">
                <h3>Backend Software Engineer &amp; Problem Solver</h3>
                <p>
                  I&apos;m Victor Varian, a Backend Software Engineer at Airwallex Singapore. Previously
                  at Shopee, I led a team of 4 engineers and helped guide key business decisions driving
                  ~80% of Shopee&apos;s quarterly revenue, working with 100+ stakeholders across the company.
                </p>
                <p>
                  I graduated with Honors (Distinction) from the{' '}
                  <strong className="highlight">National University of Singapore</strong>, majoring in
                  Software Engineering and Artificial Intelligence. My work spans distributed systems
                  (a high-availability counting service with full audit support), massive data
                  migrations (10 billion rows across 14 regions from TiDB to MySQL), and pioneering
                  Clickhouse adoption that cut storage usage by 88%.
                </p>
                <p>
                  Off the clock, I compete in world algorithmic trading competitions — most recently
                  placing in the top 1% of 20,389 teams in IMC Prosperity 3.0 — and mentor fellow
                  engineers.
                </p>
                <div className="about-note">
                  <b>I do have weaknesses:</b> I may require additional time to adapt to new
                  technologies and environments — but I&apos;m committed to continuous learning and
                  confident in delivering results given adequate time and resources. That&apos;s why I
                  love project-based work and competitions over exam-style assessments.
                </div>
                <div className="about-highlights">
                  <div className="highlight-item"><Code2 size={20} /><span>Clean Code</span></div>
                  <div className="highlight-item"><Cpu size={20} /><span>Systems at Scale</span></div>
                  <div className="highlight-item"><Zap size={20} /><span>Performance</span></div>
                  <div className="highlight-item"><Users size={20} /><span>Team Leadership</span></div>
                </div>
              </div>
              <div className="about-visual">
                <OrbitSystem />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ============ EXPERIENCE ============ */}
      <section className="experience-section" id="experience">
        <div className="container">
          <motion.div {...sectionReveal}>
            <p className="section-kicker">02 · Where I&apos;ve Been</p>
            <h2 className="section-title">Work Experience</h2>
            <p className="section-subtitle">My professional journey, from ML intern to leading a backend team</p>
          </motion.div>

          <div className="experience-timeline">
            {EXPERIENCES.map((exp, index) =>
              exp.isGraduation ? (
                <motion.div
                  key={`${exp.company}-${exp.period}`}
                  className="graduation-item"
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                  viewport={{ once: true }}
                >
                  <span className="graduation-pill">
                    <GraduationCap size={16} />
                    {exp.role} · {exp.period}
                  </span>
                </motion.div>
              ) : (
                <motion.div
                  key={`${exp.company}-${exp.period}`}
                  className="experience-item"
                  initial={{ opacity: 0, x: -40 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.55, delay: Math.min(index * 0.08, 0.3) }}
                  viewport={{ once: true, margin: '-60px' }}
                >
                  <div className={`experience-marker accent-${exp.accent}`} />
                  <CompanyLogo logo={exp.logo} company={exp.company} />
                  <div className="experience-content">
                    <div className="experience-header">
                      <div>
                        <h3 className="experience-role">{exp.role}</h3>
                        <div className={`experience-company text-${exp.accent}`}>{exp.company}</div>
                      </div>
                      <div className="experience-period">{exp.period}</div>
                    </div>
                    {exp.highlights ? (
                      <ul className="experience-highlights">
                        {exp.highlights.map((highlight) => (
                          <li key={highlight}>{highlight}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="experience-note">{exp.note}</p>
                    )}
                  </div>
                </motion.div>
              )
            )}
          </div>
        </div>
      </section>

      {/* ============ EDUCATION ============ */}
      <section className="education-section">
        <div className="container">
          <motion.div {...sectionReveal}>
            <p className="section-kicker">03 · Where I Learned</p>
            <h2 className="section-title">Education</h2>

            <TiltCard className="education-card" maxTilt={4}>
              <div className="education-grid">
                <div className="education-header">
                  <div className="education-emblem">
                    <img src={`${import.meta.env.BASE_URL}logos/nus.png`} alt="National University of Singapore" width="64" height="64" />
                  </div>
                  <div>
                    <div className="education-degree">Bachelor of Computer Science, Honors (Distinction)</div>
                    <div className="education-school">National University of Singapore · Class of 2022</div>
                    <div className="education-major">
                      Major in Software Engineering &amp; Artificial Intelligence · Awarded a tuition grant
                    </div>
                  </div>
                </div>
                <ul className="education-highlights">
                  {EDUCATION_HIGHLIGHTS.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </TiltCard>
          </motion.div>
        </div>
      </section>

      {/* ============ TECH STACK ============ */}
      <section className="tech-section">
        <div className="container">
          <motion.div {...sectionReveal}>
            <p className="section-kicker">04 · What I Use</p>
            <h2 className="section-title">My Stack</h2>
          </motion.div>

          <div className="tech-stack-container">
            {Object.entries(TECH_STACK).map(([category, items], catIndex) => (
              <motion.div
                key={category}
                className="tech-category"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: Math.min(catIndex * 0.08, 0.25) }}
                viewport={{ once: true }}
              >
                <h3 className="tech-category-title">{category}</h3>
                <div className="tech-items-grid">
                  {items.map((item) => {
                    const IconComponent = item.icon;
                    return (
                      <div key={item.name} className="tech-item-pill">
                        <IconComponent className="tech-icon" />
                        <span className="tech-name">{item.name}</span>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ ACHIEVEMENTS ============ */}
      <section className="achievements-section" id="achievements">
        <div className="container">
          <motion.div {...sectionReveal}>
            <p className="section-kicker">05 · What I&apos;ve Won</p>
            <h2 className="section-title">Achievements</h2>
            <p className="section-subtitle">Competition wins and recognitions across trading, ML, and hackathons</p>
          </motion.div>

          <div className="achievements-grid">
            {ACHIEVEMENTS.map((achievement, index) => (
              <motion.div
                key={achievement.title + achievement.year}
                initial={{ opacity: 0, y: 26 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: Math.min(index * 0.06, 0.3) }}
                viewport={{ once: true }}
              >
                <TiltCard className={`achievement-card ${achievement.featured ? 'featured' : ''}`}>
                  <div className="achievement-header">
                    <span className="achievement-year">{achievement.year}</span>
                    <span className="achievement-category">{achievement.category}</span>
                  </div>
                  <h3 className="achievement-title">
                    {achievement.featured && <Trophy size={16} className="achievement-trophy" />}
                    {achievement.title}
                  </h3>
                  <p className="achievement-description">{achievement.description}</p>
                </TiltCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ CONTACT ============ */}
      <section className="contact-section" id="contact">
        <div className="container">
          <motion.div {...sectionReveal} className="contact-content">
            <p className="section-kicker center">06 · Say Hello</p>
            <h2 className="contact-title">Let&apos;s Make It Happen</h2>
            <p className="contact-subtitle">
              I specialize in scalable distributed systems, database optimization, and machine
              learning — and I&apos;m always open to exciting opportunities.
            </p>

            <div className="contact-buttons">
              <a href="mailto:victor.vic11@yahoo.com" className="cta-button primary large">
                <Mail size={20} />
                Get In Touch
              </a>
              <a
                href="https://linkedin.com/in/victor-varian"
                target="_blank"
                rel="noopener noreferrer"
                className="cta-button secondary large"
              >
                <Linkedin size={20} />
                Connect on LinkedIn
              </a>
            </div>

            <div className="availability-badge">
              <span className="status-dot" />
              CURRENTLY AT AIRWALLEX SINGAPORE
            </div>
          </motion.div>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <p className="footer-copy">© 2026 Victor Varian. Crafted among the stars ✦</p>
            <div className="footer-links">
              {NAV_ITEMS.map((item) => (
                <button key={item.id} onClick={() => scrollToSection(item.id)}>
                  {item.label}
                </button>
              ))}
              <a className="footer-games-link" href="/games/">
                Games
              </a>
            </div>
            <div className="footer-social">
              {SOCIALS.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={social.label}
                    aria-label={social.label}
                  >
                    <Icon size={18} />
                  </a>
                );
              })}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
