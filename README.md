# LifeOS

LifeOS is a web app integrating all features you need to manage all aspects of your life, such as tasks, calendar events, notes, habits and water and food logging, very helpful as it integrates all stuff that’s usually scattered throughout tons of apps and website. 

## Features

- Dashboard summary with quick actions for every feature
- Tasks with tags and status tracking
- Events and a calendar overview
- Habits with daily tracking and heatmap history
- Hydration and food logging
- Notes with a md text editor
- Timers (pomodoro, countdown, stopwatch) with session history
- Global search across everything

## Tech stack

- Next.js 16 (App Router) + React 19
- Convex for database
- Clerk for auth
- Tailwind + shadcnui

# Build Steps

### Prerequisites

- Node.js 20+ (or Bun if you like speed)
- Convex CLI (via `npx convex` or `bunx convex`)
- You will need to create a [convex.dev](https://convex.dev) account and an empty project, running convex in the cli will create the schema and also add the .env values.
- You will also need a [clerk.com](https://clerk.com) account and after that follow these steps
    - Create an application in Clerk (choose email address for sign in methods)
    - Create a JWT template from the clerk dashboard
        - select new template and then select convex
    - Get the Issuer url and add it in .env as `CLERK_FRONTEND_API_URL`
- you can also follow this guide for setting up the clerk account and project: https://clerk.com/docs/guides/development/integrations/databases/convex

### Environment variables

The .env file should look like this:

```
CONVEX_DEPLOYMENT=your_convex_deployment
NEXT_PUBLIC_CONVEX_URL=your_convex_deployment_url
CLERK_FRONTEND_API_URL=your_clerk_frontend_api_url
CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
```

### Install and run

```
npm install
npx convex dev
npm run dev
```

Then open `http://localhost:3000`

## Build

```
npm run build
npm run start
```

# Deploy Steps

1. Deploy Convex functions and database:
    
    ```
    npx convex deploy
    ```
    
2. Set `NEXT_PUBLIC_CONVEX_URL` to the deployed Convex URL.
3. Deploy the Next.js app (Vercel or any Node host).
    - I prefer vercel for this as it’s the easiest to use for this tech stack:
        - clone the project under your github account
        - go to [vercel.com](http://vercel.com)
        - create a new project
        - select the one from github
        - add the env variables
        - click deploy

# Notes

I am using the development mode for clerk, as you need your own domain for production, which i dont own, but development should be fine, as its fully working. Other than that everything should be fine, some UI improvements can be made in some places but all features should work properly.


# Photos

<img width="1782" height="1067" alt="image" src="https://github.com/user-attachments/assets/4d215937-9e23-496e-97b7-d08984c778eb" />
<img width="1782" height="1068" alt="image" src="https://github.com/user-attachments/assets/17663325-42f7-440a-90c9-67270633c89e" />
<img width="1776" height="1067" alt="image" src="https://github.com/user-attachments/assets/40ec6d60-a90e-4596-92f1-917a75878d7c" />
<img width="1777" height="1070" alt="image" src="https://github.com/user-attachments/assets/b53fc984-c438-4d54-beee-1c4eefbeea1a" />
<img width="1777" height="1069" alt="image" src="https://github.com/user-attachments/assets/08d797e9-18ba-4266-803e-dd7554294d9b" />
