# Deploy SkillLens

The frontend is hosted on GitHub Pages; resume analysis requires the Flask API
to run separately.

## Deploy the API to Render

1. In Render, choose **New → Blueprint** and connect the `SkillLens` GitHub
   repository. Render will detect the root `render.yaml`.
2. Before deploying, enter your Gemini API key for the `GEMINI_API_KEY`
   environment variable in Render. Keep this key private; do not commit it or
   add it to GitHub Pages.
3. Deploy the `skilllens-api` web service. Wait until its `/api/health` check
   reports healthy, then copy its public service URL (for example,
   `https://skilllens-api.onrender.com`).

## Connect GitHub Pages to the API

1. In GitHub, open **Settings → Secrets and variables → Actions → Variables**
   for this repository and add a repository variable named
   `VITE_API_BASE_URL`. Set its value to the Render service URL, without a
   trailing slash.
2. Re-run the **Deploy to GitHub Pages** workflow, or push a new commit to
   `main`. The build embeds this public API URL into the frontend.
3. Open `https://shriyash-kurud.github.io/SkillLens/` and test resume analysis.

The Pages build cannot analyze resumes until the API is deployed and the
`VITE_API_BASE_URL` variable is set.
