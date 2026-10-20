export interface VoiceLines {
  greeting: string;
  whereabouts: (place: string) => string;
  suspicion: (name: string) => string;
  trust: (name: string) => string;
  neutral: (name: string) => string;
  refusal: string;
  pact: string;
  confide: string;
  threat: string;
  console: string;
  memory: (text: string) => string;
}

/**
 * Authored voice fingerprints. The engine chooses the *content*; these lines
 * only phrase it. No line may add a fact the planner did not supply.
 */
export const VOICES: Record<string, VoiceLines> = {
  meera: {
    greeting: 'Sit. If we are to be precise, we should be precise from the beginning.',
    whereabouts: (place) => `According to my own account — and I keep it exactly — I was in ${place} at the second bell.`,
    suspicion: (name) => `I have one discrepancy concerning ${name}, and I will not dress it up.`,
    trust: (name) => `I have checked ${name}’s account twice. It holds.`,
    neutral: (name) => `About ${name} I have only the record, and the record is incomplete.`,
    refusal: 'No. I have given my word elsewhere, and words are the only currency I have left.',
    pact: 'If we agree, I will write it down. I do not break what I have written.',
    confide: 'My family lost a record that would have restored our name. I came for the truth of it, not the flame.',
    threat: 'You may threaten me. I will still correct your dates.',
    console: 'Sit with it a moment. Grief is a document too; it needs to be read slowly.',
    memory: (text) => `I remember it exactly: “${text}”`,
  },
  arjun: {
    greeting: 'My friend. Sit, sit — a closed mouth is a poor guest at a long table.',
    whereabouts: (place) => `At the second bell? ${place}, unless my feet are better liars than my tongue.`,
    suspicion: (name) => `A proverb: the camel that kneels too quickly is hiding its load. ${name} kneels very quickly.`,
    trust: (name) => `${name}? I would lend them my last copper cup and not count it after.`,
    neutral: (name) => `${name} is a road I have not travelled yet. Ask me after the next bell.`,
    refusal: 'No, my friend. I like you too much to lie to you about this.',
    pact: 'A promise between us, then. The desert remembers what men forget.',
    confide: 'My father’s contract sits in that archive. I need it voided, or I am a beggar with good manners.',
    threat: 'Threaten me if it warms you. I have been threatened by better weather.',
    console: 'Come. Eat something. The world is less sharp on a full stomach.',
    memory: (text) => `You said, and I have not forgotten: ${text}`,
  },
  bela: {
    greeting: 'You are backlit. Move a hand’s width left and I can take you seriously.',
    whereabouts: (place) => `${place}. Flat light, no shadows — which is exactly why I remember it.`,
    suspicion: (name) => `${name} tells a four-o’clock story at nine. The shadows do not agree with them.`,
    trust: (name) => `${name} stands where the light falls honestly. I have photographed worse people.`,
    neutral: (name) => `${name} is out of frame. I have no exposure on them yet.`,
    refusal: 'No. I do not sign what I cannot see.',
    pact: 'All right. But if you break it, I will show the room exactly what you looked like when you did.',
    confide: 'My camera caught something on the way in. I have not shown it. I am not sure I trust it.',
    threat: 'You are blinking. That is not a threat, it is an observation.',
    console: 'Breathe. Hold still. The frame is steadier than you think.',
    memory: (text) => `I remember the shape of it: ${text}`,
  },
  kabir: {
    greeting: 'Come in, come in. There is always something warm in this palace, if you know the kitchen.',
    whereabouts: (place) => `I was in ${place}, and before you ask — yes, I had my hands full.`,
    suspicion: (name) => `${name} has not eaten at my table in two nights. A hungry person is a worried person.`,
    trust: (name) => `${name} eats like someone with nothing to hide. I would cook for them.`,
    neutral: (name) => `${name} is at the table but not at the meal, if you understand me.`,
    refusal: 'No, child. Not this. Ask me for bread, not for that.',
    pact: 'Then we have an understanding. Sit. We will seal it with something sweet.',
    confide: 'The old servants still use the kitchen door. I know the words. That is worth something, and it is worth nothing.',
    threat: 'Do not make me choose between you and my kitchen. You will not like the answer.',
    console: 'There, there. Salt and warmth, that is all anyone needs on a bad night.',
    memory: (text) => `I remember who was missing, and I remember this: ${text}`,
  },
  zoya: {
    greeting: 'This room has a bad span. Sit where the wall can take your weight.',
    whereabouts: (place) => `I was in ${place}. I can draw you the route; it is not a long one.`,
    suspicion: (name) => `Structurally, ${name}’s account has a gap where a load-bearing fact should be.`,
    trust: (name) => `${name} holds. I have leaned on worse walls.`,
    neutral: (name) => `I have not surveyed ${name} yet. Do not ask me to guess at a foundation.`,
    refusal: 'No. I have already given my word to someone whose wall I am standing under.',
    pact: 'Agreed. But understand: I defend my allies past the evidence, and then I regret it publicly.',
    confide: 'I have drawn the lower levels. Not authorised. If the palace is sold, at least someone will know its bones.',
    threat: 'You can push. This room has held worse than you for four hundred years.',
    console: 'Put your back to the wall. The panic passes; the geometry does not.',
    memory: (text) => `I remember where you were standing when you said it: ${text}`,
  },
  dev: {
    greeting: 'Confirm your business. Quickly.',
    whereabouts: (place) => `${place}. Second bell. Confirm it or don’t.`,
    suspicion: (name) => `${name} moved without a reason. I have seen that before. It cost me a unit.`,
    trust: (name) => `${name} executes cleanly. That is all I require.`,
    neutral: (name) => `${name} is untested. I do not guess.`,
    refusal: 'No. That order is bad. Find another officer.',
    pact: 'Terms understood. I keep them until you give me a reason not to.',
    confide: 'I was dismissed. The guest list has the name of the family I failed. Draw your own conclusion.',
    threat: 'One warning. I do not repeat myself.',
    console: 'Stand down. You are not under fire yet.',
    memory: (text) => `Sequence noted: ${text}`,
  },
  naina: {
    greeting: 'Listen — the fountain is a half-tone low tonight. Sit, and we will match it.',
    whereabouts: (place) => `${place}, though a place is only a verse with the music taken out.`,
    suspicion: (name) => `There is a false note in ${name}’s song. I cannot yet say which string.`,
    trust: (name) => `${name} sings the same song in every room. That is rarer than you think.`,
    neutral: (name) => `${name} is a chorus I have not heard alone yet.`,
    refusal: 'Not this one. A promise is a song; I do not sing what I cannot finish.',
    pact: 'Then we are two voices on one line. Do not leave me holding the note.',
    confide: 'I have sung for someone who owns a piece of this palace. He asked for a song about a fire. I did not like his face.',
    threat: 'Do not raise your voice at me. The room is already listening.',
    console: 'Here. Breathe with the verse. In, two, three. Out, two, three.',
    memory: (text) => `I remember the feeling of it, if not the words: ${text}`,
  },
  rohan: {
    greeting: 'Two minutes. I am repricing everything after that last vote.',
    whereabouts: (place) => `${place}. Low traffic, decent sightlines. Call it a neutral position.`,
    suspicion: (name) => `${name} is a bad position. I am not the only one who can read the odds.`,
    trust: (name) => `${name} is undervalued. I am buying while the room is still selling.`,
    neutral: (name) => `${name} is illiquid. I have no price on them yet.`,
    refusal: 'No deal. The downside is worse than the friendship.',
    pact: 'Fine. Here’s the thing: I will honour it while the numbers hold. Do not ask me to hold when they don’t.',
    confide: 'There is a phone call that could find me here. I doctored a ledger. The same hand is in this archive.',
    threat: 'You can cost me. I can cost you more. Let us not open that book.',
    console: 'Breathe. We are both still solvent. That is a good day.',
    memory: (text) => `I have the numbers, and I have this: ${text}`,
  },
  ila: {
    greeting: 'Do not stand in the draught. Sit. I will tell you what the room smells of.',
    whereabouts: (place) => `${place}. Precisely. I noticed the hour by the lamp oil, not the bell.`,
    suspicion: (name) => `${name} carries a smell I associate with impatience. Impatience is a dosage problem.`,
    trust: (name) => `${name} has a steady hand. I would trust them with a tincture.`,
    neutral: (name) => `I have not taken ${name}’s measure. The sample is too small.`,
    refusal: 'No. I have already administered my trust elsewhere.',
    pact: 'Agreed. A promise is a dose; too much kills, too little does nothing.',
    confide: 'Someone used my research on a person I loved. I recognised the poison in this kitchen on the first night.',
    threat: 'I know what a small amount does. Do not ask me to demonstrate.',
    console: 'Breathe slowly. Fear is a bitter compound; it passes.',
    memory: (text) => `I remember the trace of it: ${text}`,
  },
  samar: {
    greeting: 'Quietly. The palace is still deciding whether we are prey.',
    whereabouts: (place) => `${place}. I was still. People reveal themselves when they think no one is watching.`,
    suspicion: (name) => `${name} moves like something being stalked. That is not the same as being innocent.`,
    trust: (name) => `${name} has been patient when patience cost them. I noticed.`,
    neutral: (name) => `${name} has not moved enough for me to read the pattern.`,
    refusal: 'No. I would rather keep watch alone than promise badly.',
    pact: 'All right. We keep still, we keep watch, and neither of us runs first.',
    confide: 'My camera was recording in a room I should not have been in. I have not looked at the footage.',
    threat: 'You are making noise. Noise attracts things.',
    console: 'Sit. Watch the water. Nothing in the desert moves without a reason.',
    memory: (text) => `I remember the pattern, and one line of it: ${text}`,
  },
  tara: {
    greeting: 'Good. You are the only one who has not given me a prepared answer.',
    whereabouts: (place) => `${place}. On the record. If it turns out false, I will want to know who moved me.`,
    suspicion: (name) => `${name} answered a question I did not ask. That is the story.`,
    trust: (name) => `${name} has not lied to me yet, and I have made it expensive to start.`,
    neutral: (name) => `${name} is a source I have not opened. Ask me again when there is a document.`,
    refusal: 'No. My source is the one thing I will not trade.',
    pact: 'Deal. But if you break it, I will write it down, and I write plainly.',
    confide: 'My source is in this room. I will not name them, even if it costs me the story.',
    threat: 'You can frighten me. You cannot make me unpublished.',
    console: 'Sit. Off the record. You look like someone carrying a headline.',
    memory: (text) => `Quote, exact: “${text}”`,
  },
};

export const GENERIC_VOICE: VoiceLines = {
  greeting: 'You wanted to speak.',
  whereabouts: (place) => `I was in ${place}.`,
  suspicion: (name) => `I do not trust ${name}.`,
  trust: (name) => `I trust ${name}.`,
  neutral: (name) => `I have no strong view of ${name}.`,
  refusal: 'No.',
  pact: 'Agreed.',
  confide: 'I came here for something of my own.',
  threat: 'Careful.',
  console: 'It will pass.',
  memory: (text) => `I remember: ${text}`,
};

export function voiceFor(characterId: string): VoiceLines {
  return VOICES[characterId] ?? GENERIC_VOICE;
}
