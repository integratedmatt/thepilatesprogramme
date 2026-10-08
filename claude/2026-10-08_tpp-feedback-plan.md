---
title: "TPP: plan from Sarah's 8 Oct feedback"
type: plan
client: "The Pilates Programme (TPP)"
date: "2026-10-08"
for: "Matt (reply to Sarah, priorities) and Claude Code (website changes)"
inputs:
  - "claude/2026-10-08_tpp-website-feedback-sarah.md"
  - "claude/2026-10-08_tpp-brand-voice.md"
  - "This repo at 3fe68d5, plus the live old site (still Squarespace as of today)"
---

# TPP: plan from Sarah's 8 Oct feedback

## What Sarah is actually saying

Three things, in her order of importance:

1. **The review is costing TPP days.** She did 2 hours on the homepage and Mat alone and will not repeat that for every page. She wants a smarter way, with Mat finished first as the template.
2. **The month must deliver the low-hanging fruit**, not just a website: ads, retargeting, call booking, conversion tracking, sales call optimisation, CPD retargeting of jobs board visitors. Right now none of those are live and she has said so.
3. **The copy is not them and some of it is wrong.** Old site wording is the source of truth. Several claims were invented and are misleading (qualification, 8 weeks, 80 supported hours, studios welcome cover, £5 equipment hire).

She also praised plenty: the structure, dates jump link, quiz concept, pricing clarity block, timeline visual, the approach section direction, the leak fixes. The relationship is fine. The ask is to change how the review works and to show her the non-website work is moving.

## The smarter way (what to tell Sarah)

The four lines you drafted are the right frame:

- Old website copy becomes the starting point for every page, with the SEO structure built around it.
- Her Mat notes get applied across every page as rules (certify, accreditation per course, hours, timeframes, imagery).
- One review doc shows only the changes, so she checks edits rather than re-reading pages.
- Guides, downloads and quiz results stay offline until she has signed them off.

What makes this possible: the old site is still live at www.thepilatesprogramme.co.uk (Squarespace, 21 URLs in its sitemap). Its copy can be pulled page by page into the repo as the reference text. Sarah's global rules can then be applied mechanically and enforced by the build, so she never has to catch "qualify" or "80 hours" again.

Order of truth when sources disagree: **Sarah's 8 Oct notes > old site copy > anything in the new build.** The old Mat page itself still says "5 day intensive", "£5 per hour" equipment hire and "CIMSPA Training Partner"; Sarah has overridden all three (4 days, no £5, no CIMSPA on Mat). So "lift from the old site" means lift the sentiment and sentences, then apply her corrections.

## Part A: website, in order

### A0. Today, before anything else (under an hour)

| # | Fix | Where |
|---|---|---|
| 1 | **Protect the preview.** Sarah thinks prospects may have seen it. Confirm the Vercel preview URL is not indexed and ideally password protected (Vercel deployment protection), and that no redirect from the old domain points at it. `noindex` is supported per page in `src/layouts/Base.astro`; set it site-wide for preview builds until launch. | Vercel project settings, `src/layouts/Base.astro` |
| 2 | **Course card images.** Root cause: the old site's course graphics (Mat Website Graphic, Reformer Web Graphic, etc.) are catalogued in `src/content/seed/siteImages.json` but were never downloaded into `public/images/site`, so Mat, Reformer and Barre fell back to studio photos. Pull them with `scripts/pull-site-images.mjs` and point each course's `heroImage` at the right one. | `src/content/seed/courses.json` (heroImage), `public/images/site` |
| 3 | **Certify sweep.** 158 matches for "qualif" in `src`. Replace qualify/qualifying/qualification with certify/certifying/certification everywhere TPP's courses are meant. Keep "Level 3 fitness qualification" (student's prior award) and "qualified teachers" only where it refers to teachers from any provider, and even there prefer "certified". Includes nav eyebrows "I want to qualify" / "I'm already qualified", the footer column "Qualify", the accreditation page title "Pilates Qualifications Explained", `path: "qualify"` labels, and the FAQ group "After you qualify". | `src/components/Header.astro`, `Footer.astro`, `src/pages/accreditation.astro`, `src/content/seed/*.json`, `src/pages/**` |
| 4 | **Remove "This isn't for you".** Delete the `notForYou` column from the template, drop the field from seed and the Sanity schema. Rewrite `forYou` for Mat with Sarah's four lines verbatim. | `src/components/CoursePage.astro` (line 111 block), `courses.json`, `studio/schemas/courseFields.ts` |
| 5 | **Kill the invented claims** in the Road to Certification block: "80 supported hours", "Most students finish in eight weeks alongside a job", the suggested 8-week plan, "£5 per hour" equipment hire (`equipmentHireRate: 5` in siteSettings), "Many studios welcome trainees to observe and cover", "The three exams", "plus 5 random exercises, via Zoom". Replace with: hours listed as 30 observation, 25 personal study, 25 practice teaching, completed in your own time around work and family; usually around 6 months, anywhere from 3 to 12; "the exams", all online; practical is a 45-minute class; "ask your local studio whether you can observe or hire their space". Keep the HoursBar visual (she loves the line) and studio hire. | `src/components/CoursePage.astro` lines 51, 146 to 166, `DateRow.astro` line 51, `courses.json` exams and forYou, `siteSettings.json` |
| 6 | **Accreditation per course.** The Facts block hardcodes "ITTAP via PMA · CIMSPA Training Partner" for every course. Make it a course field. Mat: "Internationally accredited by ITTAP via the Pilates Method Alliance". No CIMSPA on Mat, no Barre Fitness Alliance on Mat. Barre: BFA leads. Confirm CIMSPA for Reformer and Barre before showing it anywhere. Same hardcoding exists in the hub page and `scripts/build-llms.mjs`. | `CoursePage.astro` line 55, `become-a-pilates-instructor/index.astro` line 44, `AccreditationStrip.astro`, `siteSettings.json` accreditationStatements, `build-llms.mjs` line 30 |
| 7 | **Location.** The Facts block hardcodes "Altrincham, Greater Manchester" and the Mat page says "What is Mat" is in Altrincham. Change to "Most courses run at our Altrincham training centre; around half a dozen a year run elsewhere in the UK and abroad. See dates." Keep Manchester in page titles and meta for SEO (that is where the search demand is) but never in a sentence that claims all training is there. | `CoursePage.astro` line 54, `courses.json` answerSummary and seo, `siteSettings.json` tagline |
| 8 | **Build guard.** Extend `scripts/check-banned-terms.mjs` so the build fails on: qualif (outside the allowlist), "80 hours", "supported hours", "eight weeks", "8-week", "isn't for you", "Zoom", "random exercises", "welcome trainees", "£5". This turns Sarah's rules into a test and is what lets you promise she will not see them again. | `scripts/check-banned-terms.mjs`, `scripts/banned-terms.allowlist.json`, `tests/unit/banned-terms.test.mjs` |

### A1. Pull the old copy in (half a day, mostly automated)

- Script: fetch each URL in the old sitemap, strip Squarespace markup, save as `content/old-site/<slug>.md` with the page's headings intact. Commit it. This is the reference Sarah keeps pointing at and it should live next to the code.
- Also pull the hundreds of course photos she mentioned once she shares the Drive folder; the old homepage had them at the bottom and the new "Why train with us" tiles need people in them.

### A2. Mat page, rebuilt from the old copy plus Sarah's notes (one day)

Mat is the template. Every change here becomes a rule for the other pages.

- Hero: Mat video (waiting on Sarah's re-upload; only Advanced came through). Until then a Mat photo, not equipment.
- Outcome line: "Training across the full spectrum of Pilates, from contrology and classical through to contemporary." Certify, not qualify.
- Facts: 4 in-person days (she confirmed 4; the old page says 5, ignore it), hours listed individually, location per A0.7, accreditation per A0.6, prerequisite "No prior certification needed. You should have practised mat Pilates regularly before you train with us" with hours to follow from Sarah.
- This is for you: her four lines. No second column.
- Curriculum: lift from old site. Add "Modifying for injuries and special populations" and "Delivering one-to-one sessions and group classes that cater to all abilities". Teaching skills heading "HUMAN MOVEMENT: anatomy and physiology".
- Included: remove the workshops item (already in the curriculum table), move the remaining item up.
- Road to Certification: per A0.5. Mention ongoing personal study after the exam.
- Trainers: photos (ask for headshots, or use the old site's).
- Pricing: block is clear but appears three times. Keep the main block and the sticky bar, drop the third. The "pricing breakdown including cost per hour" page (`src/pages/pricing.astro`) confused her; tighten to one table and move the per-hour maths behind a disclosure or remove it.
- "What this course unlocks": correct images.
- Dates jump link: keep.
- Tone pass: run the result through the brand voice guide and the anti-AI writing skill before she sees it.

### A3. Homepage (half a day)

- **Fonts.** This is why it "looks like PFCA". The display face is Acumin Pro via Adobe Fonts but `PUBLIC_TYPEKIT_ID` is empty, so every heading falls back to Helvetica/Arial. The old site loads a Typekit kit (`typekit.net/ik/GnCa1F2Rzo…`) plus Poppins. Get the kit ID from their Squarespace or Adobe account, set it in Vercel, and the brand typography appears. Check the licence covers the new domain.
- Hero copy: keep "small cohorts and coaching at our Altrincham training centre". Replace "a method that covers every tradition" with the full-spectrum line. "Every tradition" tile on the homepage gets the same treatment. Keep the "Not contemporary only. Not classical only." section, which she loves.
- Hero video: she finds the current loop dark and masculine. Offer two routes: re-cut the same professional footage to lighter, people-forward moments, or a muted montage from their course photos until new footage exists. Her call.
- "Why train with us" tiles: swap the three empty-room photos for photos with students in them (from the Drive folder).
- Nav CTA: "Book a call" once Cal.com is embedded (Part B). Until then leave "Book a course" rather than a dead link.
- "Read our approach" page: lift the old About copy and the reel Sarah is sending; add a photo of Sarah and Georgie.
- Course summaries: Mat certify; Reformer "classical and contemporary repertoire" (no contrology); Barre opens with "the UK's only school accredited by the Barre Fitness Alliance" and restores the old wording.
- Quiz: keep the mechanic, replace the questions with Sarah's when they arrive. Question 2 ("Where do you want to teach?") contradicts their USP that graduates can teach anywhere. Fix the results page layout now.

### A4. Apply the rules across every other page (one day, mostly mechanical)

Reformer, Barre, Advanced Reformer, Chair, Cadillac, Barrels, bundle, CPD, FAQs, the hub page, road-to-certification, pricing, accreditation, jobs, blog. Same rules, old copy as the base. Specific landmines already found:

- `src/pages/become-a-pilates-instructor/road-to-certification.astro` is built entirely around an 8-week plan and "three to four months". Rewrite around 3 to 12 months, usually 6.
- `src/content/seed/posts.json`: the blog post "Completing your 80 practice hours: an 8-week plan" must be unpublished or rewritten; it also has a redirect and SEO title.
- `src/content/seed/faqs.json` lines 64, 72, 80: three exams with five random exercises, "around eight weeks", "You do not need a qualification".
- `src/pages/become-a-pilates-instructor/index.astro` lines 30, 35, 44, 107: Manchester claim, Zoom, CIMSPA, "all three exams".
- Jobs board: `src/pages/jobs/post.astro` and `jobs/index.astro` say "List a role, free". Change the copy now; the paid mechanism is Part B.
- Free guide bullets in `siteSettings.json`: "The real total cost of qualifying" and "How the 80 practice hours fit…" become "certifying" and "How the practice and study hours fit around a job and a family".

### A5. Review doc for Sarah (an hour, generated)

One document, page by page, showing only what changed: old sentence, new sentence, why (her rule or a fact she gave). Nothing else. She reads diffs, not pages. Generate it from git (old copy vs new) rather than writing it by hand so it stays accurate as pages change.

### A6. Gated until sign-off

Nothing here goes live or gets emailed until Sarah and Georgie have read it:

- The Pilates Teacher Career Guide PDF (`freeGuide.fileUrl` is still empty, so nothing is being sent yet; keep it that way).
- The Roadmap to Certification guide ("wildly inaccurate", rewrite from scratch after A2).
- The practice hours guide (never mention 80).
- Quiz questions and results copy.
- Any email sequence attached to downloads.

## Part B: the low-hanging fruit (what the month is for)

This is the list Sarah wants to see. Put it in front of her with owners and status, today.

| Item | Status now | Matt does | TPP does |
|---|---|---|---|
| Book a call | Not live; nav says Book a course | Embed Cal.com, switch the CTA, add a `book_call` data-layer event | Sarah connects her calendar, sets availability and call length |
| Email capture into Arketa | Code only knows Kit or log (`src/lib/server/leads.ts`); `LEAD_PROVIDER` unset | Add an Arketa provider (check Arketa's API or Zapier/webhook route), tag by path and source page | Confirm Arketa account access and which list or tag |
| Conversion tracking | GTM container live, consent mode in place, events pushed from the site | Configure GA4 conversions and Meta pixel plus CAPI against book_click, lead_submit, quiz_complete, job_apply_click; verify in GA4 debug | Grant GA4, Meta Business Manager and GSC access |
| Retargeting | Nothing running | Build audiences: site visitors, course page viewers, quiz completers, jobs board visitors (for CPD) | Approve audiences and budget |
| Ads | No ads, no brief | Write the video content brief for the main ads (hooks, scenes to film, lengths), build the first campaign structure | Film to the brief, approve creative |
| Sales call optimisation | Not started | Call structure and follow-up sequence once Book a call is live | Share current call notes or a recording |
| Paid jobs board | Says free | Decide the mechanism (Stripe Checkout before the job form, or an invoice-and-approve flow using the existing approve/decline emails). Update the GA4 handoff which assumes free. | Confirm price per listing |

Suggested sequencing: Cal.com and the Arketa lead route first (both small, both unblock sales), tracking second (ads are blind without it), then audiences, then the ads brief. None of this waits on website copy.

## Open questions for Sarah (keep it to these)

1. Adobe Fonts / Typekit kit ID, or whoever set up the Squarespace fonts.
2. Prior mat practice hours expected before Mat training.
3. Should CIMSPA appear on Reformer or Barre pages at all?
4. Current studio hire rate for practice hours (old site says £25 per hour).
5. Hero video: re-cut the existing footage, or a photo montage until new footage exists?
6. Quiz questions, the reel, the course videos (Mat, Reformer, Barre) and the Drive photo folder.
7. Price per paid jobs listing.

## Suggested reply to Sarah (WhatsApp, short)

> Sarah, thanks for doing that, and sorry it landed as a week of review. That was never the intention and it stops here. I don't need you to go through Reformer or anything else page by page.
>
> Here's the smarter version. Your old website copy becomes the starting point for every page, with the new structure built around it. Everything you flagged on Mat (certify, accreditation per course, the hours, the timeframes, the images, no "isn't for you") becomes a rule applied to every page, and I've put a check in the build so those things can't creep back in. You'll get one document showing only the changes, old line next to new line, so you can check edits in minutes rather than re-read pages. Guides, downloads and the quiz stay offline until you've signed them off.
>
> Separately, the website is not the month. Today I'll send you a two-column list, mine and yours, covering Book a call, emails into Arketa, tracking, retargeting audiences, the ads video brief and the paid jobs board, with where each one is. First two are Book a call and Arketa, this week.
>
> Preview is being locked down today so no one sees it until you're happy. And WhatsApp video is fine, no need for Loom.

## Notes for whoever does the website work

- Production content source: check whether Vercel has `PUBLIC_SANITY_PROJECT_ID` set. If it does, the seed JSON edits must be imported into Sanity (`npm run seed:ndjson` then `sanity dataset import`), or edited in the Studio directly. If not, the seed JSON is live content.
- Run `npm run build` after every batch; postbuild already fails on banned accreditation terms and SEO basics, and A0.8 widens that net.
- Write all copy in UK English and in the voice guide's register, then run the anti-AI pass. The voice guide's claims rules are the checklist.
