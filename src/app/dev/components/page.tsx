"use client";

import { useState } from "react";
import { CalorieRing, AreaChart, SemiGauge, BarRangeChart, PlateBalance, SegmentedProgress, Sparkline } from "@/components/data/Charts";
import { StatTile, PastelTile, HeroCard, GoalCard, TabBar, CitationChip, Slider, Toggle } from "@/components/data/Cards";
import { Range, SourceTag, Chip, SectionLabel, EmptyState, ToolNumber, Skeleton } from "@/components/data/Primitives";
import { Button, PillInput, Field, Select, SegmentedControl, StepperInput, Sheet, ConfirmDialog } from "@/components/forms/Forms";
import { NoticeCard, SafetyBanner, SyncStatusPill, OfflineBanner } from "@/components/shell/Banners";
import { MessageBubble, SuggestionChips, RefusalCard, MealSuggestionCard } from "@/components/chat/Chat";
import type { CoachMessage } from "@/lib/types";
import { WEEK, TODAY_SUMMARY } from "@/lib/mock";
import { formatDayName } from "@/lib/format";
import { Activity, Bike, Droplet, Footprints, Leaf, UtensilsCrossed, Wheat } from "lucide-react";

const demoMsg: CoachMessage = {
  id: "d1",
  role: "coach",
  text: "প্লেটের এক-চতুর্থাংশ ভাত, বাকি অংশে সবজি ও প্রোটিন রাখলে ভালো।",
  citations: [{ section: "Disease guidance — Diabetes", page: 84 }],
  toolNumbers: ["plate ¼ rice"],
  time: "10:02",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <SectionLabel>{title}</SectionLabel>
      <div>{children}</div>
    </section>
  );
}

export default function DevComponentsPage() {
  const [tab, setTab] = useState("a");
  const [sheet, setSheet] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [seg, setSeg] = useState("one");
  const [toggle, setToggle] = useState(true);
  const [slider, setSlider] = useState(40);
  const [stepper, setStepper] = useState(25);
  const [select, setSelect] = useState("light");
  const [text, setText] = useState("");
  const s = TODAY_SUMMARY;

  return (
    <div className="mx-auto max-w-3xl space-y-10 p-4 md:p-8">
      <header>
        <h1 className="text-3xl font-extrabold">Component gallery</h1>
        <p className="mt-1 text-sm text-ink/55">Storybook-style demo for /dev/components · Not a medical device. No diagnosis.</p>
      </header>

      <OfflineBanner />

      <Section title="Charts">
        <div className="card space-y-6 p-5">
          <div className="flex flex-wrap items-center gap-6">
            <div className="rounded-card bg-violet p-4">
              <CalorieRing eatenLow={s.kcalLow} eatenHigh={s.kcalHigh} targetLow={s.targetLow} targetHigh={s.targetHigh} animate />
            </div>
            <SemiGauge value={185} max={200} label="Active min" valueLabel="185 min" />
            <PlateBalance veg={0.2} protein={0.15} grains={0.5} other={0.15} size={140} />
          </div>
          <div className="rounded-card bg-violet p-4">
            <AreaChart data={WEEK.map((w) => w.kcal)} target={WEEK[0].target} labels={WEEK.map((w) => formatDayName(w.date, "en"))} highlightIndex={6} animate />
          </div>
          <BarRangeChart days={WEEK.map((w) => formatDayName(w.date, "en"))} values={WEEK.map((w) => w.kcal)} targets={WEEK.map((w) => w.target)} highlightToday />
          <SegmentedProgress segments={10} filled={6} />
          <Sparkline data={[1, 3, 2, 5, 4, 6]} />
        </div>
      </Section>

      <Section title="Primitives">
        <div className="card flex flex-wrap items-center gap-3 p-5">
          <Range low={1750} high={2050} />
          <SourceTag tag="fctb" />
          <SourceTag tag="estimated-recipe" />
          <SourceTag tag="ai-assisted" />
          <SourceTag tag="user" />
          <ToolNumber>plate ¼</ToolNumber>
          <Chip>default</Chip>
          <Chip selected>selected</Chip>
          <Chip tone="mint">mint</Chip>
          <Chip tone="sky">sky</Chip>
          <Chip tone="lilac">lilac</Chip>
          <Chip tone="peach">peach</Chip>
          <Skeleton className="h-16 w-40" />
        </div>
        <EmptyState title="Nothing here yet" body="Empty states stay calm and actionable." action={<Button>Log a meal</Button>} />
      </Section>

      <Section title="Cards">
        <div className="grid gap-4 sm:grid-cols-2">
          <HeroCard
            title="Today"
            period="Week"
            onPeriod={() => {}}
            chart={
              <div className="mt-3 rounded-tile bg-white/10 p-3">
                <CalorieRing eatenLow={1750} eatenHigh={2050} targetLow={1650} targetHigh={1850} size={120} />
              </div>
            }
            stats={[
              { label: "Protein", value: "68g" },
              { label: "Carbs", value: "240g" },
              { label: "Fat", value: "62g" },
            ]}
          />
          <div className="space-y-4">
            <StatTile icon={Wheat} label="Rice portion" value="about 1.5 bati" spark={[1, 1.5, 1.2, 1.5]} />
            <StatTile icon={Droplet} label="Water" value="1.2" unit="L" spark={[0.4, 0.6, 0.8, 1.0]} />
          </div>
          <PastelTile tone="mint" icon={Footprints} label="Walk" sublabel="+ log" />
          <PastelTile tone="sky" icon={Bike} label="Cycle" sublabel="+ log" />
          <PastelTile tone="lilac" icon={Activity} label="Home workout" sublabel="+ log" />
          <PastelTile tone="peach" icon={UtensilsCrossed} label="Log lunch" sublabel="next action" />
          <GoalCard icon={Leaf} title="Protein this week" subtitle="Goal 75g/day" progress={0.72} daysLeft={3} href="/home" />
          <div className="card p-4">
            <TabBar tabs={[{ id: "a", label: "Breakfast" }, { id: "b", label: "Lunch" }]} active={tab} onChange={setTab} />
            <p className="mt-3 text-sm text-ink/60">active tab: {tab}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <CitationChip section="Protein guidance" page={42} />
              <SyncStatusPill queued={0} />
              <SyncStatusPill queued={3} />
            </div>
          </div>
        </div>
      </Section>

      <Section title="Forms">
        <div className="card space-y-5 p-5">
          <PillInput id="demo" label="Search food" placeholder="bhat dal…" value={text} onChange={setText} />
          <Field label="Slider" htmlFor="demo-slider">
            <>
              <Slider label="Balance" leftLabel="Less" rightLabel="More" value={slider} onChange={setSlider} />
              <p className="font-num mt-1 text-sm font-bold tabular">{slider}</p>
            </>
          </Field>
          <Toggle label="Notifications" checked={toggle} onChange={setToggle} />
          <SegmentedControl
            ariaLabel="Demo"
            options={[
              { value: "one", label: "One" },
              { value: "two", label: "Two" },
              { value: "three", label: "Three" },
            ]}
            value={seg}
            onChange={setSeg}
          />
          <StepperInput label="Age" value={stepper} unit="yrs" onChange={setStepper} min={10} max={90} />
          <Select label="Activity" id="act" value={select} onChange={setSelect} options={[{ value: "light", label: "Light" }, { value: "moderate", label: "Moderate" }]} />
          <div className="flex flex-wrap gap-2">
            <Button>Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="danger-soft">Danger</Button>
            <Button loading>Loading</Button>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setSheet(true)}>Open sheet</Button>
            <Button variant="secondary" onClick={() => setConfirm(true)}>Confirm</Button>
          </div>
        </div>
      </Section>

      <Section title="Banners">
        <div className="space-y-3">
          <SafetyBanner mode="restricted" />
          <SafetyBanner mode="doctor-first" />
          <NoticeCard tone="gentle" title="A bigger day than planned" body="Here is a gentle way to spread it." action={<span className="underline">See plan</span>} />
          <NoticeCard tone="info" title="Not found in guidelines" body="Please ask a dietitian." />
        </div>
      </Section>

      <Section title="Chat">
        <div className="space-y-3">
          <MessageBubble m={{ id: "u1", role: "user", text: "diabetes thakle bhat koto khabo?", time: "10:02" }} />
          <MessageBubble m={demoMsg} />
          <SuggestionChips onPick={() => {}} />
          <RefusalCard />
          <MealSuggestionCard title="Cheap protein" body="Egg, small fish and dal stay under 100 taka." why="FCTB + bazar prices" kcalLow={70} kcalHigh={165} onAdd={() => {}} />
        </div>
      </Section>

      <Sheet open={sheet} onClose={() => setSheet(false)} title="Example sheet">
        <p className="text-sm text-ink/60">Bottom sheet content for portion pickers and parse results.</p>
        <div className="mt-4">
          <Button full onClick={() => setSheet(false)}>
            Close
          </Button>
        </div>
      </Sheet>
      <ConfirmDialog open={confirm} title="Delete my data?" body="Type DELETE in settings to confirm." confirmLabel="Delete" onConfirm={() => setConfirm(false)} onCancel={() => setConfirm(false)} />
    </div>
  );
}
