import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Layout } from './components/layout/Layout';
import { publicRoutes } from './routes/publicRoutes';
import { privateRoutes } from './routes/privateRoutes';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Layout>
          <Routes>
            {publicRoutes.map(({ path, component: Component }) => (
              <Route
                key={path}
                path={path}
                element={<Component />}
              />
            ))}

            {privateRoutes.map(({ path, component: Component }) => (
              <Route
                key={path}
                path={path}
                element={<Component />}
              />
            ))}
          </Routes>
        </Layout>
      </Router>
    </AuthProvider>
  );
}

export default App;