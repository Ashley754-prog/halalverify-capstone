# Phase 1 Documentation Revisions — Proposed Manuscript Text

**Status: DRAFT for team review → adviser approval. Nothing here is final until the adviser signs off.**
These revisions resolve contradictions C1 (scope vs. adviser R1/R2), C3 (privacy claim), C4
(unmeasured metrics stated as results), and C5 (module scope), and incorporate adviser
comments R1–R5 from the consultation form.

> **C2 decision RESOLVED (2026-08-19):** Spike S2 completed — mAP@50 0.995 on the Sea Halal
> Logo v3 test split (upper-bound feasibility figure; see `spikes/s2-yolo/S2-RESULTS.md` for
> the mandatory honesty caveat). Decision: **GO — Objective 1 = Variant A (keep YOLOv8-Nano
> logo detection). The title does not change.** Variant B below is retained only as a record
> of the alternative that was considered.

---

## 1. §1.5 Scope and Limitation — replace the external-registry clause

### Current text (contradicts adviser direction R1/R2)

> "Regarding database integration and external registry disconnection, the system operates
> strictly as an independent decision-support tool and does not connect via live APIs to
> external third-party databases, government registries, or official certifying bodies, such
> as the Islamic Da'wah Council of the Philippines (IDCP)."

### Proposed replacement

> Regarding data sourcing, the system operates as an independent decision-support tool and
> does not integrate live APIs of external third-party databases or government registries.
> Instead, registry records — certified products, manufacturers, and establishments — are
> curated and periodically synchronized from the published lists of recognized halal
> certifying bodies, such as the Islamic Da'wah Council of the Philippines (IDCP), into the
> system's Supabase database. Every registry record displays its data source and
> synchronization date, and results remain advisory rather than constituting live
> verification with the issuing body. Consequently, while the system's certificate analysis
> module cross-references extracted certificate details against this curated registry,
> computer-assisted matching alone cannot substitute for direct verification with the
> certifying body, and stale records may lag behind the body's current lists between
> synchronization cycles.

### Also add to §1.5 scope paragraph (adviser R1, R3)

> The system additionally provides: (a) a Product Verification module allowing users to look
> up products by product name, manufacturer, and detected ingredients against the curated
> certifying-body registry; and (b) an interactive map of registered halal establishments
> within Zamboanga City, including a density (heatmap) view of halal establishment
> concentration.

---

## 2. §1.2 Statement of the Problem — add two research questions

After current RQ3 (establishment index), insert:

> 3a. How can a curated mirror of halal certifying-body records (certified products,
> manufacturers, and establishments) be structured within the system's relational database
> to support lookup by product name, manufacturer, and ingredient?
>
> 3b. How can registered halal establishments be visualized on an interactive map with a
> density heatmap to reveal the distribution of halal-certified establishments across
> Zamboanga City?

(Renumber subsequent questions. Adjust numbering consistently in §1.4.1.)

---

## 3. §1.4.1 Specific Objectives — Objective 1 decided by Spike S2 (GO)

### Shared new objectives (adviser R1/R3)

> To design and integrate a curated certifying-body registry of certified products,
> manufacturers, and establishments within the Supabase backend, supporting product lookup
> by name, manufacturer, and ingredient, with visible data provenance and synchronization
> dates.
>
> To develop an interactive establishment map with a density heatmap showing the
> distribution of registered halal establishments in Zamboanga City.

### Objective 1 — Variant A ✅ SELECTED (S2: GO, keep logo detection)

> To develop a real-time object detection module using a fine-tuned YOLOv8-Nano model that
> identifies and localizes accredited halal certification logos on packaged food products.

Supporting evidence: S2 spike trained YOLOv8-Nano on 1,869 images across 12 logo classes
(including Philippines1/2/3 and Invalid_logo); held-out test mAP@50 = 0.995, ~130 FPS on an
RTX 4050 laptop GPU. Feasibility confirmed; Chapter 4 must report retrained results on
locally collected photos (expected ~0.6–0.9 mAP@50), never the public-dataset figure.

### Objective 1 — Variant B ❌ REJECTED (was the NO-GO fallback; kept for record only)

> To develop a verified product directory that identifies specific products bearing valid
> halal certification, based on the curated certifying-body registry and certificate
> analysis, replacing model-based logo detection.

(No longer applicable under Variant A — no title change is needed.)

---

## 4. Abstract — fix result-tense and metric claims (C4)

### Current problematic sentence

> "Technical benchmark trials quantified model efficiency via Precision, Recall, mean
> Average Precision (50), and Character Error Rate (CER) scales, while subjective system
> validation was conducted using the System Usability Scale (SUS). The resulting metrics
> confirm that edge-optimized computer vision systems present a fast, scalable, and
> independent alternative..."

### Proposed replacement (proposal tense — until evaluation data exists)

> "Technical benchmark trials using Precision, Recall, mean Average Precision (50), and
> Character Error Rate (CER) are planned to quantify model efficiency, while subjective
> system validation is planned using the System Usability Scale (SUS). This study is
> expected to demonstrate that the integrated pipeline provides a fast and scalable
> alternative to manual verification methods."

### Also in the Abstract — align privacy claim (C3)

Replace "To protect user privacy, image processing occurs strictly inside local volatile
memory layers without retaining facial profiles or permanent footage files" with:

> "To protect user privacy, captured images are processed transiently for text extraction
> and are not stored as image files; only the extracted text and classification results are
> retained, with no facial profiles or video footage collected."

(The same replacement applies to the Executive Summary's RAM-processing sentence and the
Chapter 3 Input-Process-Output paragraph. Note: retaining extracted text is what the
current implementation does — if the team instead prefers the stronger "nothing retained"
claim, the implementation must change in a later phase, not the wording.)

---

## 5. Executive Summary — same two fixes

- Replace "image processing for feature extraction occurs strictly within local volatile
  memory (RAM); no raw camera frames ... are ever saved to permanent storage or transmitted"
  with the §4 privacy wording above (images *are* transmitted to the backend for OCR —
  state it honestly: "captured images are transmitted securely to the application's backend
  for transient OCR processing and are not stored; only extracted text and results are
  retained").
- Replace "Quantitative system performance was rigorously benchmarked ... measured before
  and after model fine-tuning" with planned/prospective tense as in §4.

---

## 6. Chapter 3 — technology corrections

1. **OpenCV:** either (a) actually adopt OpenCV preprocessing in the pipeline in a later
   phase, or (b) replace OpenCV claims with "Pillow (PIL) for image enhancement" in
   §3.1 item 2 and the Application and Logic Layer description. Current code uses PIL.
2. **"Edge-optimized" claims:** the pipeline is server-side (FastAPI backend + EasyOCR on
   CPU). Either remove "edge-optimized" throughout, or describe accurately: "a lightweight
   client-server pipeline in which the PWA captures images and a FastAPI service performs
   OCR inference."
3. **Node.js web server (§3.1 item 3):** Node.js is only the frontend build toolchain.
   Remove or reword to "Vite (Node.js-based) build tooling for the React frontend."

---

## 7. Chapter 4 (currently empty) — seed content from adviser consultation

§4.6.1 Functional Requirements should open with the adviser's five consultation comments as
FR-1…FR-5 (verbatim from the consultation form), then decompose:

- FR-1: Product verification by product name / manufacturer / ingredients against curated
  certifying-body registry.
- FR-2: Establishment certificate verification against curated certifying-body records.
- FR-3: Interactive establishment map with heatmap.
- FR-4: Flagged (haram/doubtful) E-code display with explanation on results and history.
- FR-5: Identification of specific products bearing valid halal certification (variant
  per Objective 1 decision).

§4.6.2.4 Security Requirements can now be written against the implemented baseline:
Supabase email/password authentication, JWT bearer-token enforcement on all API write
endpoints, admin-role authorization for registry mutations, and CORS restricted to the
application origin (implemented in Phase 1, backend/app/auth.py + main.py).

---

## 8. Carry-over manuscript fixes (from the initial review — do together)

- §1.7: delete leftover template instructions ("Give a minimum of fifteen...").
- Table 1 (Definition of Terms): fix the row misalignment for terms 7–16; correct "ISO/EIC"
  → "ISO/IEC" (two occurrences).
- Reference [24]: COCO dataset citation is wrong — the paper is arXiv:1405.0312, not
  arXiv:2004.12345. Re-verify references [11], [12], [17], [20], [26]–[28] before submission.
- TOC page numbers for §1.6/§1.7 and Table 2.0's checkmark rendering.
- §2.1.2 typo "HalalVErify" → "HalalVerify".

---

## Approval checklist (adviser)

| Item | Decision needed |
|---|---|
| §1.5 curated-mirror wording | Approve / revise |
| New objectives + RQs (R1, R3) | Approve / revise |
| Objective 1 variant | ✅ Decided: Variant A (YOLOv8-Nano stays) per S2 spike — adviser ratification still requested |
| Privacy wording (retains extracted text) | Approve / demand stronger implementation |
| Chapter 3 technology corrections | Approve / revise |
