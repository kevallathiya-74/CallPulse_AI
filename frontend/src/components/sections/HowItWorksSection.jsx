import { motion } from 'framer-motion';
import React from 'react';
import {
  Upload, Mic, Users, TrendingUp, Heart, BookOpen,
  ShieldCheck, Lightbulb, BarChart2, FileText,
} from 'lucide-react';
import { useInView } from '../../hooks/useInView';

const STEPS = [
  { icon: Upload, name: 'Upload Call', desc: 'Drop your audio file or paste a transcript. Supports MP3, WAV, M4A, and TXT formats up to 50MB.' },
  { icon: Mic, name: 'Transcription', desc: 'AI converts the audio to text with 97% accuracy using speaker-aware speech recognition.' },
  { icon: Users, name: 'Speaker Split', desc: 'Automatically identifies and separates the agent and customer voices across the entire call.' },
  { icon: TrendingUp, name: 'Sentiment Pass', desc: 'Runs sentiment analysis on every sentence, generating a moment-by-moment emotional arc.' },
  { icon: Heart, name: 'Tone Detection', desc: 'Classifies agent tone as empathetic, neutral, robotic, or dismissive using a fine-tuned language model.' },
  { icon: BookOpen, name: 'Clarity Check', desc: 'Measures how clearly the agent communicated—flagging jargon, incomplete explanations, and fillers.' },
  { icon: ShieldCheck, name: 'Compliance Scan', desc: 'Checks every line against your configured mandatory script and regulatory disclosure requirements.' },
  { icon: Lightbulb, name: 'AI Summary', desc: 'Generates a concise narrative summary of the call with key insights, risks, and praise points.' },
  { icon: BarChart2, name: 'Score Assembly', desc: 'Combines all 6 dimension scores into a single weighted quality score between 0 and 100.' },
  { icon: FileText, name: 'Report Ready', desc: 'Delivers a structured coaching report with charts, transcripts, and exportable PDF in under 8 seconds.' },
];

export default React.memo(function HowItWorksSection() {
  const { ref, inView } = useInView({ threshold: 0.05 });

  return (
    <section id="how-it-works" ref={ref} className="py-24 px-6">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 36 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="heading-lg gradient-text mb-4">From Raw Call to Coaching Report</h2>
          <p className="text-text-muted text-lg">Ten intelligent steps. Eight seconds. One actionable report.</p>
        </motion.div>

        <div className="relative">
          {/* Timeline center line */}
          <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-[2px] -translate-x-1/2 timeline-line" />

          <div className="flex flex-col gap-8">
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              const isLeft = i % 2 === 0;

              return (
                <motion.div
                  key={step.name}
                  initial={{ opacity: 0, x: isLeft ? -30 : 30 }}
                  animate={inView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.7, delay: i * 0.08, ease: [0.23, 1, 0.32, 1] }}
                  className={`flex items-center gap-6 ${isLeft ? 'md:flex-row' : 'md:flex-row-reverse'} flex-row`}
                >
                  {/* Content card */}
                  <div className="flex-1">
                    <div className="glass-card p-5 hover:border-primary/25 transition-all duration-300">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-xs text-text-muted font-medium">Step {i + 1}</span>
                      </div>
                      <h3 className="font-syne font-bold text-text-primary mb-1">{step.name}</h3>
                      <p className="text-text-muted text-sm leading-relaxed">{step.desc}</p>
                    </div>
                  </div>

                  {/* Center icon circle */}
                  <div className="relative z-10 flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-[0_0_20px_rgba(0,212,255,0.3)]">
                      <Icon size={18} className="text-white" />
                    </div>
                  </div>

                  {/* Spacer for alternating layout */}
                  <div className="hidden md:block flex-1" />
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
});
