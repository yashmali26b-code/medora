# CareSearch Design Directions

## Three approaches

### 1. Clinical Ledger
**Very Brief Intro:** A calm, editorial public-health experience that feels like a trusted field guide rather than a shopping site. Warm paper tones and rigorous information hierarchy replace sterile hospital blue.

**Probability:** 0.07

### 2. Signal Garden
**Very Brief Intro:** A restorative, nature-led health interface built around soft botanical cues, generous air, and gentle guidance. It is reassuring without giving false certainty.

**Probability:** 0.03

### 3. Triage Terminal
**Very Brief Intro:** A compact, data-forward safety console with high-contrast pathways and fast progressive disclosure. It foregrounds urgency and decisiveness without looking alarming.

**Probability:** 0.09

---

# Chosen Direction: Clinical Ledger

## Design Movement

**Contemporary editorial public health.** The site borrows from trusted reference books, clinical charts, and modern civic-service design: calm authority, legible facts, and deliberately visible provenance. It avoids a glossy pharmacy storefront and never uses visual language that suggests a diagnosis is certain.

## Core Principles

1. **Safety is the visual hierarchy.** Urgent actions sit above advice, and uncertainty is explained rather than disguised.
2. **Evidence is tangible.** Source, reviewer, jurisdiction, and review date appear as traceable metadata, not hidden fine print.
3. **Guidance is progressive.** Users begin with a simple search, then see only the context questions necessary for a safer next step.
4. **Warmth earns trust.** The UI is friendly and human, but its typography and structure remain clear enough for stressful moments.

## Color Philosophy

The base is a lightly warm, parchment-like ivory that lowers visual pressure and avoids generic clinical white. Deep midnight teal carries navigation and factual authority, while **Signal Vermilion** is reserved for safety interruptions, urgent routing, and the brand mark. Olive appears only as a neutral “information ready” accent, never as an approval signal. There is no green success state for health outcomes, so the interface does not visually certify a user as safe.

## Layout Paradigm

The experience is organized as an **asymmetric reading desk**. A narrow fixed information rail carries the brand and orientation, while the content canvas uses a broad left-aligned search and a stacked “next step” column. On large displays, patient-safety information appears as tactile annotations and side notes; on mobile, it becomes a clear vertical path with no information hidden behind hover states.

## Signature Elements

1. **Ledger lines:** Fine horizontal ruled lines and small margin markers reference a field guide and make content scanning easier.
2. **Signal caps:** Vermilion half-circle markers identify safety-critical content and interrupt the page rhythm only when warranted.
3. **Evidence stamps:** Small metadata blocks use mono-style labels for source, reviewed date, jurisdiction, and version.

## Interaction Philosophy

Interactions should feel practical and responsive, not playful. Search chips fill the field rather than navigating away. Safety questions reveal one compact contextual group at a time. Result cards use a crisp border shift and a short translate motion on hover, while urgent routing appears immediately with minimal animation. Unsupported searches always fall back to an honest, supportive professional-care route.

## Animation

Use low-volume motion: 160–220 ms opacity and transform transitions with a strong ease-out. The hero ledger marks and search support cards may stagger in once on entry. Search results use a 160 ms opacity/translate transition, and safety panels must appear immediately enough to avoid obscuring urgency. Respect `prefers-reduced-motion` by removing all non-essential movement. Do not animate emergency instructions, a severity selection, or keyboard interactions.

## Typography System

**Fraunces** provides the humane editorial display voice for headlines and major topic names. **DM Sans** carries body copy, navigation, and accessible controls. **IBM Plex Mono** is reserved for compact source stamps, status labels, and active-ingredient data. Headlines use a restrained high-contrast serif at 700–900 weight; body copy stays at 400–500 with generous line height; labels are uppercase, tracked, and never used for long content.

## Brand Essence

**CareSearch is a calm, evidence-led guide for people who need to understand a symptom or medicine and choose the next responsible step.**

**Personality:** Grounded, clear, protective.

## Brand Voice

Headlines are direct and measured. Calls to action state the action and why it matters. Microcopy gives the user permission to pause, revise, or speak to a professional; it never promises certainty or uses alarmist language.

Example headline: “Start with what you’re noticing.”

Example CTA: “Check the next safe step.”

## Wordmark & Logo

The brand mark is a bold, simple **open-book compass**: two curved teal forms create a protected circular field, split by a small vermilion safety point. It signals orientation, evidence, and care without using a medical cross or pharmaceutical symbol. The CareSearch wordmark uses a custom-feeling Fraunces treatment with a vermilion dot accent, never a default sans-serif logotype.

## Signature Brand Color

**Signal Vermilion — #C74A2B.** A carefully rationed warning-and-action color that makes CareSearch recognizable while preserving its safety meaning.

## Style Decisions

- Avoid patient photos and photographic medical imagery in the first release; the interface must remain culturally neutral and text-safe under high-stress use.
- Never use a green check, green medicine card, or green “safe” outcome as a health clearance cue.
- Use the generated open-book compass mark visibly in the header and site icon, with no text inside the logo image.
- Signal Vermilion is restricted to the brand mark, emergency routing, primary next-step actions, and small safety markers; editorial emphasis relies on type and teal contrast instead.
- Every major page region must carry a visible provenance or orientation cue, such as a jurisdiction, review label, source stamp, routing standard, or margin annotation.
- Visual assets must read as reference artifacts—labels, guides, documents, reviewed cards, and annotations—rather than lifestyle or pharmacy advertising imagery.

## Medora Rebrand Amendment

The user-supplied Medora logo is the new primary brand asset. The interface therefore moves from parchment and vermilion toward a **clean clinical search palette**: Cobalt Confidence (#064EAC), Medora Teal (#10C7B7), Search Aqua (#0784BA), and clarity-first white. Backgrounds use a restrained microscope-lens texture, aqua radial focus zones, and a faint clinical-grid rule, so the visual language echoes the logo’s magnifier, rounded “M” silhouette, and clean medicine-search promise. Cobalt retains urgency and authority; aqua expresses discovery and care; white maintains readability.
***
