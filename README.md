# Vocamira

Vocamira is a web-based English vocabulary learning app built around short, focused study sessions and interactive quizzes.

## Live Demo

[Open Vocamira](https://iamyunusemreozgel.github.io/Vocamira/)

## Features

- Definition Quiz mode
- Fill in the Blank mode
- CEFR-based difficulty filters: Beginner, Intermediate, Advanced, and Mixed
- Adjustable quiz lengths: 10, 20, 30, or 50 questions
- Category-based vocabulary filtering
- All Words, Unseen Words, and Weak Words pools
- Automatic weak-word detection based on user performance
- Instant correct and incorrect answer feedback
- Quiz results and learning progress tracking
- User authentication and cloud progress storage with Supabase
- Profile dashboard with games played, total questions, accuracy, and practised words
- Performance statistics by quiz mode
- Recommended words to review
- Responsive mobile-first interface
- Installable Progressive Web App shell
- Basic offline support through a service worker

## How Weak Words Work

A word is considered weak when the user has answered it incorrectly more often than correctly:

```text
wrong answers > correct answers
```

Correct answers are calculated across both quiz modes.

## Tech Stack

- HTML5
- CSS3
- Vanilla JavaScript
- Supabase Authentication and Database
- Progressive Web App APIs
- GitHub Pages

## Project Structure

```text
Vocamira/
├── index.html
├── manifest.webmanifest
├── service-worker.js
├── offline.html
├── Pages/
│   ├── game.html
│   ├── study.html
│   ├── profile.html
│   ├── login.html
│   └── how-it-works.html
├── assets/
│   ├── css/
│   ├── images/
│   └── js/
└── data/
    └── words.json
```

## Running Locally

The vocabulary data is loaded with `fetch`, so the project should be served through a local web server rather than opened directly from the file system.

Using VS Code, you can run the project with the **Live Server** extension and open `index.html`.

You can also use another static server, for example:

```bash
python -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

## PWA Installation

Vocamira can be installed on supported phones and computers.

On iPhone:

1. Open the live site in Safari.
2. Tap the Share button.
3. Select **Add to Home Screen**.
4. Enable **Open as Web App** when available.
5. Tap **Add**.

## Current Status

Vocamira is under active development. The core study, quiz, authentication, progress tracking, profile statistics, weak-word logic, and initial PWA shell are available.

## Planned Improvements

- Dedicated PNG app icons for broader PWA compatibility
- Push notifications and daily study reminders
- Spaced repetition scheduling
- Daily challenges and streaks
- More detailed progress charts
- Achievements and learning milestones
- Expanded vocabulary content
- Improved offline support

## Author

Developed by [Yunus Emre Özgel](https://github.com/IamYunusEmreOzgel).
