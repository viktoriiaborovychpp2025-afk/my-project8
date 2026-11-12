const moodGroup = document.querySelector(".mood__options");
const moodCards = [...document.querySelectorAll(".mood-card[role='radio']")];
const recommendations = document.querySelector(".recommendations");
const recommendationTitle = document.querySelector("#recommendations-title");
const recommendationIcon = document.querySelector(".recommendations__state .mood-card__icon");
const recommendationDescription = document.querySelector("#recommendation-description");
const recommendationAction = document.querySelector("#recommendation-action");

const practices = {
  breathing: {
    card: document.querySelector("#tool-breathing"),
    control: document.querySelector("#breathing-start"),
    status: document.querySelector("#breathing-recommendation"),
    title: "дихальної вправи"
  },
  audio: {
    card: document.querySelector("#tool-audio"),
    control: document.querySelector("#audio-start"),
    status: document.querySelector("#audio-recommendation"),
    title: "аудіо-релаксу"
  }
};

if (
  !moodGroup
  || moodCards.length === 0
  || !recommendations
  || !recommendationTitle
  || !recommendationIcon
  || !recommendationDescription
  || !(recommendationAction instanceof HTMLButtonElement)
  || Object.values(practices).some(({ card, control, status }) => (
    !(card instanceof HTMLElement)
    || !(control instanceof HTMLButtonElement)
    || !(status instanceof HTMLElement)
  ))
) {
  throw new Error("Не вдалося ініціалізувати селектор настрою: перевірте розмітку.");
}

const emotionRecommendations = {
  anxiety: {
    description: "Автоматичний підбір вправ із візуальним анімованим індикатором фаз дихання (вдих/видих) та таймером для правильного дотримання ритму.",
    practice: "breathing"
  },
  stress: {
    description: "Автоматичний підбір вправ із візуальним анімованим індикатором фаз дихання (вдих/видих) та таймером для правильного дотримання ритму.",
    practice: "breathing"
  },
  fatigue: {
    description: "Сеанси аудіо-релаксу зі зручним плеєром (керування відтворенням, пауза, гучність) для зняття емоційного напруження.",
    practice: "audio"
  },
  sadness: {
    description: "Сеанси аудіо-релаксу зі зручним плеєром (керування відтворенням, пауза, гучність) для зняття емоційного напруження.",
    practice: "audio"
  }
};

let selectedPractice = "breathing";

function selectEmotion(selectedCard) {
  const recommendation = emotionRecommendations[selectedCard.dataset.emotion];

  if (!recommendation) {
    console.error(`Немає рекомендації для емоції "${selectedCard.dataset.emotion}".`);
    return;
  }

  moodCards.forEach((card) => {
    const isSelected = card === selectedCard;
    card.setAttribute("aria-checked", String(isSelected));
    card.tabIndex = isSelected ? 0 : -1;
  });

  const title = selectedCard.querySelector(".mood-card__title")?.textContent.trim();
  const icon = selectedCard.querySelector(".mood-card__icon")?.textContent.trim();

  if (!title || !icon) {
    throw new Error("Не вдалося оновити рекомендацію: у картці стану відсутні назва або іконка.");
  }

  selectedPractice = recommendation.practice;
  const practice = practices[selectedPractice];

  recommendations.classList.add("is-updating");
  void recommendations.offsetWidth;
  recommendationTitle.textContent = title;
  recommendationIcon.textContent = icon;
  recommendationDescription.textContent = recommendation.description;
  recommendationAction.dataset.practice = selectedPractice;
  recommendationAction.setAttribute("aria-label", `Почати: ${practice.title}`);

  Object.entries(practices).forEach(([key, target]) => {
    const isRecommended = key === selectedPractice;
    target.card.classList.toggle("is-recommended", isRecommended);
    target.status.hidden = !isRecommended;
  });

  window.requestAnimationFrame(() => {
    recommendations.classList.remove("is-updating");
  });
}

recommendationAction.addEventListener("click", () => {
  const practice = practices[recommendationAction.dataset.practice];
  if (!practice) {
    throw new Error(`Невідома рекомендована практика "${recommendationAction.dataset.practice}".`);
  }

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  practice.card.scrollIntoView({
    behavior: prefersReducedMotion ? "auto" : "smooth",
    block: "center"
  });
  practice.control.focus({ preventScroll: true });
});

moodGroup.addEventListener("click", (event) => {
  if (!(event.target instanceof Element)) {
    return;
  }

  const card = event.target.closest(".mood-card[role='radio']");
  if (card && moodGroup.contains(card)) {
    selectEmotion(card);
  }
});

moodGroup.addEventListener("keydown", (event) => {
  const currentIndex = moodCards.indexOf(event.target);
  if (currentIndex < 0) {
    return;
  }

  let nextIndex;
  switch (event.key) {
    case "ArrowRight":
    case "ArrowDown":
      nextIndex = (currentIndex + 1) % moodCards.length;
      break;
    case "ArrowLeft":
    case "ArrowUp":
      nextIndex = (currentIndex - 1 + moodCards.length) % moodCards.length;
      break;
    case "Home":
      nextIndex = 0;
      break;
    case "End":
      nextIndex = moodCards.length - 1;
      break;
    default:
      return;
  }

  event.preventDefault();
  moodCards[nextIndex].focus();
  selectEmotion(moodCards[nextIndex]);
});
