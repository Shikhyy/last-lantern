import { addJournal, changeLantern, emit, getContestant, living, note, player } from './state';
import type { ActionResult, GameEvent, MatchState, Mission } from './types';
import { MAX_SHIELDS } from './types';
import { clueAvailable } from './evidence';

function openMission(state: MatchState, missionId: string): { mission?: Mission; error?: string } {
  const mission = state.missions.find((entry) => entry.id === missionId);
  if (!mission) return { error: 'That mission is not on the board.' };
  if (state.phase !== 'day') return { error: 'Missions run during the day.' };
  if (mission.status !== 'open') return { error: 'That mission is already sealed.' };
  return { mission };
}

export function contribute(state: MatchState, missionId: string): ActionResult {
  const { mission, error } = openMission(state, missionId);
  if (!mission) return { state, events: [], error: error ?? 'Unknown mission.' };
  const me = player(state);
  if (!me.alive) return { state, events: [], error: 'The dead do not work.' };
  const given = mission.contributions[me.id] ?? 0;
  if (given >= 2) return { state, events: [], error: 'You have already given this mission all you can.' };
  mission.contributions[me.id] = given + 1;
  const event = emit(state, {
    kind: 'mission',
    text: `${me.name} takes up a share of ${mission.title} (${given + 1} of 2).`,
    actorId: me.id,
  });
  note(state, `You add your hands to ${mission.title}.`);
  return { state, events: [event], error: null };
}

export function sabotageMission(state: MatchState, missionId: string): ActionResult {
  const { mission, error } = openMission(state, missionId);
  if (!mission) return { state, events: [], error: error ?? 'Unknown mission.' };
  const me = player(state);
  if (!me.alive) return { state, events: [], error: 'The dead do not act.' };
  if (me.role !== 'shadow') return { state, events: [], error: 'There is no step here for you.' };
  if (mission.sabotagedBy) return { state, events: [], error: 'The room is already compromised.' };
  mission.sabotagedBy = me.id;
  const event = emit(state, {
    kind: 'sabotage',
    text: `A quiet hand spoils ${mission.title}.`,
    privateTo: me.id,
    actorId: me.id,
  });
  addJournal(state, {
    kind: 'note',
    title: 'What you did',
    text: `You spoiled ${mission.title}. No one saw your hand.`,
  });
  note(state, 'The room will find the damage later.');
  return { state, events: [event], error: null };
}

export function resolveMission(state: MatchState, missionId: string): ActionResult {
  const mission = state.missions.find((entry) => entry.id === missionId);
  if (!mission) return { state, events: [], error: 'That mission is not on the board.' };
  if (mission.status !== 'open') return { state, events: [], error: 'That mission is already sealed.' };
  if (state.phase !== 'day') return { state, events: [], error: 'Missions are sealed during the day.' };

  const events: GameEvent[] = [];
  const contributors = Object.entries(mission.contributions)
    .filter(([, amount]) => amount > 0)
    .map(([id]) => id);
  const total = contributors.reduce((sum, id) => sum + (mission.contributions[id] ?? 0), 0);
  const sabotaged = Boolean(mission.sabotagedBy);
  const success = total >= mission.threshold && !sabotaged;

  mission.status = 'resolved';
  mission.success = success;
  mission.resolvedText = success
    ? `${mission.title} is completed: ${total} hands against a threshold of ${mission.threshold}.`
    : sabotaged
      ? `${mission.title} fails at the seal. A hand was in it that should not have been.`
      : `${mission.title} falls short: ${total} hands against a threshold of ${mission.threshold}.`;

  const event = emit(state, {
    kind: 'mission',
    text: mission.resolvedText,
    amount: total,
  });
  events.push(event);

  const delta = success ? mission.reward.lantern : mission.failure.lantern;
  if (delta !== 0) {
    changeLantern(state, delta, success ? `${mission.title} completed` : `${mission.title} failed`, event.id);
  }

  if (success) {
    for (const id of contributors) {
      const contestant = getContestant(state, id);
      contestant.embers += mission.reward.embers;
    }
    const leader = contributors
      .map((id) => ({ id, amount: mission.contributions[id] ?? 0 }))
      .sort((a, b) => b.amount - a.amount)[0];
    if (leader) {
      const contestant = getContestant(state, leader.id);
      contestant.embers += 1;
      if (mission.reward.leadShield) contestant.shields = Math.min(MAX_SHIELDS, contestant.shields + 1);
    }
  }

  if (sabotaged) {
    const tell = state.clues.find(
      (clue) => clue.room === 'archive' && !clue.discoveredBy.includes(state.playerId),
    );
    mission.tellClueId = tell?.id ?? null;
    if (mission.family === 'cistern-locks') {
      const archive = state.rooms.find((room) => room.room === 'archive');
      if (archive) archive.archiveDrained = true;
    }
  }

  if (success && mission.family === 'gallery-mirrors') {
    const reward = state.clues.find(
      (clue) =>
        clue.room === 'gallery' &&
        clueAvailable(state, clue) &&
        !clue.discoveredBy.includes(state.playerId),
    );
    if (reward) {
      reward.discoveredBy.push(state.playerId);
      const found = emit(state, {
        kind: 'clue',
        text: `The inscription gives up ${reward.title}. ${reward.body}`,
        privateTo: state.playerId,
        clueId: reward.id,
      });
      events.push(found);
      addJournal(state, { kind: 'clue', title: reward.title, text: reward.body });
    }
  }

  addJournal(state, {
    kind: 'mission',
    title: mission.title,
    text: `${mission.resolvedText} ${delta === 0 ? '' : `The flame ${delta > 0 ? 'rises' : 'falls'} by ${Math.abs(delta)}.`}`.trim(),
  });
  note(state, mission.resolvedText);

  const stillOpen = state.missions.some((entry) => entry.round === state.round && entry.status === 'open');
  if (!stillOpen) {
    note(state, 'Both missions are sealed. The day is yours until the bell.');
  }

  return { state, events, error: null };
}

export function aiSabotageCheck(state: MatchState, mission: Mission, rng: { chance: (p: number) => boolean }): void {
  if (mission.sabotagedBy || state.round > 5) return;
  const shadows = living(state).filter((entry) => !entry.isPlayer && entry.role === 'shadow');
  if (shadows.length === 0) return;
  const saboteur = shadows
    .slice()
    .sort((a, b) => b.personality.guile - a.personality.guile)[0];
  if (rng.chance(0.28 + saboteur.personality.guile / 320)) mission.sabotagedBy = saboteur.id;
}

export function resolveOpenMissions(state: MatchState): GameEvent[] {
  const events: GameEvent[] = [];
  for (const mission of state.missions.filter((entry) => entry.round === state.round && entry.status === 'open')) {
    const result = resolveMission(state, mission.id);
    events.push(...result.events);
  }
  return events;
}
