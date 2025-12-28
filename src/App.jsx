import { useState, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import {
  Github,
  Linkedin,
  Mail,
  ChevronDown,
  Code2,
  Palette,
  Zap,
  Users,
  Globe
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
  SiCloudflare,
  SiTailwindcss,
  SiGrafana,
  SiOpenjdk,
  SiGit,
  SiKaggle,
  SiYoutube,
  SiInstagram
} from 'react-icons/si';
import './App.css';

function App() {
  const [activeSection, setActiveSection] = useState('home');
  const [headerVisible, setHeaderVisible] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const { scrollY } = useScroll();
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);
  const scale = useTransform(scrollY, [0, 300], [1, 0.8]);

  // Animated text rotation
  const roles = [
    'Backend Software Engineer.',
    'Android Developer.',
    'Algorithmic Trader.',
    'Tech Lovers.'
  ];

  const [currentRole, setCurrentRole] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [typingSpeed, setTypingSpeed] = useState(150);

  useEffect(() => {
    const handleTyping = () => {
      const fullText = roles[currentRole];

      if (!isDeleting) {
        // Typing forward
        if (displayText.length < fullText.length) {
          setDisplayText(fullText.substring(0, displayText.length + 1));
          setTypingSpeed(100);
        } else {
          // Finished typing, wait before deleting
          setTimeout(() => setIsDeleting(true), 2000);
        }
      } else {
        // Deleting
        if (displayText.length > 0) {
          setDisplayText(fullText.substring(0, displayText.length - 1));
          setTypingSpeed(50);
        } else {
          // Finished deleting, move to next role
          setIsDeleting(false);
          setCurrentRole((prev) => (prev + 1) % roles.length);
        }
      }
    };

    const timer = setTimeout(handleTyping, typingSpeed);
    return () => clearTimeout(timer);
  }, [displayText, isDeleting, currentRole, typingSpeed, roles]);

  // Track mouse position for parallax effects
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Track scroll position for header visibility and active section
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setHeaderVisible(scrollPosition > 100);
      setHasScrolled(scrollPosition > 0);

      // Determine active section based on scroll position
      const sections = ['home', 'about', 'experience', 'contact'];
      const sectionElements = sections.map(id => document.getElementById(id));

      for (let i = sectionElements.length - 1; i >= 0; i--) {
        const element = sectionElements[i];
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top <= 150) {
            setActiveSection(sections[i]);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial check
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Apply class to html element based on scroll state
  useEffect(() => {
    if (hasScrolled) {
      document.documentElement.classList.add('scrolled');
    } else {
      document.documentElement.classList.remove('scrolled');
    }
  }, [hasScrolled]);

  // Smooth scroll to section
  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const offset = 80; // Account for header height
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  // Tech stack items - categorized based on user's actual skills
  const techStack = {
    'Programming Languages': [
      { name: 'Python', icon: SiPython },
      { name: 'Golang', icon: SiGo },
      { name: 'Java', icon: SiOpenjdk },
      { name: 'JavaScript', icon: SiJavascript },
      { name: 'Ruby', icon: SiRuby },
      { name: 'Rust', icon: SiRust }
    ],
    'Frontend Development': [
      { name: 'React', icon: SiReact },
      { name: 'CSS3', icon: SiCss3 },
      { name: 'HTML5', icon: SiHtml5 },
      { name: 'Redux', icon: SiRedux },
      { name: 'Tailwind CSS', icon: SiTailwindcss }
    ],
    'Backend Development': [
      { name: 'Node.js', icon: SiNodedotjs },
      { name: 'Android', icon: SiAndroid },
      { name: 'Nginx', icon: SiNginx }
    ],
    'Databases': [
      { name: 'MySQL', icon: SiMysql },
      { name: 'MongoDB', icon: SiMongodb },
      { name: 'Redis', icon: SiRedis },
      { name: 'PostgreSQL', icon: SiPostgresql },
      { name: 'Firebase', icon: SiFirebase }
    ],
    'Frameworks': [
      { name: 'Django', icon: SiDjango },
      { name: 'Kubernetes', icon: SiKubernetes },
      { name: 'Ruby on Rails', icon: SiRubyonrails },
      { name: 'React', icon: SiReact }
    ],
    'Others': [
      { name: 'TensorFlow', icon: SiTensorflow },
      { name: 'Heroku', icon: SiHeroku },
      { name: 'Selenium', icon: SiSelenium },
      { name: 'Mocha', icon: SiMocha },
      { name: 'Linux', icon: SiLinux },
      { name: 'Git', icon: SiGit },
      { name: 'Grafana', icon: SiGrafana }
    ]
  };

  const achievements = [
    {
      title: 'IMC Prosperity 3.0 Trading Competition',
      description: 'Top 1% from 20,389 teams',
      year: 'May 2025',
      category: 'Algorithmic Trading'
    },
    {
      title: 'IMC Prosperity 2.0 Trading Competition',
      description: 'Top 4% from 10,007 teams',
      year: 'May 2024',
      category: 'Algorithmic Trading'
    },
    {
      title: 'Grab Business Case Challenge',
      description: '3rd place team winner',
      year: 'Apr 2021',
      category: 'Business'
    },
    {
      title: 'NUS Data Science Competition',
      description: '1st place team winner',
      year: 'Jan 2021',
      category: 'Data Science'
    },
    {
      title: 'JP Morgan Code for Good',
      description: '1st place team winner',
      year: 'Oct 2020',
      category: 'Hackathon'
    },
    {
      title: 'Shopee Code League',
      description: 'Top 2% from 350 teams in Sentiment Analysis',
      year: 'Jul 2020',
      category: 'Machine Learning'
    },
    {
      title: 'Shopee Code League',
      description: 'Top 9% from 800 teams in Product Detection Competition',
      year: 'Jun 2020',
      category: 'Machine Learning'
    },
    {
      title: 'Singapore Mathematical Olympiad Open Section',
      description: 'Silver Award',
      year: 'Nov 2017',
      category: 'Mathematics'
    }
  ];

  const experiences = [
    {
      company: 'Shopee Singapore',
      role: 'Backend Software Engineer',
      period: 'June 2022 - Present',
      highlights: [
        'Led a team of 4 engineers driving ~80% of quarterly revenue',
        'Boosted development time by 25% with config-based implementation',
        'Migrated 10B rows and 3TB across 14 regions from TiDB to MySQL',
        'Pioneered Clickhouse adoption, saving 88% storage usage'
      ]
    },
    {
      company: 'National University of Singapore',
      role: '🎓 Graduated from NUS',
      period: 'May 2022',
      isGraduation: true,
      highlights: [
        'Bachelor of Computer Science, Honors (Distinction)',
        'Major: Software Engineering and Artificial Intelligence'
      ]
    },
    {
      company: 'Sensetime Singapore',
      role: 'Frontend Software Engineer Intern',
      period: 'Dec 2021 - Mar 2022',
      highlights: [
        'Built commercial website showcasing AI photo technology',
        'Designed Photoshop-like editor with AI integrations using React'
      ]
    },
    {
      company: 'Sea Singapore',
      role: 'Backend Software Engineer Intern',
      period: 'May 2021 - Aug 2021',
      highlights: [
        'Created filesystem with Linux FUSE interface using JuiceFS',
        'Built filestore engine in Rust outperforming MinIO in CRUD'
      ]
    },
    {
      company: 'Shopee Singapore',
      role: 'Data Science Intern',
      period: 'Dec 2020 - Apr 2021',
      highlights: [
        'Improved NER tagging accuracy by 3% over shopee-roBERTa',
        'Built semantic similarity model using sentence-transformers'
      ]
    },
    {
      company: 'SAP Singapore',
      role: 'Full Stack Machine Learning Intern',
      period: 'Jan 2020 - Jun 2020',
      highlights: [
        'Built performance test tool using Vegeta for model servers in SAP DI Cloud',
        'Created TensorFlow APIs (Regress, Classify, Predict) on Golang API Gateway',
        'Developed logging and statistics endpoints for error detection and live data analysis'
      ]
    }
  ];

  const navItems = [
    { id: 'home', label: 'Home' },
    { id: 'about', label: 'About' },
    { id: 'experience', label: 'Experience' },
    { id: 'contact', label: 'Contact' }
  ];

  // Helper function to determine article (a/an) based on first character
  const getArticle = (text) => {
    if (!text) return 'a';
    const firstChar = text.trim().charAt(0).toLowerCase();
    return ['a', 'e', 'i', 'o', 'u'].includes(firstChar) ? 'an' : 'a';
  };

  return (
    <div className="app">
      {/* Floating Navigation Header */}
      <motion.nav
        className={`floating-header ${headerVisible ? 'visible' : ''}`}
        initial={{ y: -100, opacity: 0 }}
        animate={{
          y: headerVisible ? 0 : -100,
          opacity: headerVisible ? 1 : 0
        }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
      >
        <div className="header-container">
          <div className="header-logo" onClick={() => scrollToSection('home')}>
            <span className="logo-text">VV</span>
          </div>
          <div className="header-nav">
            {navItems.map((item) => (
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

      {/* Hero Section */}
      <section className="hero-section" id="home">
        {/* Enhanced Animated Background Elements */}
        <div className="animated-bg-elements">
          {/* Dynamic gradient mesh that follows mouse */}
          <div className="gradient-mesh" style={{
            background: `radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, rgba(59, 130, 246, 0.2) 0%, transparent 50%)`
          }}></div>

          {/* Multiple gradient orbs for depth */}
          <motion.div
            className="gradient-orb orb-1"
            animate={{
              x: [0, 50, 0],
              y: [0, -30, 0],
              scale: [1, 1.1, 1]
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <motion.div
            className="gradient-orb orb-2"
            animate={{
              x: [0, -40, 0],
              y: [0, 50, 0],
              scale: [1, 1.2, 1]
            }}
            transition={{
              duration: 25,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 2
            }}
          />
          <motion.div
            className="gradient-orb orb-3"
            animate={{
              x: [0, 30, 0],
              y: [0, 40, 0],
              scale: [1, 0.9, 1]
            }}
            transition={{
              duration: 18,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 4
            }}
          />

          {/* Enhanced floating particles */}
          <div className="floating-particles">
            {[...Array(80)].map((_, i) => (
              <motion.div
                key={i}
                className="particle"
                initial={{
                  x: Math.random() * window.innerWidth,
                  y: Math.random() * window.innerHeight + window.innerHeight,
                  opacity: Math.random() * 0.6 + 0.3
                }}
                animate={{
                  y: [null, -window.innerHeight - 100],
                  x: [null, (Math.random() - 0.5) * 200],
                  opacity: [null, 0]
                }}
                transition={{
                  duration: Math.random() * 15 + 10,
                  repeat: Infinity,
                  delay: Math.random() * 5,
                  ease: "linear"
                }}
                style={{
                  width: Math.random() * 3 + 1,
                  height: Math.random() * 3 + 1
                }}
              />
            ))}
          </div>

          {/* Enhanced geometric shapes */}
          <div className="geometric-shapes">
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                className={`shape shape-${i + 1}`}
                animate={{
                  rotate: [0, 360],
                  scale: [1, 1.3, 1],
                  opacity: [0.1, 0.4, 0.1]
                }}
                transition={{
                  duration: 20 + i * 5,
                  repeat: Infinity,
                  ease: "linear",
                  delay: i * 2
                }}
                style={{
                  x: mousePosition.x * 0.03 - 50,
                  y: mousePosition.y * 0.03 - 50
                }}
              />
            ))}
          </div>

          {/* Grid overlay for tech aesthetic */}
          <div className="grid-overlay"></div>
        </div>

        <motion.div
          className="hero-content"
          style={{
            opacity,
            scale,
            x: (mousePosition.x - 50) * 0.015,
            y: (mousePosition.y - 50) * 0.015
          }}
        >
          {/* Enhanced glowing orb behind text */}
          <div className="hero-glow-orb"></div>
          <div className="hero-glow-orb-secondary"></div>

          {/* Main hero text with enhanced animations */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="hero-text-container"
          >
            <motion.div
              className="hero-greeting"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="greeting-text"
              >
                👋 Hi there, I'm
              </motion.span>
            </motion.div>

            <motion.h1
              className="hero-title-enhanced"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <motion.span
                className="name-gradient"
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
              >
                Victor Varian
              </motion.span>
            </motion.h1>

            <motion.div
              className="animated-role-enhanced"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
            >
              <span className="role-prefix">I'm {getArticle(displayText)}</span>
              <span className="role-text">{displayText}</span>
              <motion.span
                className="cursor-blink"
                animate={{ opacity: [1, 0] }}
                transition={{ duration: 0.7, repeat: Infinity }}
              >
                |
              </motion.span>
            </motion.div>

            <motion.p
              className="hero-description"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1 }}
            >
              Building scalable systems & solving complex problems at scale
            </motion.p>
          </motion.div>

          {/* Enhanced CTA buttons */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.2 }}
            className="hero-cta"
          >
            <motion.a
              href="#contact"
              className="cta-button primary magnetic-button"
              whileHover={{ scale: 1.08, y: -8 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <span>Let's Connect</span>
              <motion.div
                className="button-glow"
                initial={{ opacity: 0 }}
                whileHover={{ opacity: 1 }}
              />
              <motion.div
                className="button-shine"
                initial={{ x: "-100%" }}
                whileHover={{ x: "100%" }}
                transition={{ duration: 0.6 }}
              />
            </motion.a>
            <motion.a
              href="mailto:victor.vic11@yahoo.com"
              className="cta-button secondary magnetic-button"
              whileHover={{ scale: 1.08, y: -8 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <Mail size={20} />
              <span>Get In Touch</span>
            </motion.a>
          </motion.div>

          {/* Enhanced social links */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 1.4 }}
            className="social-links"
          >
            {[
              { icon: Github, href: "https://github.com/victorvic54", label: "GitHub" },
              { icon: Linkedin, href: "https://linkedin.com/in/victor-varian", label: "LinkedIn" },
              { icon: SiKaggle, href: "https://kaggle.com/victorvic", label: "Kaggle" },
              { icon: SiInstagram, href: "https://www.instagram.com/victor.varian/", label: "Instagram" },
              { icon: SiYoutube, href: "https://www.youtube.com/@victor.varian", label: "YouTube" }
            ].map((social, index) => {
              const Icon = social.icon;
              const isKaggle = social.label === "Kaggle";
              return (
                <motion.a
                  key={index}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-link-item"
                  whileHover={{ scale: 1.25, y: -8 }}
                  whileTap={{ scale: 0.9 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  title={social.label}
                >
                  <Icon size={isKaggle ? 28 : 24} />
                </motion.a>
              );
            })}
          </motion.div>

          {/* Enhanced scroll indicator */}
          <motion.div
            className="scroll-indicator"
            initial={{ opacity: 0, y: 0 }}
            animate={{
              opacity: 1,
              y: [0, 12, 0]
            }}
            transition={{
              opacity: { delay: 1.6 },
              y: { duration: 2, repeat: Infinity, ease: "easeInOut" }
            }}
            onClick={() => scrollToSection('about')}
          >
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <ChevronDown size={32} />
            </motion.div>
            <motion.div
              className="scroll-line"
              animate={{ height: [0, 40, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
            <span className="scroll-text">Scroll</span>
          </motion.div>
        </motion.div>
      </section>

      {/* About Section */}
      <section className="about-section" id="about">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="section-title">About Me</h2>

            {/* Quick Stats Section */}
            <section className="stats-section">
              <div className="container">
                <div className="stats-grid">
                  <motion.div
                    className="stat-card"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    viewport={{ once: true }}
                  >
                    <div className="stat-number">3+ Years</div>
                    <div className="stat-label">Professional Experience</div>
                  </motion.div>
                  <motion.div
                    className="stat-card"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    viewport={{ once: true }}
                  >
                    <div className="stat-number">2+ Years</div>
                    <div className="stat-label">Internship Experience</div>
                  </motion.div>
                  <motion.div
                    className="stat-card"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    viewport={{ once: true }}
                  >
                    <div className="stat-number">10B+</div>
                    <div className="stat-label">DB Rows Migrated</div>
                  </motion.div>
                  <motion.div
                    className="stat-card"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    viewport={{ once: true }}
                  >
                    <div className="stat-number">Top 1%</div>
                    <div className="stat-label">Trading Competition</div>
                  </motion.div>
                </div>
              </div>
            </section>

            <div className="about-content">
              <div className="about-text">
                <h3>Backend Software Engineer & Problem Solver</h3>
                <p>
                  I'm Victor Varian, a Backend Software Engineer at Shopee Singapore with a passion for building
                  scalable distributed systems and leveraging machine learning. Currently leading a team of 4 engineers
                  and driving key business decisions that impact ~80% of Shopee's quarterly revenue.
                </p>
                <p>
                  Graduated with Honors (Distinction) from <strong className="highlight">National University of Singapore</strong>, majoring in Software
                  Engineering and Artificial Intelligence. My expertise spans backend development (Python, Golang, Rust),
                  database optimization, and machine learning. I've successfully migrated 10 billion rows across 14 regions
                  and pioneered innovative solutions like using Clickhouse to save 88% in storage.
                </p>
                <p>
                  When I'm not optimizing systems or building ML models, I'm competing in algorithmic trading competitions
                  (Top 1% in IMC Prosperity 3.0) and mentoring fellow engineers.
                </p>
                <p className="about-text-note">
                  <b>I do have weaknesses:</b> <br />
                  While I may require additional time to adapt to new technologies and environments, I am committed to continuous learning and am confident in my ability to deliver results with adequate time and resources.
                  <br />
                  <br />
                  That's why I loved project-based or competitions that allow sufficient time over exam-style assessments.
                </p>
                <div className="about-highlights">
                  <div className="highlight-item">
                    <Code2 size={24} />
                    <span>Clean Code</span>
                  </div>
                  <div className="highlight-item">
                    <Zap size={24} />
                    <span>Fast Performance</span>
                  </div>
                  <div className="highlight-item">
                    <Palette size={24} />
                    <span>Modern Design</span>
                  </div>
                  <div className="highlight-item">
                    <Users size={24} />
                    <span>Collaboration</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Education Section */}
      <section className="education-section">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="section-title">🏛️ &nbsp;Education</h2>
            <p className="section-subtitle">My academic background</p>

            <div className="education-card-wrapper">
              <div className="education-card">
                <h3>Education</h3>
                <div className="education-degree">Bachelor of Computer Science, Honors (Distinction)</div>
                <div className="education-school">National University of Singapore</div>
                <div className="education-major"><b>Major:</b> Software Engineering and Artificial Intelligence</div>
                <div className="education-year">Class of 2022</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Experience Timeline Section */}
      <section className="experience-section" id="experience">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="section-title">💼 &nbsp;Work Experience</h2>
            <p className="section-subtitle">My professional journey</p>

            <div className="experience-timeline">
              {experiences.map((exp, index) => (
                exp.isGraduation ? (
                  <motion.div
                    key={index}
                    className="experience-item graduation-item"
                    initial={{ opacity: 0, x: -50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    viewport={{ once: true }}
                  >
                    <div className="graduation-line">
                      <span className="graduation-text">{exp.role}</span>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key={index}
                    className="experience-item"
                    initial={{ opacity: 0, x: -50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    viewport={{ once: true }}
                  >
                    <div className="experience-marker"></div>
                    <div className="experience-content">
                      <div className="experience-header">
                        <div>
                          <h3 className="experience-role">{exp.role}</h3>
                          <div className="experience-company">{exp.company}</div>
                        </div>
                        <div className="experience-period">{exp.period}</div>
                      </div>
                      <ul className="experience-highlights">
                        {exp.highlights.map((highlight, idx) => (
                          <li key={idx}>{highlight}</li>
                        ))}
                      </ul>
                    </div>
                  </motion.div>
                )
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Tech Stack Section */}
      <section className="tech-section">
        <div className="container">
          <h2 className="section-title">⚙️ &nbsp;My Stack</h2>
          <div className="tech-stack-container">
            {Object.entries(techStack).map(([category, items]) => (
              <motion.div
                key={category}
                className="tech-category"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
              >
                <h3 className="tech-category-title">{category.charAt(0).toUpperCase() + category.slice(1)}</h3>
                <div className="tech-items-grid">
                  {items.map((item, index) => {
                    const IconComponent = item.icon;
                    return (
                      <motion.div
                        key={index}
                        className="tech-item-pill"
                        whileHover={{ scale: 1.05 }}
                        transition={{ duration: 0.2 }}
                      >
                        {IconComponent ? (
                          <IconComponent className="tech-icon" />
                        ) : (
                          <span className="tech-icon-placeholder">{item.name.charAt(0)}</span>
                        )}
                        <span className="tech-name">{item.name}</span>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Achievements Section */}
      <section className="achievements-section">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="section-title">🏆 &nbsp;Achievements</h2>
            <p className="section-subtitle">Competition wins and recognitions</p>

            <div className="achievements-grid">
              {achievements.map((achievement, index) => (
                <motion.div
                  key={index}
                  className="achievement-card"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.08 }}
                  viewport={{ once: true }}
                  whileHover={{ y: -5 }}
                >
                  <div className="achievement-header">
                    <div className="achievement-year">{achievement.year}</div>
                    <div className="achievement-category">{achievement.category}</div>
                  </div>
                  <h3 className="achievement-title">{achievement.title}</h3>
                  <p className="achievement-description">{achievement.description}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="contact-section" id="contact">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="contact-content"
          >
            <h2 className="contact-title">Let's Make It Happen!</h2>
            <p className="contact-subtitle">
              Backend Software Engineer | Open to exciting opportunities
            </p>
            <p className="contact-description">
              I specialize in building scalable distributed systems, database optimization, and machine learning solutions.
            </p>

            <div className="contact-buttons">
              <a href="mailto:victor.vic11@yahoo.com" className="cta-button primary large">
                <Mail size={20} />
                Get In Touch
              </a>
              <a href="https://linkedin.com/in/victor-varian" target="_blank" rel="noopener noreferrer" className="cta-button secondary large">
                <Linkedin size={20} />
                Connect on LinkedIn
              </a>
            </div>

            <div className="availability-badge">
              <span className="status-dot"></span>
              CURRENTLY AT SHOPEE SINGAPORE
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-left">
              <p>&copy; 2025 Victor Varian. All rights reserved</p>
            </div>
            <div className="footer-links">
              <a href="#home">Home</a>
              <a href="#about">About</a>
              <a href="#experience">Experience</a>
              <a href="#contact">Contact</a>
            </div>
            <div className="footer-social">
              {[
                { icon: Github, href: "https://github.com/victorvic54", label: "GitHub" },
                { icon: Linkedin, href: "https://linkedin.com/in/victor-varian", label: "LinkedIn" },
                { icon: SiKaggle, href: "https://kaggle.com/victorvic", label: "Kaggle" },
                { icon: SiInstagram, href: "https://www.instagram.com/victor.varian/", label: "Instagram" },
                { icon: SiYoutube, href: "https://www.youtube.com/@victor.varian", label: "YouTube" }
              ].map((social, index) => {
                const Icon = social.icon;
                const isKaggle = social.label === "Kaggle";
                return (
                  <a
                    key={index}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={social.label}
                  >
                    <Icon size={isKaggle ? 22 : 20} />
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
