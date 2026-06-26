// --- APPLICATION STATE ---
const state = {
  activeSlide: 0,
  theme: 'cosmic', // 'cosmic' or 'rose'
  isMuted: false,
  candlesExtinguished: 0,
  balloonsPopped: 0,
  fortunesOpened: 0,
  wishesCastCount: 0,
  audioCtx: null,
  musicPlaying: false,
  musicTimeout: null,
  lastTrailSpawn: 0,
  customData: {
    name: 'kunali',
    age: '',
    sender: 'Your Friend',
    message: `On this special day, may your heart be as light as a balloon, your smile as bright as a candle's flame, and your future as sparkling as a shooting star.\n\nYou bring so much light and joy into the lives of everyone around you. Here's to celebrating the wonderful person you are, and to all the beautiful memories yet to be made!\n\nHappy Birthday!`,
    memories: [
      "Your infectious, happy laughter",
      "Late night talks and endless support",
      "Always bringing positive energy",
      "Being an incredibly kind human",
      "Inspiring everyone around you"
    ],
    fortunes: [
      "A year of incredible adventures is waiting for you!",
      "Your laughter will light up every room you enter!",
      "A wonderful, unexpected success is heading your way!"
    ],
    defaultTheme: 'cosmic'
  }
};

// --- CONFIGURATIONS ---
const BALLOON_COLORS = [
  '#ff595e', '#ffca3a', '#8ac926', '#1982c4', '#6a4c93', 
  '#ff8da1', '#6ee7b7', '#a78bfa', '#fb923c', '#f472b6'
];

const CHIME_FREQS = {
  'C5': 523.25,
  'D5': 587.33,
  'E5': 659.25,
  'G5': 783.99,
  'A5': 880.00
};

// --- INITIALIZATION ON LOAD ---
window.addEventListener('DOMContentLoaded', () => {
  decodeURLParameters();
  initTheme();
  setupEventListeners();
  initCanvas();
  setupMouseParallax();
});

// --- URL ENCODING & DECODING ---
function decodeURLParameters() {
  const urlParams = new URLSearchParams(window.location.search);
  const wishParam = urlParams.get('wish');
  
  if (wishParam) {
    try {
      const decodedData = decodeURIComponent(atob(wishParam).split('').map(c => {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      
      const parsed = JSON.parse(decodedData);
      if (parsed.name) state.customData.name = parsed.name;
      if (parsed.age !== undefined) state.customData.age = parsed.age;
      if (parsed.sender) state.customData.sender = parsed.sender;
      if (parsed.message) state.customData.message = parsed.message;
      if (parsed.memories && Array.isArray(parsed.memories)) {
        state.customData.memories = parsed.memories;
      }
      if (parsed.fortunes && Array.isArray(parsed.fortunes)) {
        state.customData.fortunes = parsed.fortunes;
      }
      if (parsed.defaultTheme) {
        if (parsed.defaultTheme === 'pastel') parsed.defaultTheme = 'cosmic';
        state.theme = parsed.defaultTheme;
        state.customData.defaultTheme = parsed.defaultTheme;
      }
    } catch (e) {
      console.error("Failed to decode customized wishes: ", e);
    }
  }

  // Populate HTML elements with customized data
  document.getElementById('landing-title').innerText = `A Magical Wish for ${state.customData.name}...`;
  document.title = `Happy Birthday, ${state.customData.name}!`;
  
  const recipientTitle = state.customData.age ? `To ${state.customData.name} (${state.customData.age})` : `To ${state.customData.name}`;
  document.getElementById('letter-recipient-title').innerText = recipientTitle;
  document.getElementById('letter-author-signature').innerText = `— From ${state.customData.sender}`;
  
  // Load fortunes
  for (let i = 0; i < 3; i++) {
    const fortuneEl = document.getElementById(`fortune-${i}`);
    if (fortuneEl && state.customData.fortunes[i]) {
      fortuneEl.innerText = state.customData.fortunes[i];
    }
  }
}

function encodeCreatorLink() {
  const name = document.getElementById('c-name').value.trim();
  const age = document.getElementById('c-age').value.trim();
  const sender = document.getElementById('c-sender').value.trim();
  const message = document.getElementById('c-message').value.trim();
  
  const memoriesText = document.getElementById('c-balloons').value;
  const memories = memoriesText.split('\n').map(m => m.trim()).filter(m => m.length > 0);
  
  const fortunesText = document.getElementById('c-fortunes').value;
  const fortunes = fortunesText.split('\n').map(f => f.trim()).filter(f => f.length > 0);
  
  const defaultTheme = document.getElementById('c-theme').value;
  
  const payload = { name, age, sender, message, memories, fortunes, defaultTheme };
  
  try {
    const jsonString = JSON.stringify(payload);
    const encodedData = btoa(encodeURIComponent(jsonString).replace(/%([0-9A-F]{2})/g, (match, p1) => {
      return String.fromCharCode(parseInt(p1, 16));
    }));
    
    const baseUrl = window.location.href.split('?')[0];
    const fullLink = `${baseUrl}?wish=${encodedData}`;
    
    const outputArea = document.getElementById('link-output-area');
    const linkBox = document.getElementById('generated-link-text');
    
    linkBox.innerText = fullLink;
    outputArea.classList.add('visible');
  } catch (err) {
    alert("Failed to generate link. Please check inputs.");
    console.error(err);
  }
}

// --- THEME MANAGEMENT ---
function initTheme() {
  const body = document.body;
  body.className = ''; 
  body.classList.add(`theme-${state.theme}`);
  
  const toggleBtn = document.getElementById('theme-toggle');
  if (state.theme === 'rose') {
    toggleBtn.innerHTML = `
      <svg viewBox="0 0 24 24">
        <path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58c-.39-.39-1.03-.39-1.41 0s-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37c-.39-.39-1.03-.39-1.41 0s-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41l-1.06-1.06zm1.06-10.96c.39-.39.39-1.03 0-1.41s-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06zM7.05 18.01c.39-.39.39-1.03 0-1.41s-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41l1.06-1.06z"/>
      </svg>
      <span>Cosmic Neon</span>
    `;
  } else {
    toggleBtn.innerHTML = `
      <svg viewBox="0 0 24 24">
        <path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-.46-.04-.92-.1-1.36-.98 1.37-2.58 2.26-4.4 2.26-2.98 0-5.4-2.42-5.4-5.4 0-1.81.89-3.42 2.26-4.4-.44-.06-.9-.1-1.36-.1z"/>
      </svg>
      <span>Elegant Rose</span>
    `;
  }
}

function toggleTheme() {
  state.theme = state.theme === 'cosmic' ? 'rose' : 'cosmic';
  initTheme();
}

// --- EVENT LISTENERS ---
function setupEventListeners() {
  document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
  document.getElementById('audio-toggle').addEventListener('click', toggleAudioMute);
  document.getElementById('creator-btn').addEventListener('click', openCreatorPanel);
  document.getElementById('close-creator').addEventListener('click', closeCreatorPanel);
  document.getElementById('modal-overlay').addEventListener('click', closeCreatorPanel);
  document.getElementById('creator-form').addEventListener('submit', encodeCreatorLink);
  document.getElementById('copy-link-btn').addEventListener('click', copyCreatorLink);

  document.getElementById('gift-box-trigger').addEventListener('click', openGiftBox);
  document.getElementById('gift-box-trigger').addEventListener('keypress', (e) => {
    if (e.key === 'Enter' || e.key === ' ') openGiftBox();
  });

  document.getElementById('next-btn').addEventListener('click', nextSlide);
  document.getElementById('prev-btn').addEventListener('click', prevSlide);

  const candles = document.querySelectorAll('.candle-wrapper');
  candles.forEach((candle, idx) => {
    candle.addEventListener('click', () => extinguishCandle(candle, idx));
    candle.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' || e.key === ' ') extinguishCandle(candle, idx);
    });
  });

  const envelopes = document.querySelectorAll('.envelope-wrapper');
  envelopes.forEach((env) => {
    env.addEventListener('click', () => openEnvelope(env));
    env.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' || e.key === ' ') openEnvelope(env);
    });
  });

  document.getElementById('wishing-form').addEventListener('submit', castWish);
  document.getElementById('reset-game-btn').addEventListener('click', resetStarGame);
}

function openCreatorPanel() {
  document.getElementById('c-name').value = state.customData.name;
  document.getElementById('c-age').value = state.customData.age;
  document.getElementById('c-sender').value = state.customData.sender;
  document.getElementById('c-message').value = state.customData.message;
  document.getElementById('c-balloons').value = state.customData.memories.join('\n');
  document.getElementById('c-fortunes').value = state.customData.fortunes.join('\n');
  document.getElementById('c-theme').value = state.customData.defaultTheme || 'cosmic';

  document.getElementById('creator-modal').classList.add('open');
  document.getElementById('modal-overlay').classList.add('open');
}

function closeCreatorPanel() {
  document.getElementById('creator-modal').classList.remove('open');
  document.getElementById('modal-overlay').classList.remove('open');
  document.getElementById('link-output-area').classList.remove('visible');
}

function copyCreatorLink() {
  const linkText = document.getElementById('generated-link-text').innerText;
  navigator.clipboard.writeText(linkText).then(() => {
    const copyBtn = document.getElementById('copy-link-btn');
    copyBtn.innerText = "Copied!";
    setTimeout(() => {
      copyBtn.innerText = "Copy to Clipboard";
    }, 2000);
  }).catch(err => {
    console.error("Failed to copy link: ", err);
  });
}

// --- 3D MOUSE PARALLAX TILT ---
function setupMouseParallax() {
  window.addEventListener('mousemove', (e) => {
    const activeCard = document.querySelector('.slide-card.active');
    if (!activeCard) return;

    const cardCenterX = window.innerWidth / 2;
    const cardCenterY = window.innerHeight / 2;

    const dx = (e.clientX - cardCenterX) / (window.innerWidth / 2);
    const dy = (e.clientY - cardCenterY) / (window.innerHeight / 2);

    const rotateX = -dy * 10; 
    const rotateY = dx * 10;

    activeCard.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(10px)`;
  });

  window.addEventListener('mouseleave', () => {
    const activeCard = document.querySelector('.slide-card.active');
    if (activeCard) {
      activeCard.style.transform = '';
    }
  });
}

// --- AUDIO SYNTHESIS ENGINE (WEB AUDIO API) ---
function getAudioContext() {
  if (!state.audioCtx) {
    state.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (state.audioCtx.state === 'suspended') {
    state.audioCtx.resume();
  }
  return state.audioCtx;
}

function toggleAudioMute() {
  state.isMuted = !state.isMuted;
  const audioBtn = document.getElementById('audio-toggle');
  
  if (state.isMuted) {
    audioBtn.innerHTML = `
      <svg viewBox="0 0 24 24">
        <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.21.05-.42.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.06-2.57-7.33-6-8.6v2.1c2.33 1.16 4 3.63 4 6.5zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.11c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73 4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
      </svg>
      <span>Muted</span>
    `;
    stopMusic();
  } else {
    audioBtn.innerHTML = `
      <svg viewBox="0 0 24 24">
        <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM12 3L9.12 5.88 12 8.76V3zm-9 6v6h4l5 5V4L7 9H3zm13.5 3c0 2.87-1.67 5.34-4 6.5v2.1c3.43-1.27 6-4.54 6-8.6s-2.57-7.33-6-8.6v2.1c2.33 1.16 4 3.63 4 6.5z"/>
      </svg>
      <span>Music On</span>
    `;
    if (state.musicPlaying) {
      playBirthdaySong();
    }
  }
}

function playSynthSound(type) {
  if (state.isMuted) return;
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    
    if (type === 'extinguish') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(100, now + 0.3);
      
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.3);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.3);
      
    } else if (type === 'pop') {
      const bufferSize = ctx.sampleRate * 0.15; 
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 600;
      filter.Q.value = 2.0;
      
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noise.start(now);
      noise.stop(now + 0.15);
      
    } else if (type === 'wish') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(1200, now + 1.2);
      
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 1.2);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 1.2);
    }
  } catch (err) {
    console.warn("Synth error: ", err);
  }
}

// Plays a clear chime note (Music Box mode)
function playMusicBoxNote(freq) {
  if (state.isMuted) return;
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator(); 
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(freq, now);
    
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(freq * 2, now); 

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2200, now);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.18, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.8);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 1.8);
    osc2.stop(now + 1.8);
  } catch (err) {
    console.warn(err);
  }
}

// Automatic arpeggio sweep when the music box key is wound up
function playMusicBoxArpeggio() {
  if (state.isMuted) return;
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    // C major pentatonic/happy arpeggio notes
    const notes = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25, 783.99, 880.00]; 
    
    notes.forEach((freq, idx) => {
      const playTime = now + idx * 0.15;
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, playTime);
      
      gain.gain.setValueAtTime(0, playTime);
      gain.gain.linearRampToValueAtTime(0.1, playTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, playTime + 1.2);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(playTime);
      osc.stop(playTime + 1.2);
    });
  } catch (e) {
    console.warn(e);
  }
}

// Synthesize Lofi Happy Birthday Tune
const MELODY = [
  { note: 'C4', dur: 0.75 }, { note: 'C4', dur: 0.25 }, { note: 'D4', dur: 1 }, { note: 'C4', dur: 1 }, { note: 'F4', dur: 1 }, { note: 'E4', dur: 2 },
  { note: 'C4', dur: 0.75 }, { note: 'C4', dur: 0.25 }, { note: 'D4', dur: 1 }, { note: 'C4', dur: 1 }, { note: 'G4', dur: 1 }, { note: 'F4', dur: 2 },
  { note: 'C4', dur: 0.75 }, { note: 'C4', dur: 0.25 }, { note: 'C5', dur: 1 }, { note: 'A4', dur: 1 }, { note: 'F4', dur: 1 }, { note: 'E4', dur: 1 }, { note: 'D4', dur: 1 },
  { note: 'A#4', dur: 0.75 }, { note: 'A#4', dur: 0.25 }, { note: 'A4', dur: 1 }, { note: 'F4', dur: 1 }, { note: 'G4', dur: 1 }, { note: 'F4', dur: 2 }
];

const NOTE_FREQS = {
  'C4': 261.63, 'D4': 293.66, 'E4': 329.63, 'F4': 349.23, 'G4': 392.00, 'A4': 440.00, 'A#4': 466.16, 'C5': 523.25
};

function playBirthdaySong() {
  if (state.isMuted) return;
  stopMusic();
  state.musicPlaying = true;
  
  try {
    const ctx = getAudioContext();
    let timeAccumulator = ctx.currentTime + 0.1;
    const tempoMultiplier = 0.55; 

    MELODY.forEach((item) => {
      const freq = NOTE_FREQS[item.note];
      const duration = item.dur * tempoMultiplier;
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, timeAccumulator);
      
      gain.gain.setValueAtTime(0, timeAccumulator);
      gain.gain.linearRampToValueAtTime(0.12, timeAccumulator + 0.08); 
      gain.gain.setValueAtTime(0.12, timeAccumulator + duration - 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, timeAccumulator + duration); 
      
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1000, timeAccumulator);
      
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(timeAccumulator);
      osc.stop(timeAccumulator + duration);
      
      if (item.dur >= 1) {
        const bassOsc = ctx.createOscillator();
        const bassGain = ctx.createGain();
        
        bassOsc.type = 'sine';
        bassOsc.frequency.setValueAtTime(freq / 2, timeAccumulator); 
        
        bassGain.gain.setValueAtTime(0, timeAccumulator);
        bassGain.gain.linearRampToValueAtTime(0.08, timeAccumulator + 0.1);
        bassGain.gain.exponentialRampToValueAtTime(0.001, timeAccumulator + duration * 0.8);
        
        bassOsc.connect(bassGain);
        bassGain.connect(ctx.destination);
        bassOsc.start(timeAccumulator);
        bassOsc.stop(timeAccumulator + duration * 0.8);
      }
      
      timeAccumulator += duration;
    });
    
    state.musicTimeout = setTimeout(playBirthdaySong, MELODY.reduce((sum, val) => sum + val.dur, 0) * tempoMultiplier * 1000 + 1000);
  } catch (err) {
    console.warn(err);
  }
}

function stopMusic() {
  state.musicPlaying = false;
  if (state.musicTimeout) {
    clearTimeout(state.musicTimeout);
    state.musicTimeout = null;
  }
}

// --- GIFT BOX UNWRAPPING ACTION ---
function openGiftBox() {
  const wrapper = document.getElementById('gift-box-trigger');
  if (wrapper.classList.contains('opening')) return;
  
  wrapper.classList.add('opening');
  
  setTimeout(() => playSynthSound('pop'), 300);
  setTimeout(() => spawnBurstConfetti(180), 400);

  setTimeout(() => {
    document.getElementById('landing-screen').classList.add('hidden');
    document.getElementById('app-container').classList.remove('hidden');
    document.getElementById('app-container').offsetHeight;
    document.getElementById('app-container').classList.add('visible');
    
    playBirthdaySong();
    updateSlideControls();
  }, 1400);
}

// --- SLIDESHOW NAVIGATION ---
function nextSlide() {
  if (state.activeSlide === 0 && state.candlesExtinguished < 5) {
    alert("Make sure to blow out all the cake candles first!");
    return;
  }
  if (state.activeSlide === 2 && state.balloonsPopped < 5) {
    alert("Pop all 5 memory balloons to reveal your birthday blessings!");
    return;
  }
  if (state.activeSlide === 3 && state.fortunesOpened < 3) {
    alert("Make sure to open all 3 fortune envelopes!");
    return;
  }

  const slides = document.querySelectorAll('.slide-card');
  if (state.activeSlide < slides.length - 1) {
    slides[state.activeSlide].style.transform = '';
    
    slides[state.activeSlide].classList.remove('active');
    slides[state.activeSlide].classList.add('passed');
    state.activeSlide++;
    slides[state.activeSlide].classList.add('active');
    
    if (state.activeSlide === 1) startLetterTypewriter();
    if (state.activeSlide === 2) setupBalloonsSlide();
    if (state.activeSlide === 3) setupFortunesSlide();
    
    updateSlideControls();
  }
}

function prevSlide() {
  const slides = document.querySelectorAll('.slide-card');
  if (state.activeSlide > 0) {
    if (state.activeSlide === 4) {
      stopStarGame();
      const wishSlide = document.getElementById('slide-well');
      const wellTitle = wishSlide.querySelector('.letter-title');
      const wellDesc = wishSlide.querySelector('.well-desc');
      if (wellTitle) wellTitle.style.display = '';
      if (wellDesc) wellDesc.style.display = '';
      const wishForm = document.getElementById('wishing-form');
      wishForm.classList.remove('hidden');
      wishForm.style.opacity = '1';
      wishForm.style.transition = '';
      document.getElementById('star-game').classList.add('hidden');
    }
    slides[state.activeSlide].style.transform = '';
    slides[state.activeSlide].classList.remove('active');
    state.activeSlide--;
    slides[state.activeSlide].classList.remove('passed');
    slides[state.activeSlide].classList.add('active');
    
    updateSlideControls();
  }
}

function updateSlideControls() {
  document.getElementById('prev-btn').disabled = (state.activeSlide === 0);
  
  const nextBtn = document.getElementById('next-btn');
  if (state.activeSlide === 0 && state.candlesExtinguished < 5) {
    nextBtn.disabled = true;
  } else if (state.activeSlide === 2 && state.balloonsPopped < 5) {
    nextBtn.disabled = true;
  } else if (state.activeSlide === 3 && state.fortunesOpened < 3) {
    nextBtn.disabled = true;
  } else {
    nextBtn.disabled = (state.activeSlide === 4); 
  }
}

// --- INTERACTIVE CANDLES LOGIC (SLIDE 1) ---
function extinguishCandle(wrapper, index) {
  if (wrapper.classList.contains('extinguished')) return;
  
  wrapper.classList.add('extinguished');
  playSynthSound('extinguish');
  
  const smoke = wrapper.querySelector('.smoke-cloud');
  smoke.classList.add('smoke-rise');
  
  const rect = wrapper.getBoundingClientRect();
  const wickX = rect.left + rect.width / 2;
  const wickY = rect.top + 8;
  spawnSparkles(wickX, wickY, 15);
  
  state.candlesExtinguished++;
  
  if (state.candlesExtinguished === 5) {
    document.getElementById('candles-feedback').innerText = "🎂 Happy Birthday! Let's celebrate!";
    document.getElementById('candles-feedback').style.color = "var(--primary-color)";
    
    spawnBurstConfetti(200);
    playBirthdaySong();
    
    document.getElementById('next-btn').disabled = false;
  } else {
    document.getElementById('candles-feedback').innerText = `Blown out: ${state.candlesExtinguished} / 5`;
  }
}

// --- POETIC LETTER TYPEWRITER ANIMATION (SLIDE 2) ---
let typewriterRunning = false;
function startLetterTypewriter() {
  if (typewriterRunning) return;
  typewriterRunning = true;
  
  const textContainer = document.getElementById('letter-body-content');
  textContainer.innerHTML = '';
  
  const rawMessage = state.customData.message;
  let index = 0;
  
  function typeChar() {
    if (index < rawMessage.length) {
      const char = rawMessage.charAt(index);
      if (char === '\n') {
        textContainer.innerHTML += '<br>';
      } else {
        textContainer.innerHTML += char;
      }
      index++;
      setTimeout(typeChar, 25 + Math.random() * 15);
    } else {
      typewriterRunning = false;
    }
  }
  
  typeChar();
}

// --- MEMORY BALLOONS GAME (SLIDE 3) ---
let balloonsInterval = null;
let spawnedCount = 0;

function setupBalloonsSlide() {
  state.balloonsPopped = 0;
  spawnedCount = 0;
  document.getElementById('balloons-counter').innerText = `Popped: 0 / 5`;
  document.getElementById('next-btn').disabled = true;
  
  const balloonsArea = document.getElementById('balloons-area');
  const existingBalloons = balloonsArea.querySelectorAll('.floating-balloon, .pop-card');
  existingBalloons.forEach(el => el.remove());
  
  if (balloonsInterval) clearInterval(balloonsInterval);
  
  balloonsInterval = setInterval(() => {
    if (spawnedCount < 5) {
      spawnBalloon(spawnedCount);
      spawnedCount++;
    } else {
      clearInterval(balloonsInterval);
    }
  }, 1000);
}

function spawnBalloon(index) {
  const balloonsArea = document.getElementById('balloons-area');
  const balloon = document.createElement('div');
  balloon.className = 'floating-balloon';
  balloon.role = 'button';
  balloon.tabIndex = 0;
  
  const color = BALLOON_COLORS[index % BALLOON_COLORS.length];
  balloon.style.color = color;
  balloon.style.backgroundColor = color;
  balloon.style.boxShadow = `inset -5px -6px 15px rgba(0, 0, 0, 0.2), 0 5px 12px ${color}40`;
  
  const areaWidth = balloonsArea.offsetWidth;
  const startX = 30 + Math.random() * (areaWidth - 110);
  balloon.style.left = `${startX}px`;
  balloon.style.bottom = `-80px`;
  
  const string = document.createElement('div');
  string.className = 'balloon-string';
  balloon.appendChild(string);
  
  balloonsArea.appendChild(balloon);
  
  let bottomPos = -80;
  const speed = 1.0 + Math.random() * 0.8;
  const swingWidth = 10 + Math.random() * 20;
  const swingSpeed = 0.02 + Math.random() * 0.02;
  let angle = Math.random() * Math.PI;
  
  function animateFloat() {
    if (!balloon.parentElement) return; 
    
    bottomPos += speed;
    angle += swingSpeed;
    const xOffset = Math.sin(angle) * swingWidth;
    
    balloon.style.bottom = `${bottomPos}px`;
    balloon.style.transform = `translateX(${xOffset}px) rotate(${xOffset / 5}deg)`;
    
    if (bottomPos > balloonsArea.offsetHeight + 10) {
      bottomPos = -80;
      const startX = 30 + Math.random() * (areaWidth - 110);
      balloon.style.left = `${startX}px`;
    }
    
    requestAnimationFrame(animateFloat);
  }
  
  requestAnimationFrame(animateFloat);
  
  const popHandler = () => popBalloon(balloon, index, color);
  balloon.addEventListener('click', popHandler);
  balloon.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' || e.key === ' ') popHandler();
  });
}

function popBalloon(balloon, index, color) {
  const rect = balloon.getBoundingClientRect();
  const popX = rect.left + rect.width / 2;
  const popY = rect.top + rect.height / 2;
  
  playSynthSound('pop');
  spawnPopParticles(popX, popY, color, 30);
  balloon.remove();
  
  const memoryText = state.customData.memories[index] || "Wishing you infinite happiness!";
  showMemoryCard(memoryText, popX, popY);
  
  state.balloonsPopped++;
  document.getElementById('balloons-counter').innerText = `Popped: ${state.balloonsPopped} / 5`;
  
  if (state.balloonsPopped === 5) {
    document.getElementById('next-btn').disabled = false;
    spawnBurstConfetti(100);
  }
}

function showMemoryCard(text, globalX, globalY) {
  const balloonsArea = document.getElementById('balloons-area');
  const areaRect = balloonsArea.getBoundingClientRect();
  
  const relativeX = globalX - areaRect.left;
  const relativeY = globalY - areaRect.top;
  
  const card = document.createElement('div');
  card.className = 'pop-card';
  card.innerText = text;
  
  card.style.left = `${Math.max(60, Math.min(balloonsArea.offsetWidth - 60, relativeX))}px`;
  card.style.top = `${Math.max(60, Math.min(balloonsArea.offsetHeight - 60, relativeY))}px`;
  
  balloonsArea.appendChild(card);
  
  setTimeout(() => {
    card.style.transition = "opacity 0.6s ease";
    card.style.opacity = 0;
    setTimeout(() => card.remove(), 600);
  }, 2400);
}

// --- SURPRISE FORTUNE ENVELOPES (SLIDE 4) ---
function setupFortunesSlide() {
  state.fortunesOpened = 0;
  document.getElementById('fortunes-counter-text').innerText = `Opened: 0 / 3`;
  document.getElementById('next-btn').disabled = true;
  
  document.querySelectorAll('.envelope-wrapper').forEach((env) => {
    env.classList.remove('opened');
  });
}

function openEnvelope(wrapper) {
  if (wrapper.classList.contains('opened')) return;
  
  wrapper.classList.add('opened');
  playSynthSound('wish');
  
  const rect = wrapper.getBoundingClientRect();
  const cX = rect.left + rect.width / 2;
  const cY = rect.top + rect.height / 2;
  spawnPopParticles(cX, cY, 'var(--primary-color)', 25);
  
  state.fortunesOpened++;
  document.getElementById('fortunes-counter-text').innerText = `Opened: ${state.fortunesOpened} / 3`;
  
  if (state.fortunesOpened === 3) {
    document.getElementById('fortunes-counter-text').innerText = "🔮 Your future looks exceptionally bright!";
    document.getElementById('fortunes-counter-text').style.color = "var(--primary-color)";
    document.getElementById('next-btn').disabled = false;
    spawnBurstConfetti(100);
  }
}



// --- WISHING WELL SUBMISSION (SLIDE 6) ---
function castWish(e) {
  if (e) e.preventDefault();
  
  const input = document.getElementById('user-wish-input');
  const wishText = input.value.trim();
  
  if (wishText.length === 0) return;
  
  input.value = '';
  input.blur();
  
  playSynthSound('wish');
  spawnWishStar(wishText);
  
  const rect = input.getBoundingClientRect();
  spawnSparkles(rect.left + rect.width / 2, rect.top, 50);
  
  state.wishesCastCount++;
  if (state.wishesCastCount === 1) {
    spawnBurstConfetti(150);
  }

  // Fade out form, hide heading/desc, slide in the star game!
  const wishSlide = document.getElementById('slide-well');
  const wellTitle = wishSlide.querySelector('.letter-title');
  const wellDesc = wishSlide.querySelector('.well-desc');
  const wishForm = document.getElementById('wishing-form');
  wishForm.style.transition = 'opacity 0.5s ease';
  wishForm.style.opacity = '0';
  setTimeout(() => {
    wishForm.classList.add('hidden');
    if (wellTitle) wellTitle.style.display = 'none';
    if (wellDesc) wellDesc.style.display = 'none';
    const starGameEl = document.getElementById('star-game');
    starGameEl.classList.remove('hidden');
    initStarGame();
  }, 500);
}

// --- DYNAMIC CANVAS PARTICLE ENGINE ---
let canvas, ctx;
let particles = [];
let stars = [];
let wishes = [];

function initCanvas() {
  canvas = document.getElementById('particle-canvas');
  ctx = canvas.getContext('2d');
  
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  
  stars = [];
  const starCount = Math.min(100, Math.floor((canvas.width * canvas.height) / 15000));
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: 0.5 + Math.random() * 1.5,
      alpha: Math.random(),
      twinkleSpeed: 0.005 + Math.random() * 0.01
    });
  }
  
  animate();
}

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Twinkle stars
  stars.forEach(s => {
    s.alpha += s.twinkleSpeed;
    if (s.alpha > 1 || s.alpha < 0.1) {
      s.twinkleSpeed = -s.twinkleSpeed;
    }
    ctx.fillStyle = `rgba(255, 255, 255, ${s.alpha})`;
    // Performance optimization: Draw rectangle instead of arc for small stars
    const r = s.radius;
    ctx.fillRect(s.x - r, s.y - r, r * 2, r * 2);
  });
  
  // Continuous background magic spawning
  spawnBackgroundMagic();
  // Continuous rare shooting stars
  spawnShootingStar();
  
  // General particles
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    
    if (p.type === 'confetti') {
      p.vy += p.gravity;
      p.rotation += p.rotationSpeed;
      
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
      
      if (p.y > canvas.height + 20) {
        particles.splice(i, 1);
        continue;
      }
    } else if (p.type === 'sparkle') {
      p.alpha -= 0.015;
      p.radius *= 0.96;
      
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = p.color + ('0' + Math.floor(p.alpha * 255).toString(16)).slice(-2);
      ctx.fill();
      
      if (p.alpha <= 0.01 || p.radius <= 0.2) {
        particles.splice(i, 1);
        continue;
      }
    } else if (p.type === 'bg-magic') {
      p.rotation += p.rotationSpeed;
      
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.font = `600 ${p.size}px serif`;
      ctx.fillStyle = p.color;
      
      // Removed canvas shadowBlur and shadowColor because they are extremely CPU-heavy and cause performance lag.
      ctx.fillText(p.glyph, -p.size / 2, p.size / 2);
      ctx.restore();
      
      if (p.y < -40) {
        particles.splice(i, 1);
        continue;
      }
    } else if (p.type === 'shooting-star') {
      p.alpha -= 0.025;
      
      ctx.save();
      ctx.strokeStyle = `rgba(255, 255, 255, ${p.alpha})`;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x - p.vx * 1.5, p.y - p.vy * 1.5);
      ctx.stroke();
      ctx.restore();
      
      if (p.alpha <= 0.01 || p.y > canvas.height || p.x > canvas.width) {
        particles.splice(i, 1);
        continue;
      }
    }
  }
  
  // Rising text wishes
  for (let i = wishes.length - 1; i >= 0; i--) {
    const w = wishes[i];
    w.y += w.vy;
    w.x += Math.sin(w.angle) * 0.4;
    w.angle += 0.02;
    w.alpha -= 0.003; 
    
    ctx.save();
    ctx.globalAlpha = w.alpha;
    ctx.font = '700 12px "Inter", sans-serif';
    ctx.fillStyle = state.theme === 'rose' ? '#ffdfb9' : '#ec4899';
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = 15;
    
    ctx.font = '20px serif';
    ctx.fillText('⭐', w.x - 10, w.y - 12);
    
    ctx.font = '600 12px "Inter", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(w.text, w.x, w.y + 12);
    ctx.restore();
    
    if (w.y < -50 || w.alpha <= 0.01) {
      wishes.splice(i, 1);
    }
  }
  
  requestAnimationFrame(animate);
}

// Spawns background magical elements (hearts, music notes, sparkles, balloons)
function spawnBackgroundMagic() {
  // Only spawn periodically
  if (Math.random() > 0.025) return;
  
  const glyphs = ['❤️', '✨', '🎈', '🎵', '🌸', '⭐', '💫', '🎶'];
  const colors = state.theme === 'rose' 
    ? ['#e8a2a8', '#d4af37', '#ffdfb9', '#2a8a68'] 
    : ['#ec4899', '#ffcc00', '#06b6d4', '#a855f7'];
  
  particles.push({
    type: 'bg-magic',
    x: Math.random() * canvas.width,
    y: canvas.height + 40,
    glyph: glyphs[Math.floor(Math.random() * glyphs.length)],
    color: colors[Math.floor(Math.random() * colors.length)],
    vx: -0.4 + Math.random() * 0.8,
    vy: -0.6 - Math.random() * 0.8, 
    size: 14 + Math.random() * 14,
    rotation: Math.random() * Math.PI,
    rotationSpeed: -0.01 + Math.random() * 0.02,
    alpha: 0.15 + Math.random() * 0.35
  });
}

// Spawns shooting stars in background
function spawnShootingStar() {
  if (Math.random() > 0.003) return; // rare streak
  
  particles.push({
    type: 'shooting-star',
    x: Math.random() * canvas.width * 0.8,
    y: -40,
    vx: 5 + Math.random() * 5,
    vy: 5 + Math.random() * 5,
    alpha: 1.0
  });
}

// Spawns beautiful star sparkle particles that float around (Mouse Trail)
function spawnSparkleTrail(x, y) {
  const colors = state.theme === 'rose' 
    ? ['#d4af37', '#e8a2a8', '#ffdfb9', '#d4af3740'] 
    : ['#ec4899', '#ffcc00', '#06b6d4', '#ec489940'];
  
  particles.push({
    type: 'sparkle',
    x: x,
    y: y,
    radius: 1.5 + Math.random() * 2.5,
    color: colors[Math.floor(Math.random() * colors.length)],
    vx: -0.5 + Math.random() * 1.0,
    vy: -0.8 - Math.random() * 0.8, 
    alpha: 0.8
  });
}

// Spawns confetti bursting
function spawnBurstConfetti(count) {
  const colors = ['#ff758f', '#ffda79', '#7eedc4', '#60a5fa', '#c084fc', '#f472b6'];
  for (let i = 0; i < count; i++) {
    particles.push({
      type: 'confetti',
      x: Math.random() * canvas.width,
      y: -20 - Math.random() * 80,
      w: 8 + Math.random() * 8,
      h: 12 + Math.random() * 12,
      color: colors[Math.floor(Math.random() * colors.length)],
      vx: -2 + Math.random() * 4,
      vy: 2 + Math.random() * 5,
      gravity: 0.05 + Math.random() * 0.05,
      rotation: Math.random() * Math.PI,
      rotationSpeed: -0.05 + Math.random() * 0.1
    });
  }
}

// Spawns sparkles at specific coordinates
function spawnSparkles(x, y, count) {
  const color = state.theme === 'rose' ? '#d4af37' : '#ec4899';
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1 + Math.random() * 4;
    particles.push({
      type: 'sparkle',
      x: x,
      y: y,
      radius: 2 + Math.random() * 4,
      color: color,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 0.5,
      alpha: 1
    });
  }
}

// Spawns a custom-colored particle blast
function spawnPopParticles(x, y, color, count) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 2 + Math.random() * 5;
    particles.push({
      type: 'sparkle',
      x: x,
      y: y,
      radius: 3 + Math.random() * 5,
      color: color,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      alpha: 1
    });
  }
}

// Spawns a custom text star
function spawnWishStar(text) {
  wishes.push({
    text: `"${text}"`,
    x: canvas.width / 2 + (-50 + Math.random() * 100),
    y: canvas.height + 20,
    vy: -1.2 - Math.random() * 0.8,
    angle: Math.random() * Math.PI,
    alpha: 1.0
  });
}

// --- COSMIC STAR CATCHER MINI-GAME ---
const gameState = {
  score: 0,
  basket: { x: 0, w: 70, h: 12 },
  fallingStars: [],
  active: false,
  canvas: null,
  ctx: null,
  animationId: null,
  lastSpawnTime: 0
};

function initStarGame() {
  gameState.canvas = document.getElementById('game-canvas');
  if (!gameState.canvas) return;
  gameState.ctx = gameState.canvas.getContext('2d');
  
  resizeGameCanvas();
  window.addEventListener('resize', resizeGameCanvas);
  
  gameState.score = 0;
  document.getElementById('game-score-val').innerText = '0';
  gameState.basket.x = gameState.canvas.width / 2 - gameState.basket.w / 2;
  gameState.fallingStars = [];
  gameState.active = true;
  gameState.lastSpawnTime = Date.now();
  
  const wrapper = gameState.canvas.parentElement;
  wrapper.addEventListener('mousemove', handleGameMove);
  wrapper.addEventListener('touchmove', handleGameTouch, { passive: true });
  
  if (gameState.animationId) cancelAnimationFrame(gameState.animationId);
  gameState.animationId = requestAnimationFrame(gameLoop);
}

function resizeGameCanvas() {
  if (!gameState.canvas) return;
  const wrapper = gameState.canvas.parentElement;
  gameState.canvas.width = wrapper.clientWidth;
  gameState.canvas.height = wrapper.clientHeight;
}

function handleGameMove(e) {
  if (!gameState.active || !gameState.canvas) return;
  const rect = gameState.canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  gameState.basket.x = Math.max(0, Math.min(gameState.canvas.width - gameState.basket.w, mouseX - gameState.basket.w / 2));
}

function handleGameTouch(e) {
  if (!gameState.active || !gameState.canvas || e.touches.length === 0) return;
  const rect = gameState.canvas.getBoundingClientRect();
  const touchX = e.touches[0].clientX - rect.left;
  gameState.basket.x = Math.max(0, Math.min(gameState.canvas.width - gameState.basket.w, touchX - gameState.basket.w / 2));
}

function spawnFallingStar() {
  if (!gameState.canvas) return;
  const colors = ['#ec4899', '#06b6d4', '#a855f7', '#ffcc00', '#22c55e'];
  gameState.fallingStars.push({
    x: Math.random() * (gameState.canvas.width - 20) + 10,
    y: -15,
    vy: 1.2 + Math.random() * 1.8,
    size: 14 + Math.random() * 8,
    color: colors[Math.floor(Math.random() * colors.length)],
    glyph: ['⭐', '💫', '✨'][Math.floor(Math.random() * 3)]
  });
}

function gameLoop() {
  if (!gameState.active || !gameState.canvas || !gameState.ctx) return;
  
  const gCanvas = gameState.canvas;
  const gCtx = gameState.ctx;
  
  gCtx.clearRect(0, 0, gCanvas.width, gCanvas.height);
  
  const now = Date.now();
  if (now - gameState.lastSpawnTime > 800) {
    spawnFallingStar();
    gameState.lastSpawnTime = now;
  }
  
  gCtx.fillStyle = 'var(--secondary-color)';
  gCtx.shadowColor = 'var(--secondary-color)';
  gCtx.shadowBlur = 10;
  
  gCtx.beginPath();
  gCtx.roundRect(gameState.basket.x, gCanvas.height - 18, gameState.basket.w, gameState.basket.h, 6);
  gCtx.fill();
  
  gCtx.strokeStyle = '#ffffff';
  gCtx.lineWidth = 1.5;
  gCtx.stroke();
  gCtx.shadowBlur = 0;
  
  for (let i = gameState.fallingStars.length - 1; i >= 0; i--) {
    const star = gameState.fallingStars[i];
    star.y += star.vy;
    
    gCtx.font = `${star.size}px serif`;
    gCtx.textAlign = 'center';
    gCtx.textBaseline = 'middle';
    gCtx.fillStyle = star.color;
    gCtx.fillText(star.glyph, star.x, star.y);
    
    const basketY = gCanvas.height - 18;
    if (star.y + star.size / 2 >= basketY && 
        star.y - star.size / 2 <= basketY + gameState.basket.h &&
        star.x >= gameState.basket.x && 
        star.x <= gameState.basket.x + gameState.basket.w) {
      
      gameState.fallingStars.splice(i, 1);
      gameState.score++;
      document.getElementById('game-score-val').innerText = gameState.score;
      
      playStarCatchChime();
      spawnSparkles(star.x, basketY, 10);
      continue;
    }
    
    if (star.y > gCanvas.height + 20) {
      gameState.fallingStars.splice(i, 1);
    }
  }
  
  gameState.animationId = requestAnimationFrame(gameLoop);
}

function playStarCatchChime() {
  if (state.isMuted) return;
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    
    const freqs = [523.25, 587.33, 659.25, 783.99, 880.00, 1046.50];
    const freq = freqs[gameState.score % freqs.length];
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);
    
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(now);
    osc.stop(now + 0.4);
  } catch (e) {
    console.warn(e);
  }
}

function resetStarGame() {
  gameState.score = 0;
  document.getElementById('game-score-val').innerText = '0';
  gameState.fallingStars = [];
  gameState.lastSpawnTime = Date.now();
  if (gameState.canvas) {
    spawnSparkles(gameState.canvas.width / 2, gameState.canvas.height / 2, 20);
  }
}

function stopStarGame() {
  gameState.active = false;
  if (gameState.animationId) {
    cancelAnimationFrame(gameState.animationId);
    gameState.animationId = null;
  }
  const wrapper = document.getElementById('game-canvas')?.parentElement;
  if (wrapper) {
    wrapper.removeEventListener('mousemove', handleGameMove);
    wrapper.removeEventListener('touchmove', handleGameTouch);
  }
}
