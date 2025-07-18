document.addEventListener('DOMContentLoaded', () => {
    // Audio Context
    let audioContext;
    let isPlaying = false;
    let currentStep = 0;
    let intervalId = null;
    
    // Sequencer configuration
    const tracks = ['kick', 'snare', 'hihat', 'clap'];
    const steps = 16;
    const initialTempo = 120;
    
    // DOM Elements
    const playButton = document.getElementById('play-button');
    const stopButton = document.getElementById('stop-button');
    const tempoSlider = document.getElementById('tempo');
    const tempoValue = document.getElementById('tempo-value');
    const sequencerGrid = document.getElementById('sequencer-grid');
    
    // Volume controls
    const kickVolume = document.getElementById('kick-volume');
    const snareVolume = document.getElementById('snare-volume');
    const hihatVolume = document.getElementById('hihat-volume');
    const clapVolume = document.getElementById('clap-volume');
    
    // Sequencer state - 2D array representing the grid
    // Each inner array represents a track (kick, snare, etc.)
    // Each element in the inner array represents a step (0 = inactive, 1 = active)
    const sequencerState = Array.from({ length: tracks.length }, () => 
        Array.from({ length: steps }, () => 0)
    );
    
    // Audio samples
    const samples = {
        kick: null,
        snare: null,
        hihat: null,
        clap: null
    };
    
    // Initialize the application
    function init() {
        createSequencerGrid();
        setupEventListeners();
        loadSamples();
    }
    
    // Create the sequencer grid in the DOM
    function createSequencerGrid() {
        for (let row = 0; row < tracks.length; row++) {
            for (let col = 0; col < steps; col++) {
                const cell = document.createElement('div');
                cell.className = 'grid-cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                
                // Add click event to toggle cell state
                cell.addEventListener('click', () => {
                    toggleCell(row, col, cell);
                });
                
                sequencerGrid.appendChild(cell);
            }
        }
    }
    
    // Toggle the state of a cell (active/inactive)
    function toggleCell(row, col, cell) {
        // Toggle the state in our data model
        sequencerState[row][col] = sequencerState[row][col] === 0 ? 1 : 0;
        
        // Update the visual representation
        cell.classList.toggle('active', sequencerState[row][col] === 1);
        
        // If we're not playing, play the sound for immediate feedback
        if (!isPlaying) {
            playSound(row);
        }
    }
    
    // Set up event listeners for controls
    function setupEventListeners() {
        // Play button
        playButton.addEventListener('click', () => {
            if (!isPlaying) {
                startSequencer();
            }
        });
        
        // Stop button
        stopButton.addEventListener('click', () => {
            if (isPlaying) {
                stopSequencer();
            }
        });
        
        // Tempo slider
        tempoSlider.addEventListener('input', () => {
            const tempo = tempoSlider.value;
            tempoValue.textContent = tempo;
            
            // If we're playing, update the interval
            if (isPlaying) {
                updateTempo(tempo);
            }
        });
    }
    
    // Load audio samples
    function loadSamples() {
        // In a real application, we would load actual audio samples
        // For this demo, we'll use oscillators to generate sounds
        
        // Initialize audio context on user interaction to comply with browser policies
        document.addEventListener('click', initAudioContext, { once: true });
    }
    
    // Initialize the audio context (must be done after user interaction)
    function initAudioContext() {
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            console.log('Audio context initialized');
        }
    }
    
    // Start the sequencer
    function startSequencer() {
        if (!audioContext) {
            initAudioContext();
        }
        
        isPlaying = true;
        currentStep = 0;
        
        // Calculate interval based on tempo (BPM)
        const tempo = parseInt(tempoSlider.value);
        const stepTime = (60 * 1000) / (tempo * 4); // 16th notes
        
        // Start the sequencer loop
        intervalId = setInterval(() => {
            playStep();
            currentStep = (currentStep + 1) % steps;
        }, stepTime);
    }
    
    // Stop the sequencer
    function stopSequencer() {
        isPlaying = false;
        clearInterval(intervalId);
        
        // Clear any playing indicators
        const cells = document.querySelectorAll('.grid-cell');
        cells.forEach(cell => cell.classList.remove('playing'));
    }
    
    // Update the tempo while playing
    function updateTempo(tempo) {
        clearInterval(intervalId);
        
        const stepTime = (60 * 1000) / (tempo * 4); // 16th notes
        
        intervalId = setInterval(() => {
            playStep();
            currentStep = (currentStep + 1) % steps;
        }, stepTime);
    }
    
    // Play the current step
    function playStep() {
        // Clear previous step indicators
        const cells = document.querySelectorAll('.grid-cell');
        cells.forEach(cell => cell.classList.remove('playing'));
        
        // Highlight current step
        for (let row = 0; row < tracks.length; row++) {
            const cell = document.querySelector(`.grid-cell[data-row="${row}"][data-col="${currentStep}"]`);
            cell.classList.add('playing');
            
            // If this cell is active, play the sound
            if (sequencerState[row][currentStep] === 1) {
                playSound(row);
            }
        }
    }
    
    // Play a sound for a specific track
    function playSound(trackIndex) {
        if (!audioContext) return;
        
        // Create oscillator for demo purposes
        // In a real app, we would use actual samples
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        // Connect oscillator to gain node and gain node to destination
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // Set volume based on mixer settings
        let volume;
        switch (trackIndex) {
            case 0: // Kick
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(60, audioContext.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(30, audioContext.currentTime + 0.1);
                volume = kickVolume.value / 100;
                gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.3);
                break;
            case 1: // Snare
                oscillator.type = 'triangle';
                oscillator.frequency.setValueAtTime(250, audioContext.currentTime);
                volume = snareVolume.value / 100;
                gainNode.gain.setValueAtTime(volume * 0.7, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.2);
                break;
            case 2: // Hi-hat
                oscillator.type = 'square';
                oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
                volume = hihatVolume.value / 100;
                gainNode.gain.setValueAtTime(volume * 0.3, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.1);
                break;
            case 3: // Clap
                oscillator.type = 'sawtooth';
                oscillator.frequency.setValueAtTime(450, audioContext.currentTime);
                volume = clapVolume.value / 100;
                gainNode.gain.setValueAtTime(volume * 0.5, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.15);
                break;
        }
        
        // Start and stop the oscillator
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.5);
    }
    
    // Initialize the application
    init();
});