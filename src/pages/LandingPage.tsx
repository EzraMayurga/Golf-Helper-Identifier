import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Activity, ArrowRight, BarChart3, Shield, Trophy, Video, Zap,
  BookOpen, MessageSquare, Upload, Sparkles, TrendingUp, Users,
  CheckCircle2, PlayCircle, Target, Award
} from 'lucide-react';

const features = [
  { icon: <Sparkles size={22} />, title: 'AI Swing Analysis', desc: 'Frame-by-frame breakdown powered by computer vision' },
  { icon: <Target size={22} />, title: 'Body Keypoint Detection', desc: '33 anatomical points tracked for full-body biomechanics' },
  { icon: <Activity size={22} />, title: 'Swing Phase Breakdown', desc: 'Address, Backswing, Downswing, Impact, Follow-through' },
  { icon: <BarChart3 size={22} />, title: 'Progress Tracking', desc: 'Visualize improvement week over week with charts' },
  { icon: <MessageSquare size={22} />, title: 'Coach Feedback', desc: 'Personalized notes from certified PGA coaches' },
  { icon: <Trophy size={22} />, title: 'Global Leaderboard', desc: 'Tournament-style rankings with weekly resets' },
  { icon: <BookOpen size={22} />, title: 'Premium Tutorials', desc: 'Curated drills and lessons from the pros' },
  { icon: <Shield size={22} />, title: 'Injury Prevention', desc: 'Detect risky mechanics before they cause harm' },
];

const steps = [
  { icon: <Upload size={22} />, title: 'Upload Swing Video', desc: 'Drop your MP4 or MOV — desktop or mobile.' },
  { icon: <Sparkles size={22} />, title: 'AI Detects Motion', desc: 'Pose model extracts 33 keypoints per frame.' },
  { icon: <Award size={22} />, title: 'Get Score & Tips', desc: 'Phase scores, recommendations, injury risk.' },
  { icon: <TrendingUp size={22} />, title: 'Track Improvement', desc: 'Watch your handicap trend down over time.' },
];

const roles = [
  {
    title: 'Player',
    color: 'from-emerald-500/20 to-emerald-500/5',
    accent: 'text-green-brand',
    desc: 'Upload swings, get instant AI feedback, track progress and climb the leaderboard.',
    bullets: ['Swing score & phase breakdown', 'Progress chart & history', 'Leaderboard rank'],
    cta: '/dashboard',
  },
  {
    title: 'Coach',
    color: 'from-amber-400/15 to-amber-400/5',
    accent: 'text-gold',
    desc: 'Review your players, leave structured feedback, and publish premium tutorials.',
    bullets: ['Pending swing queue', 'Structured feedback form', 'Tutorial publishing'],
    cta: '/coach',
  },
  {
    title: 'Admin',
    color: 'from-emerald-700/15 to-emerald-700/5',
    accent: 'text-emerald-deep',
    desc: 'Monitor users, subscriptions, AI services and overall platform health.',
    bullets: ['User & subscription mgmt', 'AI engine monitoring', 'Reports & analytics'],
    cta: '/admin',
  },
];

const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 golf-glass">
        <div className="container mx-auto flex items-center justify-between h-16 px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl golf-gradient-green flex items-center justify-center shadow-lg shadow-primary/20">
              <Activity size={18} className="text-white" />
            </div>
            <div className="leading-tight">
              <span className="font-display text-lg font-bold tracking-tight block">GOLF ANALYSIS AI</span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest">AI Swing Platform</span>
            </div>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-muted-foreground hover:text-primary transition-colors">Features</a>
            <a href="#how" className="text-sm text-muted-foreground hover:text-primary transition-colors">How It Works</a>
            <a href="#roles" className="text-sm text-muted-foreground hover:text-primary transition-colors">Tutorials</a>
            <a href="#pricing" className="text-sm text-muted-foreground hover:text-primary transition-colors">Pricing</a>
            <Link to="/login" className="text-sm text-muted-foreground hover:text-primary transition-colors">Login</Link>
            <Link to="/register" className="golf-btn-primary text-sm !py-2 !px-4">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="golf-gradient-hero pt-32 pb-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-golf-dots opacity-60" />
        {/* Curved fairway shape */}
        <svg className="absolute bottom-0 left-0 w-full h-32" viewBox="0 0 1200 120" preserveAspectRatio="none" aria-hidden>
          <path d="M0,60 C300,120 900,0 1200,60 L1200,120 L0,120 Z" fill="hsl(var(--golf-mint))" opacity="0.6" />
        </svg>

        <div className="container mx-auto px-6 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
            >
              <span className="golf-badge-green mb-5 inline-flex items-center gap-1.5">
                <Sparkles size={12} /> AI-Powered Motion Analysis
              </span>
              <h1 className="font-display text-5xl md:text-6xl xl:text-7xl font-bold uppercase leading-[0.95] mb-6">
                Improve Your <span className="text-green-brand">Golf Swing</span> with AI Motion Analysis
              </h1>
              <p className="text-lg text-muted-foreground max-w-xl mb-8">
                Upload your swing, get an instant AI score, phase-by-phase breakdown,
                personalized recommendations, and track your progress on the global leaderboard.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link to="/register" className="golf-btn-primary inline-flex items-center gap-2 justify-center">
                  Analyze Your Swing <ArrowRight size={18} />
                </Link>
                <Link to="/login" className="golf-btn-secondary inline-flex items-center gap-2 justify-center">
                  <PlayCircle size={18} /> View Demo
                </Link>
              </div>
              <div className="flex items-center gap-6 mt-8 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-green-brand" /> No credit card</div>
                <div className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-green-brand" /> 3 free analyses</div>
              </div>
            </motion.div>

            {/* Hero visual: golfer + skeleton + floating metric cards */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative h-[440px] hidden lg:block"
            >
              {/* Big rounded surface */}
              <div className="absolute inset-0 rounded-[2rem] golf-gradient-green overflow-hidden shadow-2xl shadow-primary/30">
                <div className="absolute inset-0 bg-golf-dots opacity-20" />
                {/* Swing arc */}
                <svg viewBox="0 0 400 400" className="absolute inset-0 w-full h-full">
                  <path
                    d="M 80 320 Q 200 40 340 280"
                    fill="none"
                    stroke="hsl(var(--golf-gold))"
                    strokeWidth="2"
                    strokeDasharray="6 6"
                    opacity="0.7"
                  />
                  <circle cx="80" cy="320" r="6" fill="hsl(var(--golf-gold))" />
                  <circle cx="340" cy="280" r="6" fill="white" />
                </svg>

                {/* Stylized golfer + skeleton keypoints */}
                <svg viewBox="0 0 400 400" className="absolute inset-0 w-full h-full">
                  {/* Body lines */}
                  <g stroke="white" strokeWidth="2.5" fill="none" opacity="0.95">
                    <line x1="200" y1="110" x2="200" y2="200" />
                    <line x1="200" y1="200" x2="170" y2="290" />
                    <line x1="200" y1="200" x2="230" y2="290" />
                    <line x1="170" y1="290" x2="160" y2="360" />
                    <line x1="230" y1="290" x2="240" y2="360" />
                    <line x1="200" y1="140" x2="150" y2="195" />
                    <line x1="200" y1="140" x2="260" y2="180" />
                    <line x1="260" y1="180" x2="305" y2="135" />
                  </g>
                  {/* Keypoints */}
                  {[
                    [200, 95, 10], [200, 140, 6], [200, 200, 6], [170, 290, 6], [230, 290, 6],
                    [160, 360, 6], [240, 360, 6], [150, 195, 6], [260, 180, 6], [305, 135, 6],
                  ].map(([x, y, r], i) => (
                    <circle key={i} cx={x} cy={y} r={r} fill="hsl(var(--golf-gold))" stroke="white" strokeWidth="2" />
                  ))}
                </svg>
              </div>

              {/* Floating metric cards */}
              <motion.div
                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 }}
                className="absolute -left-6 top-12 bg-white rounded-2xl shadow-xl p-4 border border-border w-44"
              >
                <p className="golf-label">Swing Score</p>
                <p className="font-display text-3xl font-bold text-green-brand">87</p>
                <div className="golf-progress-bar mt-2"><div className="golf-progress-fill" style={{ width: '87%' }} /></div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.8 }}
                className="absolute -right-4 top-32 bg-white rounded-2xl shadow-xl p-4 border border-border w-44"
              >
                <p className="golf-label">Tempo</p>
                <p className="font-display text-3xl font-bold text-emerald-deep">3:1</p>
                <p className="text-xs text-muted-foreground">Backswing : Downswing</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1 }}
                className="absolute -right-2 bottom-8 bg-white rounded-2xl shadow-xl p-4 border border-border w-48"
              >
                <p className="golf-label">Injury Risk</p>
                <div className="flex items-baseline gap-2">
                  <p className="font-display text-3xl font-bold text-green-brand">12%</p>
                  <span className="text-xs text-green-brand font-semibold">LOW</span>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.2 }}
                className="absolute left-2 bottom-12 bg-white rounded-2xl shadow-xl p-3 border border-border flex items-center gap-2"
              >
                <div className="w-9 h-9 rounded-lg bg-accent flex items-center justify-center">
                  <Trophy size={18} className="text-green-brand" />
                </div>
                <div>
                  <p className="text-[10px] uppercase text-muted-foreground tracking-widest">Rank</p>
                  <p className="font-display font-bold text-emerald-deep">#24</p>
                </div>
              </motion.div>
            </motion.div>
          </div>

          {/* Stats bar */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-16 golf-card-glow grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto text-center"
          >
            {[
              { value: '33', label: 'Body Keypoints' },
              { value: '5', label: 'Swing Phases' },
              { value: '98%', label: 'AI Accuracy' },
              { value: '< 3s', label: 'Analysis Time' },
            ].map(stat => (
              <div key={stat.label}>
                <p className="font-display text-4xl font-bold text-green-brand">{stat.value}</p>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24">
        <div className="container mx-auto px-6">
          <div className="text-center mb-14 max-w-2xl mx-auto">
            <span className="golf-badge-green mb-4 inline-block">Features</span>
            <h2 className="golf-section-title">Everything you need to <span className="text-green-brand">improve</span></h2>
            <p className="text-muted-foreground mt-4">A complete AI coaching toolkit built around the modern golfer.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="golf-card group"
              >
                <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center text-green-brand mb-4 group-hover:scale-110 transition-transform">
                  {f.icon}
                </div>
                <h3 className="font-display text-lg font-semibold mb-1.5">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 golf-gradient-hero opacity-70" />
        <div className="container mx-auto px-6 relative">
          <div className="text-center mb-14 max-w-2xl mx-auto">
            <span className="golf-badge-green mb-4 inline-block">How It Works</span>
            <h2 className="golf-section-title">From video to <span className="text-green-brand">better golf</span></h2>
          </div>

          <div className="relative grid md:grid-cols-4 gap-6">
            {/* Connector line */}
            <div className="hidden md:block absolute top-12 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
            {steps.map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative"
              >
                <div className="w-24 h-24 mx-auto rounded-full bg-white border-2 border-primary/30 flex items-center justify-center mb-5 shadow-lg shadow-primary/10 relative z-10">
                  <div className="w-16 h-16 rounded-full golf-gradient-green flex items-center justify-center text-white">
                    {step.icon}
                  </div>
                  <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-gold text-white text-xs font-bold flex items-center justify-center" style={{ background: 'hsl(var(--golf-gold))' }}>
                    {i + 1}
                  </span>
                </div>
                <div className="text-center">
                  <h3 className="font-display text-lg font-semibold mb-1">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Role-based preview */}
      <section id="roles" className="py-24">
        <div className="container mx-auto px-6">
          <div className="text-center mb-14 max-w-2xl mx-auto">
            <span className="golf-badge-green mb-4 inline-block">Built for everyone</span>
            <h2 className="golf-section-title">Three roles, <span className="text-green-brand">one platform</span></h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {roles.map((r, i) => (
              <motion.div
                key={r.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`golf-card relative overflow-hidden bg-gradient-to-br ${r.color}`}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-11 h-11 rounded-xl bg-white shadow flex items-center justify-center">
                    <Users size={20} className={r.accent} />
                  </div>
                  <h3 className="font-display text-2xl font-bold uppercase">{r.title}</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">{r.desc}</p>
                <ul className="space-y-2 mb-6">
                  {r.bullets.map(b => (
                    <li key={b} className="text-sm flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-green-brand flex-shrink-0" /> {b}
                    </li>
                  ))}
                </ul>
                <Link to="/login" className="text-sm font-semibold text-green-brand inline-flex items-center gap-1 hover:gap-2 transition-all">
                  See preview <ArrowRight size={14} />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 bg-secondary/40">
        <div className="container mx-auto px-6">
          <div className="text-center mb-14">
            <span className="golf-badge-green mb-4 inline-block">Pricing</span>
            <h2 className="golf-section-title">Choose your <span className="text-green-brand">plan</span></h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            <div className="golf-card">
              <h3 className="font-display text-2xl font-bold mb-2">Free</h3>
              <p className="text-4xl font-display font-bold mb-1">$0<span className="text-base text-muted-foreground font-body">/mo</span></p>
              <p className="text-sm text-muted-foreground mb-6">Get started with basic analysis</p>
              <ul className="space-y-3 mb-8">
                {['3 video uploads/month', 'Basic swing score', 'Leaderboard access', 'Community tutorials'].map(f => (
                  <li key={f} className="text-sm flex items-center gap-2"><CheckCircle2 size={14} className="text-green-brand" />{f}</li>
                ))}
              </ul>
              <Link to="/register" className="golf-btn-secondary w-full text-center block">Get Started</Link>
            </div>

            <div className="golf-card-glow border-primary/40 relative bg-gradient-to-br from-white to-accent/40">
              <span className="golf-badge-gold absolute -top-3 right-4">⭐ Premium</span>
              <h3 className="font-display text-2xl font-bold mb-2">Premium</h3>
              <p className="text-4xl font-display font-bold text-green-brand mb-1">$19<span className="text-base text-muted-foreground font-body">/mo</span></p>
              <p className="text-sm text-muted-foreground mb-6">Full AI analysis suite</p>
              <ul className="space-y-3 mb-8">
                {['Unlimited uploads', 'Full AI analysis', 'Injury risk detection', 'Coach feedback', 'Premium tutorials', 'Priority support'].map(f => (
                  <li key={f} className="text-sm flex items-center gap-2"><CheckCircle2 size={14} className="text-green-brand" />{f}</li>
                ))}
              </ul>
              <Link to="/register" className="golf-btn-primary w-full text-center block">Start Premium</Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="relative golf-gradient-green rounded-3xl p-12 md:p-16 text-center overflow-hidden shadow-2xl shadow-primary/30">
            <div className="absolute inset-0 bg-golf-dots opacity-10" />
            <svg className="absolute -bottom-10 left-0 w-full h-40 opacity-20" viewBox="0 0 1200 120" preserveAspectRatio="none">
              <path d="M0,60 C300,120 900,0 1200,60 L1200,120 L0,120 Z" fill="white" />
            </svg>
            <div className="relative">
              <h2 className="font-display text-4xl md:text-5xl font-bold uppercase text-white mb-4">
                Ready to perfect your swing?
              </h2>
              <p className="text-white/80 max-w-xl mx-auto mb-8">
                Join thousands of golfers using AI to fix their swing, prevent injury, and lower their handicap.
              </p>
              <Link to="/register" className="inline-flex items-center gap-2 bg-white text-green-brand font-semibold px-8 py-4 rounded-lg hover:shadow-2xl hover:-translate-y-0.5 transition-all">
                Start Analyzing Free <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border bg-white/60">
        <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg golf-gradient-green flex items-center justify-center">
              <Activity size={14} className="text-white" />
            </div>
            <span className="font-display font-bold">SWINGAI GOLF</span>
          </div>
          <p className="text-sm text-muted-foreground">© 2026 SwingAI Golf Platform · University SE Case Study</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
