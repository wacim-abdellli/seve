import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  CheckCircle2, 
  ArrowRight, 
  Code,
  FileEdit,
  ShieldCheck,
  Layers,
  Activity,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { PageViewsWidget } from '@/components/PageViewsWidget'

export default function LandingPage() {
  const navigate = useNavigate()
  const [activeFaq, setActiveFaq] = useState<number | null>(null)
  const [selectedPreviewTemplate, setSelectedPreviewTemplate] = useState('classic')

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index)
  }

  const templatesInfo = [
    { id: 'classic', name: 'Classic', font: 'Georgia / Serif', desc: 'Standard single-column layout, highly recommended for traditional finance and legal roles.' },
    { id: 'modern', name: 'Modern', font: 'Arial / Sans-Serif', desc: 'Sleek, colored headers with a modern structure for tech and startup applications.' },
    { id: 'executive', name: 'Executive', font: 'EB Garamond / Garamond', desc: 'Elegant, distinguished header bars tailored for senior and management roles.' },
    { id: 'minimalist', name: 'Minimalist', font: 'Inter / Sans-Serif', desc: 'Airy margins and clean whitespace optimized for maximal readability.' },
    { id: 'creative', name: 'Creative', font: 'Outfit / Sans-Serif', desc: 'Distinct layout tags with left-border accents for design and marketing.' },
    { id: 'compact', name: 'Compact', font: 'System UI / Sans', desc: 'Dense single-page design for maximum content in minimal space.' },
    { id: 'professional', name: 'Professional', font: 'Inter / Sans-Serif', desc: 'Clean business-oriented layout with subtle color accents.' },
    { id: 'technical', name: 'Technical', font: 'SF Mono / Monospace', desc: 'Monospace tech-optimized template with skill badges.' },
    { id: 'academic', name: 'Academic', font: 'Georgia / Serif', desc: 'Research-focused layout prioritizing education and publications.' },
    { id: 'clean', name: 'Clean', font: 'Inter / Sans-Serif', desc: 'Ultra-minimalist design with maximum whitespace and readability.' },
  ]

  const faqItems = [
    {
      q: 'Is Seve really free?',
      a: 'Yes. The core editor, professional templates, local keyword matching, and ATS compatibility checker are 100% free, requiring no credit card, subscription, or sign-up.'
    },
    {
      q: 'How does the ATS compatibility checker work?',
      a: 'It uses a smart, rule-based local algorithm that scans your resume content. It evaluates section presence, standard date consistency, quantified bullet achievements, use of action verbs, and keyword frequency. No data is sent to external servers for this scoring.'
    },
    {
      q: 'Is my personal data secure?',
      a: 'Completely. Your resume data is stored locally inside your browser\'s localStorage and never uploaded to our servers.'
    }
  ]

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col overflow-x-hidden relative">
      
      {/* Cinematic Grid & Mesh Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f1f2e_1px,transparent_1px),linear-gradient(to_bottom,#1f1f2e_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-[0.25]" />
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/5 filter blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] rounded-full bg-red-500/3 filter blur-[120px]" />
      </div>

      {/* 1. Header/Navbar */}
      <header className="px-6 py-4 border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 select-none">
            <div className="flex items-center">
              <span className="relative font-serif text-3xl font-black text-white leading-none" style={{ fontFamily: "'EB Garamond', Georgia, serif" }}>
                S
                <span className="absolute top-0 -right-2.5 w-2.5 h-2.5 rounded-full bg-[#e11d48]" />
              </span>
              <span className="font-serif text-3xl font-black text-white leading-none pl-2.5" style={{ fontFamily: "'EB Garamond', Georgia, serif" }}>
                eve
              </span>
            </div>
            <div className="h-6 w-px bg-border mx-1" />
            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-0.5">
              Resume Builder
            </span>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="hidden sm:inline text-xs text-muted-foreground font-medium flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Client-Side & Open Source
            </span>
            <Button onClick={() => navigate('/editor')} size="sm" className="font-bold">
              Build Your Resume
            </Button>
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <main className="flex-1 py-12 md:py-24 flex items-center z-10 relative">
        <div className="max-w-7xl mx-auto px-6 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Column: Headline and Call-To-Action */}
            <div className="lg:col-span-6 text-center lg:text-left flex flex-col items-center lg:items-start">
              <Badge variant="outline" className="mb-6 rounded-full border-border bg-zinc-900/50 px-3 py-1 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs text-muted-foreground font-medium">Smart ATS Checker — No Signup Required</span>
              </Badge>
              
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white leading-tight tracking-tight max-w-xl">
                The resume builder that <span className="bg-gradient-to-r from-red-400 via-red-500 to-red-600 bg-clip-text text-transparent">gets you hired.</span>
              </h2>
              
              <p className="text-sm md:text-base text-muted-foreground font-light max-w-lg mt-6 leading-relaxed">
                Beautiful templates, smart ATS checker, and optional AI tools — all in your browser. No paywalls, no tracking, no sign-up required.
              </p>
              
              <div className="mt-8 flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                <Button onClick={() => navigate('/editor')} className="font-bold gap-2 text-red-400 bg-red-950/20 border border-red-800/60 hover:bg-red-900/35 hover:text-red-300 shadow-[0_0_24px_rgba(224,49,79,0.15)] h-11 px-6 transition-all">
                  Build Your Resume
                  <ArrowRight size={16} />
                </Button>
              </div>

              <PageViewsWidget />

              <div className="mt-4 pt-4 border-t border-border/60 w-full max-w-xs text-center lg:text-left">
                <span className="text-[10px] text-muted-foreground/80 italic">
                  Built by a developer who was tired of paying for resume builders.
                </span>
              </div>
            </div>

            {/* Right Column: Simulated Live Preview */}
            <div className="lg:col-span-6 flex justify-center">
              <Card className="w-full max-w-[440px] p-5 bg-card/60 backdrop-blur-sm border-border shadow-[0_0_30px_rgba(0,0,0,0.4)] relative">
                
                <div className="flex items-center justify-between border-b border-border/80 pb-3 mb-4">
                  <div className="flex gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-zinc-800" />
                    <span className="w-2 h-2 rounded-full bg-amber-500/60" />
                    <span className="w-2 h-2 rounded-full bg-emerald-500/60" />
                  </div>
                  <span className="text-[10px] text-muted-foreground font-mono">workspace_demo.tsx</span>
                </div>

                <div className="bg-zinc-950/80 border border-border/60 rounded-xl p-4 min-h-[220px] flex flex-col justify-between mb-4">
                  <div className="border-b border-border/30 pb-2 mb-3">
                    <div className="text-sm font-bold text-white leading-none">Jane Doe</div>
                    <div className="text-[9px] text-red-400 font-bold uppercase tracking-wider mt-1.5">Senior Software Engineer</div>
                  </div>

                  <div className="flex-1 flex flex-col gap-2">
                    <div className="text-[8px] text-muted-foreground font-bold uppercase tracking-wider">Experience</div>
                    <div className="bg-zinc-900/30 border border-border/40 rounded-lg p-2.5">
                      <div className="flex justify-between items-center text-[9px] font-bold text-white">
                        <span>Software Engineer at Acme Inc.</span>
                        <span className="text-[8px] text-muted-foreground">2024 — Present</span>
                      </div>
                      <p className="text-[8.5px] text-muted-foreground leading-normal mt-1">
                        • Engineered scalable web applications using React and TypeScript, boosting response speeds by 40%.
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-border/20 flex flex-wrap gap-1">
                    {['React', 'TypeScript', 'Node.js', 'System Design'].map((sk) => (
                      <Badge key={sk} variant="secondary" className="text-[8px] font-bold uppercase py-0.5 px-1.5 bg-zinc-900 border-border text-zinc-300">
                        {sk}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="bg-zinc-900/40 border border-border/80 rounded-xl p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative w-9 h-9 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle cx="18" cy="18" r="15" className="stroke-zinc-800 fill-transparent" strokeWidth="2.5" />
                        <circle cx="18" cy="18" r="15" className="stroke-red-500 fill-transparent" strokeWidth="2.5" strokeDasharray={2 * Math.PI * 15} strokeDashoffset={2 * Math.PI * 15 * 0.15} />
                      </svg>
                      <span className="absolute text-[9px] font-black text-white">85%</span>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-white">Smart ATS Audit Grade</div>
                      <div className="text-[9px] text-muted-foreground">High Interview Probability</div>
                    </div>
                  </div>
                  <Badge className="text-[8px] font-black uppercase bg-emerald-500/10 text-emerald-400 border-emerald-500/20 py-0.5 px-2">
                    READY FOR ATS
                  </Badge>
                </div>

              </Card>
            </div>
          </div>
        </div>
      </main>

      {/* 3. Core Features Section */}
      <section className="py-16 md:py-24 border-t border-border bg-zinc-950/20 z-10 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-red-400 mb-2">Core Features</h2>
            <h3 className="text-2xl md:text-3xl font-extrabold text-white">Everything you need. Genuinely free.</h3>
            <p className="text-sm text-muted-foreground mt-4 leading-relaxed font-light">
              No mock pricing, no hidden tiers, no sign-up gates. Just a highly specialized client-side utility built to help you land interviews.
            </p>
          </div>
     
          {/* Feature Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: FileEdit,
                title: 'Interactive Editor',
                desc: 'Click directly on the resume preview canvas to edit your content in real-time, backed by automatic local storage.'
              },
              {
                icon: Activity,
                title: 'Smart ATS Checker',
                desc: 'Our rule-based scanner checks your layout, quantified results, action verbs, and date formats instantly.'
              },
              {
                icon: Layers,
                title: 'Professional Layouts',
                desc: 'Choose from 5 clean, single and multi-column templates engineered for high readability and print-to-PDF output.'
              },
            ].map((feat, i) => (
              <Card key={i} className="flex flex-col gap-4 p-5 bg-card/40 border-border/80 hover:border-zinc-700/80 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-red-500/5 border border-border flex items-center justify-center text-red-400">
                  <feat.icon size={20} />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-2">{feat.title}</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed font-light">{feat.desc}</p>
                </div>
              </Card>
            ))}
          </div>

          {/* Template Showcase Box */}
          <Card className="mt-16 p-6 md:p-8 bg-card/40 border-border/80">
            <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-border pb-6 mb-8 gap-4">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-widest text-red-400 mb-1">Template Showcase</h4>
                <h3 className="text-xl font-bold text-white">Select and review professional layouts</h3>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {templatesInfo.map((t) => (
                  <Button
                    key={t.id}
                    onClick={() => setSelectedPreviewTemplate(t.id)}
                    variant={selectedPreviewTemplate === t.id ? "default" : "outline"}
                    size="sm"
                    className="font-bold text-xs"
                  >
                    {t.name}
                  </Button>
                ))}
              </div>
            </div>
     
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-6 flex flex-col gap-5">
                {templatesInfo.map((t) => (
                  t.id === selectedPreviewTemplate && (
                    <div key={t.id} className="animate-scale-in flex flex-col gap-4">
                      <Badge variant="outline" className="w-fit font-mono text-[9px] bg-zinc-950 border-border text-zinc-400">
                        Font: {t.font}
                      </Badge>
                      <h4 className="text-lg font-bold text-white">The {t.name} Resume Template</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed font-light">
                        {t.desc}
                      </p>
                      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                        <CheckCircle2 size={16} className="text-emerald-500" />
                        100% ATS Reader Compatibility Verified
                      </div>
                    </div>
                  )
                ))}
                <Button
                  onClick={() => navigate('/editor')}
                  className="font-bold gap-2 text-red-400 bg-red-950/20 border border-red-800/60 hover:bg-red-900/35 hover:text-red-300 shadow-[0_0_15px_rgba(224,49,79,0.1)] w-fit mt-4 transition-all"
                >
                  Use this style
                  <ArrowRight size={14} />
                </Button>
              </div>

              {/* Visual Preview Wireframe Mock */}
              <div className="lg:col-span-6">
                <div className="bg-zinc-950 border border-border rounded-xl p-5 min-h-[180px] flex flex-col justify-between shadow-inner">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between border-b border-border/20 pb-2">
                      <div className="w-16 h-3 bg-zinc-800 rounded-sm" />
                      <div className="w-24 h-2 bg-zinc-900 rounded-sm" />
                    </div>
                    {selectedPreviewTemplate === 'classic' && (
                      <div className="flex flex-col gap-2.5 font-serif">
                        <div className="w-full h-2 bg-zinc-900/60 rounded-sm" />
                        <div className="w-[85%] h-2 bg-zinc-900/60 rounded-sm" />
                        <div className="w-[90%] h-2 bg-zinc-900/60 rounded-sm" />
                      </div>
                    )}
                    {selectedPreviewTemplate === 'modern' && (
                      <div className="flex flex-col gap-2.5 font-sans">
                        <div className="flex gap-2">
                          <div className="w-[33%] h-2 bg-zinc-900/40 rounded-sm" />
                          <div className="w-[67%] h-2 bg-zinc-900/60 rounded-sm" />
                        </div>
                        <div className="w-full h-2 bg-zinc-900/60 rounded-sm" />
                      </div>
                    )}
                    {selectedPreviewTemplate === 'executive' && (
                      <div className="flex flex-col gap-3">
                        <div className="w-full h-1 bg-zinc-800 rounded-full" />
                        <div className="w-[80%] h-2 bg-zinc-900/60 rounded-sm" />
                        <div className="w-[95%] h-2 bg-zinc-900/60 rounded-sm" />
                      </div>
                    )}
                    {selectedPreviewTemplate === 'minimalist' && (
                      <div className="flex flex-col gap-2.5 font-sans py-1">
                        <div className="w-[95%] h-2 bg-zinc-900/60 rounded-sm" />
                        <div className="w-[85%] h-2 bg-zinc-900/60 rounded-sm" />
                      </div>
                    )}
                    {selectedPreviewTemplate === 'creative' && (
                      <div className="flex gap-3 border-l-2 border-zinc-800 pl-3">
                        <div className="flex-1 flex flex-col gap-2.5">
                          <div className="w-full h-2 bg-zinc-900/60 rounded-sm" />
                          <div className="w-[90%] h-2 bg-zinc-900/60 rounded-sm" />
                        </div>
                      </div>
                    )}
                    {selectedPreviewTemplate === 'compact' && (
                      <div className="flex flex-col gap-1.5">
                        <div className="w-full h-1.5 bg-zinc-800 rounded-sm" />
                        <div className="w-[75%] h-1.5 bg-zinc-900/60 rounded-sm" />
                        <div className="w-[90%] h-1.5 bg-zinc-900/60 rounded-sm" />
                        <div className="w-[60%] h-1.5 bg-zinc-900/60 rounded-sm" />
                      </div>
                    )}
                    {selectedPreviewTemplate === 'professional' && (
                      <div className="flex flex-col gap-2">
                        <div className="w-32 h-2 bg-zinc-800 rounded-sm" />
                        <div className="w-full h-2 bg-zinc-900/60 rounded-sm" />
                        <div className="w-[80%] h-2 bg-zinc-900/60 rounded-sm" />
                      </div>
                    )}
                    {selectedPreviewTemplate === 'technical' && (
                      <div className="flex flex-col gap-2 font-mono">
                        <div className="flex gap-1.5 flex-wrap">
                          <div className="w-10 h-3 bg-zinc-800/40 rounded-sm" />
                          <div className="w-14 h-3 bg-zinc-800/40 rounded-sm" />
                          <div className="w-8 h-3 bg-zinc-800/40 rounded-sm" />
                        </div>
                        <div className="w-full h-2 bg-zinc-900/60 rounded-sm" />
                      </div>
                    )}
                    {selectedPreviewTemplate === 'academic' && (
                      <div className="flex flex-col gap-2 font-serif">
                        <div className="w-full h-2 bg-zinc-800/40 rounded-sm" />
                        <div className="w-[70%] h-2 bg-zinc-900/60 rounded-sm" />
                        <div className="w-[90%] h-2 bg-zinc-900/60 rounded-sm" />
                      </div>
                    )}
                    {selectedPreviewTemplate === 'clean' && (
                      <div className="flex flex-col gap-3 py-1">
                        <div className="w-full h-2 bg-zinc-800/30 rounded-sm" />
                        <div className="w-[80%] h-2 bg-zinc-900/60 rounded-sm" />
                        <div className="w-[60%] h-2 bg-zinc-900/60 rounded-sm" />
                      </div>
                    )}
                  </div>
                  <span className="text-[9px] text-muted-foreground font-mono text-right mt-4 block">
                    Visual layout accent mockup
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* 4. FAQ Section */}
      <section className="py-16 md:py-24 border-t border-border bg-zinc-950/10 z-10 relative">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-xs font-bold uppercase tracking-widest text-red-400 mb-2">Frequently Asked</h2>
            <h3 className="text-2xl md:text-3xl font-extrabold text-white">Honest Answers Only.</h3>
          </div>
   
          <div className="flex flex-col gap-3 select-text">
            {faqItems.map((item, idx) => {
              const isOpen = activeFaq === idx
              return (
                <Card key={idx} className="overflow-hidden border-border bg-card/30">
                  <button
                    onClick={() => toggleFaq(idx)}
                    className="w-full text-left px-5 py-4 flex items-center justify-between text-sm font-bold text-white hover:bg-zinc-900/10 transition-colors"
                  >
                    <span>{item.q}</span>
                    <span className="text-red-400">
                      {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </span>
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 text-xs text-muted-foreground leading-relaxed border-t border-border/40 font-light bg-zinc-950/20">
                      {item.a}
                    </div>
                  )}
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* 5. Footer */}
      <footer className="py-12 border-t border-border bg-background z-10 relative no-print">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-muted-foreground">
          <div>© {new Date().getFullYear()} Seve. Free and open source.</div>
          <div className="flex items-center gap-6">
            <button 
              onClick={() => navigate('/privacy')} 
              className="hover:text-white transition-colors flex items-center gap-1.5"
            >
              <ShieldCheck size={16} className="text-emerald-500" />
              Privacy Notice
            </button>
              <a 
                href="https://github.com/wacim-abdellli/seve" 
                target="_blank" 
                rel="noreferrer" 
                className="hover:text-white transition-colors flex items-center gap-1.5"
              >
                <Code size={16} />
                GitHub
              </a>
            </div>
        </div>
      </footer>
    </div>
  )
}
