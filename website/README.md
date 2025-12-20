# NomadWay Website

A modern, high-conversion landing page for the NomadWay travel app built with React, Vite, and Tailwind CSS.

## 🚀 Features

- **Glassmorphism UI** - Modern frosted glass design aesthetic
- **Framer Motion Animations** - Smooth, professional transitions
- **Responsive Design** - Works on all device sizes
- **Analytics Dashboard** - Track visits and downloads
- **Dark Theme** - Easy on the eyes, matching the app's dark mode

## 📦 Tech Stack

- **React 18** - UI library
- **Vite** - Lightning-fast build tool
- **Tailwind CSS** - Utility-first styling
- **Framer Motion** - Animation library
- **Recharts** - Analytics charts
- **React Router** - Client-side routing

## 🛠️ Development

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
cd website
npm install
```

### Running locally

```bash
npm run dev
```

The site will be available at `http://localhost:3000`

### Building for production

```bash
npm run build
```

The built files will be in the `dist` folder.

## 📊 Pages

### Landing Page (`/`)

- Hero section with animated phone mockup
- Features grid with glassmorphism cards
- Popular destinations showcase
- Download CTA section
- Footer

### Admin Dashboard (`/admin-stats`)

- Password-protected analytics dashboard
- Visits vs Downloads line chart
- Downloads by version pie chart
- Top countries bar chart
- Recent signups list

## 🎨 Customization

### Colors

Edit `tailwind.config.js` to customize the color palette:

```javascript
colors: {
  primary: {
    500: '#22c55e', // Main green color
    // ...
  },
}
```

### Fonts

The site uses:
- **Inter** - Body text
- **Poppins** - Headings

Loaded via Google Fonts in `index.html`.

## 📁 Project Structure

```
website/
├── public/
│   └── favicon.svg
├── src/
│   ├── pages/
│   │   ├── LandingPage.jsx
│   │   └── AdminDashboard.jsx
│   ├── utils/
│   │   └── analytics.js
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── index.html
├── package.json
├── tailwind.config.js
├── postcss.config.js
└── vite.config.js
```

## 🔧 Environment Variables

For the Vite dev server proxy to work, make sure your backend is running on port 3001.

## 📱 APK Downloads

Place your APK file at `/uploads/nomadway.apk` on the server. The download button will:
1. Track the download via the analytics API
2. Trigger the file download

## 🚀 Deployment

See the main project's `deployment/` folder for Nginx configuration and deployment scripts.
