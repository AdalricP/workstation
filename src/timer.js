// Flow Timer Settings
const settings = {
    flowDuration: 3, // 30 minutes in seconds
    shortBreakDuration: 3, // 5 minutes in seconds
    longBreakDuration: 15 * 60, // 15 minutes in seconds
    flowsBeforeLongBreak: 3, // Number of flows before a long break
    flowEndAudio: new Audio('ting.mp3'),
    breakEndAudio: new Audio('ting2.mp3')
};

// App State
let state = {
    remainingTime: settings.flowDuration,
    isRunning: false,
    isBreak: false,
    completedFlows: 0,
    timerInterval: null
};

// DOM Elements
const timerDisplay = document.getElementById('timer');

const toggleBtn = document.getElementById('toggleBtn');
const playIcon = toggleBtn.querySelector('.play-icon');
const pauseIcon = toggleBtn.querySelector('.pause-icon');

const resetBtn = document.getElementById('resetBtn');
const flowDots = document.getElementById('flowDots');

const flowReduceButton = document.getElementById('upBtn');
const flowIncreaseButton = document.getElementById('downBtn');

// Initialize the app
function init() {
    updateTimerDisplay();
    renderFlowDots();
    setupEventListeners();
    updateButtonState();
}

function editFlows(increment) {
    if (state.isBreak) {
        state.completedFlows += increment;
    }
    if (state.completedFlows < 0) {
        state.completedFlows = 0;
    } else if (state.completedFlows > settings.flowsBeforeLongBreak-1) {
        state.completedFlows = 0;
    }

    if(!state.isBreak) {
        if(state.completedFlows < settings.flowsBeforeLongBreak-1) {
            state.remainingTime = settings.shortBreakDuration;
            state.isBreak = true;
        } else {
            state.remainingTime = settings.longBreakDuration;
            state.isBreak = true;
        }
    }
    else {
        state.remainingTime = settings.flowDuration;
        state.isBreak = false;
    }
    updateTimerDisplay();
    renderFlowDots();
    pauseTimer();
}

function renderFlowDots() {
    const dots = flowDots.children;

    for (let i = 0; i < settings.flowsBeforeLongBreak; i++) {
        let dot = dots[i];

        // Create new dots if not enough
        if (!dot) {
            dot = document.createElement('div');
            dot.className = 'dot';
            flowDots.appendChild(dot);
        }

        // Toggle class smoothly

        dot.classList.toggle('completed', i < state.completedFlows || (state.isBreak && i == state.completedFlows));

        dot.classList.toggle(`current`, i == state.completedFlows && !state.isBreak);
    }

    // Remove extra dots if any
    while (flowDots.children.length > settings.flowsBeforeLongBreak) {
        flowDots.removeChild(flowDots.lastChild);
    }
}


// Update the timer display
function updateTimerDisplay() {
    const minutes = Math.floor(state.remainingTime / 60);
    const seconds = state.remainingTime % 60;
    timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// Update button appearance
function updateButtonState() {
    if (state.isRunning) {
        playIcon.style.display = 'none';
        pauseIcon.style.display = 'block';
    } else {
        playIcon.style.display = 'block';
        pauseIcon.style.display = 'none';
    }
}

// Toggle between play and pause
function toggleTimer() {
    if (state.isRunning) {
        pauseTimer();
    } else {
        startTimer();
    }
}

// Start the timer
function startTimer() {
    if (state.timerInterval) return;
    
    state.isRunning = true;
    state.timerInterval = setInterval(() => {
        state.remainingTime--;
        updateTimerDisplay();
        
        if (state.remainingTime <= 0) {
            clearInterval(state.timerInterval);
            state.timerInterval = null;
            handleTimerCompletion();
        }
    }, 1000);
    updateButtonState();
}

// Pause the timer
function pauseTimer() {
    clearInterval(state.timerInterval);
    state.timerInterval = null;
    state.isRunning = false;
    updateButtonState();
}

// Handle timer completion
function handleTimerCompletion() {
    state.isRunning = false;
    
    

    if (!state.isBreak) {
        // Flow session completed
        settings.flowEndAudio.play();
        state.completedFlows++;
        renderFlowDots();
        
        if (state.completedFlows >= settings.flowsBeforeLongBreak) {
            // Time for long break
            state.isBreak = true;
            state.remainingTime = settings.longBreakDuration;

        } else {
            // Short break
            state.isBreak = true;
            state.remainingTime = settings.shortBreakDuration;

        }
    } else {
        // Break completed - check if we just finished a long break

        settings.breakEndAudio.play();
        if (state.completedFlows >= settings.flowsBeforeLongBreak) {
            // Reset completed flows after long break
            state.completedFlows = 0;
            renderFlowDots();
        }
        
        // Back to flow
        state.isBreak = false;
        state.remainingTime = settings.flowDuration;

    }
    
    updateTimerDisplay();
    updateButtonState();
}

// Reset the timer
function resetTimer() {
    pauseTimer();
    state.isBreak = false;
    state.remainingTime = settings.flowDuration;
    state.completedFlows = 0;
    updateTimerDisplay();
    renderFlowDots();

    updateButtonState();
}

// Event listeners
function setupEventListeners() {
    toggleBtn.addEventListener('click', toggleTimer);
    resetBtn.addEventListener('click', resetTimer);
    flowReduceButton.addEventListener('click', () => editFlows(-1));
    flowIncreaseButton.addEventListener('click', () => editFlows(1));
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', init);