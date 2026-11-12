const breathingDuration = 4 * 60 * 1000;
const breathingPhases = [
  { name: "Вдих", duration: 4 },
  { name: "Затримка", duration: 2 },
  { name: "Видих", duration: 6 }
];

const breathingPanel = document.querySelector(".breathing-panel");
const breathingPhaseItems = [...(breathingPanel?.querySelectorAll(".breathing-phases__item") ?? [])];
const breathingPhaseSeconds = [...(breathingPanel?.querySelectorAll("[data-phase-seconds]") ?? [])];
const breathingCurrentPhase = breathingPanel?.querySelector("#breathing-current-phase");
const breathingTimer = breathingPanel?.querySelector("#breathing-timer");
const breathingStart = breathingPanel?.querySelector("#breathing-start");
const breathingPause = breathingPanel?.querySelector("#breathing-pause");

if (
  !breathingPanel
  || breathingPhaseItems.length !== breathingPhases.length
  || breathingPhaseSeconds.length !== breathingPhases.length
  || !breathingCurrentPhase
  || !breathingTimer
  || !breathingStart
  || !breathingPause
) {
  throw new Error("Не вдалося ініціалізувати таймер дихальної вправи: перевірте розмітку.");
}

let breathingState = "idle";
let breathingElapsed = 0;
let breathingStartedAt = 0;
let breathingInterval = null;

function formatClock(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  return `${minutes}:${String(totalSeconds % 60).padStart(2, "0")}`;
}

function getBreathingElapsed() {
  if (breathingState !== "running") {
    return breathingElapsed;
  }
  return Math.min(breathingElapsed + performance.now() - breathingStartedAt, breathingDuration);
}

function stopBreathingInterval() {
  if (breathingInterval !== null) {
    window.clearInterval(breathingInterval);
    breathingInterval = null;
  }
}

function renderBreathing() {
  const elapsed = getBreathingElapsed();
  const remainingMilliseconds = Math.max(0, breathingDuration - elapsed);
  const remainingSeconds = Math.ceil(remainingMilliseconds / 1000);
  breathingTimer.textContent = formatClock(remainingSeconds);
  breathingTimer.setAttribute("aria-label", `Залишилося ${formatClock(remainingSeconds)}`);

  if (remainingMilliseconds === 0) {
    stopBreathingInterval();
    breathingElapsed = breathingDuration;
    breathingState = "completed";
    breathingCurrentPhase.textContent = "Завершено";
    breathingPhaseItems.forEach((item) => item.classList.remove("breathing-phases__item--active"));
    breathingPhaseSeconds.forEach((element) => {
      element.textContent = `${element.dataset.phaseSeconds} сек`;
    });
    breathingStart.textContent = "Почати знову";
    breathingStart.setAttribute("aria-label", "Почати дихальну вправу знову");
    breathingPause.disabled = true;
    return;
  }

  const elapsedWholeSeconds = Math.floor(elapsed / 1000);
  const cycleLength = breathingPhases.reduce((sum, phase) => sum + phase.duration, 0);
  let secondsIntoCycle = elapsedWholeSeconds % cycleLength;
  let activePhaseIndex = 0;

  while (secondsIntoCycle >= breathingPhases[activePhaseIndex].duration) {
    secondsIntoCycle -= breathingPhases[activePhaseIndex].duration;
    activePhaseIndex += 1;
  }

  breathingCurrentPhase.textContent = breathingPhases[activePhaseIndex].name;
  breathingPhaseItems.forEach((item, index) => {
    item.classList.toggle("breathing-phases__item--active", index === activePhaseIndex);
    breathingPhaseSeconds[index].textContent = index === activePhaseIndex
      ? `${breathingPhases[index].duration - secondsIntoCycle} сек`
      : `${breathingPhases[index].duration} сек`;
  });
}

breathingStart.addEventListener("click", () => {
  if (breathingState === "running") {
    return;
  }

  if (breathingState === "completed") {
    breathingElapsed = 0;
  }

  breathingStartedAt = performance.now();
  breathingState = "running";
  breathingStart.textContent = "Відновити";
  breathingStart.setAttribute("aria-label", "Відновити дихальну вправу");
  breathingPause.disabled = false;
  renderBreathing();
  stopBreathingInterval();
  breathingInterval = window.setInterval(renderBreathing, 100);
});

breathingPause.addEventListener("click", () => {
  if (breathingState !== "running") {
    return;
  }

  breathingElapsed = getBreathingElapsed();
  breathingState = "paused";
  stopBreathingInterval();
  breathingStart.textContent = "Відновити";
  breathingStart.setAttribute("aria-label", "Відновити дихальну вправу");
  breathingPause.disabled = true;
  renderBreathing();
});

const audioDuration = 10 * 60;
const audioPanel = document.querySelector(".audio-panel");
const audioProgress = audioPanel?.querySelector("#audio-progress");
const audioStatus = audioPanel?.querySelector("#audio-status");
const audioTime = audioPanel?.querySelector("#audio-time");
const audioStart = audioPanel?.querySelector("#audio-start");
const audioStartLabel = audioPanel?.querySelector("#audio-start-label");
const audioPause = audioPanel?.querySelector("#audio-pause");
const audioVolume = audioPanel?.querySelector("#audio-volume");

if (
  !audioPanel
  || !audioProgress
  || !audioStatus
  || !audioTime
  || !audioStart
  || !audioStartLabel
  || !audioPause
  || !audioVolume
) {
  throw new Error("Не вдалося ініціалізувати аудіо-релакс: перевірте розмітку.");
}

let audioState = "idle";
let audioElapsed = 0;
let audioStartedAt = 0;
let audioInterval = null;
let audioContext = null;
let masterGain = null;
let audioBusy = false;

function getAudioElapsed() {
  if (audioState !== "playing" || !audioContext) {
    return audioElapsed;
  }
  return Math.min(audioElapsed + (audioContext.currentTime - audioStartedAt) * 1000, audioDuration * 1000);
}

function stopAudioInterval() {
  if (audioInterval !== null) {
    window.clearInterval(audioInterval);
    audioInterval = null;
  }
}

function setAudioStatus(status) {
  audioStatus.textContent = status;
}

function setAudioVolume() {
  if (masterGain && audioContext && audioContext.state !== "closed") {
    masterGain.gain.setTargetAtTime(
      Number(audioVolume.value) * 0.0004,
      audioContext.currentTime,
      0.05
    );
  }
}

function createRelaxingAudio() {
  const AudioContextConstructor = window.AudioContext;
  if (!AudioContextConstructor) {
    throw new Error("Web Audio API is not supported in this browser.");
  }

  audioContext = new AudioContextConstructor();
  masterGain = audioContext.createGain();
  masterGain.gain.value = Number(audioVolume.value) * 0.0004;
  masterGain.connect(audioContext.destination);

  const baseTone = audioContext.createOscillator();
  baseTone.type = "sine";
  baseTone.frequency.value = 174;
  baseTone.connect(masterGain);
  baseTone.start();

  const harmonyGain = audioContext.createGain();
  harmonyGain.gain.value = 0.3;
  harmonyGain.connect(masterGain);

  const harmonyTone = audioContext.createOscillator();
  harmonyTone.type = "sine";
  harmonyTone.frequency.value = 261.63;
  harmonyTone.connect(harmonyGain);
  harmonyTone.start();
}

function updateAudioControls() {
  audioPause.disabled = audioState !== "playing" || audioBusy;
  audioStart.disabled = audioBusy;

  if (audioState === "paused") {
    audioStartLabel.textContent = "Відновити";
    audioStart.setAttribute("aria-label", "Відновити аудіо-релакс");
  } else if (audioState === "completed") {
    audioStartLabel.textContent = "Слухати знову";
    audioStart.setAttribute("aria-label", "Слухати аудіо-релакс знову");
  } else {
    audioStartLabel.textContent = "Слухати";
    audioStart.setAttribute("aria-label", "Слухати аудіо-релакс");
  }
}

function renderAudio() {
  const elapsedMilliseconds = getAudioElapsed();
  const elapsedSeconds = Math.floor(elapsedMilliseconds / 1000);
  audioProgress.value = String(elapsedSeconds);
  audioTime.textContent = `${formatClock(elapsedSeconds)} / ${formatClock(audioDuration)}`;
  audioTime.setAttribute(
    "aria-label",
    `Минуло ${formatClock(elapsedSeconds)} із ${formatClock(audioDuration)}`
  );

  if (elapsedMilliseconds >= audioDuration * 1000 && audioState === "playing") {
    stopAudioInterval();
    audioElapsed = audioDuration * 1000;
    audioState = "completed";
    setAudioStatus("Прослуховування завершено");

    if (audioContext && audioContext.state !== "closed") {
      const completedContext = audioContext;
      audioContext = null;
      masterGain = null;
      completedContext.close().catch((error) => {
        console.error("Не вдалося закрити аудіосесію після завершення:", error);
      });
    }
  }

  updateAudioControls();
}

audioStart.addEventListener("click", async () => {
  if (audioBusy || audioState === "playing") {
    return;
  }

  audioBusy = true;
  updateAudioControls();

  try {
    if (audioState === "completed") {
      audioElapsed = 0;
    }

    if (!audioContext || audioContext.state === "closed") {
      createRelaxingAudio();
    }

    await audioContext.resume();
    audioStartedAt = audioContext.currentTime;
    audioState = "playing";
    audioBusy = false;
    setAudioStatus("Відтворюється");
    renderAudio();
    stopAudioInterval();
    audioInterval = window.setInterval(renderAudio, 100);
  } catch (error) {
    audioBusy = false;
    setAudioStatus("Не вдалося запустити аудіо. Спробуйте ще раз.");
    updateAudioControls();
    console.error("Не вдалося запустити аудіо-релакс:", error);
  }
});

audioPause.addEventListener("click", async () => {
  if (audioState !== "playing" || audioBusy) {
    return;
  }

  audioElapsed = getAudioElapsed();
  audioState = "paused";
  stopAudioInterval();
  audioBusy = true;
  setAudioStatus("На паузі");
  renderAudio();
  updateAudioControls();

  try {
    if (audioContext && audioContext.state === "running") {
      await audioContext.suspend();
    }
  } catch (error) {
    audioState = "playing";
    if (audioContext?.state === "running") {
      audioStartedAt = audioContext.currentTime - audioElapsed / 1000;
    } else {
      audioState = "paused";
    }
    setAudioStatus(
      audioState === "paused"
        ? "Аудіо призупинено браузером. Натисніть «Відновити»."
        : "Не вдалося поставити аудіо на паузу. Спробуйте ще раз."
    );
    console.error("Не вдалося призупинити аудіо-релакс:", error);
    if (audioState === "playing") {
      audioInterval = window.setInterval(renderAudio, 100);
    }
  } finally {
    audioBusy = false;
    updateAudioControls();
  }
});

audioProgress.addEventListener("input", () => {
  audioElapsed = Number(audioProgress.value) * 1000;

  if (audioState === "playing") {
    if (audioContext?.state === "running") {
      audioStartedAt = audioContext.currentTime - audioElapsed / 1000;
    }
  } else if (audioElapsed >= audioDuration * 1000) {
    audioElapsed = audioDuration * 1000;
    audioState = "completed";
    stopAudioInterval();
    setAudioStatus("Прослуховування завершено");
    updateAudioControls();
  } else if (audioState === "completed") {
    audioState = "paused";
    setAudioStatus("На паузі");
    updateAudioControls();
  }

  renderAudio();
});

audioVolume.addEventListener("input", setAudioVolume);

renderBreathing();
renderAudio();
