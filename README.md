# Dispatch

A minimal always-on-top chat window for talking to Claude.

## Setup

```bash
npm install
cp .env.example .env   # then paste your Anthropic API key into .env
npm start
```

## Use

- Press **Ctrl+Shift+Space** (or **Cmd+Shift+Space** on macOS) to show/hide the window from anywhere.
- Or click the Dispatch icon in your system tray/menu bar.
- Type a message, hit Enter, get a response below the input.

Closing the window just hides it — quit via the tray menu's "Quit" item.

## Also in this repo

- [`quotidian/`](quotidian/) — a quotes app (Expo / React Native) built with the Replica skill pack.
- [`.claude/skills/`](.claude/skills/) — the [Replica](https://github.com/Jakeschincariol/replica-skill) skills (MIT), installed for this project.
