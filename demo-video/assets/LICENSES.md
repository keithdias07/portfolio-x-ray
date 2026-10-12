# Third-party assets and licences

## Stock video (Pexels)

Licence: **Pexels License** (https://www.pexels.com/license/), checked on 12 Oct 2026:
- Free to use; attribution not required; modification allowed.
- Not allowed: showing identifiable people in a bad light or offensively; implying endorsement of a product by people in the imagery;
  selling unaltered copies; redistributing on other stock platforms; using in a trademark.

How we comply: clips are edited (cropped, dimmed, slow zoom, overlaid text); nobody is shown in a bad light; the consultation
footage (hands and documents only) is labelled on screen as *“Illustrative stock footage — not our actual meeting”*; nobody in the
footage is presented as our chartered accountant or as endorsing the product.

| Used in | Pexels ID | Title | Creator | Source page | File downloaded |
|---|---|---|---|---|---|
| Scene 1 (0:00–0:09) | 7567651 | Man using cellphone while holding a credit card | Ivan S | https://www.pexels.com/video/man-using-cellphone-while-holding-a-credit-card-7567651/ | 7567651-hd_1920_1080_25fps.mp4 (served as 1280×720) |
| Scene 2 (0:09–0:16) | 7821854 | A person explaining a document | RDNE Stock project | https://www.pexels.com/video/a-person-explaining-a-document-7821854/ | 7821854-hd_1920_1080_30fps.mp4 |
| Scene 2 (0:16–0:25) | 8731231 | People discussing while looking at the paperwork | Mikhail Nilov | https://www.pexels.com/video/people-discussing-while-looking-at-the-paperwork-8731231/ | 8731231-hd_1920_1080_25fps.mp4 (served as 1280×720) |
| Scene 6 (1:06–1:10) | 26586752 | Professional woman researching and taking notes | James Cheney | https://www.pexels.com/video/professional-woman-researching-and-taking-notes-26586752/ | 11965986_1920_1080_24fps.mp4 |
| Scene 7 (1:21–1:23) | 29002861 | Financial planning with calculator and notes | Jakub Zerdzicki | https://www.pexels.com/video/financial-planning-with-calculator-and-notes-29002861/ | 12542523_1920_1080_25fps.mp4 |
| Scene 8 (1:37–1:49) | 7252631 | A man using smartphone | Ivan S | https://www.pexels.com/video/a-man-using-smartphone-7252631/ | 7252631-hd_1920_1080_25fps.mp4 (served as 1280×720) |

## Music

Original ambient pad synthesised for this video with FFmpeg (`aevalsrc` sine chords, low-pass, echo). No third-party music is used.
(A Mixkit track was considered but not used because its music licence text could not be read and checked.)

## Voice

Narration: Microsoft neural voice **“Andrew” (en-US-AndrewMultilingualNeural)**, generated on 12 Oct 2026 with the open-source
`edge-tts` Python package, which calls the online text-to-speech service behind Microsoft Edge's Read Aloud. No account or API key
was used. **Licensing caveat:** Microsoft doesn't publish terms that explicitly cover using Read Aloud output in a public video.
For a fully licensed version, re-generate the same lines with Azure AI Speech (same voice; the free F0 tier is enough) using
`project/vo/azure-tts.ps1`, or record a team member reading `voiceover-script.txt`.

An earlier draft used the offline Windows voice “Microsoft Heera (en-IN)” (`project/vo/tts.ps1`); it was replaced because it
sounded too robotic.

## App footage and icon

Screen capture of our own prototype (Investor Assistant). The end-card sprout icon is the app's own logo, the Lucide “sprout”
icon (ISC licence).
