import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import Welcome from './pages/Welcome';
import Capture from './pages/Capture';
import Adjustment from './pages/Adjustment';
import Trace from './pages/Trace';
import Preview from './pages/Preview';
import Export from './pages/Export';
import PastExports from './pages/PastExports';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#2196f3',
    },
    secondary: {
      main: '#f50057',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/" element={<Welcome />} />
          <Route path="/capture" element={<Capture />} />
          <Route path="/adjust" element={<Adjustment />} />
          <Route path="/trace" element={<Trace />} />
          <Route path="/preview" element={<Preview />} />
          <Route path="/export" element={<Export />} />
          <Route path="/past-exports" element={<PastExports />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
