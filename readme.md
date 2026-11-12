# Emma Herms - Portfolio Website

🌐 **Live Site**: [https://emmaherms.com/](https://emmaherms.com/)

A personal portfolio website for Emma Herms. This interactive website showcases Emma's publications, ongoing research projects, and science communication work using immersive 3D visualizations.

## Main Technologies Used

- **Three.js** - 3D graphics and WebGL rendering
- **Firebase** - Hosting and analytics

## Setup / run locally

Install the current **LTS** version of [Node.js](https://nodejs.org/en/download/), then
close and reopen PowerShell or your terminal so the Node.js installation is added to
your `PATH`. Verify that both Node.js and npm are available:

``` bash
node --version
npm --version
```

If PowerShell reports that `node` is not recognized, Node.js is either not installed
or the terminal was opened before it was installed. Reinstall Node.js with the
default options, reopen the terminal, and run the version checks again.

Run these commands from the project directory:

``` bash
# Install dependencies (only the first time)
npm install

# Run the local server at localhost:8080
npm run dev

# Build for production in the dist/ directory
npm run build
```
