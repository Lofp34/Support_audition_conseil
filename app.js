(function () {
  const storageKey = "audition-conseil-simulation";
  const app = document.getElementById("app");

  const defaultState = {
    name: "",
    role: "",
    selectedCaseId: "",
    currentView: "entry",
    coachStepIndex: 0,
    openDiscoveryThemes: {
      decouverte: 0,
    },
    openPatientSections: {
      contexte: true,
      gene: true,
      ressenti: false,
      spontane: true,
      cache: false,
      objections: false,
      convaincre: false,
    },
    coachNotes: {},
    coachChecks: {},
    discoveryChecks: {},
    debriefNotes: "",
  };

  const state = loadState();

  function cloneDefaultState() {
    return JSON.parse(JSON.stringify(defaultState));
  }

  function loadState() {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) return cloneDefaultState();
      const parsed = JSON.parse(raw);
      return {
        ...cloneDefaultState(),
        ...parsed,
        openDiscoveryThemes: {
          ...defaultState.openDiscoveryThemes,
          ...(parsed.openDiscoveryThemes || {}),
        },
        openPatientSections: {
          ...defaultState.openPatientSections,
          ...(parsed.openPatientSections || {}),
        },
      };
    } catch (error) {
      return cloneDefaultState();
    }
  }

  function saveState() {
    window.localStorage.setItem(storageKey, JSON.stringify(state));
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function currentCase() {
    return window.casePatients.find((item) => item.id === state.selectedCaseId);
  }

  function currentStep() {
    return window.planVente.steps[state.coachStepIndex];
  }

  function noteValue(stepId) {
    return state.coachNotes[stepId] || "";
  }

  function checkValue(stepId, index) {
    return Boolean(state.coachChecks?.[stepId]?.[index]);
  }

  function discoveryCheckValue(stepId, themeIndex, questionIndex) {
    return Boolean(
      state.discoveryChecks?.[stepId]?.[themeIndex]?.[questionIndex]
    );
  }

  function openDiscoveryThemeIndex(stepId) {
    return Object.prototype.hasOwnProperty.call(
      state.openDiscoveryThemes || {},
      stepId
    )
      ? state.openDiscoveryThemes[stepId]
      : 0;
  }

  function scrollCurrentViewToTop() {
    window.requestAnimationFrame(() => {
      const selectorMap = {
        "case-library": ".panel",
        "patient-view": ".panel",
        "coach-view": ".step-panel",
        debrief: ".debrief-card",
        entry: ".hero",
      };
      const selector = selectorMap[state.currentView];
      const target = selector ? app.querySelector(selector) : null;

      if (target) {
        target.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
        return;
      }

      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  function syncEntryRoleButtons() {
    const disabled = !state.name.trim();
    app
      .querySelectorAll('[data-action="choose-role"]')
      .forEach((button) => {
        button.disabled = disabled;
      });
  }

  function renderHeader() {
    if (state.currentView === "entry") return "";

    const roleLabel =
      state.role === "patient" ? "Role patient" : "Role audioprothesiste";

    return `
      <header class="shell-header">
        <div class="shell-header-title">
          <strong>${escapeHtml(state.name || "Session")}</strong>
          <span>${roleLabel} · Support de simulation en binome</span>
        </div>
        <div class="pill-row">
          <button class="ghost-button" data-action="back-home">Changer de role</button>
          <button class="tiny-button" data-action="reset-session">Effacer la session</button>
        </div>
      </header>
    `;
  }

  function renderEntry() {
    return `
      <section class="stage hero">
        <div class="hero-copy">
          <span class="eyebrow">Audition Conseil 66 · Simulation d'entretien</span>
          <h1>Un vrai support de jeu de role clinique et commercial.</h1>
          <p>
            Cette application aide deux apprenants a se mettre en situation :
            l'un incarne un patient complet, l'autre suit un GPS d'entretien
            structure autour du plan de vente Audition Conseil 66.
          </p>
          <div class="hero-ribbons">
            <div class="hero-ribbon">
              <div>01</div>
              <div>
                <strong>Role patient</strong>
                Fiche d'incarnation complete, utile pour jouer juste pendant tout l'entretien.
              </div>
            </div>
            <div class="hero-ribbon">
              <div>02</div>
              <div>
                <strong>Role audioprothesiste</strong>
                Coach pas a pas pour la prise de contact, la decouverte, l'argumentation, les objections et le closing.
              </div>
            </div>
            <div class="hero-ribbon">
              <div>03</div>
              <div>
                <strong>Objectif pedagogique</strong>
                Structurer des rendez-vous fluides, humains et efficaces, sans transformer l'entretien en recitation.
              </div>
            </div>
          </div>
        </div>
        <div class="hero-form">
          <div>
            <h2 class="page-title">Entrez dans la simulation</h2>
            <p class="page-intro">
              Commencez par renseigner le prenom de l'apprenant, puis choisissez le role a jouer pendant la mise en situation.
            </p>
          </div>
          <div class="field-block">
            <label class="label" for="name-input">Prenom de l'apprenant</label>
            <input
              id="name-input"
              class="text-input"
              type="text"
              placeholder="Ex. Flora, Roman, Juliette..."
              value="${escapeHtml(state.name)}"
              data-input="name"
            />
          </div>
          <div class="field-block">
            <span class="label">Choix du role</span>
            <div class="role-grid">
              <button
                class="role-card"
                data-role="patient"
                data-action="choose-role"
                ${state.name.trim() ? "" : "disabled"}
              >
                <div class="pill-row">
                  <span class="pill pill-copper">Patient</span>
                </div>
                <div class="role-title">Je joue le patient</div>
                <div class="subtle">
                  Je choisis un cas, je memorise le personnage, je sais ce que je dis spontanement, ce que je garde pour plus tard et ce qui pourrait me convaincre.
                </div>
              </button>
              <button
                class="role-card"
                data-role="audioprothesiste"
                data-action="choose-role"
                ${state.name.trim() ? "" : "disabled"}
              >
                <div class="pill-row">
                  <span class="pill pill-highlight">Audioprothesiste</span>
                </div>
                <div class="role-title">Je mene l'entretien</div>
                <div class="subtle">
                  Je suis le fil du rendez-vous grace a un coach pratique : questions utiles, points de vigilance, reformulation, BAC, AICT et closing.
                </div>
              </button>
            </div>
          </div>
          <div class="footer-note">
            Support v1 concu pour tablette ou ordinateur, en binome de formation.
          </div>
        </div>
      </section>
    `;
  }

  function renderCaseLibrary() {
    const cards = window.casePatients
      .map(
        (item) => `
          <button class="case-card" data-action="open-case" data-case-id="${escapeHtml(item.id)}" data-tone="${escapeHtml(item.tone)}">
            <div class="case-card-head">
              <div>
                <small>${escapeHtml(item.prenom)}, ${escapeHtml(item.age)} ans</small>
                <h2 class="case-title">${escapeHtml(item.prenom)}</h2>
              </div>
            </div>
            <div class="meta-line">${escapeHtml(item.situation)}</div>
            <div class="chip-row">
              <span class="chip">${escapeHtml(item.style_de_personnage)}</span>
              <span class="chip">${escapeHtml(item.objections_probables[0])}</span>
            </div>
            <div class="subtle">
              ${escapeHtml(item.ce_que_je_dirai_spontanement[0])}
            </div>
          </button>
        `
      )
      .join("");

    return `
      <section class="stage">
        <div class="panel">
          <div class="pill-row">
            <span class="pill pill-copper">Bibliotheque des cas</span>
          </div>
          <h1 class="page-title">Choisissez le patient a incarner</h1>
          <p class="page-intro">
            Chaque fiche est pensee pour un entretien complet. Vous ne voyez que la matiere utile pour jouer le patient : contexte, emotions, objections probables et informations a reveler seulement si l'audioprothesiste pose de bonnes questions.
          </p>
          <div class="case-grid">${cards}</div>
        </div>
      </section>
    `;
  }

  function renderAccordion(id, title, content, open) {
    return `
      <section class="accordion" data-open="${open ? "true" : "false"}">
        <button class="accordion-toggle" data-action="toggle-section" data-section="${escapeHtml(id)}">
          <div>
            <span class="mini-title">Section</span>
            <strong>${escapeHtml(title)}</strong>
          </div>
          <span>${open ? "Fermer" : "Ouvrir"}</span>
        </button>
        <div class="accordion-content">${content}</div>
      </section>
    `;
  }

  function renderPatientView() {
    const patient = currentCase();

    if (!patient) {
      return `
        <section class="stage panel">
          <div class="empty-state">
            Aucun cas selectionne pour le role patient.
          </div>
        </section>
      `;
    }

    const detailSections = [
      {
        id: "contexte",
        title: "Mon quotidien",
        content: `
          <div class="detail-grid">
            <div class="detail-card">
              <p class="mini-title">Contexte de vie</p>
              <ul class="list">${patient.contexte_de_vie.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
            </div>
            <div class="detail-card">
              <p class="mini-title">Activites</p>
              <ul class="list">${patient.activites.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
            </div>
            <div class="detail-card">
              <p class="mini-title">Entourage</p>
              <ul class="list">${patient.entourage.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
            </div>
            <div class="detail-card">
              <p class="mini-title">Rapport a l'appareillage</p>
              <p>${escapeHtml(patient.rapport_a_l_appareillage)}</p>
            </div>
          </div>
        `,
      },
      {
        id: "gene",
        title: "Ce qui me gene",
        content: `<ul class="list">${patient.situations_de_gene.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`,
      },
      {
        id: "ressenti",
        title: "Ce que je ressens",
        content: `
          <ul class="list">${patient.impact_emotionnel.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
          <div class="detail-card">
            <p class="mini-title">Mes motivations cachees</p>
            <ul class="list">${patient.motivations_cachees.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
          </div>
        `,
      },
      {
        id: "spontane",
        title: "Ce que je vais dire spontanement",
        content: `
          <ul class="list">${patient.ce_que_je_dirai_spontanement.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
          <p class="footer-note">Commencez par ces phrases si l'entretien reste large. Ne donnez pas tout d'un coup.</p>
        `,
      },
      {
        id: "cache",
        title: "Ce que je ne dirai que si on me questionne bien",
        content: `<ul class="list">${patient.indices_a_reveler_si_bonne_decouverte.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`,
      },
      {
        id: "objections",
        title: "Mes objections probables",
        content: `
          <ul class="list">${patient.objections_probables.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
          <div class="detail-card">
            <p class="mini-title">Mes freins de fond</p>
            <ul class="list">${patient.freins.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
          </div>
        `,
      },
      {
        id: "convaincre",
        title: "Ce qui pourrait me convaincre",
        content: `<ul class="list">${patient.ce_qui_peut_le_convaincre.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`,
      },
    ];

    return `
      <section class="stage case-layout">
        <div class="panel">
          <div class="button-row">
            <button class="ghost-button" data-action="back-to-cases">Retour aux cas</button>
            <button class="button" data-action="finish-session">Passer au debrief</button>
          </div>
          <div style="height: 18px;"></div>
          <div class="pill-row">
            <span class="pill pill-copper">Role patient</span>
            <span class="pill">${escapeHtml(patient.style_de_personnage)}</span>
          </div>
          <h1 class="page-title">${escapeHtml(patient.prenom)}, ${escapeHtml(patient.age)} ans</h1>
          <p class="page-intro">${escapeHtml(patient.situation)}</p>

          <div class="overview-grid" style="margin-top: 24px;">
            <div class="overview-card">
              <p class="mini-title">Qui je suis</p>
              <p>${escapeHtml(patient.situation)}</p>
            </div>
            <div class="overview-card">
              <p class="mini-title">Niveau d'ouverture</p>
              <p>${escapeHtml(patient.niveau_d_ouverture)}</p>
            </div>
          </div>

          <div style="height: 22px;"></div>
          <div class="detail-grid">
            ${detailSections
              .map((section) =>
                renderAccordion(
                  section.id,
                  section.title,
                  section.content,
                  state.openPatientSections[section.id]
                )
              )
              .join("")}
          </div>
        </div>

        <aside class="memory-stack">
          <div class="memory-card">
            <p class="mini-title">Memo de jeu</p>
            <h2 class="section-title">Incarnez le patient, pas une correction.</h2>
            <p class="subtle">
              Votre role n'est pas d'aider l'audioprothesiste. Jouez le personnage avec coherence, rythme et retenue. Plus il pose de bonnes questions, plus vous pouvez livrer des elements profonds.
            </p>
          </div>

          <div class="memory-card">
            <p class="mini-title">Premiere phrase possible</p>
            <blockquote class="quote">${escapeHtml(patient.ce_que_je_dirai_spontanement[0])}</blockquote>
          </div>

          <div class="memory-card">
            <p class="mini-title">Boussole emotionnelle</p>
            <ul class="list">
              <li><strong>Style :</strong> ${escapeHtml(patient.style_de_personnage)}</li>
              <li><strong>Ouverture :</strong> ${escapeHtml(patient.niveau_d_ouverture)}</li>
              <li><strong>Declencheur :</strong> ${escapeHtml(patient.ce_qui_peut_le_convaincre[0])}</li>
            </ul>
          </div>
        </aside>
      </section>
    `;
  }

  function renderContactSections(step) {
    if (!step.sections?.length) return "";

    return `
      <div>
        <p class="mini-title">Guide operationnel</p>
        <div class="contact-grid">
          ${step.sections
            .map(
              (section) => `
                <article class="contact-card">
                  <p class="mini-title">${escapeHtml(section.title)}</p>
                  <p class="contact-example">${escapeHtml(section.example)}</p>
                </article>
              `
            )
            .join("")}
        </div>
      </div>
    `;
  }

  function renderPitchExact(step) {
    if (!step.pitchExact?.length) return "";

    return `
      <div class="step-callout">
        <p class="mini-title">Pitch Audition Conseil 66</p>
        <div class="script-stack">
          ${step.pitchExact
            .map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`)
            .join("")}
        </div>
      </div>
    `;
  }

  function renderDiscoveryThemes(step) {
    if (!step.themes?.length) return "";

    const openTheme = openDiscoveryThemeIndex(step.id);

    return `
      <div>
        <p class="mini-title">Themes a explorer</p>
        <div class="theme-grid">
          ${step.themes
            .map(
              (theme, themeIndex) => `
                <article class="theme-card theme-accordion" data-open="${openTheme === themeIndex ? "true" : "false"}">
                  <button
                    class="theme-card-toggle"
                    data-action="toggle-discovery-theme"
                    data-step-id="${escapeHtml(step.id)}"
                    data-theme-index="${themeIndex}"
                  >
                    <div class="theme-card-summary">
                      <div>
                        <p class="mini-title">Theme ${themeIndex + 1}</p>
                        <h4>${escapeHtml(theme.title)}</h4>
                      </div>
                      <span class="theme-card-meta">${theme.questions.length} questions</span>
                    </div>
                    <span class="theme-card-icon" aria-hidden="true">${openTheme === themeIndex ? "−" : "+"}</span>
                  </button>
                  <div class="theme-card-body">
                    ${
                      theme.objective
                        ? `<p class="theme-objective">${escapeHtml(theme.objective)}</p>`
                        : ""
                    }
                    <div class="question-checklist">
                      ${theme.questions
                        .map((question, questionIndex) => {
                          const checked = discoveryCheckValue(
                            step.id,
                            themeIndex,
                            questionIndex
                          );

                          return `
                            <label
                              class="check-item discovery-item ${checked ? "is-done" : ""}"
                              data-action="toggle-discovery-check"
                              data-step-id="${escapeHtml(step.id)}"
                              data-theme-index="${themeIndex}"
                              data-question-index="${questionIndex}"
                            >
                              <input type="checkbox" ${checked ? "checked" : ""} />
                              <span>${escapeHtml(question)}</span>
                            </label>
                          `;
                        })
                        .join("")}
                    </div>
                    ${
                      theme.followUps?.length
                        ? `
                          <div class="theme-followups">
                            <p class="mini-title">Creuser</p>
                            <ul class="list">
                              ${theme.followUps
                                .map((item) => `<li>${escapeHtml(item)}</li>`)
                                .join("")}
                            </ul>
                          </div>
                        `
                        : ""
                    }
                  </div>
                </article>
              `
            )
            .join("")}
        </div>
      </div>
    `;
  }

  function renderCoachView() {
    const step = currentStep();
    const isContactStep = step.id === "prise-de-contact";
    const isDiscoveryStep = step.id === "decouverte";
    const showObjectiveCard = !isContactStep;
    const showPromptsCard = !isContactStep && !isDiscoveryStep && step.prompts?.length;
    const showWatchouts = !isContactStep && step.watchouts?.length;
    const showSuccessSignals = !isContactStep && step.successSignals?.length;
    const showCallout = Boolean(step.callout) && step.id !== "argumentation";

    const nav = window.planVente.steps
      .map(
        (item, index) => `
          <button data-action="go-step" data-step-index="${index}" data-active="${index === state.coachStepIndex ? "true" : "false"}">
            <strong>${escapeHtml(item.shortLabel)}</strong>
            <small>${escapeHtml(item.title)}</small>
          </button>
        `
      )
      .join("");

    const themesMarkup = isDiscoveryStep ? renderDiscoveryThemes(step) : "";

    const objectionsMarkup = step.objections
      ? `
          <div>
            <p class="mini-title">Objections frequentes</p>
            <div class="objection-grid">
              ${step.objections
                .map(
                  (objection) => `
                    <article class="objection-card">
                      <h4>${escapeHtml(objection.title)}</h4>
                      <ul class="list">${objection.points.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
                    </article>
                  `
                )
                .join("")}
            </div>
          </div>
        `
      : "";

    const formulaMarkup = step.formula
      ? `
          <div class="formula-card">
            <p class="mini-title">Structure utile</p>
            <p><strong>${escapeHtml(step.formula)}</strong></p>
          </div>
        `
      : "";

    const calloutMarkup = showCallout
      ? `
          <div class="step-callout">
            <p class="mini-title">${escapeHtml(step.calloutLabel || "Repere terrain")}</p>
            <p>${escapeHtml(step.callout)}</p>
          </div>
        `
      : "";

    const checklistMarkup = step.checklist
      .map(
        (item, index) => `
          <label class="check-item">
            <input
              type="checkbox"
              data-action="toggle-check"
              data-step-id="${escapeHtml(step.id)}"
              data-check-index="${index}"
              ${checkValue(step.id, index) ? "checked" : ""}
            />
            <span>${escapeHtml(item)}</span>
          </label>
        `
      )
      .join("");

    return `
      <section class="stage coach-layout">
        <aside class="step-nav panel">
          <div>
            <span class="pill pill-highlight">Coach d'entretien</span>
            <h2 class="section-title" style="margin-top: 14px;">Votre GPS de rendez-vous</h2>
            <p class="subtle">
              Gardez le fil du plan de vente. Votre binome joue le patient sur son ecran ; vous, vous structurez l'echange.
            </p>
          </div>
          ${nav}
          <button class="button" data-action="finish-session">Passer au debrief</button>
        </aside>

        <section class="step-panel">
          <div class="step-header">
            <div>
              <span class="step-kicker">${escapeHtml(step.shortLabel)}</span>
              <h1 class="step-title">${escapeHtml(step.title)}</h1>
            </div>
            <div class="step-progress">Etape ${state.coachStepIndex + 1} / ${window.planVente.steps.length}</div>
          </div>

          ${
            showObjectiveCard
              ? `
                <div class="success-card">
                  <p class="mini-title">Objectif de la phase</p>
                  <p>${escapeHtml(step.objective)}</p>
                  <p><strong>${escapeHtml(step.mantra)}</strong></p>
                </div>
              `
              : ""
          }

          ${isContactStep ? renderContactSections(step) : ""}
          ${isContactStep ? renderPitchExact(step) : ""}
          ${calloutMarkup}
          ${formulaMarkup}

          ${
            showPromptsCard || showWatchouts
              ? `
                <div class="step-grid">
                  ${
                    showPromptsCard
                      ? `
                        <div class="detail-card">
                          <p class="mini-title">Questions et formulations suggerees</p>
                          <ul class="list">${step.prompts
                            .map((item) => `<li>${escapeHtml(item)}</li>`)
                            .join("")}</ul>
                        </div>
                      `
                      : ""
                  }
                  ${
                    showWatchouts
                      ? `
                        <div class="warning-card">
                          <p class="mini-title">Erreurs a eviter</p>
                          <ul class="list">${step.watchouts
                            .map((item) => `<li>${escapeHtml(item)}</li>`)
                            .join("")}</ul>
                        </div>
                      `
                      : ""
                  }
                </div>
              `
              : ""
          }

          ${themesMarkup}
          ${objectionsMarkup}

          ${
            showSuccessSignals
              ? `
                <div class="success-card">
                  <p class="mini-title">Vous pouvez avancer quand...</p>
                  <ul class="list">${step.successSignals
                    .map((item) => `<li>${escapeHtml(item)}</li>`)
                    .join("")}</ul>
                </div>
              `
              : ""
          }

          <div class="button-row">
            <button class="ghost-button" data-action="prev-step" ${state.coachStepIndex === 0 ? "disabled" : ""}>Etape precedente</button>
            <button class="button" data-action="next-step">
              ${state.coachStepIndex === window.planVente.steps.length - 1 ? "Aller au debrief" : "Etape suivante"}
            </button>
          </div>
        </section>

        <aside class="aside-panel">
          <div>
            <p class="mini-title">Rappel general</p>
            <ul class="list">${window.planVente.rappelGlobal.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
          </div>

          <div style="height: 18px;"></div>
          <div>
            <p class="mini-title">Checklist de la phase</p>
            <div class="checklist">${checklistMarkup}</div>
          </div>

          <div style="height: 18px;"></div>
          <div>
            <label class="label" for="coach-notes">Mes reperes pour cette phase</label>
            <textarea
              id="coach-notes"
              class="textarea"
              data-input="coach-note"
              data-step-id="${escapeHtml(step.id)}"
              placeholder="Ex. phrase de reformulation, angle a creuser, objection entendue..."
            >${escapeHtml(noteValue(step.id))}</textarea>
          </div>
        </aside>
      </section>
    `;
  }

  function debriefQuestions() {
    if (state.role === "patient") {
      return [
        "Ai-je joue le personnage avec coherence du debut a la fin ?",
        "Ai-je garde pour plus tard les informations qui devaient etre decouvertes ?",
        "A quel moment l'audioprothesiste m'a donne envie de m'ouvrir davantage ?",
        "Qu'est-ce qui, dans son entretien, m'a laisse dubitatif ou peu compris ?",
      ];
    }

    return [
      "Ai-je pose assez de questions ouvertes avant d'argumenter ?",
      "Ma reformulation reprenait-elle vraiment les mots du patient ?",
      "Ai-je traite l'objection a partir du vecu du patient plutot qu'avec une reponse standard ?",
      "Ma conclusion etait-elle claire, naturelle et engageante ?",
    ];
  }

  function renderDebrief() {
    const questions = debriefQuestions();
    const caseLabel = currentCase() ? currentCase().titre : "Simulation ouverte";

    return `
      <section class="stage debrief-layout">
        <div class="debrief-card">
          <div class="pill-row">
            <span class="pill ${state.role === "patient" ? "pill-copper" : "pill-highlight"}">Debrief</span>
            <span class="pill">${escapeHtml(caseLabel)}</span>
          </div>
          <h1 class="debrief-title">Clore la simulation avec un vrai retour utile.</h1>
          <p class="page-intro">
            Le debrief sert a transformer la mise en situation en apprentissage. Notez ce qui a aide, ce qui a freine et ce qui doit etre rejoue.
          </p>

          <div class="debrief-grid" style="margin-top: 24px;">
            ${questions
              .map(
                (question, index) => `
                  <article class="detail-card">
                    <p class="mini-title">Question ${index + 1}</p>
                    <p>${escapeHtml(question)}</p>
                  </article>
                `
              )
              .join("")}
          </div>

          <div style="height: 20px;"></div>
          <label class="label" for="debrief-note">Notes de debrief</label>
          <textarea
            id="debrief-note"
            class="textarea"
            data-input="debrief-note"
            placeholder="Ce qui a marche, ce qui doit etre retravaille, formulation a garder..."
          >${escapeHtml(state.debriefNotes)}</textarea>

          <div style="height: 20px;"></div>
          <div class="button-row">
            <button class="ghost-button" data-action="restart-role">Nouvelle simulation avec ce role</button>
            <button class="button" data-action="back-home">Changer de role</button>
          </div>
        </div>

        <aside class="memory-stack">
          <div class="memory-card">
            <p class="mini-title">Support v1</p>
            <h2 class="section-title">Ce que l'application sait faire</h2>
            <ul class="list">
              <li>Donner au patient une fiche jouable et complete.</li>
              <li>Donner a l'audioprothesiste un GPS de rendez-vous pas a pas.</li>
              <li>Offrir une base commune pour le feedback formateur.</li>
            </ul>
          </div>
          <div class="memory-card">
            <p class="mini-title">Piste de suite</p>
            <p class="subtle">
              Cette base pourra ensuite accueillir un scoring, un mode formateur ou une synchronisation de session. Pour l'instant, elle vise la fluidite et la clarte en salle.
            </p>
          </div>
        </aside>
      </section>
    `;
  }

  function render() {
    let body = "";

    if (state.currentView === "entry") body = renderEntry();
    if (state.currentView === "case-library") body = renderCaseLibrary();
    if (state.currentView === "patient-view") body = renderPatientView();
    if (state.currentView === "coach-view") body = renderCoachView();
    if (state.currentView === "debrief") body = renderDebrief();

    app.innerHTML = `${renderHeader()}${body}`;

    if (state.currentView === "entry") {
      syncEntryRoleButtons();
    }
  }

  function resetRoleFlow() {
    state.selectedCaseId = "";
    state.currentView = state.role === "patient" ? "case-library" : "coach-view";
    state.coachStepIndex = 0;
    state.debriefNotes = "";
  }

  app.addEventListener("click", (event) => {
    const target = event.target.closest("[data-action]");
    if (!target) return;

    const action = target.dataset.action;
    let shouldScrollToTop = false;

    if (action === "choose-role") {
      if (!state.name.trim()) return;
      state.role = target.dataset.role;
      state.currentView = state.role === "patient" ? "case-library" : "coach-view";
      state.selectedCaseId = "";
      state.coachStepIndex = 0;
      shouldScrollToTop = true;
    }

    if (action === "open-case") {
      state.selectedCaseId = target.dataset.caseId;
      state.currentView = "patient-view";
      shouldScrollToTop = true;
    }

    if (action === "back-home") {
      state.role = "";
      state.selectedCaseId = "";
      state.currentView = "entry";
      state.coachStepIndex = 0;
      state.debriefNotes = "";
      shouldScrollToTop = true;
    }

    if (action === "reset-session") {
      Object.assign(state, cloneDefaultState());
      window.localStorage.removeItem(storageKey);
      shouldScrollToTop = true;
    }

    if (action === "back-to-cases") {
      state.currentView = "case-library";
      shouldScrollToTop = true;
    }

    if (action === "toggle-section") {
      const key = target.dataset.section;
      state.openPatientSections[key] = !state.openPatientSections[key];
    }

    if (action === "go-step") {
      state.coachStepIndex = Number(target.dataset.stepIndex);
      shouldScrollToTop = true;
    }

    if (action === "prev-step") {
      state.coachStepIndex = Math.max(0, state.coachStepIndex - 1);
      shouldScrollToTop = true;
    }

    if (action === "next-step") {
      if (state.coachStepIndex >= window.planVente.steps.length - 1) {
        state.currentView = "debrief";
      } else {
        state.coachStepIndex += 1;
      }
      shouldScrollToTop = true;
    }

    if (action === "toggle-check") {
      const stepId = target.dataset.stepId;
      const index = Number(target.dataset.checkIndex);
      state.coachChecks[stepId] = state.coachChecks[stepId] || {};
      state.coachChecks[stepId][index] = !state.coachChecks[stepId][index];
    }

    if (action === "toggle-discovery-check") {
      const stepId = target.dataset.stepId;
      const themeIndex = Number(target.dataset.themeIndex);
      const questionIndex = Number(target.dataset.questionIndex);

      state.discoveryChecks[stepId] = state.discoveryChecks[stepId] || {};
      state.discoveryChecks[stepId][themeIndex] =
        state.discoveryChecks[stepId][themeIndex] || {};
      state.discoveryChecks[stepId][themeIndex][questionIndex] =
        !state.discoveryChecks[stepId][themeIndex][questionIndex];
    }

    if (action === "toggle-discovery-theme") {
      const stepId = target.dataset.stepId;
      const themeIndex = Number(target.dataset.themeIndex);
      const currentOpen = openDiscoveryThemeIndex(stepId);

      state.openDiscoveryThemes[stepId] =
        currentOpen === themeIndex ? null : themeIndex;
    }

    if (action === "finish-session") {
      state.currentView = "debrief";
      shouldScrollToTop = true;
    }

    if (action === "restart-role") {
      resetRoleFlow();
      shouldScrollToTop = true;
    }

    saveState();
    render();

    if (shouldScrollToTop) {
      scrollCurrentViewToTop();
    }
  });

  app.addEventListener("input", (event) => {
    const target = event.target;

    if (target.dataset.input === "name") {
      state.name = target.value;
      saveState();
      syncEntryRoleButtons();
      return;
    }

    if (target.dataset.input === "coach-note") {
      state.coachNotes[target.dataset.stepId] = target.value;
    }

    if (target.dataset.input === "debrief-note") {
      state.debriefNotes = target.value;
    }

    saveState();
  });

  render();
})();
