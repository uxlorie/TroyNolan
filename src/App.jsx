import { Analytics } from '@vercel/analytics/react';
import Layout from './components/Layout';
import Hero from './components/Hero';
import Snake from './sections/Snake';

function App() {
  return (
    <Layout>
      <Hero />
      <Snake />
      <Analytics />
    </Layout>
  );
}

export default App;
