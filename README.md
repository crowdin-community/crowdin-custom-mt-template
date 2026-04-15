# Crowdin Custom MT Template

A template project to quickly get started with custom **Machine Translation** provider development for Crowdin.

## Features

- Ready-to-use template for a custom MT integration
- Built on top of [`@crowdin/app-project-module`](https://crowdin.github.io/app-project-module/)
- Implements the Crowdin [Custom MT](https://crowdin.github.io/app-project-module/tools/custom-mt/) tool interface
- Includes settings low-code UI for configuration with credential validation
- Language mapping / supported-languages validation helper

## Prerequisites

- Node.js 20 or higher
- npm or yarn
- Crowdin.com or Crowdin Enterprise account

## Quick Start

1. Copy this template to a new project:
   ```bash
   cp -r boilerplate my-mt-app && cd my-mt-app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file based on `.env.example` and fill in your credentials:
   ```bash
   cp .env.example .env
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Expose the local server with ngrok (or similar) and set `URL` in `.env` to the public URL.

## Configuration

Required environment variables (see `.env.example`):

```env
PORT=3000
URL=https://your-url.ngrok.io
CROWDIN_CLIENT_ID=XXX
CROWDIN_CLIENT_SECRET=XXX
```

## What you need to implement

Open `handler.js` and fill in the three TODO sections:

1. **`configuration.name` / `identifier` / `description`** — brand your integration.
2. **`translateStrings(...)`** — call your MT provider's API and return an array of translated strings, in the same order as the input.
3. **`SUPPORTED_LANGUAGES`** — map Crowdin language codes to the codes your provider expects, and reject unsupported languages early.

`settings-form.js` defines the low-code form users see when configuring the app — adjust the fields to match the credentials your provider needs.

## Project Structure

```
├── handler.js           # Main entry point — Crowdin customMT interface + /form validation
├── settings-form.js     # Low-code UI schema for app settings
├── logo.svg             # App logo
├── package.json         # Dependencies and scripts
└── .env.example         # Environment variable template
```

## References

- [Crowdin App Project Module docs](https://crowdin.github.io/app-project-module/)
- [Custom MT interface](https://crowdin.github.io/app-project-module/tools/custom-mt/)
- [Low-code UI](https://crowdin.github.io/app-project-module/user-interface/)
- [App metadata storage](https://crowdin.github.io/app-project-module/storage/#app-metadata)

## License

MIT
