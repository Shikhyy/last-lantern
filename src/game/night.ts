import {
  chooseReadTarget,
  chooseWardTarget,
  commitRng,
  rngFor,
  shadowVeilProposal,
  veilNight,
} from './ai';
import { SABOTAGES, type SabotageId } from './content';
import { eliminateByVeil, revealJudgment, roleName } from './judgment';
import {
  addJournal,
  applySuspicion,
  changeLantern,
  emit,
  getContestant,
  note,
  player,
  pushMemory,
} from './state';
import { factionOf, type ActionResult, type Faction, type GameEvent, type MatchState, type NightState } from './types';

export function beginNight(state: MatchState): void {
  state.phase = 'night';
  const rng = rngFor(state);
  const me = player(state);
  const shadowsAlive = state.contestants.filter((entry) => entry.alive && entry.role === 'shadow');

  const warden = state.contestants.find((entry) => entry.alive && entry.role === 'warden');
  const keeper = state.contestants.find((entry) => entry.alive && entry.role === 'keeper');

  let wardTarget: string | null = null;
  if (warden && !warden.isPlayer) wardTarget = chooseWardTarget(state, warden) || null;

  let readTarget: string | null = null;
  if (keeper && !keeper.isPlayer) readTarget = chooseReadTarget(state, keeper, rng) || null;

  let veilTarget: string | null = null;
  let proposals: NightState['proposals'] = [];
  if (veilNight(state.round) && shadowsAlive.length > 0) {
    const proposal = shadowVeilProposal(state, rng);
    proposals = proposal.proposals;
    // The player Shadowed chooses; the allies' proposal is advice, not a command.
    veilTarget = me.alive && me.role === 'shadow' ? null : proposal.targetId;
    if (proposals.length > 0) {
      for (const entry of proposals) {
        const speaker = getContestant(state, entry.speakerId);
        const target = getContestant(state, entry.targetId);
        const text = `${speaker.name} proposes ${target.name} for the Veil.`;
        for (const shadow of shadowsAlive) {
          const knowledge = state.knowledge[shadow.id];
          if (!knowledge) continue;
          knowledge.channel.push({
            id: `ch${state.nextId++}`,
            night: state.round,
            speakerId: entry.speakerId,
            kind: 'veil',
            targetId: entry.targetId,
            text,
          });
        }
        if (me.alive && me.role === 'shadow') {
          state.playerIntel.channel.push({
            id: `ch${state.nextId++}`,
            night: state.round,
            speakerId: entry.speakerId,
            kind: 'veil',
            targetId: entry.targetId,
            text,
          });
        }
      }
    }
  }

  let sabotage: string | null = null;
  const aiShadow = shadowsAlive.find((entry) => !entry.isPlayer);
  if (aiShadow && state.round <= 5 && !(me.alive && me.role === 'shadow')) {
    if (rng.chance(0.35 + aiShadow.personality.guile / 300)) {
      sabotage = rng.pick(SABOTAGES).id;
    }
  }

  state.nightState = {
    veilTarget,
    veilBlocked: false,
    sabotage,
    readTarget,
    readResult: null,
    wardTarget,
    proposals,
    resolved: false,
    narration: [],
  };
  commitRng(state, rng);
  emit(state, {
    kind: 'phase',
    text: 'Night falls over Nimbagarh. The corridors keep their own counsel.',
  });
  note(state, 'Night. Choose what you will do, and do it quietly.');
}

function validateWard(state: MatchState, wardenId: string, targetId: string): string | null {
  const warden = getContestant(state, wardenId);
  const target = state.contestants.find((entry) => entry.id === targetId);
  if (!target || !target.alive) return 'That person is not here tonight.';
  if (target.id === warden.id) return 'You cannot ward yourself.';
  if (warden.lastWardTarget === target.id) return 'You warded them last night; the ward will not hold twice.';
  return null;
}

export function performNightAction(
  state: MatchState,
  input: { veilTarget?: string; sabotage?: string; readTarget?: string; wardTarget?: string },
): ActionResult {
  if (state.phase !== 'night') return { state, events: [], error: 'It is not night.' };
  const me = player(state);
  const night = state.nightState;
  if (!night) return { state, events: [], error: 'The night has not begun.' };
  if (night.resolved) return { state, events: [], error: 'The night is already decided.' };

  if (input.veilTarget && !veilNight(state.round)) {
    return { state, events: [], error: 'The Veil is not drawn tonight.' };
  }
  if (me.alive) {
    if (me.role === 'shadow') {
      if (veilNight(state.round)) {
        if (!input.veilTarget) return { state, events: [], error: 'Choose whom the Veil will take.' };
        const target = state.contestants.find((entry) => entry.id === input.veilTarget);
        if (!target || !target.alive) return { state, events: [], error: 'That person is not here.' };
        if (target.role === 'shadow') return { state, events: [], error: 'The Veil does not take its own.' };
        night.veilTarget = target.id;
      }
      if (input.sabotage) {
        if (!SABOTAGES.some((entry) => entry.id === input.sabotage)) {
          return { state, events: [], error: 'That is not a sabotage you can work.' };
        }
        night.sabotage = input.sabotage;
      }
    } else if (me.role === 'keeper') {
      if (!input.readTarget) return { state, events: [], error: 'Choose someone to Read.' };
      const target = state.contestants.find((entry) => entry.id === input.readTarget && entry.alive);
      if (!target) return { state, events: [], error: 'That person is not here.' };
      if (target.id === me.id) return { state, events: [], error: 'You cannot Read yourself.' };
      night.readTarget = target.id;
    } else if (me.role === 'warden') {
      if (!input.wardTarget) return { state, events: [], error: 'Choose someone to ward.' };
      const problem = validateWard(state, me.id, input.wardTarget);
      if (problem) return { state, events: [], error: problem };
      night.wardTarget = input.wardTarget;
    }
  }

  return resolveNight(state);
}

export function resolveNight(state: MatchState): ActionResult {
  const night = state.nightState;
  if (!night) return { state, events: [], error: 'There is no night to resolve.' };
  const events: GameEvent[] = [];
  const me = player(state);
  const veilIsDue = veilNight(state.round);
  const shadows = state.contestants.filter((entry) => entry.alive && entry.role === 'shadow').map((entry) => entry.id);

  // 1. Ward.
  if (night.wardTarget) {
    const warden = state.contestants.find((entry) => entry.alive && entry.role === 'warden');
    if (warden) {
      warden.lastWardTarget = night.wardTarget;
      if (warden.isPlayer) state.playerIntel.wards.push({ targetId: night.wardTarget, night: state.round });
      events.push(
        emit(state, {
          kind: 'ward',
          text: `${warden.name} sets the ward.`,
          privateTo: warden.id,
          actorId: warden.id,
          subjectId: night.wardTarget,
        }),
      );
      applySuspicion(state, warden.id, night.wardTarget, -0.04, events[events.length - 1].id);
    }
  }

  // 2. Veil (blocked by the ward; the rite is spent either way).
  if (veilIsDue && night.veilTarget) {
    const victim = getContestant(state, night.veilTarget);
    if (night.wardTarget === night.veilTarget) {
      night.veilBlocked = true;
      night.narration.push('The flame guttered. No one was taken.');
      const blocked = emit(state, {
        kind: 'veil',
        text: 'The Veil met a ward and failed. The rite is spent. You do not know who cast it.',
        witnessedBy: shadows,
      });
      events.push(blocked);
      for (const shadowId of shadows) {
        const knowledge = state.knowledge[shadowId];
        if (knowledge) knowledge.wardBlockedNights.push(state.round);
      }
      if (me.alive && me.role === 'shadow') state.playerIntel.channel.push({
        id: `ch${state.nextId++}`,
        night: state.round,
        speakerId: 'host',
        kind: 'note',
        targetId: null,
        text: 'The Veil met a ward. The rite is spent.',
      });
    } else {
      events.push(...eliminateByVeil(state, victim.id));
      night.narration.push('One chair was empty at dawn.');
    }
  } else if (veilIsDue && !night.veilTarget) {
    night.narration.push('The Veil was not drawn.');
  }

  // 3. Read (exact faction, private).
  if (night.readTarget) {
    const target = getContestant(state, night.readTarget);
    const keeper = state.contestants.find((entry) => entry.alive && entry.role === 'keeper');
    const faction: Faction = factionOf(target.role);
    if (keeper && keeper.isPlayer) {
      night.readResult = faction;
      state.playerIntel.reads.push({ targetId: target.id, faction, night: state.round });
      addJournal(state, {
        kind: 'night',
        title: 'Your Read',
        text: `${target.name} is ${faction === 'shadow' ? 'Shadowed' : 'an Oathkeeper'}.`,
      });
      note(state, `You Read ${target.name}: ${faction === 'shadow' ? 'Shadowed' : 'Oathkeeper'}.`);
    } else if (keeper) {
      const event = emit(state, {
        kind: 'read',
        text: `${keeper.name} Reads ${target.name}.`,
        privateTo: keeper.id,
        actorId: keeper.id,
        subjectId: target.id,
      });
      events.push(event);
      const knowledge = state.knowledge[keeper.id];
      if (knowledge) {
        knowledge.readResults.push({ targetId: target.id, faction, night: state.round });
        applySuspicion(state, keeper.id, target.id, faction === 'shadow' ? 0.6 : -0.5, event.id);
        pushMemory(state, keeper.id, {
          kind: 'observation',
          text: `Read ${target.name}: ${faction === 'shadow' ? 'Shadowed' : 'Oathkeeper'}.`,
          importance: 0.95,
          subjectId: target.id,
          highEmotion: true,
        });
      }
    }
  }

  // 4. Sabotage.
  if (night.sabotage) {
    const sabotage = SABOTAGES.find((entry) => entry.id === night.sabotage);
    if (sabotage) {
      const event = emit(state, {
        kind: 'sabotage',
        text: sabotage.text,
        witnessedBy: shadows,
      });
      events.push(event);
      applySabotage(state, night.sabotage as SabotageId, event.id);
      night.narration.push(sabotage.text);
    }
  }

  night.resolved = true;
  state.phase = 'judgment';
  revealJudgment(state);
  state.lastMessage = night.narration.join(' ') || 'The night passes without a sound.';
  addJournal(state, {
    kind: 'night',
    title: `The night of ${state.round}`,
    text: state.lastMessage,
  });
  return { state, events, error: null };
}

function applySabotage(state: MatchState, sabotage: SabotageId, eventId: string): void {
  switch (sabotage) {
    case 'mirror-tilt':
      state.pendingPenalty.thresholdBonus += 1;
      break;
    case 'ledger-fragment':
      state.pendingPenalty.rewardPenalty += 4;
      break;
    case 'valve-open': {
      const archive = state.rooms.find((room) => room.room === 'archive');
      if (archive) archive.archiveDrained = true;
      changeLantern(state, -4, 'The hidden valve floods the lower archive', eventId);
      break;
    }
    case 'lamp-smoke':
      changeLantern(state, -3, 'Smoke smothers a lamp', eventId);
      break;
    case 'door-bar':
      changeLantern(state, -2, 'A barred door costs the palace an hour', eventId);
      break;
    default:
      break;
  }
}

/** Watches that no dead contestant is included in any live set. */
export function assertNightInvariants(state: MatchState): void {
  const night = state.nightState;
  if (!night) return;
  const dead = state.contestants.filter((entry) => !entry.alive).map((entry) => entry.id);
  const targets = [night.veilTarget, night.readTarget, night.wardTarget].filter(Boolean) as string[];
  for (const target of targets) {
    if (dead.includes(target) && target !== night.readTarget) {
      throw new Error(`Night action targeted a dead contestant: ${target}`);
    }
  }
}

export { roleName };
