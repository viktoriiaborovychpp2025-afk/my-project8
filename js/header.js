const menuToggle = document.getElementById("menu-toggle");
const primaryNavigation = document.getElementById("primary-navigation");
const practiceDropdown = document.querySelector(".practice-dropdown");
const practiceMenuToggle = document.getElementById("practice-menu-toggle");

if (
  !(menuToggle instanceof HTMLButtonElement) ||
  !(primaryNavigation instanceof HTMLElement) ||
  !(practiceDropdown instanceof HTMLElement) ||
  !(practiceMenuToggle instanceof HTMLButtonElement)
) {
  throw new Error("Header menu controls are missing.");
}

const closePracticeMenu = () => {
  practiceDropdown.classList.remove("is-open");
  practiceDropdown.classList.add("is-closed");
  practiceMenuToggle.setAttribute("aria-expanded", "false");
};

const closeMenu = () => {
  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.setAttribute("aria-label", "Відкрити меню");
  primaryNavigation.classList.add("hidden");
  primaryNavigation.classList.remove("flex");
  closePracticeMenu();
};

window.matchMedia("(min-width: 1200px)").addEventListener("change", (event) => {
  if (event.matches) {
    closeMenu();
  }
});

menuToggle.addEventListener("click", () => {
  const isExpanded = menuToggle.getAttribute("aria-expanded") === "true";

  menuToggle.setAttribute("aria-expanded", String(!isExpanded));
  menuToggle.setAttribute("aria-label", isExpanded ? "Відкрити меню" : "Закрити меню");
  primaryNavigation.classList.toggle("hidden", isExpanded);
  primaryNavigation.classList.toggle("flex", !isExpanded);
});

practiceMenuToggle.addEventListener("click", () => {
  const isExpanded = practiceMenuToggle.getAttribute("aria-expanded") === "true";
  practiceMenuToggle.setAttribute("aria-expanded", String(!isExpanded));
  practiceDropdown.classList.toggle("is-open", !isExpanded);
  practiceDropdown.classList.toggle("is-closed", isExpanded);
});

practiceDropdown.addEventListener("pointerenter", () => {
  practiceDropdown.classList.remove("is-closed");
});

practiceDropdown.addEventListener("focusout", (event) => {
  if (!(event.relatedTarget instanceof Node) || !practiceDropdown.contains(event.relatedTarget)) {
    closePracticeMenu();
  }
});

primaryNavigation.addEventListener("click", (event) => {
  if (event.target instanceof Element && event.target.closest("a")) {
    if (window.matchMedia("(max-width: 1199px)").matches) {
      closeMenu();
    } else {
      closePracticeMenu();
    }
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    if (practiceMenuToggle.getAttribute("aria-expanded") === "true") {
      closePracticeMenu();
      practiceMenuToggle.focus();
    } else if (menuToggle.getAttribute("aria-expanded") === "true") {
      closeMenu();
      menuToggle.focus();
    }
  }
});

document.addEventListener("click", (event) => {
  if (event.target instanceof Node && !practiceDropdown.contains(event.target)) {
    closePracticeMenu();
  }
});
