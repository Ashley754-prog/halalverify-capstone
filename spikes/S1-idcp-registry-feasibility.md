# Spike S1 — IDCP Registry Data Feasibility Memo

**Date:** 2026-08-16
**Question (Q1 from requirements review):** Can the "verify against the halal certifying body's database" requirement (adviser comments R1/R2) be satisfied with real data, and how?

## What was checked

The IDCP (Islamic Da'wah Council of the Philippines) is the primary recognized halal certifying body in the Philippines and the one named in the manuscript §1.5.

- Official site: https://www.idcphalal.org/
- Public registry page: https://www.idcphalal.org/certified-product-page — titled "IDCP HALAL CERTIFIED CLIENTS & REGISTERED PRODUCTS"

## Findings

1. **A public registry exists, but it is file-based, not a database/API.** The certified-product page is a Google Sites page whose records are delivered via *embedded files* (most likely PDF or document viewer embeds). No product records are rendered in the page HTML itself, no search UI, no CSV/JSON download, no public API.
2. **No API exists** (as far as the public site shows). Any integration will be manual or semi-automated file processing, not live lookup.
3. **[Uncertain — requires manual step by the team]** The exact fields inside the embedded files are unknown until someone opens the page in a browser and downloads the file(s). Expected fields based on the page title: client/company name and registered product names. Certificate numbers and expiry dates are **not confirmed** to be included — this materially affects R2 (certificate-number matching), so verify first.

## Recommended approach (pending adviser sign-off)

**Curated mirror with visible provenance** — the approach to propose to the adviser:

1. Team downloads the IDCP certified-clients file(s) at a recorded date.
2. Records are manually encoded into Supabase (`products`, `manufacturers`, `establishments`) with mandatory metadata columns: `source` ("IDCP published list"), `source_url`, `synced_at`.
3. The app displays provenance on every registry record ("Sourced from IDCP published list, synced 2026-XX-XX") so users never mistake the mirror for a live check.
4. Re-sync cadence: monthly (manual) until a better source appears.

This satisfies the spirit of R1/R2 ("verify in their databases") while remaining honest about being a periodically synced copy — and it is the only technically feasible reading given no API exists.

## Go/No-Go

- **Conditional GO** for the curated-mirror approach.
- **Blocking action before Phase 2:** a team member opens the certified-product page, downloads the embedded file(s), and records: (a) file format, (b) fields per record, (c) approximate record count, (d) whether establishment certificates (not just products) are listed. Fill the table below and attach the file sample to this memo.

## Field availability (team to fill after downloading)

| Field needed | Present? (Y/N/Partial) | Notes / example |
|---|---|---|
| Product name | — | |
| Company / manufacturer | — | |
| Certificate number | — | |
| Expiry date | — | |
| Certifying body | — | |
| Establishment/facility name | — | |
| Address / location | — | |
| Approx. total records | — | |

## Fallbacks if the file is unusable

- **Fallback A:** Contact IDCP through the site/official Facebook page and request a machine-readable list for academic use (capstone endorsement letter from WMSU helps).
- **Fallback B:** Start with a small adviser-approved sample (e.g., 50 products photographed from local stores + their certificates) and label the registry clearly as a partial sample dataset.
- **Fallback C:** For establishments, the local halal ordinance office / city government may hold a register of halal-certified establishments in Zamboanga City — worth one visit; would also supply coordinates for the map (R3).

## Sources

- IDCP official website — https://www.idcphalal.org/
- IDCP Certified Clients & Registered Products page — https://www.idcphalal.org/certified-product-page
- IDCP Contact Us (Manila HQ address, phones, email) — https://www.idcphalal.org/contact-us

---

## Appendix — Delivery & interview script (added 2026-08-19)

**IDCP has NO branch office.** Only HQ: Suite 400–410 FUBC Building, 413 Escolta St.,
Binondo, Manila 1006. Mon–Fri 9AM–5PM. Tel (02) 8242-9394 / (02) 8245-8456.
Email: inquire@idcphalal.org. Facebook: facebook.com/IDCPHalal.org.

**Delivery plan for the request letter:** (1) email scanned signed PDF to
inquire@idcphalal.org with the letter text in the email body too; (2) message the official
Facebook page with a one-paragraph summary; (3) phone follow-up after 5 working days.
Keep all responses — they become Chapter 4 §4.4 Data Gathering appendix evidence.

**Elevator pitch (use first, in person or on the phone):**
"We are WMSU IT students developing a mobile app that helps consumers check if a product
is halal: the app reads the ingredient label with the phone camera, checks food additive
codes against a database, and recognizes halal certification logos. We are asking IDCP's
permission and help so our app's product and establishment records match your official
certified list."

**Questions (in order):**

1. Is your office the one that maintains the official list of halal-certified products and
   companies in the Philippines? **If not — who does?** (verification of our core assumption)
2. Is the certified clients/products list shown on your website the latest version?
   When was it last updated?
3. May we request a softcopy (Excel or PDF) of the certified clients and registered products
   list for our research? What is the process or requirement?
4. Do you keep a register of halal-certified **establishments** (restaurants, stores) in
   Zamboanga City or Region IX, with certificate numbers and validity dates?
5. Is there a way to verify a certificate number with your office — by phone, email, or in
   person? (This is the adviser's R2 requirement.)
6. May we use the official IDCP halal logo image in our research and app for detection
   purposes? Are there guidelines we should follow?
7. For LOCAL Zamboanga establishment data, who else should we approach — the city
   government's halal ordinance office, or the regional Muslim affairs office?
8. May we know your name and designation for citation in our research?
   (records the key-informant for Chapter 4)

**Interpreting answers:**
- Q1–3 "yes + here's the file" → fill the field table above; Phase 2 data GO.
- "website is current" → use the website file; record the sync date; letter response still
  goes in the appendix.
- Redirected elsewhere → follow the referral; Fallbacks B/C below still apply.
- No response after 2 follow-ups → switch to Fallback C (city hall) for establishments and
  Fallback B (sample dataset from stores) for products; note the attempt in the paper.
