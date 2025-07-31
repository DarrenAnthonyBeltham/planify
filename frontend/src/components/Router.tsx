import { useState, useEffect } from 'react';
import { HomePage } from '../pages/Homepage';
import { ProjectPage } from '../pages/ProjectPage';

export function Router() {
  const [hash, setHash] = useState(window.location.hash);

  useEffect(() => {
    const handleHashChange = () => {
      setHash(window.location.hash);
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  const parts = hash.replace(/^#\/?|\/$/g, '').split('/');

  if (parts[0] === 'project' && parts[1]) {
    const projectId = parts[1];
    return <ProjectPage projectId={projectId} />;
  }

  return <HomePage />;
}
