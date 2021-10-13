import { Main } from './main';

// Run with URL: http://localhost:3000/test-app/dist/

declare global {
    interface Window {
        revgridTestAppMain: Main;
    }
}

if (document.readyState !== "loading") run();
// in case the document is already rendered
else document.addEventListener("DOMContentLoaded", run, { passive: true });

function run() {
    const main = new Main();
    window.revgridTestAppMain = main;
    main.start();
}
