# SONATA

**Live demo:**

**The competitive league for musicians.** Sign in, pick up your instrument, and play the season's piece into your mic. SONATA listens, scores every note as you play it, and puts you on the path from Beginner to the global ranking.

## What it is

SONATA is a **virtual league for instrumentalists**. Players join one of two stages, **Classical** or **Contemporary**, play a set piece live, and are **scored note by note** on pitch while they play. No studio and no audition: if you can play it, you can compete.

## Why it exists

It exists for the musicians who want to hone their skills with people around the world in a fun, heavily competitive environment. It exists for the people who want to dust off their instruments and get back to playing music after their time in school. Athletes and gamers have leagues, ladders and seasons. Musicians mostly practice alone, with nothing to measure against and nobody to play for. SONATA gives practice **a score, a rank and an opponent**, using nothing more than the mic already in your laptop.  

## How it works

1. Create an account with email or Google.
2. Run the sound check so SONATA can hear your instrument.
3. Play the piece: notes scroll toward the line and you play them as they arrive.
4. Get scored live on every note, with a final score and a note-by-note result at the end.
5. Climb: instrument level goes **Beginner → Intermediate → Professional**, and from Intermediate you enter the global ranking at **Developing → Established → World-Class**.

## What we built (specifics)

- **Accounts:** email and password or **Continue with Google** through Supabase Auth. Every new player gets a profile row automatically, starting as a Beginner and unranked. The play pages are for signed-in players only.
- **Sound check:** picks your microphone, shows the input level and the note it hears, and confirms three things before you play: microphone allowed, sound coming through, note recognised.
- **Live play screen:** a scrolling note lane drawn on a canvas, a count-in with a metronome, your pitch traced over the target notes in real time, and a running score. Timing runs off the audio clock so the lane and the sound stay together.
- **Scoring that follows the player:** pitch is judged to within half a semitone in **any octave**, so the same piece works for a low voice, a violin or a trumpet. The scorer also follows a player who drifts ahead of or behind the beat instead of failing every note after the first slip. Calibrated against a real recording of the piece.
- **An original piece:** "Decay and Destruction", written by the team for the Classical stage and stored as readable bar-by-bar data, so adding the next piece is a few lines.
- **Player profile:** player name, instrument level, global ranking and sign-in method.
- **The league around it:** an animated hero, how-it-works and ranking ladder, Classical and Contemporary stage pages with their own colors, and this week's match cards.
- **MVP boundaries:** play is solo for now. Ensembles, matches and season dates on the site are sample data, results are not saved between sessions yet, and the Schedule and Leaderboard pages are marked "Coming soon".

## Tech

Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, Supabase (Postgres + Auth with row-level security), the Web Audio API with [pitchy](https://github.com/ianprime0509/pitchy) for pitch detection, deployed on **Vercel**.

## What to know

- **All audio stays in the browser.** The mic is analyzed on your device; nothing is recorded or uploaded.
- The mic only works on `localhost` or an `https` address, which is how browsers protect microphone access.
- **Headphones help:** keep the metronome and any backing sound out of the mic so it only hears you.
- Database tables, access rules and sign-up triggers are in `supabase/schema.sql`, which can be run again safely.

