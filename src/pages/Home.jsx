import React from 'react';
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

function LearnTab() {
  return (
    <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
      <section className="overflow-hidden rounded-lg border border-border bg-white/82 shadow-sm">
        <div className="grid min-h-[420px] gap-8 p-6 md:grid-cols-[0.9fr_1.1fr] md:p-8">
          <div className="flex flex-col justify-center">
            <h2 className="font-heading text-3xl font-bold text-foreground md:text-4xl">
              Your immune system is a living defense network.
            </h2>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              White blood cells move through blood and tissues looking for danger. They can engulf bacteria, mark infected cells, and call in specialized immune responses.
            </p>
            <div className="mt-6 grid gap-3">
              {immuneSteps.map((step, index) => (
                <div key={step.title} className="flex items-start gap-3 rounded-md border border-border bg-background/80 p-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                    {index + 1}
                  </div>
                  <div>
                    <h3 className="font-heading text-base font-semibold text-foreground">{step.title}</h3>
                    <p className="text-sm leading-5 text-muted-foreground">{step.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative min-h-[320px] overflow-hidden rounded-lg border border-rose-100 bg-[radial-gradient(circle_at_20%_20%,rgba(244,114,182,0.25),transparent_30%),linear-gradient(135deg,#fff1f2,#eef2ff_54%,#ecfdf5)]">
            <div className="absolute left-[10%] top-[18%] h-24 w-24 rounded-full bg-gradient-to-br from-red-200 via-red-500 to-red-800 shadow-xl" />
            <div className="absolute right-[14%] top-[12%] h-16 w-16 rounded-full bg-gradient-to-br from-red-100 via-rose-400 to-red-700 shadow-lg" />
            <div className="absolute bottom-[18%] left-[12%] h-14 w-14 rounded-full bg-gradient-to-br from-fuchsia-200 via-purple-500 to-violet-900 shadow-lg" />
            <div className="absolute bottom-[14%] right-[12%] h-20 w-32 rounded-full bg-gradient-to-r from-lime-200 via-emerald-400 to-green-800 shadow-lg" />
            <div className="absolute left-1/2 top-1/2 flex h-36 w-36 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-gradient-to-br from-white via-indigo-100 to-slate-200 shadow-2xl ring-8 ring-white/45">
              <Shield className="h-16 w-16 text-primary" />
            </div>
            <div className="absolute inset-x-8 bottom-8 rounded-lg border border-white/60 bg-white/75 p-4 shadow-sm backdrop-blur">
              <p className="text-sm font-medium text-foreground">
                Game idea: grow by collecting red blood cells, but choose when to fight pathogens. Bigger is safer, but slower.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4">
        <div className="rounded-lg border border-border bg-white/82 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <CellOrb className="h-16 w-16 from-white via-indigo-100 to-slate-300" icon={Shield} />
            <div>
              <h2 className="font-heading text-2xl font-bold">Immune Mission</h2>
              <p className="text-sm text-muted-foreground">Protect the bloodstream while learning what each cell does.</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-border bg-white/82 p-5 shadow-sm">
          <h3 className="font-heading text-lg font-semibold">Classroom Prompts</h3>
          <ul className="mt-3 space-y-3 text-sm leading-5 text-muted-foreground">
            <li>What makes bacteria different from viruses?</li>
            <li>Why does growth make the cell slower in the game?</li>
            <li>Which parts are simplified compared with real immunity?</li>
          </ul>
        </div>
        <div className="rounded-lg border border-border bg-white/82 p-5 shadow-sm">
          <h3 className="font-heading text-lg font-semibold">Best Demo Flow</h3>
          <p className="mt-2 text-sm leading-5 text-muted-foreground">
            Start with the cell guide, launch a short solo round, then discuss which game behaviors match real immune system behavior.
          </p>
        </div>
      </section>
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

          <TabsContent value="learn" className="mt-6">
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
