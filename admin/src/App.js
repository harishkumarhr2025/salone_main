import { CssBaseline, ThemeProvider } from '@mui/material';
import { useRoutes } from 'react-router-dom';
import Router from './routes/Router';
import { Toaster } from 'react-hot-toast';

import { baseLightTheme } from './theme/DefaultColors';
import useGlobalInputAutofill from './utils/useGlobalInputAutofill';

const App = () => {
  useGlobalInputAutofill();
  const routing = useRoutes(Router);
  const theme = baseLightTheme;
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {routing}
      <Toaster />
    </ThemeProvider>
  );
};

export default App;
