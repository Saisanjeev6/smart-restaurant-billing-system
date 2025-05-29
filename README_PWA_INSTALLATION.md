
# Installing Gastronomic Gatherer as a Progressive Web App (PWA)

Gastronomic Gatherer is built as a Progressive Web App (PWA), which means you can "install" it on your computer or mobile device for a more app-like experience. This typically adds an icon to your home screen or app drawer, and the app may open in its own window without browser navigation bars.

## Prerequisites

*   **Secure Connection (HTTPS)**: For the install prompt to appear reliably, the application must be served over HTTPS. This is standard for deployed web applications. When testing locally on `http://localhost`, some browsers might still offer an install option for development purposes.
*   **Compatible Browser**: Most modern browsers support PWA installation. Common examples include:
    *   **Desktop**: Google Chrome, Microsoft Edge, Brave.
    *   **Mobile**: Google Chrome (Android), Safari (iOS), Samsung Internet (Android).

## How to Install

The exact steps can vary slightly depending on your browser and operating system.

### On Desktop (e.g., Chrome, Edge)

1.  **Navigate to the App**: Open your browser and go to the URL where Gastronomic Gatherer is hosted.
2.  **Look for an Install Prompt/Icon**:
    *   Often, an **install icon** (it might look like a computer screen with a down arrow, or a plus symbol) will appear in the **address bar** on the right side. Click this icon.
    *   Alternatively, open the browser's main **menu** (usually three dots or lines in the top-right corner). Look for an option like "**Install Gastronomic Gatherer...**", "**Add to Home Screen**", or "**Apps**" > "**Install this site as an app**".
3.  **Confirm Installation**: A dialog box will likely appear asking you to confirm the installation. Click "Install" or "Add".
4.  **Access the App**: Once installed, you should find Gastronomic Gatherer in your computer's list of applications (e.g., Start Menu on Windows, Launchpad on macOS). It might also create a desktop shortcut.

### On Mobile Devices

#### Android (e.g., Chrome)

1.  **Navigate to the App**: Open Chrome and go to the URL of Gastronomic Gatherer.
2.  **Look for an Install Prompt or Menu Option**:
    *   You might see a pop-up banner at the bottom of the screen prompting you to "Add Gastronomic Gatherer to Home screen."
    *   If not, tap the browser's **menu icon** (usually three dots).
    *   Look for an option like "**Install app**" or "**Add to Home screen**".
3.  **Confirm Addition**: Tap "Add" or "Install" in the confirmation dialog.
4.  **Access the App**: An icon for Gastronomic Gatherer will be added to your phone's home screen or app drawer.

#### iOS (Safari)

1.  **Navigate to the App**: Open Safari and go to the URL of Gastronomic Gatherer.
2.  **Tap the Share Icon**: This is the icon that looks like a square with an arrow pointing upwards, usually at the bottom of the screen.
3.  **Find "Add to Home Screen"**: Scroll through the options in the share sheet and tap on "**Add to Home Screen**".
4.  **Confirm Name and Add**: You can customize the name that appears under the icon if you wish. Then, tap "**Add**" in the top-right corner.
5.  **Access the App**: An icon for Gastronomic Gatherer will be added to your iPhone's or iPad's home screen.

## Notes

*   **Updates**: PWAs typically update automatically in the background when you re-open them and a new version of the web app is available.
*   **Offline Capability**: The current version of Gastronomic Gatherer has a very basic service worker primarily to enable installation. True offline functionality (like accessing data or placing orders while offline) would require more advanced service worker caching strategies.
*   **Permissions**: The app might ask for certain permissions (like notifications) if those features are implemented in the future.

Enjoy using Gastronomic Gatherer as an installed app!
