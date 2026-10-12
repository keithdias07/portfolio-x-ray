// Single source of truth for the demo edit: shots, narration, subtitles, overlays.
export const FPS = 30;
export const DURATION = 109.5;

// ---- narration lines: start time in the final video (trimmed WAVs from vo/trim) ----
export const VO = [
  { id: 'L01', at: 0.8 }, { id: 'L02', at: 4.7 },
  { id: 'L03', at: 10.0 }, { id: 'L04', at: 14.4 },
  { id: 'L05', at: 25.5 }, { id: 'L06', at: 30.0 },
  { id: 'L07', at: 38.4 }, { id: 'L08', at: 43.5 }, { id: 'L09', at: 50.3 },
  { id: 'L10', at: 55.4 }, { id: 'L11', at: 60.9 },
  { id: 'L12', at: 67.0 }, { id: 'L13', at: 71.6 },
  { id: 'L14', at: 82.0 }, { id: 'L15', at: 90.7 },
  { id: 'L16', at: 97.6 }, { id: 'L17', at: 101.4 },
];

// subtitle cues: text per narration line, optionally split into parts (timed by character share)
export const SUBS = {
  L01: ['For a new investor, it’s hard to know\nwhere your money sits,'],
  L02: ['what risks you carry, and what to trust.'],
  L03: ['So we spoke with a chartered accountant\nabout what new investors need.'],
  L04: ['Their input shaped our requirements:', 'risk fit, a simple calculator,\nvisible tax, and financial literacy.'],
  L05: ['Investor Assistant starts with the person,\nnot the portfolio.'],
  L06: ['It asks about goals and finances,', 'then connects demo accounts\nthrough a simulated consent flow.'],
  L07: ['Then Portfolio X-Ray checks the data,\nand shows its work.'],
  L08: ['Each potential discrepancy comes with\nits evidence, and what to verify next.'],
  L09: ['A flag is a starting point,\nnot proof of an error.'],
  L10: ['It weighs your ability to take risk\nagainst your willingness,', 'and the lower one wins.'],
  L11: ['Then it explains whether your mix broadly fits.'],
  L12: ['But spotting a problem isn’t enough.', 'Understanding it matters.'],
  L13: ['Learn & Explore turns bonds, funds, risk and tax', 'into short lessons and quick quizzes.'],
  L14: ['The calculator shows a range of outcomes,', 'with inflation, and estimated tax\nwhere supported.'],
  L15: ['Explore investments compares options like', 'REITs, InvITs and government securities.'],
  L16: ['Detect. Understand. Plan.'],
  L17: ['Investor Assistant helps new investors\nask better questions about their money.'],
};

// ---- picture: B-roll shots (frames extracted at 30 fps) and app shots (take2 screencast) ----
// app shot: src = take2 time at shot start, speed = source seconds per output second
export const SHOTS = [
  { kind: 'broll', dir: 'b1', from: 0, to: 9.5, kb: [1.0, 1.08], dim: 0.55 },
  { kind: 'broll', dir: 'b2', from: 9.5, to: 16.5, kb: [1.06, 1.0], dim: 0.42 },
  { kind: 'broll', dir: 'b3', from: 16.5, to: 25.0, kb: [1.0, 1.06], dim: 0.35 },
  // Scene 3 — onboarding
  { kind: 'app', from: 25.0, to: 27.2, mark: 'welcome', off: 0.2, speed: 1 },
  { kind: 'app', from: 27.2, to: 31.7, mark: 'get-started', off: 0.1, speed: 2.31, zoom: { z: 1.12, ox: 1290, oy: 40 } },
  { kind: 'app', from: 31.7, to: 38.0, mark: 'connect', off: 0, speed: 1.46 },
  // Scene 4 — X-Ray
  { kind: 'app', from: 38.0, to: 42.0, mark: 'data-check', off: 0.1, speed: 0.85, zoom: { z: 1.12, ox: 1290, oy: 40 } },
  { kind: 'app', from: 42.0, to: 43.6, mark: 'money', off: 0.1, speed: 1.75 },
  { kind: 'app', from: 43.6, to: 50.6, mark: 'finding', off: 0, speed: 1.04, zoom: { z: 1.16, ox: 1290, oy: 40 } },
  { kind: 'app', from: 50.6, to: 55.0, mark: 'finding-mid', off: 0, speed: 1.1, zoom: { z: 1.16, ox: 1290, oy: 40 } },
  // Scene 5 — risk & suitability
  { kind: 'app', from: 55.0, to: 60.0, mark: 'reveal', off: 0.1, speed: 1, zoom: { z: 1.12, ox: 1290, oy: 40 } },
  { kind: 'app', from: 60.0, to: 63.0, mark: 'home', off: 0.1, speed: 1 },
  { kind: 'app', from: 63.0, to: 66.5, mark: 'advice-chat2', off: 0.1, speed: 0.8 },
  // Scene 6 — Learn & Explore
  { kind: 'broll', dir: 'b4', from: 66.5, to: 70.0, kb: [1.0, 1.05], dim: 0.45 },
  { kind: 'app', from: 70.0, to: 73.6, mark: 'learn', off: 0.1, speed: 2.64, zoom: { z: 1.12, ox: 1290, oy: 40 } },
  { kind: 'app', from: 73.6, to: 75.4, mark: 'lesson-open', off: 0, speed: 1.33, zoom: { z: 1.12, ox: 1290, oy: 40 } },
  { kind: 'app', from: 75.4, to: 81.5, mark: 'quiz', off: 0, speed: 1.44, zoom: { z: 1.12, ox: 1290, oy: 40 } },
  // Scene 7 — calculator + explore
  { kind: 'broll', dir: 'b5', from: 81.5, to: 83.5, kb: [1.04, 1.0], dim: 0.3 },
  { kind: 'app', from: 83.5, to: 90.5, mark: 'grow-sip', off: 0.1, speed: 2.3, zoom: { z: 1.12, ox: 1290, oy: 40 } },
  { kind: 'app', from: 90.5, to: 94.0, mark: 'reit-card', off: 0, speed: 1.43, zoom: { z: 1.12, ox: 1290, oy: 40 } },
  { kind: 'app', from: 94.0, to: 97.0, mark: 'compare', off: 0, speed: 1, zoom: { z: 1.12, ox: 1290, oy: 40 } },
  // Scene 8 — close
  { kind: 'broll', dir: 'b6', from: 97.0, to: 109.5, kb: [1.0, 1.07], dim: 0.72 },
];

export const BROLL_SOURCES = [
  { dir: 'b1', id: 7567651, file: '7567651-hd_1920_1080_25fps.mp4', title: 'Man using cellphone while holding a credit card', by: 'Ivan S', url: 'https://www.pexels.com/video/man-using-cellphone-while-holding-a-credit-card-7567651/', used: 'Scene 1 (0:00–0:09)' },
  { dir: 'b2', id: 7821854, file: '7821854-hd_1920_1080_30fps.mp4', title: 'A person explaining a document', by: 'RDNE Stock project', url: 'https://www.pexels.com/video/a-person-explaining-a-document-7821854/', used: 'Scene 2 (0:09–0:16), illustrative only' },
  { dir: 'b3', id: 8731231, file: '8731231-hd_1920_1080_25fps.mp4', title: 'People discussing while looking at the paperwork', by: 'Mikhail Nilov', url: 'https://www.pexels.com/video/people-discussing-while-looking-at-the-paperwork-8731231/', used: 'Scene 2 (0:16–0:25), illustrative only' },
  { dir: 'b4', id: 26586752, file: '11965986_1920_1080_24fps.mp4', title: 'Professional woman researching and taking notes', by: 'James Cheney', url: 'https://www.pexels.com/video/professional-woman-researching-and-taking-notes-26586752/', used: 'Scene 6 (1:06–1:10)' },
  { dir: 'b5', id: 29002861, file: '12542523_1920_1080_25fps.mp4', title: 'Financial planning with calculator and notes', by: 'Jakub Zerdzicki', url: 'https://www.pexels.com/video/financial-planning-with-calculator-and-notes-29002861/', used: 'Scene 7 (1:21–1:23)' },
  { dir: 'b6', id: 7252631, file: '7252631-hd_1920_1080_25fps.mp4', title: 'A man using smartphone', by: 'Ivan S', url: 'https://www.pexels.com/video/a-man-using-smartphone-7252631/', used: 'Scene 8 (1:37–1:49), heavily dimmed behind closing titles' },
];

export const SCENES = [
  { n: 1, name: 'The problem', from: 0, to: 9.5 },
  { n: 2, name: 'Why we built it this way (CA consultation)', from: 9.5, to: 25.0 },
  { n: 3, name: 'Meet Investor Assistant', from: 25.0, to: 38.0 },
  { n: 4, name: 'USP 1 — Explainable Portfolio X-Ray', from: 38.0, to: 55.0 },
  { n: 5, name: 'Risk profile and suitability', from: 55.0, to: 66.5 },
  { n: 6, name: 'USP 2 — Learn & Explore', from: 66.5, to: 81.5 },
  { n: 7, name: 'Calculator and Explore investments', from: 81.5, to: 97.0 },
  { n: 8, name: 'Closing', from: 97.0, to: 109.5 },
];
