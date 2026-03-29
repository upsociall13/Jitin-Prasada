import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, Menu, X, ArrowRight, TrendingUp, Cpu, Globe, 
  MessageSquare, Users, Briefcase, MapPin, Play, 
  ChevronRight, ChevronLeft, ExternalLink, Send, Sparkles,
  Twitter, Linkedin, Facebook, Instagram
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line 
} from 'recharts';
import { askAssistant } from './services/geminiService';
import ReactMarkdown from 'react-markdown';
import { cn } from './lib/utils';
import { 
  db, auth, Initiative as InitiativeType, MediaItem as MediaItemType, ImpactStat as ImpactStatType, 
  OperationType, handleFirestoreError 
} from './firebase';
import { collection, onSnapshot, query, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';
import AdminPanel from './components/AdminPanel';
import { Toaster, toast } from 'react-hot-toast';

// --- Types ---
type UserType = 'citizen' | 'entrepreneur' | 'vendor';

// --- Mock Data ---
const IMPACT_DATA = [
  { name: '2021', msmes: 120, digital: 45, jobs: 200 },
  { name: '2022', msmes: 250, digital: 80, jobs: 450 },
  { name: '2023', msmes: 480, digital: 150, jobs: 890 },
  { name: '2024', msmes: 720, digital: 230, jobs: 1400 },
];

// --- Components ---

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={cn(
      "fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-6 py-4",
      isScrolled ? "bg-white/80 backdrop-blur-lg shadow-sm py-3" : "bg-transparent"
    )}>
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <a 
          href="#" 
          onClick={(e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="flex items-center gap-3 group cursor-pointer"
        >
          <div className="w-10 h-10 bg-navy rounded-full flex items-center justify-center text-white font-bold text-xl group-hover:bg-saffron transition-colors duration-300">
            JP
          </div>
          <span className={cn(
            "font-display font-bold text-xl tracking-tight transition-colors duration-300", 
            isScrolled ? "text-navy" : "text-navy",
            "group-hover:text-saffron"
          )}>
            JITIN PRASADA
          </span>
        </a>

        <div className="hidden md:flex items-center gap-8 font-medium text-sm uppercase tracking-widest">
          {['Initiatives', 'Impact', 'Media', 'Connect'].map((item) => (
            <a key={item} href={`#${item.toLowerCase()}`} className="hover:text-saffron transition-colors">
              {item}
            </a>
          ))}
          <button className="bg-navy text-white px-6 py-2 rounded-full hover:bg-navy-light transition-all">
            Connect
          </button>
        </div>

        <button className="md:hidden" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-full left-0 right-0 bg-white border-t p-6 flex flex-col gap-4 md:hidden shadow-xl"
          >
            {['Initiatives', 'Impact', 'Media', 'Connect'].map((item) => (
              <a key={item} href={`#${item.toLowerCase()}`} onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-medium border-b pb-2">
                {item}
              </a>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

const SOCIAL_LINKS = [
  { name: 'Twitter', icon: <Twitter className="w-5 h-5" />, url: 'https://twitter.com/JitinPrasada' },
  { name: 'LinkedIn', icon: <Linkedin className="w-5 h-5" />, url: 'https://www.linkedin.com/in/jitin-prasada-8a8b8b1b/' },
  { name: 'Facebook', icon: <Facebook className="w-5 h-5" />, url: 'https://www.facebook.com/JitinPrasadaOfficial' },
  { name: 'Instagram', icon: <Instagram className="w-5 h-5" />, url: 'https://www.instagram.com/jitinprasada' },
];

const Hero = () => {
  const [currentImage, setCurrentImage] = useState(0);
  const images = [
    {
      url: "Public/Jitin1.jpeg",
      caption: "Minister of State",
      subcaption: "Ministry of Commerce & Industry"
    },
    {
      url: "Public/Jitin2.jpeg",
      caption: "Digital Transformation",
      subcaption: "Leading India's Tech Future"
    },
    {
      url: "Public/Jitin3.jpeg",
      caption: "Pilibhit Development",
      subcaption: "Grassroots Progress & Innovation"
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % images.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const nextImage = () => setCurrentImage((prev) => (prev + 1) % images.length);
  const prevImage = () => setCurrentImage((prev) => (prev - 1 + images.length) % images.length);

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-white pt-20">
      {/* Social Sidebar */}
      <div className="absolute left-8 top-1/2 -translate-y-1/2 hidden xl:flex flex-col gap-6 z-20">
        <div className="w-px h-20 bg-navy/10 mx-auto" />
        {SOCIAL_LINKS.map((social) => (
          <motion.a
            key={social.name}
            href={social.url}
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.2, color: '#FF9933' }}
            className="text-navy/40 transition-colors"
          >
            {social.icon}
          </motion.a>
        ))}
        <div className="w-px h-20 bg-navy/10 mx-auto" />
      </div>

      {/* Background Elements */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-navy hidden lg:block" />
      <div className="absolute top-0 right-0 w-full h-full bg-navy lg:hidden opacity-10" />
      
      <div className="max-w-7xl mx-auto px-6 w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-2xl"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-navy/5 text-navy text-xs font-bold tracking-[0.1em] uppercase mb-8 border border-navy/10">
            <span className="w-2 h-2 rounded-full bg-saffron animate-pulse" />
            Minister of State | Govt. of India
          </span>
          
          <h1 className="text-6xl md:text-8xl font-bold text-navy mb-8 leading-[0.95] tracking-tighter">
            Shaping India’s <br />
            <span className="text-saffron italic">Commerce</span> & <br />
            Digital Future
          </h1>
          
          <p className="text-xl text-gray-500 max-w-lg mb-8 font-medium leading-relaxed">
            Shaping policy, empowering enterprises, and building world-class digital ecosystems for a globally competitive India.
          </p>

          {/* Constituency Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="mb-12 flex items-center gap-6 p-6 rounded-[32px] bg-white shadow-2xl shadow-navy/5 border border-gray-100 max-w-lg group hover:border-saffron/30 transition-all duration-500"
          >
            <div className="w-16 h-16 rounded-2xl bg-navy/5 flex items-center justify-center text-navy shrink-0 group-hover:bg-navy group-hover:text-white transition-all duration-500">
              <MapPin className="w-8 h-8" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Constituency</span>
                  <span className="w-1 h-1 rounded-full bg-saffron" />
                  <span className="text-[10px] font-bold text-navy uppercase tracking-widest">Uttar Pradesh</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-[10px] font-bold text-green-600 uppercase tracking-widest">Active</span>
                </div>
              </div>
              <div className="text-3xl font-bold text-navy mb-1 tracking-tight">Pilibhit</div>
              <div className="text-xs text-gray-500 font-medium leading-relaxed">
                Known as <span className="text-navy font-semibold italic">"The Flute City"</span> & home to the majestic Pilibhit Tiger Reserve.
              </div>
            </div>
          </motion.div>
          
          <div className="flex flex-col sm:flex-row gap-6">
            <button className="bg-navy text-white px-10 py-5 rounded-2xl font-bold hover:bg-navy-light hover:shadow-2xl hover:shadow-navy/20 transition-all flex items-center justify-center gap-3 group">
              Explore Initiatives 
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button className="bg-white text-navy border-2 border-navy/10 px-10 py-5 rounded-2xl font-bold hover:bg-gray-50 transition-all">
              Connect
            </button>
          </div>

          <div className="mt-16 flex items-center gap-8 pt-8 border-t border-gray-100">
            <div>
              <div className="text-2xl font-bold text-navy">720K+</div>
              <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">MSMEs Impacted</div>
            </div>
            <div className="w-px h-8 bg-gray-100" />
            <div>
              <div className="text-2xl font-bold text-navy">230+</div>
              <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Digital Projects</div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9, x: 50 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
          className="relative"
        >
          <div className="relative aspect-[4/5] rounded-[40px] overflow-hidden shadow-2xl shadow-navy/20 group/carousel">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentImage}
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                className="absolute inset-0"
              >
                <img 
                  src={images[currentImage].url} 
                  alt={images[currentImage].caption} 
                  className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-navy/80 via-transparent to-transparent" />
                
                <div className="absolute bottom-10 left-10 right-10">
                  <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="glass p-6 rounded-3xl border-white/10"
                  >
                    <div className="text-white font-display text-2xl font-bold mb-1">{images[currentImage].caption}</div>
                    <div className="text-white/60 text-xs font-bold uppercase tracking-[0.2em]">{images[currentImage].subcaption}</div>
                  </motion.div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Carousel Controls */}
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-4 opacity-0 group-hover/carousel:opacity-100 transition-opacity duration-300">
              <button 
                onClick={prevImage}
                className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white hover:text-navy transition-all"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button 
                onClick={nextImage}
                className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white hover:text-navy transition-all"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>

            {/* Carousel Indicators */}
            <div className="absolute top-6 right-6 flex gap-2">
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentImage(i)}
                  className={cn(
                    "w-8 h-1 rounded-full transition-all duration-300",
                    currentImage === i ? "bg-saffron w-12" : "bg-white/30"
                  )}
                />
              ))}
            </div>
          </div>

          {/* Floating Elements */}
          <motion.div 
            animate={{ y: [0, -15, 0] }}
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            className="absolute -top-10 -right-10 hidden xl:block z-20"
          >
            <div className="glass p-6 rounded-3xl shadow-xl border-white/20 flex items-center gap-4">
              <div className="w-12 h-12 bg-saffron rounded-2xl flex items-center justify-center text-white">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <div className="text-navy font-bold text-lg">40% Growth</div>
                <div className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">Export Volume</div>
              </div>
            </div>
          </motion.div>

          <motion.div 
            animate={{ y: [0, 15, 0] }}
            transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 1 }}
            className="absolute -bottom-6 -left-10 hidden xl:block z-20"
          >
            <div className="glass p-6 rounded-3xl shadow-xl border-white/20 flex items-center gap-4">
              <div className="w-12 h-12 bg-navy rounded-2xl flex items-center justify-center text-white">
                <Globe className="w-6 h-6" />
              </div>
              <div>
                <div className="text-navy font-bold text-lg">Global Hub</div>
                <div className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">Trade & Innovation</div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Background Pattern */}
      <div className="absolute top-0 right-0 w-full h-full pointer-events-none opacity-[0.03] z-0">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>
    </section>
  );
};

const ImpactDashboard = () => {
  const [stats, setStats] = useState<ImpactStatType[]>([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'impact_stats'), (snapshot) => {
      setStats(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ImpactStatType)));
    });
    return () => unsub();
  }, []);

  return (
    <section id="impact" className="py-24 bg-white px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Impact at Scale</h2>
            <p className="text-gray-600 text-lg mb-12">
              Our data-driven approach ensures that every policy translates into measurable outcomes for citizens and businesses alike.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
              {stats.length > 0 ? stats.map((stat, i) => (
                <motion.div 
                  key={i}
                  whileHover={{ y: -5 }}
                  className="p-6 rounded-2xl bg-gray-50 border border-gray-100"
                >
                  <div className="mb-4">
                    {stat.label.toLowerCase().includes('msme') ? <Users className="text-navy" /> : 
                     stat.label.toLowerCase().includes('digital') ? <Cpu className="text-saffron" /> : 
                     <Briefcase className="text-navy-light" />}
                  </div>
                  <div className="text-3xl font-bold text-navy mb-1">{stat.value}</div>
                  <div className="text-xs text-gray-500 uppercase tracking-wider font-bold">{stat.label}</div>
                </motion.div>
              )) : (
                [
                  { label: 'MSMEs Impacted', value: '720K+', icon: <Users className="text-navy" /> },
                  { label: 'Digital Initiatives', value: '230+', icon: <Cpu className="text-saffron" /> },
                  { label: 'Jobs Enabled', value: '1.4M+', icon: <Briefcase className="text-navy-light" /> },
                ].map((stat, i) => (
                  <motion.div 
                    key={i}
                    whileHover={{ y: -5 }}
                    className="p-6 rounded-2xl bg-gray-50 border border-gray-100"
                  >
                    <div className="mb-4">{stat.icon}</div>
                    <div className="text-3xl font-bold text-navy mb-1">{stat.value}</div>
                    <div className="text-xs text-gray-500 uppercase tracking-wider font-bold">{stat.label}</div>
                  </motion.div>
                ))
              )}
            </div>
          </div>

          <div className="h-[400px] w-full bg-gray-50 rounded-3xl p-8 border border-gray-100">
            <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-8">Growth Trajectory</h3>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={IMPACT_DATA}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#999', fontSize: 12 }} />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
                  cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                />
                <Bar dataKey="msmes" fill="#001F3F" radius={[4, 4, 0, 0]} barSize={40} />
                <Bar dataKey="jobs" fill="#FF9933" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </section>
  );
};

const Initiatives = () => {
  const [initiatives, setInitiatives] = useState<InitiativeType[]>([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'initiatives'), (snapshot) => {
      setInitiatives(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as InitiativeType)));
    });
    return () => unsub();
  }, []);

  const getIcon = (iconName: string) => {
    switch(iconName) {
      case 'TrendingUp': return <TrendingUp className="w-6 h-6" />;
      case 'Cpu': return <Cpu className="w-6 h-6" />;
      case 'Globe': return <Globe className="w-6 h-6" />;
      default: return <Sparkles className="w-6 h-6" />;
    }
  };

  const displayInitiatives = initiatives.length > 0 ? initiatives : [
    {
      id: 'commerce',
      title: 'Commerce & Industry Growth',
      icon: 'TrendingUp',
      description: 'Empowering domestic industries and streamlining trade policies for a $5 trillion economy.',
      impact: '40% Growth in Export volume',
      color: 'bg-navy'
    },
    {
      id: 'digital',
      title: 'Digital India & Tech',
      icon: 'Cpu',
      description: 'Leading the electronics manufacturing revolution and expanding digital infrastructure.',
      impact: '200+ Smart Cities Integrated',
      color: 'bg-saffron'
    },
    {
      id: 'global',
      title: 'Global Trade & Innovation',
      icon: 'Globe',
      description: 'Positioning India as a global innovation hub and securing strategic trade partnerships.',
      impact: '15+ New Trade Agreements',
      color: 'bg-navy-light'
    }
  ];

  return (
    <section id="initiatives" className="py-24 bg-navy text-white px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">Key Strategic Pillars</h2>
          <p className="text-white/60 text-lg max-w-2xl mx-auto">
            Focusing on the core drivers of India's economic and technological sovereignty.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {displayInitiatives.map((item, i) => (
            <motion.div 
              key={i}
              whileHover={{ scale: 1.02 }}
              className="group relative p-10 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                {getIcon(item.icon)}
              </div>
              <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-8", item.color)}>
                {getIcon(item.icon)}
              </div>
              <h3 className="text-2xl font-bold mb-4">{item.title}</h3>
              <p className="text-white/60 mb-8 leading-relaxed">
                {item.description}
              </p>
              <div className="pt-6 border-t border-white/10 flex justify-between items-center">
                <span className="text-saffron font-bold">{item.impact || 'Active Initiative'}</span>
                <ArrowRight className="w-5 h-5 text-white/30 group-hover:text-white transition-colors" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const MediaSection = () => {
  const [media, setMedia] = useState<MediaItemType[]>([]);

  useEffect(() => {
    const unsub = onSnapshot(query(collection(db, 'media'), orderBy('date', 'desc')), (snapshot) => {
      setMedia(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MediaItemType)));
    });
    return () => unsub();
  }, []);

  const displayMedia = media.length > 0 ? media : [
    { id: '1', title: "Vision for Digital India 2030", type: "Video", date: "Mar 15, 2024", thumbnail: "https://picsum.photos/seed/tech1/800/450" },
    { id: '2', title: "Empowering MSMEs through Tech", type: "Speech", date: "Mar 10, 2024", thumbnail: "https://picsum.photos/seed/biz1/800/450" },
    { id: '3', title: "Global Trade Summit Keynote", type: "Press", date: "Mar 05, 2024", thumbnail: "https://picsum.photos/seed/global1/800/450" },
    { id: '4', title: "Future of Electronics Manufacturing", type: "Video", date: "Feb 28, 2024", thumbnail: "https://picsum.photos/seed/chip1/800/450" },
  ];

  return (
    <section id="media" className="py-24 bg-white px-6 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h2 className="text-4xl font-bold mb-4">Media & Insights</h2>
            <p className="text-gray-500">Latest updates, speeches, and press coverage.</p>
          </div>
          <button className="hidden md:flex items-center gap-2 text-navy font-bold hover:text-saffron transition-colors">
            View All <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {displayMedia.map((item) => (
            <motion.div 
              key={item.id}
              whileHover={{ y: -10 }}
              className="group cursor-pointer"
            >
              <div className="relative aspect-[16/9] rounded-2xl overflow-hidden mb-4">
                <img 
                  src={item.thumbnail} 
                  alt={item.title} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Play className="w-5 h-5 text-white fill-white" />
                  </div>
                </div>
                <div className="absolute top-3 left-3 px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-[10px] font-bold uppercase tracking-widest">
                  {item.type}
                </div>
              </div>
              <h3 className="font-bold text-lg mb-1 group-hover:text-navy-light transition-colors">{item.title}</h3>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">{item.date}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const ConnectSection = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    userType: 'Citizen',
    message: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      toast.error('Please fill in all required fields');
      return;
    }
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'messages'), {
        ...formData,
        createdAt: serverTimestamp()
      });
      toast.success('Message sent successfully! We will get back to you soon.');
      setFormData({ name: '', email: '', userType: 'Citizen', message: '' });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'messages');
      toast.error('Failed to send message. Please try again later.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="connect" className="py-24 bg-gray-50 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
          <div>
            <h2 className="text-4xl md:text-5xl font-bold mb-8">Let's Build the Future Together</h2>
            <p className="text-gray-600 text-lg mb-12 leading-relaxed">
              Whether you are a citizen with a vision, an entrepreneur looking for support, or a business seeking policy clarity—your input matters.
            </p>
            
            <div className="space-y-8">
              {[
                { icon: <MapPin />, title: "Constituency Office", detail: "Pilibhit, Uttar Pradesh" },
                { icon: <Briefcase />, title: "Ministry Office", detail: "Udyog Bhawan, New Delhi" },
                { icon: <Globe />, title: "Digital Connect", detail: "connect@jitinprasada.in" },
              ].map((item, i) => (
                <div key={i} className="flex gap-6 items-start">
                  <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center text-navy shrink-0">
                    {item.icon}
                  </div>
                  <div>
                    <h4 className="font-bold text-navy">{item.title}</h4>
                    <p className="text-gray-500">{item.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-10 rounded-3xl shadow-xl shadow-navy/5 border border-gray-100">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Full Name</label>
                  <input 
                    type="text" 
                    required
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-navy transition-all" 
                    placeholder="John Doe" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Email Address</label>
                  <input 
                    type="email" 
                    required
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-navy transition-all" 
                    placeholder="john@example.com" 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-gray-400">I am a...</label>
                <select 
                  value={formData.userType}
                  onChange={e => setFormData({...formData, userType: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-navy transition-all"
                >
                  <option>Citizen</option>
                  <option>Entrepreneur</option>
                  <option>Vendor / Business Owner</option>
                  <option>Policy Researcher</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Your Message / Idea</label>
                <textarea 
                  rows={4} 
                  required
                  value={formData.message}
                  onChange={e => setFormData({...formData, message: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-navy transition-all" 
                  placeholder="How can we help?" 
                />
              </div>
              <button 
                type="submit"
                disabled={submitting}
                className="w-full bg-navy text-white py-4 rounded-xl font-bold hover:bg-navy-light transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {submitting ? 'Sending...' : 'Send Message'} <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

const AIChatAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{role: 'user' | 'assistant', content: string}[]>([
    { role: 'assistant', content: "Hello! I'm your Digital Assistant. How can I help you learn about Jitin Prasada's initiatives today?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userType, setUserType] = useState<UserType>('citizen');

  const SUGGESTIONS = [
    { label: "Vendor Connect", prompt: "How can I register for the Vendor Connect Module and what are the benefits?" },
    { label: "Digital India", prompt: "What are the latest digital initiatives for entrepreneurs?" },
    { label: "Pilibhit", prompt: "Tell me about the development initiatives in Pilibhit." }
  ];

  const handleSend = async (overrideInput?: string) => {
    const messageToSend = overrideInput || input.trim();
    if (!messageToSend || isLoading) return;
    
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: messageToSend }]);
    setIsLoading(true);

    const response = await askAssistant(messageToSend, userType);
    setMessages(prev => [...prev, { role: 'assistant', content: response || "I'm sorry, I couldn't process that." }]);
    setIsLoading(false);
  };

  return (
    <div className="fixed bottom-8 right-8 z-[60]">
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="absolute bottom-20 right-0 w-[350px] md:w-[400px] h-[500px] bg-white rounded-3xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden"
          >
            <div className="bg-navy p-6 text-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-saffron rounded-full flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h4 className="font-bold text-sm">Digital Assistant</h4>
                  <p className="text-[10px] text-white/60 uppercase tracking-widest">Powered by AI</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)}><X className="w-5 h-5" /></button>
            </div>

            <div className="p-4 bg-gray-50 border-b flex gap-2 overflow-x-auto no-scrollbar">
              {(['citizen', 'entrepreneur', 'vendor'] as UserType[]).map((type) => (
                <button 
                  key={type}
                  onClick={() => setUserType(type)}
                  className={cn(
                    "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap",
                    userType === type ? "bg-navy text-white" : "bg-white text-gray-400 border border-gray-200"
                  )}
                >
                  {type}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
              {messages.map((msg, i) => (
                <div key={i} className={cn("flex", msg.role === 'user' ? "justify-end" : "justify-start")}>
                  <div className={cn(
                    "max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed",
                    msg.role === 'user' ? "bg-navy text-white rounded-tr-none" : "bg-gray-100 text-navy rounded-tl-none"
                  )}>
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 p-4 rounded-2xl rounded-tl-none flex gap-1">
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" />
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t bg-white space-y-4">
              {messages.length === 1 && !isLoading && (
                <div className="flex flex-wrap gap-2">
                  {SUGGESTIONS.map((s, i) => (
                    <button 
                      key={i}
                      onClick={() => handleSend(s.prompt)}
                      className="px-3 py-1.5 bg-gray-50 hover:bg-navy/5 text-navy text-[10px] font-bold uppercase tracking-wider rounded-lg border border-gray-100 transition-all"
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              )}
              <div className="relative">
                <input 
                  type="text" 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask about policies, schemes..."
                  className="w-full pl-4 pr-12 py-3 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-navy"
                />
                <button 
                  onClick={() => handleSend()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-navy text-white rounded-lg flex items-center justify-center hover:bg-navy-light transition-all"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button 
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-16 h-16 bg-navy text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-navy-light transition-all relative"
      >
        {isOpen ? <X /> : <MessageSquare />}
        {!isOpen && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-saffron rounded-full animate-pulse" />
        )}
      </motion.button>
    </div>
  );
};

const Footer = () => {
  return (
    <footer className="bg-navy text-white py-20 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-1 md:col-span-2">
            <a 
              href="#" 
              onClick={(e) => {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="flex items-center gap-3 group cursor-pointer mb-6"
            >
              <div className="w-10 h-10 bg-white text-navy rounded-full flex items-center justify-center font-bold text-xl group-hover:bg-saffron transition-colors duration-300">
                JP
              </div>
              <span className="font-display font-bold text-xl tracking-tight group-hover:text-saffron transition-colors duration-300">
                JITIN PRASADA
              </span>
            </a>
            <p className="text-white/50 max-w-sm mb-8 leading-relaxed">
              Bridging policy, people, and progress through digital innovation. Shaping the future of India's commerce and technology landscape.
            </p>
            <div className="flex gap-4">
              {SOCIAL_LINKS.map((social) => (
                <a 
                  key={social.name} 
                  href={social.url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-white hover:text-navy transition-all"
                >
                  <span className="sr-only">{social.name}</span>
                  {social.icon}
                </a>
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="font-bold mb-6 uppercase tracking-widest text-xs text-saffron">Quick Links</h4>
            <ul className="space-y-4 text-white/60 font-medium">
              <li><a href="#initiatives" className="hover:text-white transition-colors">Initiatives</a></li>
              <li><a href="#impact" className="hover:text-white transition-colors">Impact Dashboard</a></li>
              <li><a href="#media" className="hover:text-white transition-colors">Media Center</a></li>
              <li><a href="#connect" className="hover:text-white transition-colors">Connect</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-6 uppercase tracking-widest text-xs text-saffron">Legal</h4>
            <ul className="space-y-4 text-white/60 font-medium">
              <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Terms of Use</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Accessibility</a></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-white/30 text-xs font-medium uppercase tracking-widest">
          <p>© 2024 Jitin Prasada. All Rights Reserved.</p>
          <p>Designed for Impact & Performance</p>
        </div>
      </div>
    </footer>
  );
};

export default function App() {
  const [showAdmin, setShowAdmin] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      <Toaster position="top-right" />
      <Navbar />
      <Hero />
      <ImpactDashboard />
      <Initiatives />
      <MediaSection />
      <ConnectSection />
      <Footer />
      <AIChatAssistant />

      {/* Hidden Admin Trigger */}
      <button 
        onClick={() => setShowAdmin(true)}
        className="fixed bottom-4 left-4 w-8 h-8 opacity-0 hover:opacity-10 z-[100] cursor-default"
      >
        Admin
      </button>

      {showAdmin && <AdminPanel onClose={() => setShowAdmin(false)} />}
    </div>
  );
}
