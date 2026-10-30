import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { loadUserCountry, loadWorld, type Country, type World } from '../countries';
import { SoundToggle } from '../SoundToggle';
import { speak } from '../speech';
import { Chip } from '../ui/Chip';
import { Feedback as FeedbackToast } from '../ui/Feedback';
import { IconButton } from '../ui/IconButton';
import { XIcon } from '../ui/icons';
import { Overlay } from '../ui/Overlay';
import { ProgressBar } from '../ui/ProgressBar';
import type { Focus } from './board';
import { CheckCard } from './CheckCard';
import { CountryCard } from './CountryCard';
import { FindCard } from './FindCard';
import { FlagJigsaw } from './FlagJigsaw';
import { FlatBoard } from './FlatBoard';
import { GlobeBoard } from './GlobeBoard';
import { LearnDoneCard } from './LearnDoneCard';
import { LearnHuntCard } from './LearnHuntCard';
import { LearnStartCard } from './LearnStartCard';
import { type Asked, BATCH, buildQuestions, dueTargets, levelAfter, levelOf, loadProgress, pickCodes, pickSession, type Progress, saveProgress, schedule, SESSION_MAX, sessionExtras, shuffle } from './learnSession';
import { LEVELS } from './LevelList';
import { MatchCard } from './MatchCard';
import { MemoryMatch } from './MemoryMatch';
import { PickFlagCard } from './PickFlagCard';
import { QuestionDock } from './QuestionDock';
import type { Paint } from './painter';
import { FLAG_RECOGNITION } from './recognition';
import { buildTargets, chapterOf, sovereignOf, type Target, withPaint } from './targets';

// Each new country: meet it on the map, then build its flag. Then a memory game with every
// country in the session, then practice on the map.
type Phase = 'start' | 'check' | 'meet' | 'build' | 'match' | 'practice' | 'done';
type Feedback = { tone: 'correct' | 'oops' | 'hint'; title: string; detail: string };
export type LearnView = 'map' | 'globe';

type Question = Asked<Target>;

// The quick check keeps asking new flags until the session's new ones are unknown, up to this many.
const MAX_CHECKS = 8;

// The player's own country first, then Easy → Medium → Hard, best-known flags first.
function learnOrder(targets: Target[], homeCode: string | null) {
  return [...targets].sort((a, b) =>
    Number(b.code === homeCode) - Number(a.code === homeCode)
    || chapterOf(a) - chapterOf(b)
    || (FLAG_RECOGNITION[b.code] ?? 0) - (FLAG_RECOGNITION[a.code] ?? 0)
    || b.area - a.area);
}

// Countries due for practice first, then the next new ones. `due` counts every due country,
// also the ones that wait for a later session.
function nextBatch(order: Target[], progress: Progress, now: number) {
  const due = dueTargets(order, progress, now);
  const { fresh, reviews } = pickSession(due, order.filter(t => !levelOf(progress, t.code)));
  return { fresh, review: reviews, due: due.length };
}

// Two other flags from countries of about the same fame.
function flagChoices(order: Target[], target: Target) {
  // By code: `order` is rebuilt when the home country loads, so the objects can differ.
  const i = order.findIndex(t => t.code === target.code);
  const near = order.slice(Math.max(0, i - 12), i + 13).filter(t => t.code !== target.code);
  return shuffle([target, ...shuffle(near).slice(0, 2)]);
}

// Known countries show their flags; the ones being learned stay blank until found.
function knownPaints(order: Target[], progress: Progress, skip: Set<string>) {
  const paints = new Map<Country, Paint>();
  for (const t of order) {
    if (skip.has(t.code) || levelOf(progress, t.code) < 2) continue;
    for (const f of t.features) paints.set(f, 'flag');
  }
  return paints;
}

// The progress chip's word for each step of a session.
const STEP_LABELS: Partial<Record<Phase, string>> = { check: 'Check', meet: 'Meet', build: 'Build', match: 'Match', practice: 'Practice' };

const NO_CODES: string[] = [];

// `codes`: countries sent from Flag Hunt's "Learn these", learned before anything else.
export function Learn({ view, viewSwitch, codes = NO_CODES }: { view: LearnView; viewSwitch?: ReactNode; codes?: string[] }) {
  const [world, setWorld] = useState<World | null>(null);
  const [homeCode, setHomeCode] = useState<string | null>(null);
  const [progress, setProgress] = useState<Progress>({});

  const [phase, setPhase] = useState<Phase>('start');
  // Quick check: new countries in order, how many of them get asked, and the answers so far.
  const [candidates, setCandidates] = useState<Target[]>([]);
  const [checkCount, setCheckCount] = useState(0);
  // How many unknown flags the check looks for: this session's new countries.
  const [checkGoal, setCheckGoal] = useState(0);
  const [checkIndex, setCheckIndex] = useState(0);
  const [unknown, setUnknown] = useState<Target[]>([]);
  const [knew, setKnew] = useState<Target[]>([]);
  const [review, setReview] = useState<Target[]>([]);
  const [fresh, setFresh] = useState<Target[]>([]);
  const [session, setSession] = useState<Target[]>([]);
  // Codes of countries the kid knew in the check that join just to repeat them.
  const [repeats, setRepeats] = useState<Set<string>>(new Set());
  const [meetIndex, setMeetIndex] = useState(0);
  const [matches, setMatches] = useState(0);
  // Bumped each session so the memory game deals new cards.
  const [round, setRound] = useState(0);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [index, setIndex] = useState(0);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [paints, setPaints] = useState<Map<Country, Paint>>(new Map());
  const [focus, setFocus] = useState<Focus | null>(null);
  // Whether the meet card's facts are open on phones; kept from one country to the next.
  const [factsOpen, setFactsOpen] = useState(false);
  // Flag Hunt's countries, until their session starts.
  const [huntCodes, setHuntCodes] = useState(codes);
  const timer = useRef<number>(undefined);

  useEffect(() => setHuntCodes(codes), [codes]);

  useEffect(() => {
    let cancelled = false;
    setProgress(loadProgress());
    loadWorld().then(w => {
      if (!cancelled) setWorld(w);
    });
    loadUserCountry().then(code => {
      if (!cancelled) setHomeCode(sovereignOf(code));
    });
    return () => { cancelled = true; window.clearTimeout(timer.current); };
  }, []);

  const order = useMemo(() => (world ? learnOrder(buildTargets(world), homeCode) : []), [world, homeCode]);
  const batch = useMemo(() => nextBatch(order, progress, Date.now()), [order, progress]);
  const hunt = useMemo(() => pickCodes(order, huntCodes), [order, huntCodes]);
  // While the map loads the codes can't be checked yet, so the card waits with them.
  const showHunt = huntCodes.length > 0 && (!world || hunt.length > 0);
  const huntSize = world ? hunt.length : Math.min(huntCodes.length, SESSION_MAX);
  const counts = useMemo(() => {
    const c = [0, 0, 0, 0];
    for (const t of order) c[levelOf(progress, t.code)]++;
    return c;
  }, [order, progress]);

  const question = phase === 'practice' ? questions[index] : undefined;
  const choices = useMemo(() => (question?.kind === 'pick' ? flagChoices(order, question.target) : []), [order, question]);
  const board = view === 'globe' ? 'globe' : 'map';

  // Between sessions the map shows every known flag.
  useEffect(() => {
    if (phase === 'start') setPaints(knownPaints(order, progress, new Set()));
  }, [phase, order, progress]);

  // A pick question lights its country up and turns to it.
  useEffect(() => {
    if (question?.kind !== 'pick') return;
    const { target } = question;
    setPaints(p => withPaint(p, target.features, 'answer'));
    setFocus({ lonLat: target.center, features: target.features, id: Date.now() });
  }, [question]);

  // Functional, so a level set from a timer doesn't drop one set just before.
  // Also moves the country's next practice day (see `schedule`).
  const setLevel = (code: string, level: number, ok = true) => {
    setProgress(p => {
      const next = { ...p, [code]: schedule(p[code], level, ok, Date.now()) };
      saveProgress(next);
      return next;
    });
  };

  const meet = (i: number, batchFresh: Target[]) => {
    const t = batchFresh[i];
    setMeetIndex(i);
    setFeedback(null);
    setPaints(p => withPaint(p, t.features, 'flag'));
    setFocus({ lonLat: t.center, features: t.features, id: Date.now() });
    speak(t.name);
  };

  // The countries being practiced go blank so their flags don't give them away.
  const startPractice = (sessionTargets: Target[]) => {
    setPaints(p => withPaint(p, sessionTargets.flatMap(t => t.features), null));
    setFeedback(null);
    setIndex(0);
    setPhase('practice');
  };

  // The memory game needs at least 2 countries.
  const afterBuilding = (sessionTargets: Target[]) => {
    setFeedback(null);
    if (sessionTargets.length >= 2) setPhase('match');
    else startPractice(sessionTargets);
  };

  // After the check: meet and build what the kid didn't know; reviews and a few countries
  // they knew join for the memory game and the map.
  const beginLearning = (missed: Target[], reviews: Target[], known: Target[]) => {
    const { extras, repeats: again } = sessionExtras(reviews, known);
    const all = [...missed, ...extras];
    setFresh(missed);
    setSession(all);
    setRepeats(new Set(again.map(t => t.code)));
    setQuestions(buildQuestions(all));
    setMatches(0);
    setRound(r => r + 1);
    if (missed.length) {
      setPhase('meet');
      meet(0, missed);
    } else if (all.length) {
      afterBuilding(all);
    } else {
      setPhase('done');
    }
  };

  const start = () => {
    const { fresh: f, review: r } = batch;
    if (!f.length && !r.length) return;
    window.clearTimeout(timer.current);
    setFeedback(null);
    setReview(r);
    setKnew([]);
    setUnknown([]);
    if (!f.length) {
      beginLearning([], r, []);
      return;
    }
    const pool = order.filter(t => !levelOf(progress, t.code));
    setCandidates(pool);
    setCheckGoal(f.length);
    setCheckCount(Math.min(f.length, pool.length));
    setCheckIndex(0);
    setPaints(knownPaints(order, progress, new Set(r.map(t => t.code))));
    setPhase('check');
  };

  // From Flag Hunt: no quick check, every country is met, built, matched and found.
  const startHunt = () => {
    window.clearTimeout(timer.current);
    setFeedback(null);
    setReview([]);
    setKnew([]);
    setUnknown([]);
    setHuntCodes([]);
    setPaints(knownPaints(order, progress, new Set(hunt.map(t => t.code))));
    beginLearning(hunt, [], []);
  };

  // A flag the kid already knows becomes Known and the check asks one more;
  // an unknown one is kept for the meet step. No penalty either way.
  const answerCheck = (ok: boolean, miss?: Feedback) => {
    const t = candidates[checkIndex];
    const missed = ok ? unknown : [...unknown, t];
    const known = ok ? [...knew, t] : knew;
    const count = ok ? Math.min(checkCount + 1, MAX_CHECKS, candidates.length) : checkCount;
    if (ok) {
      setLevel(t.code, 2);
      setKnew(known);
      setPaints(p => withPaint(p, t.features, 'flag'));
    }
    setUnknown(missed);
    setCheckCount(count);
    setFeedback(ok ? { tone: 'correct', title: `Yes! You know ${t.name}`, detail: 'No need to learn it again.' } : (miss ?? null));
    timer.current = window.setTimeout(() => {
      setFeedback(null);
      if (missed.length >= checkGoal || checkIndex + 1 >= count) beginLearning(missed, review, known);
      else setCheckIndex(checkIndex + 1);
    }, ok ? 1200 : 1500);
  };

  // Met: on to building its flag.
  const nextMeet = () => {
    window.clearTimeout(timer.current);
    const t = fresh[meetIndex];
    setLevel(t.code, Math.max(levelOf(progress, t.code), 1));
    setFeedback(null);
    setPhase('build');
  };

  // Flag built: say its name, give it a moment, then meet the next country.
  const builtFlag = () => {
    speak(fresh[meetIndex].name);
    timer.current = window.setTimeout(() => {
      if (meetIndex + 1 < fresh.length) {
        setPhase('meet');
        meet(meetIndex + 1, fresh);
      } else {
        afterBuilding(session);
      }
    }, 1200);
  };

  const matched = (code: string) => {
    const t = session.find(s => s.code === code);
    if (t) speak(t.name);
    setMatches(m => m + 1);
  };

  // Moves on; a country that will be asked again goes blank so its flag doesn't give it away.
  const nextQuestion = (qs: Question[], clear: Target | null) => {
    setFeedback(null);
    if (clear) setPaints(p => withPaint(p, clear.features, null));
    if (index + 1 >= qs.length) setPhase('done');
    else setIndex(index + 1);
  };

  const answer = (ok: boolean, wrongName: string, clicked?: Country) => {
    if (!question) return;
    const { target: t, kind } = question;
    const before = levelOf(progress, t.code);
    const level = levelAfter(before, kind, ok, repeats.has(t.code));
    setLevel(t.code, level, ok);

    if (ok) {
      const askedAgain = questions.slice(index + 1).some(q => q.target === t);
      setPaints(p => withPaint(p, t.features, 'flag'));
      setFeedback({
        tone: 'correct',
        title: `Yes! ${t.name}`,
        detail: level > before && level >= 2 ? `${t.name} is now ${LEVELS[level].label}!` : 'Flag painted.',
      });
      timer.current = window.setTimeout(() => nextQuestion(questions, askedAgain ? t : null), 1200);
      return;
    }

    // A miss shows the right answer, then asks the same thing again later.
    const qs = question.retry ? questions : [...questions, { ...question, retry: true }];
    setQuestions(qs);
    const clickedBefore = clicked ? (paints.get(clicked) ?? null) : null;
    setPaints(p => {
      const shown = clicked ? withPaint(p, [clicked], 'wrong') : p;
      return withPaint(shown, t.features, kind === 'pick' ? 'flag' : 'answer');
    });
    setFocus({ lonLat: t.center, features: t.features, id: Date.now() });
    setFeedback({
      tone: 'oops',
      title: kind === 'pick' ? `Oops, that's the flag of ${wrongName}` : `Oops, that's ${wrongName}`,
      detail: kind === 'pick'
        ? `This is ${t.name}. Look at its flag! We'll try again soon.`
        : `${t.name} is the yellow one. We'll try again soon.`,
    });
    timer.current = window.setTimeout(() => {
      if (clicked) setPaints(p => withPaint(p, [clicked], clickedBefore));
      nextQuestion(qs, t);
    }, 2800);
  };

  const onPick = (clicked: Country) => {
    const code = sovereignOf(clicked.properties.code);

    if (phase === 'check') {
      if (feedback) return;
      if (code === candidates[checkIndex].code) answerCheck(true);
      else answerCheck(false, { tone: 'hint', title: `That's ${clicked.properties.name}`, detail: "No problem, let's meet this one!" });
      return;
    }

    if (feedback && feedback.tone !== 'hint') return;

    if (phase === 'meet') {
      const t = fresh[meetIndex];
      window.clearTimeout(timer.current);
      if (code === t.code) {
        setFeedback({ tone: 'correct', title: `Hi, ${t.name}!`, detail: 'Nice to meet you.' });
        timer.current = window.setTimeout(nextMeet, 1000);
      } else {
        setFeedback({ tone: 'hint', title: `That's ${clicked.properties.name}`, detail: `${t.name} is the one with its flag on.` });
        timer.current = window.setTimeout(() => setFeedback(null), 2000);
      }
      return;
    }

    if (!question || question.kind === 'pick') return;
    answer(code === question.target.code, clicked.properties.name, clicked);
  };

  const stop = () => {
    window.clearTimeout(timer.current);
    setFeedback(null);
    setPhase('start');
  };

  const stepLabel = STEP_LABELS[phase];
  const inSession = stepLabel !== undefined;
  // Meet and build go one new country at a time.
  const perCountry = phase === 'meet' || phase === 'build';
  const step = phase === 'check' ? checkIndex + 1 : perCountry ? meetIndex + 1 : phase === 'match' ? matches : index + 1;
  const steps = phase === 'check' ? checkCount : perCountry ? fresh.length : phase === 'match' ? session.length : questions.length;
  const checking = phase === 'check' ? candidates[checkIndex] : undefined;
  const meeting = phase === 'meet' ? fresh[meetIndex] : undefined;
  const hasNext = batch.fresh.length + batch.review.length > 0;

  return (
    // `[&_canvas]` aims the globe's three.js canvas, which the board renders itself.
    // `data-game-active` hides the app's top bar and tab bar on phones during a session.
    <div data-game-active={inSession ? '' : undefined} className={`relative h-full font-body text-fg [&_canvas]:cursor-crosshair ${view === 'globe' ? 'bg-backdrop' : 'bg-map-sea'}`}>
      {inSession && (
        // Above the build and match overlays, so Stop and the sound switch stay in reach.
        <div className="absolute top-4 right-4 z-3 flex items-center gap-3 max-md:top-3 max-md:right-3 max-md:left-3">
          <IconButton aria-label="Stop learning" onClick={stop} className="md:order-last">
            <XIcon size={22} strokeWidth="3" />
          </IconButton>
          <SoundToggle />
          <Chip phone="sticker" render={<div />} className="md:order-first max-md:min-w-0 max-md:flex-1">
            <span className="shrink-0">{stepLabel} {step} / {steps}</span>
            <ProgressBar value={step / steps} label="Session progress" className="max-md:w-auto max-md:flex-1" />
          </Chip>
        </div>
      )}

      {world && (view === 'globe'
        ? <GlobeBoard world={world} paints={paints} focus={focus} onPick={onPick} />
        : <FlatBoard world={world} paints={paints} focus={focus} onPick={onPick} />)}

      {inSession && (
        <QuestionDock>
          {feedback && <FeedbackToast raised tone={feedback.tone} title={feedback.title} detail={feedback.detail} />}

          {checking && (
            <CheckCard
              code={checking.code}
              board={board}
              disabled={!!feedback}
              onNotYet={() => answerCheck(false, { tone: 'hint', title: 'No problem!', detail: "Let's meet this one." })}
            />
          )}

          {meeting && (
            <CountryCard
              target={meeting}
              order={order}
              board={board}
              open={factsOpen}
              onOpenChange={setFactsOpen}
              saidHi={feedback?.tone === 'correct'}
              onNext={nextMeet}
            />
          )}

          {question && question.kind !== 'pick' && (
            <FindCard code={question.target.code} name={question.kind === 'name' ? question.target.name : undefined} board={board} />
          )}

          {question?.kind === 'pick' && (
            <PickFlagCard
              choices={choices}
              disabled={!!feedback}
              onPick={(code, name) => answer(code === question.target.code, name)}
            />
          )}
        </QuestionDock>
      )}

      {/* Build and match sit over the map; the top padding keeps them clear of the progress chip. */}
      {phase === 'build' && fresh[meetIndex] && (
        <Overlay scroll>
          <div className="w-[480px] max-w-full">
            <FlagJigsaw key={fresh[meetIndex].code} code={fresh[meetIndex].code} name={fresh[meetIndex].name} onDone={builtFlag} />
          </div>
        </Overlay>
      )}

      {phase === 'match' && (
        <Overlay scroll>
          <MatchCard>
            <MemoryMatch key={round} countries={session} onMatch={matched} onDone={() => startPractice(session)} />
          </MatchCard>
        </Overlay>
      )}

      {phase === 'start' && showHunt && (
        <Overlay>
          <LearnHuntCard
            board={board}
            loading={!world}
            viewSwitch={viewSwitch}
            size={huntSize}
            countries={hunt.map(t => ({ code: t.code, name: t.name, level: levelOf(progress, t.code) }))}
            onStart={startHunt}
            onNotNow={() => setHuntCodes([])}
          />
        </Overlay>
      )}

      {phase === 'start' && !showHunt && (
        <Overlay>
          <LearnStartCard
            board={board}
            loading={!world}
            viewSwitch={viewSwitch}
            counts={counts}
            due={batch.due}
            hasNext={hasNext}
            onStart={start}
          />
        </Overlay>
      )}

      {phase === 'done' && (
        <Overlay>
          <LearnDoneCard
            knew={knew.length}
            met={fresh.length}
            practiced={session.length}
            // Countries known in the check that also repeated are listed once.
            countries={[...knew.filter(k => !session.some(s => s.code === k.code)), ...session].map(t => ({ code: t.code, name: t.name, level: levelOf(progress, t.code) }))}
            more={hasNext ? batch.fresh.length || BATCH : undefined}
            onMore={start}
          />
        </Overlay>
      )}
    </div>
  );
}
