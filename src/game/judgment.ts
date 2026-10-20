import { addJournal, aiLiving, applySuspicion, emit, factionOutcome, getContestant, living, note } from './state';
import type { GameEvent, MatchState } from './types';

/**
 * The Judgment of the Flame. Called once per night, after night actions. It is
 * the only place a dead contestant's role becomes public.
 */
export function revealJudgment(state: MatchState): GameEvent[] {
  const events: GameEvent[] = [];
  for (const contestant of state.contestants) {
    if (contestant.alive || contestant.revealedRole) continue;
    contestant.revealedRole = contestant.role;
    const event = emit(state, {
      kind: 'judgment',
      text: `The Judgment of the Flame reads ${contestant.name}: ${roleName(contestant.role)}.`,
      actorId: 'host',
      subjectId: contestant.id,
    });
    events.push(event);
    addJournal(state, {
      kind: 'vote',
      title: `The Judgment: ${contestant.name}`,
      text: `${contestant.name} was ${roleName(contestant.role)}.`,
    });
    // An innocent banishment is public evidence about the people who pushed it.
    // Only the recorded public ballot is used; no AI invents a motive.
    if (contestant.role !== 'shadow' && contestant.eliminatedBy === 'council') {
      const voters = state.voteHistory.filter(
        (vote) => vote.round === contestant.eliminatedOn && vote.targetId === contestant.id,
      );
      for (const observer of aiLiving(state)) {
        for (const vote of voters) {
          if (vote.voterId === observer.id) continue;
          if (!getContestant(state, vote.voterId).alive) continue;
          applySuspicion(state, observer.id, vote.voterId, 0.04, event.id);
        }
      }
    }
  }

  if (state.lantern <= 0) state.outcome = 'shadow';
  state.outcome = state.outcome ?? factionOutcome(state);
  return events;
}

export function judgmentNext(state: MatchState): 'ending' | 'finale' | 'dawn' {
  if (state.outcome || state.lantern <= 0) return 'ending';
  if (living(state).length <= 4) return 'finale';
  if (state.round >= 5) return 'finale';
  return 'dawn';
}

export function roleName(role: 'shadow' | 'keeper' | 'warden' | 'oathkeeper'): string {
  switch (role) {
    case 'shadow':
      return 'Shadowed';
    case 'keeper':
      return 'the Lantern Keeper';
    case 'warden':
      return 'the Warden';
    default:
      return 'an Oathkeeper';
  }
}

export function describeJudgment(state: MatchState): string[] {
  return state.contestants
    .filter((entry) => !entry.alive && entry.revealedRole)
    .map((entry) => `${entry.name} — ${roleName(entry.revealedRole as 'shadow' | 'keeper' | 'warden' | 'oathkeeper')}`);
}

export function veilVictims(state: MatchState): string[] {
  return state.contestants.filter((entry) => entry.eliminatedBy === 'veil').map((entry) => entry.id);
}

export function remainingShadowed(state: MatchState): number {
  return state.contestants.filter((entry) => entry.alive && entry.role === 'shadow').length;
}

export function lastEliminated(state: MatchState): string | null {
  const dead = state.contestants
    .filter((entry) => !entry.alive && entry.eliminatedOn === state.round)
    .map((entry) => entry.id);
  return dead.length > 0 ? dead[dead.length - 1] : null;
}

export function eliminateByVeil(state: MatchState, targetId: string): GameEvent[] {
  const target = getContestant(state, targetId);
  const events: GameEvent[] = [];
  const shadows = state.contestants.filter((entry) => entry.alive && entry.role === 'shadow').map((entry) => entry.id);
  events.push(
    emit(state, {
      kind: 'veil',
      text: `The Veil closes over ${target.name}.`,
      witnessedBy: shadows,
      privateTo: null,
      subjectId: target.id,
    }),
  );
  const publicWitnesses = living(state).filter((entry) => entry.id !== target.id).map((entry) => entry.id);
  events.push(
    emit(state, {
      kind: 'veil',
      text: 'One chair is empty at dawn. The flame is lower than it was.',
      witnessedBy: publicWitnesses,
      actorId: 'host',
    }),
  );
  target.alive = false;
  target.eliminatedOn = state.round;
  target.eliminatedBy = 'veil';
  target.shields = 0;
  // A revealed Shadowed leaves the private channel.
  for (const shadowId of shadows) {
    const knowledge = state.knowledge[shadowId];
    if (!knowledge) continue;
    knowledge.shadowAllies = knowledge.shadowAllies.filter((id) => id !== target.id);
    if (target.role === 'shadow') {
      knowledge.channel.push({
        id: `ch${state.nextId}`,
        night: state.round,
        speakerId: 'host',
        kind: 'note',
        targetId: null,
        text: 'The channel has lost a voice.',
      });
      state.nextId += 1;
    }
  }
  addJournal(state, { kind: 'night', title: 'The Veil', text: 'Someone did not come to the morning table.' });
  state.outcome = factionOutcome(state);
  note(state, 'One chair is empty at dawn.');
  return events;
}
