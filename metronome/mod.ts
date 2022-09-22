let bpm = 100;
let timeSignature = "4/4";

const song = {
  title: "Crawdad Song",
  signature: "4/4",
  bpm: 100,
  chordProgression: "GGGGGGGGGGGGDDDDGGGGCCCCGGDDGGGG" //<- loopable 
};

// --------------------------

// Load song
const progression = song.chordProgression;
bpm = song.bpm;
timeSignature = song.signature;
let songCounter = 0;

// --------------------------

const signatureParts = timeSignature.split("/");
const beatsPerMeasure = parseInt(signatureParts[0], 10); // numerator
const beatsPerNote = parseInt(signatureParts[1], 10); // denominator

const tempo = (1 / beatsPerNote) * beatsPerMeasure;

// formula to convert BPMs to Milliseconds
const millisecondBpm = 60000 / bpm * tempo;

console.log(`\n %cPlaying "${song.title}". \n`, "color: yellow;");

let counter = 1;
setInterval(() => {
  console.log(counter.toString(), progression.substring(songCounter, songCounter + 1));
  songCounter += 1;
  if (songCounter === progression.length) songCounter = 0;

  counter += 1;
  if (counter > beatsPerMeasure) counter = 1;
}, millisecondBpm);

/* Tempo
 1 Whole note
 1/2 = 0.5
 1/4 = 0.25
 1/8 = 0.125
 1/16 = 0.0625
 1/32 = 0.03125
 1/64 = 0.015625
 1/128 = 0.0078125
*/

/** == TODO Features
 * Set BPM
 * Set Time Signature
 * Start/Stop metronmone
 * Song Designer - Edit/Save
 * View/Load song from a list
 * Add Visual and Audio effects
 */