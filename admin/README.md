# Mantri Inn - Frontend Application

A modern React-based frontend application for Mantri Inn property management system.

**Live Demo**: <a href="https://modernize-react-free.netlify.app/dashboard">Live Demo</a>

---

## Prerequisites

Make sure you have the following installed on your system:

- **Node.js** (v14 or above) - [Download](https://nodejs.org/)
- **npm** (comes with Node.js) or **yarn**
- **Git** - [Download](https://git-scm.com/)

---

## Setup Instructions

### Step 1: Navigate to the Admin Directory

```bash
cd admin
```

### Step 2: Install Dependencies

Using npm:
```bash
npm install
```

Or using yarn:
```bash
yarn install
```

This will install all required packages from the `package.json` file.

### Step 3: Configure Environment Variables (if needed)

If the application requires environment variables, create a `.env` file in the `admin` directory:

```bash
touch .env
```

Add any required environment variables based on your backend configuration (e.g., API endpoints).

### Step 4: Start the Development Server

Using npm:
```bash
npm start
```

Or using yarn:
```bash
yarn start
```

The application will automatically open in your browser at `http://localhost:3000`

---

## Available Scripts

### `npm start`
- Runs the app in development mode
- Opens [http://localhost:3000](http://localhost:3000) to view it in the browser
- The page will reload when you make changes

### `npm build`
- Builds the app for production to the `build` folder
- Correctly bundles React in production mode and optimizes the build for the best performance

### `npm test`
- Launches the test runner in interactive watch mode

### `npm eject`
- **Warning**: This is a one-way operation. Once you eject, you can't go back!

---

## Project Structure

```
admin/
├── public/              # Static files
│   ├── index.html
│   └── robots.txt
├── src/                 # Source code
│   ├── App.js          # Main App component
│   ├── index.js        # Entry point
│   ├── assets/         # Images, JSON files
│   ├── components/     # Reusable components
│   ├── layouts/        # Layout components
│   ├── redux/          # Redux store and features
│   ├── routes/         # Route definitions
│   ├── theme/          # Theme configuration
│   ├── utils/          # Utility functions
│   └── views/          # Page components
├── package.json        # Project dependencies
└── README.md          # This file
```

---

## Features

- **React 18** with modern hooks
- **Redux Toolkit** for state management
- **Material-UI (MUI)** for component library
- **React Router v6** for navigation
- **Axios** for HTTP requests
- **Data Grid** and charts with MUI X and ApexCharts
- **Map Integration** with Leaflet and Google Maps
- **Real-time Communication** with Socket.io
- **CSV Export** support
- **Print Functionality** with React-to-Print
- **Date Handling** with date-fns and DayJS
- **Form Validation** with Yup

---

## Troubleshooting

### Issue: Dependencies fail to install
- Clear npm cache: `npm cache clean --force`
- Delete `node_modules` folder and `package-lock.json`
- Run `npm install` again

### Issue: Port 3000 already in use
- The dev server will automatically find another available port
- Or manually specify a port: `PORT=3001 npm start`

### Issue: Module not found errors
- Ensure you've run `npm install` from the `admin` directory
- Verify all dependencies are correctly listed in `package.json`

---

## Development Tips

- Use the React Developer Tools browser extension for debugging
- Redux DevTools browser extension is useful for state management debugging
- Hot Module Replacement (HMR) is enabled for instant feedback during development

---

## Support

For more information about the Mantri Inn project, refer to the main project documentation or contact the development team.
