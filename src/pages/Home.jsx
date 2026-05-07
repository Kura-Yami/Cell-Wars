// @ts-nocheck
import { useEffect, useRef, useState } from 'react';
import imgWhiteBloodCell from '@/Images/Whiteblood cell.png';
import imgRedBloodCell from '@/Images/RedBloodCell.png';
import gifBacteriadup from '@/Images/Bacteria_Duplication_vid.gif';
import imgVirus from '@/Images/Virus.png';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Activity,
  Biohazard,
  CircleDot,
  Microscope,
  Play,
  Shield,
  Sparkles,
  Swords,
  Users,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import FloatingCells from '@/components/game/FloatingCells';

const cellTypes = [
  {
    name: 'White Blood Cells',
    role: 'Defenders',
    icon: Shield,
    color: 'from-slate-50 via-indigo-100 to-white',
    border: 'border-indigo-200',
    text: 'White blood cells patrol the body, identify invaders, and coordinate immune responses. In the game, this is the player cell.',
    stats: ['Engulf invaders', 'Signal immune help', 'Remember threats'],
  },
  {
    name: 'Red Blood Cells',
    role: 'Oxygen Carriers',
    icon: CircleDot,
    color: 'from-red-200 via-rose-400 to-red-700',
    border: 'border-red-200',
    text: 'Red blood cells move oxygen from the lungs to tissues. In the game, they are safe nutrients that help your cell grow.',
    stats: ['Carry oxygen', 'Flexible discs', 'No nucleus'],
  },
  {
    name: 'Bacteria',
    role: 'Living Invaders',
    icon: Biohazard,
    color: 'from-lime-200 via-emerald-400 to-green-800',
    border: 'border-emerald-200',
    text: 'Bacteria are single-celled organisms. Some are helpful, but harmful bacteria can multiply quickly and trigger inflammation.',
    stats: ['Can reproduce', 'Have cell walls', 'Some release toxins'],
  },
  {
    name: 'Viruses',
    role: 'Hijackers',
    icon: Zap,
    color: 'from-fuchsia-200 via-purple-500 to-violet-900',
    border: 'border-purple-200',
    text: 'Viruses are tiny packets of genetic material. They invade cells and use those cells to make more virus particles.',
    stats: ['Need host cells', 'Tiny particles', 'Rapid mutation'],
  },
];

const immuneSteps = [
  {
    title: 'Detect',
    text: 'Immune cells recognize unusual proteins, toxins, or damaged tissue signals.',
  },
  {
    title: 'Respond',
    text: 'White blood cells move toward the threat and begin attacking or coordinating help.',
  },
  {
    title: 'Remember',
    text: 'Some immune cells store information so the body can respond faster next time.',
  },
];

/** @param {{ className: string, icon: React.ElementType }} props */
function CellOrb({ className, icon: Icon }) {
  return (
    <div className={`relative flex aspect-square items-center justify-center rounded-full bg-gradient-to-br shadow-inner ${className}`}>
      <div className="absolute inset-[18%] rounded-full border border-white/40 bg-white/25 blur-[1px]" />
      <Icon className="relative z-10 h-9 w-9 text-white drop-shadow" />
    </div>
  );
}

function SiteHeader() {
  return (
    <header className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
      <div className="max-w-2xl">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary shadow-sm">
          <Microscope className="h-3.5 w-3.5" />
          Human Biology: Immunology
        </div>
        <h1 className="font-heading text-5xl font-bold leading-tight text-foreground md:text-7xl">
          Cell Wars
        </h1>
        <p className="mt-4 max-w-xl text-sm leading-6 text-muted-foreground md:text-base">
          Learn how immune cells defend the body, then play as a white blood cell in a bloodstream arena built for classroom demos.
        </p>
      </div>
      <div className="grid w-full max-w-xs grid-cols-2 gap-3">
        <Link to="/play?solo=true">
          <Button className="h-12 w-full rounded-lg font-heading text-base">
            <Play className="h-5 w-5" />
            Solo
          </Button>
        </Link>
        <Link to="/host">
          <Button variant="outline" className="h-12 w-full rounded-lg border-2 font-heading text-base">
            <Users className="h-5 w-5" />
            Host
          </Button>
        </Link>
      </div>
    </header>
  );
}

const gameConnections = [
  { bio: 'White blood cell patrols for threats', game: 'Your cell — you control it' },
  { bio: 'Red blood cells carry oxygen through blood', game: 'Collectibles that make you grow' },
  { bio: 'Bacteria can reproduce and spread', game: 'AI enemies that multiply over time' },
  { bio: 'Viruses hijack host cells', game: 'Fast enemies that drain your size' },
  { bio: 'Bigger immune cells engulf more', game: 'Larger size = can eat more, but slower' },
];

const slideLabels = ['Intro', 'How It Works', 'White Blood Cells', 'Red Blood Cells', 'Bacteria', 'Viruses', 'Play'];

function SlideTag({ n, total, label }) {
  return (
    <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-primary">
      Slide {n} of {total} · {label}
    </p>
  );
}

function Slide1() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-8 px-6 md:flex-row md:gap-12 md:px-12">
      <div className="max-w-lg">
        <SlideTag n={1} total={7} label="Overview" />
        <h2 className="font-heading text-4xl font-bold leading-tight text-foreground md:text-5xl">
          Your body is under constant attack.
        </h2>
        <p className="mt-5 text-base leading-7 text-muted-foreground">
          Every day, bacteria, viruses, and other pathogens try to invade your body. Your immune system — led by white blood cells — is the defense force that keeps you alive.
        </p>
        <p className="mt-3 text-base leading-7 text-muted-foreground">
          In this game, <strong>you are the white blood cell.</strong>
        </p>
      </div>
      <div className="flex h-64 w-64 shrink-0 items-center justify-center md:h-80 md:w-80">
        <img src={imgWhiteBloodCell} alt="White blood cell" className="h-full w-full object-contain drop-shadow-2xl" />
      </div>
    </div>
  );
}

function Slide2() {
  return (
    <div className="flex h-full flex-col justify-center gap-6 px-6 md:px-16">
      <div>
        <SlideTag n={2} total={7} label="Immune Response" />
        <h2 className="font-heading text-4xl font-bold text-foreground md:text-5xl">How your immune system works.</h2>
      </div>
      <div className="grid gap-5 md:grid-cols-3">
        {immuneSteps.map((step, index) => (
          <div key={step.title} className="flex flex-col gap-4 rounded-xl border border-border bg-white/80 p-6 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground">
              {index + 1}
            </div>
            <h3 className="font-heading text-2xl font-bold text-foreground">{step.title}</h3>
            <p className="text-sm leading-6 text-muted-foreground">{step.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function Slide3() {
  return (
    <div className="flex h-full flex-col justify-center gap-5 px-6 md:flex-row md:items-center md:gap-12 md:px-16">
      <div className="shrink-0 text-center md:text-left">
        <SlideTag n={3} total={7} label="White Blood Cells" />
        <img src={imgWhiteBloodCell} alt="White blood cell" className="mx-auto mb-2 h-32 w-32 object-contain md:mx-0" />
        <p className="text-xs font-semibold uppercase tracking-wide text-indigo-500">Leukocytes · Defenders</p>
        <h2 className="font-heading text-3xl font-bold text-foreground md:text-4xl">White Blood Cells</h2>
        <p className="mt-2 max-w-xs text-sm leading-6 text-muted-foreground">
          White blood cells are immune system cells produced in the bone marrow that protect the body against infections, foreign invaders, and diseases.
        </p>
        <div className="mt-3 inline-block rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
          In Game: You — the player cell
        </div>
      </div>

      <div className="grid flex-1 gap-3">
        <div className="rounded-xl border border-indigo-100 bg-white/80 p-4 shadow-sm">
          <h3 className="font-heading text-sm font-bold uppercase tracking-wide text-indigo-600">Cell Types</h3>
          <ul className="mt-2 space-y-1 text-sm leading-6 text-muted-foreground">
            <li><strong>Neutrophils</strong> — first responders, rush to infections within minutes</li>
            <li><strong>Macrophages</strong> — engulf and digest bacteria, clean up dead cells</li>
            <li><strong>T Cells</strong> — hunt and kill virus-infected or cancerous cells</li>
            <li><strong>B Cells</strong> — produce antibodies that tag pathogens for destruction</li>
            <li><strong>Natural Killer Cells</strong> — destroy abnormal cells without prior exposure</li>
          </ul>
        </div>
        <div className="rounded-xl border border-indigo-100 bg-white/80 p-4 shadow-sm">
          <h3 className="font-heading text-sm font-bold uppercase tracking-wide text-indigo-600">Real-World Examples</h3>
          <ul className="mt-2 space-y-1 text-sm leading-6 text-muted-foreground">
            <li><strong>Strep throat</strong> — neutrophils flood the throat, causing redness and swelling</li>
            <li><strong>COVID-19 vaccines</strong> — B cells make antibodies; T cells remember the virus for years</li>
            <li><strong>HIV</strong> — destroys CD4 T cells, leaving the immune system unable to fight anything</li>
            <li><strong>Leukemia</strong> — cancer where bone marrow makes too many dysfunctional white blood cells</li>
            <li><strong>Cancer cells</strong> — Natural Killer cells hunt and destroy them before tumors can form</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function Slide4() {
  return (
    <div className="flex h-full flex-col justify-center gap-5 px-6 md:flex-row md:items-center md:gap-12 md:px-16">
      <div className="shrink-0 text-center md:text-left">
        <SlideTag n={4} total={7} label="Red Blood Cells" />
        <img src={imgRedBloodCell} alt="Red blood cell" className="mx-auto mb-2 h-32 w-32 object-contain md:mx-0" />
        <p className="text-xs font-semibold uppercase tracking-wide text-red-500">Erythrocytes · Oxygen Carriers</p>
        <h2 className="font-heading text-3xl font-bold text-foreground md:text-4xl">Red Blood Cells</h2>
        <p className="mt-2 max-w-xs text-sm leading-6 text-muted-foreground">
          Red blood cells are specialized cells produced in the bone marrow that transport oxygen from the lungs to body tissues and carry carbon dioxide back for exhalation. They contain hemoglobin, a protein that gives blood its red color.
        </p>
        <div className="mt-3 inline-block rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
          In Game: Collectibles that make you grow
        </div>
      </div>

      <div className="grid flex-1 gap-3">
        <div className="rounded-xl border border-red-100 bg-white/80 p-4 shadow-sm">
          <h3 className="font-heading text-sm font-bold uppercase tracking-wide text-red-600">Key Biology</h3>
          <ul className="mt-2 space-y-1 text-sm leading-6 text-muted-foreground">
            <li><strong>Hemoglobin</strong> — iron-based protein inside RBCs that binds and carries oxygen</li>
            <li><strong>Biconcave disc shape</strong> — maximizes surface area for faster gas exchange</li>
            <li><strong>No nucleus</strong> — more room for hemoglobin; can't divide or repair themselves</li>
            <li><strong>Bone marrow production</strong> — your body makes ~2 million new RBCs every second</li>
            <li><strong>Carry CO₂ back</strong> — return carbon dioxide from tissues to the lungs for exhale</li>
          </ul>
        </div>
        <div className="rounded-xl border border-red-100 bg-white/80 p-4 shadow-sm">
          <h3 className="font-heading text-sm font-bold uppercase tracking-wide text-red-600">Real-World Examples</h3>
          <ul className="mt-2 space-y-1 text-sm leading-6 text-muted-foreground">
            <li><strong>Sickle cell anemia</strong> — misshapen crescent RBCs clump and block blood flow, causing severe pain crises</li>
            <li><strong>Iron deficiency anemia</strong> — not enough hemoglobin; causes fatigue, pale skin, shortness of breath</li>
            <li><strong>Altitude sickness</strong> — at high elevation, body produces more RBCs to compensate for thinner air</li>
            <li><strong>Blood transfusions</strong> — donated RBCs save lives in trauma, surgery, and cancer treatment</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function Slide5() {
  return (
    <div className="flex h-full flex-col justify-center gap-5 px-6 md:flex-row md:items-center md:gap-12 md:px-16">
      <div className="shrink-0 text-center md:text-left">
        <SlideTag n={5} total={7} label="Bacteria" />
        <img src={gifBacteriadup} alt="Bacteria duplication" className="mx-auto mb-2 h-32 w-32 object-contain md:mx-0 rounded-lg" />
        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Prokaryotes · Living Invaders</p>
        <h2 className="font-heading text-3xl font-bold text-foreground md:text-4xl">Bacteria</h2>
        <p className="mt-2 max-w-xs text-sm leading-6 text-muted-foreground">
          Bacteria are microscopic, single-celled prokaryotic organisms found in nearly every environment on Earth. While some act as pathogens causing infections like strep throat, most are harmless or beneficial, supporting digestion and immunity.
        </p>
        <div className="mt-3 inline-block rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
          In Game: AI enemies that multiply over time
        </div>
      </div>

      <div className="grid flex-1 gap-3">
        <div className="rounded-xl border border-emerald-100 bg-white/80 p-4 shadow-sm">
          <h3 className="font-heading text-sm font-bold uppercase tracking-wide text-emerald-700">Key Biology</h3>
          <ul className="mt-2 space-y-1 text-sm leading-6 text-muted-foreground">
            <li><strong>Prokaryotes</strong> — no membrane-bound nucleus; DNA floats freely in the cell</li>
            <li><strong>Cell wall</strong> — rigid outer layer that antibiotics target to destroy the bacteria</li>
            <li><strong>Binary fission</strong> — splits into two identical copies; can double every 20 minutes</li>
            <li><strong>Toxin release</strong> — some bacteria secrete poisons that damage surrounding tissue</li>
            <li><strong>Not all bad</strong> — your gut has ~38 trillion bacteria that help you digest food</li>
          </ul>
        </div>
        <div className="rounded-xl border border-emerald-100 bg-white/80 p-4 shadow-sm">
          <h3 className="font-heading text-sm font-bold uppercase tracking-wide text-emerald-700">Real-World Examples</h3>
          <ul className="mt-2 space-y-1 text-sm leading-6 text-muted-foreground">
            <li><strong>Strep throat</strong> (S. pyogenes) — untreated, can lead to rheumatic heart disease</li>
            <li><strong>MRSA</strong> — antibiotic-resistant staph; dangerous in hospitals and on skin</li>
            <li><strong>Salmonella</strong> — food poisoning from undercooked chicken or eggs; infects gut lining</li>
            <li><strong>Tuberculosis</strong> (M. tuberculosis) — kills ~1.5 million people per year worldwide</li>
            <li><strong>Bubonic plague</strong> (Y. pestis) — killed one-third of Europe in the 14th century</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function Slide6() {
  return (
    <div className="flex h-full flex-col justify-center gap-5 px-6 md:flex-row md:items-center md:gap-12 md:px-16">
      <div className="shrink-0 text-center md:text-left">
        <SlideTag n={6} total={7} label="Viruses" />
        <img src={imgVirus} alt="Virus" className="mx-auto mb-2 h-32 w-32 object-contain md:mx-0" />
        <p className="text-xs font-semibold uppercase tracking-wide text-purple-600">Non-living · Hijackers</p>
        <h2 className="font-heading text-3xl font-bold text-foreground md:text-4xl">Viruses</h2>
        <p className="mt-2 max-w-xs text-sm leading-6 text-muted-foreground">
          Viruses are tiny, non-living, acellular pathogens that require a living host cell to replicate. Composed of genetic material (DNA or RNA) inside a protein coat (capsid), they hijack host machinery to create new viruses, often destroying the host cell.
        </p>
        <div className="mt-3 inline-block rounded-full border border-purple-200 bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700">
          In Game: Fast enemies that drain your size
        </div>
      </div>

      <div className="grid flex-1 gap-3">
        <div className="rounded-xl border border-purple-100 bg-white/80 p-4 shadow-sm">
          <h3 className="font-heading text-sm font-bold uppercase tracking-wide text-purple-700">Key Biology</h3>
          <ul className="mt-2 space-y-1 text-sm leading-6 text-muted-foreground">
            <li><strong>Not alive</strong> — no metabolism, no cells; just DNA or RNA wrapped in a protein coat (capsid)</li>
            <li><strong>Hijack host cells</strong> — inject genetic material and force the cell to make thousands of copies</li>
            <li><strong>Tiny</strong> — 20–300 nanometers; most bacteria are 10–100× larger</li>
            <li><strong>Rapid mutation</strong> — RNA viruses mutate fast, making vaccines and treatments harder</li>
            <li><strong>Antibiotics don't work</strong> — need antivirals (e.g., Tamiflu) or vaccines for prevention</li>
          </ul>
        </div>
        <div className="rounded-xl border border-purple-100 bg-white/80 p-4 shadow-sm">
          <h3 className="font-heading text-sm font-bold uppercase tracking-wide text-purple-700">Real-World Examples</h3>
          <ul className="mt-2 space-y-1 text-sm leading-6 text-muted-foreground">
            <li><strong>Influenza</strong> — mutates yearly; that's why the flu vaccine changes every season</li>
            <li><strong>SARS-CoV-2 (COVID-19)</strong> — hijacks lung cells; caused a global pandemic in 2020</li>
            <li><strong>HIV</strong> — destroys T cells over years, eventually causing AIDS; no cure yet</li>
            <li><strong>Chickenpox (varicella)</strong> — lies dormant in nerve cells for decades; reactivates as shingles</li>
            <li><strong>Ebola</strong> — destroys blood vessel cells; up to 90% fatality in some outbreaks</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function Slide9() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 px-6 text-center md:px-16">
      <SlideTag n={7} total={7} label="Demo Time" />
      <h2 className="font-heading text-4xl font-bold text-foreground md:text-6xl">Time to play.</h2>
      <p className="max-w-xl text-base leading-7 text-muted-foreground">
        Apply what you learned. Collect red blood cells to grow, avoid pathogens until you're strong enough, then fight back.
      </p>
      <div className="mt-2 flex flex-wrap justify-center gap-4">
        <Link to="/play?solo=true">
          <Button className="h-14 rounded-lg px-8 font-heading text-lg">
            <Play className="h-5 w-5" />
            Solo Game
          </Button>
        </Link>
        <Link to="/host">
          <Button variant="outline" className="h-14 rounded-lg border-2 px-8 font-heading text-lg">
            <Users className="h-5 w-5" />
            Host Multiplayer
          </Button>
        </Link>
      </div>
      <div className="mt-4 rounded-xl border border-border bg-white/80 p-5 shadow-sm">
        <h3 className="font-heading text-base font-semibold">Discussion prompts</h3>
        <ul className="mt-3 space-y-2 text-sm leading-5 text-muted-foreground">
          <li>What makes bacteria different from viruses?</li>
          <li>Why does growth make the cell slower in the game?</li>
          <li>Which parts are simplified compared with real immunity?</li>
        </ul>
      </div>
    </div>
  );
}

function LearnTab() {
  const [activeSlide, setActiveSlide] = useState(0);
  /** @type {React.RefObject<HTMLDivElement>} */
  const containerRef = useRef(null);
  /** @type {React.MutableRefObject<(HTMLDivElement | null)[]>} */
  const slideRefs = useRef([]);

  const slides = [
    <Slide1 key={0} />,
    <Slide2 key={1} />,
    <Slide3 key={2} />,
    <Slide4 key={3} />,
    <Slide5 key={4} />,
    <Slide6 key={5} />,
    <Slide9 key={6} />,
  ];

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = slideRefs.current.indexOf(/** @type {HTMLDivElement} */ (entry.target));
            if (index !== -1) setActiveSlide(index);
          }
        });
      },
      { root: container, threshold: 0.5 }
    );
    slideRefs.current.forEach((slide) => slide && observer.observe(slide));
    return () => observer.disconnect();
  }, []);

  /** @param {number} index */
  const scrollToSlide = (index) => {
    slideRefs.current[index]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  return (
    <div className="relative">
      <div
        ref={containerRef}
        className="h-[calc(100vh-162px)] snap-y snap-mandatory overflow-y-scroll bg-white/82"
        style={{ scrollbarWidth: 'none' }}
      >
        {slides.map((slide, i) => (
          <div
            key={i}
            ref={(el) => { slideRefs.current[i] = el; }}
            className="h-full snap-start snap-always"
          >
            {slide}
          </div>
        ))}
      </div>

      {/* Dot nav — overlaid on right edge */}
      <div className="absolute right-4 top-1/2 z-10 flex -translate-y-1/2 flex-col gap-2">
        {slideLabels.map((label, i) => (
          <button
            key={i}
            onClick={() => scrollToSlide(i)}
            title={label}
            className={`h-2.5 w-2.5 rounded-full transition-all duration-200 ${
              activeSlide === i ? 'scale-125 bg-primary' : 'bg-muted-foreground/40 hover:bg-muted-foreground'
            }`}
          />
        ))}
      </div>

      {/* Prev/Next — overlaid on bottom edge */}
      <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          disabled={activeSlide === 0}
          onClick={() => scrollToSlide(activeSlide - 1)}
          className="bg-white/80 backdrop-blur-sm"
        >
          ← Prev
        </Button>
        <span className="text-xs text-muted-foreground">
          {activeSlide + 1} / {slides.length}
        </span>
        <Button
          size="sm"
          disabled={activeSlide === slides.length - 1}
          onClick={() => scrollToSlide(activeSlide + 1)}
          className="backdrop-blur-sm"
        >
          Next →
        </Button>
      </div>
    </div>
  );
}

function CellGuideTab() {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cellTypes.map((cell) => {
        const Icon = cell.icon;
        return (
          <motion.article
            key={cell.name}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-lg border ${cell.border} bg-white/86 p-5 shadow-sm`}
          >
            <CellOrb className={`mb-5 h-24 w-24 ${cell.color}`} icon={Icon} />
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{cell.role}</p>
            <h2 className="mt-1 font-heading text-2xl font-bold text-foreground">{cell.name}</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">{cell.text}</p>
            <div className="mt-5 grid gap-2">
              {cell.stats.map((stat) => (
                <div key={stat} className="flex items-center gap-2 text-sm text-foreground">
                  <Sparkles className="h-4 w-4 text-primary" />
                  {stat}
                </div>
              ))}
            </div>
          </motion.article>
        );
      })}
    </section>
  );
}

function PlayTab() {
  return (
    <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
      <section className="rounded-lg border border-border bg-white/86 p-6 shadow-sm md:p-8">
        <div className="flex items-center gap-3">
          <CellOrb className="h-20 w-20 from-white via-indigo-100 to-slate-300" icon={Shield} />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">Interactive Mode</p>
            <h2 className="font-heading text-3xl font-bold text-foreground">Play the immune defense game.</h2>
          </div>
        </div>
        <p className="mt-5 text-sm leading-6 text-muted-foreground">
          Use the game tab for live demonstrations. Solo mode works anywhere. Hosted multiplayer needs the published site plus a shared backend such as Supabase for room state.
        </p>
        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          <Link to="/play?solo=true">
            <Button className="h-14 w-full rounded-lg font-heading text-base">
              <Play className="h-5 w-5" />
              Solo Game
            </Button>
          </Link>
          <Link to="/host">
            <Button variant="secondary" className="h-14 w-full rounded-lg font-heading text-base">
              <Users className="h-5 w-5" />
              Host
            </Button>
          </Link>
          <Link to="/join">
            <Button variant="outline" className="h-14 w-full rounded-lg border-2 font-heading text-base">
              <Zap className="h-5 w-5" />
              Join
            </Button>
          </Link>
        </div>
      </section>

      <section className="relative min-h-[360px] overflow-hidden rounded-lg border border-border bg-slate-950 shadow-sm">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_35%,rgba(248,113,113,0.3),transparent_28%),radial-gradient(circle_at_70%_60%,rgba(34,197,94,0.2),transparent_24%),linear-gradient(135deg,#111827,#1f1235)]" />
        <div className="absolute left-[14%] top-[18%] h-12 w-12 rounded-full bg-red-500 shadow-[0_0_24px_rgba(239,68,68,0.55)]" />
        <div className="absolute left-[42%] top-[16%] h-8 w-8 rounded-full bg-red-300" />
        <div className="absolute right-[12%] top-[26%] h-20 w-32 rotate-12 rounded-full bg-gradient-to-r from-lime-300 to-green-700 shadow-lg" />
        <div className="absolute bottom-[18%] right-[24%] h-14 w-14 rounded-full bg-gradient-to-br from-fuchsia-300 to-purple-900 shadow-lg" />
        <div className="absolute bottom-[18%] left-[20%] flex h-32 w-32 items-center justify-center rounded-full bg-white shadow-[0_0_38px_rgba(255,255,255,0.5)]">
          <Shield className="h-14 w-14 text-primary" />
        </div>
        <div className="absolute left-5 top-5 rounded-md bg-black/45 px-3 py-2 text-xs font-semibold text-white backdrop-blur">
          Score 240
        </div>
        <div className="absolute bottom-5 left-5 right-5 rounded-lg border border-white/10 bg-black/45 p-4 text-white backdrop-blur">
          <div className="mb-2 flex items-center gap-2 font-heading text-lg">
            <Swords className="h-5 w-5" />
            Arena Preview
          </div>
          <p className="text-sm leading-5 text-white/75">
            Eat red cells to grow. Avoid pathogens until your white blood cell is strong enough to fight back.
          </p>
        </div>
      </section>
    </div>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen overflow-hidden bg-background">
      <FloatingCells />
      <main className="relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-6 md:px-8 md:py-10">
        <SiteHeader />

        <Tabs defaultValue="learn" className="w-full">
          <TabsList className="grid h-auto w-full grid-cols-3 rounded-lg border border-border bg-white/80 p-1 shadow-sm md:w-[520px]">
            <TabsTrigger value="learn" className="rounded-md py-2 font-heading">
              <Activity className="mr-2 h-4 w-4" />
              Learn
            </TabsTrigger>
            <TabsTrigger value="cells" className="rounded-md py-2 font-heading">
              <Microscope className="mr-2 h-4 w-4" />
              Cells
            </TabsTrigger>
            <TabsTrigger value="play" className="rounded-md py-2 font-heading">
              <Play className="mr-2 h-4 w-4" />
              Play
            </TabsTrigger>
          </TabsList>

          <TabsContent value="learn" className="mt-2 -mx-4 md:-mx-8">
            <LearnTab />
          </TabsContent>
          <TabsContent value="cells" className="mt-6">
            <CellGuideTab />
          </TabsContent>
          <TabsContent value="play" className="mt-6">
            <PlayTab />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
