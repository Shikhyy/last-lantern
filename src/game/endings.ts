import { pactSummary } from './pacts';
import { factionOutcome, player } from './state';
import type { EndingId, EndingState, Faction, MatchState } from './types';

export interface EndingCopy {
  title: string;
  epilogue: string;
  faction: Faction;
}

const ENDINGS: Record<EndingId, EndingCopy> = {
  keeper_of_the_flame: {
    title: 'Keeper of the Flame',
    faction: 'oathkeeper',
    epilogue:
      'The Last Lantern is carried out of the Aangan at dawn, and the palace lets out a breath it has held for six nights. You kept your oaths in a house built to break them. The steward’s seal is pressed into your hand, still warm. Nimbagarh will not remember your name for four hundred years; it will remember that the flame did not go out on your watch.',
  },
  quiet_steward: {
    title: 'The Quiet Steward',
    faction: 'oathkeeper',
    epilogue:
      'The Shadowed are named, the flame holds, and you are not there to see it. Someone else carries the lantern out through the gate while your chair is carried the other way. The palace keeps its fortune and loses its witness. In the archive, a clerk writes your name once, in the small hand reserved for those who paid for a victory they did not survive. The flame is steady. The room is quiet. That will have to be enough.',
  },
  shadows_lantern: {
    title: 'The Shadow’s Lantern',
    faction: 'shadow',
    epilogue:
      'You put out the Last Lantern with your own hand, and the palace does not stop you. The court empties. The oaths are read aloud and found to be only words. In the dark of the Aangan, the three of you divide a fortune that was never yours, and the sandstone keeps the sound of it. By morning the gates are open and the road is clear. No one follows. No one ever will.',
  },
  gilded_betrayal: {
    title: 'The Gilded Betrayal',
    faction: 'shadow',
    epilogue:
      'The Shadowed take the flame, and they take it with the help of a promise you made in daylight. What you traded for safety is read out at the unmasking, quietly, without commentary. The people you protected are alive; the thing you protected them from is now the thing that owns the palace. Nimbagarh pays its debts in gold leaf. In the morning, the gold is the only warm thing left.',
  },
  long_dark: {
    title: 'The Long Dark',
    faction: 'shadow',
    epilogue:
      'The Lantern Meter reaches zero before the sixth dawn. There is no vote, no verdict, no last question: only the flame going down like a tide, and the corridors going black one by one. The palace keeps its fortune and loses its name. Somewhere in the dark, three people are still pretending to be twelve. The desert does not care which of them was lying.',
  },
  unlit_oath: {
    title: 'The Unlit Oath',
    faction: 'shadow',
    epilogue:
      'The final vote ties, and ties again. No one is named. The Lantern’s Riddle closes with every tally cancelled, and the flame is carried out under a cloth because no one has the authority to look at it. The Shadowed leave with the rest. The oath is not broken; it is simply never finished. In Nimbagarh, an unfinished oath is the oldest kind of victory.',
  },
};

export type EndingTrigger = 'faction' | 'long_dark' | 'unlit';

export function chooseEndingId(state: MatchState, trigger: EndingTrigger): EndingId {
  if (trigger === 'long_dark') return 'long_dark';
  if (trigger === 'unlit') return 'unlit_oath';
  const me = player(state);
  if (state.outcome === 'oathkeeper') {
    const summary = pactSummary(state);
    return me.alive && summary.kept >= summary.broken ? 'keeper_of_the_flame' : 'quiet_steward';
  }
  return me.role === 'shadow' ? 'shadows_lantern' : 'gilded_betrayal';
}

export function buildEnding(state: MatchState, trigger: EndingTrigger): EndingState {
  const id = chooseEndingId(state, trigger);
  const copy = ENDINGS[id];
  const me = player(state);
  const summary = pactSummary(state);
  const decisions = state.events
    .filter((event) =>
      event.kind === 'judgment' ||
      event.kind === 'elimination' ||
      event.kind === 'mission' ||
      (event.kind === 'vote' && event.actorId === 'host'),
    )
    .map((event) => `Night ${event.round}: ${event.text}`)
    .slice(-14);

  return {
    id,
    title: copy.title,
    faction: copy.faction,
    epilogue: copy.epilogue,
    playerSurvived: me.alive,
    pactsKept: summary.kept,
    pactsBroken: summary.broken,
    unmasking: {
      roles: state.contestants.map((contestant) => ({
        contestantId: contestant.id,
        name: contestant.name,
        role: contestant.role,
        alive: contestant.alive,
      })),
      votes: [...state.voteHistory],
      pacts: state.pacts.map((pact) => ({
        a: pact.a,
        b: pact.b,
        term: pact.term,
        status: pact.status,
      })),
      lies: state.claims
        .filter((claim) => claim.truth === 'false')
        .map((claim) => ({ speakerId: claim.speakerId, text: claim.text }))
        .slice(-12),
      decisions,
    },
  };
}

export function endingCopy(id: EndingId): EndingCopy {
  return ENDINGS[id];
}

export function allEndings(): { id: EndingId; title: string; faction: Faction }[] {
  return (Object.keys(ENDINGS) as EndingId[]).map((id) => ({
    id,
    title: ENDINGS[id].title,
    faction: ENDINGS[id].faction,
  }));
}

/** Sets the terminal phase, reveals every role, and builds the epilogue. */
export function applyEnding(state: MatchState, trigger: EndingTrigger = 'faction'): void {
  state.phase = 'ending';
  for (const contestant of state.contestants) contestant.revealedRole = contestant.role;
  const resolved: EndingTrigger =
    trigger === 'unlit' || state.finaleState?.noElimination === 'tie'
      ? 'unlit'
      : state.lantern <= 0
        ? 'long_dark'
        : trigger;
  state.outcome =
    state.outcome ?? factionOutcome(state) ?? (player(state).role === 'shadow' ? 'shadow' : 'oathkeeper');
  state.ending = buildEnding(state, resolved);
  state.lastMessage = state.ending.title;
}
