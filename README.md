# Gesture Mario (Web, Vercel-ready)

This repo is a rewrite of the original Python/OpenCV project into a **static web app**:

- Hand tracking runs **in the browser** using **MediaPipe Hands**
- A simple Mario-like runner game runs on an HTML5 `<canvas>`
- Hosting works on **Vercel** (no server required)

## Run locally

Camera access requires **https** or **localhost**.

From the repo root:

```bash
python -m http.server 8000
```

Open:

- `http://localhost:8000/`

Click **Start camera + game**, allow camera permissions, then jump with:

- **Open hand** gesture
- **Space** / **Arrow Up**

## Deploy on Vercel

1. Push this repo to GitHub
2. In Vercel: **New Project** → Import your repo
3. Framework preset: **Other**
4. Build command: **None**
5. Output directory: **/** (repo root)

Vercel will serve `index.html` at the root automatically.


