import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { initStorage } from './utils/storage';
import './index.css';

const root = createRoot(document.getElementById('root')!);

function StorageError({ message }: { message: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 text-center bg-app text-fg">
      <div className="max-w-sm space-y-3">
        <h1 className="text-xl font-black">Base de données inaccessible</h1>
        <p className="text-sm text-fg-muted">
          Mon Kanda n'a pas pu ouvrir le stockage de l'appareil. Vos données ne sont pas perdues : fermez puis rouvrez
          l'application.
        </p>
        <p className="text-[11px] text-fg-muted break-words">{message}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="px-5 py-2.5 rounded-full bg-brand text-brand-fg text-sm font-black"
        >
          Réessayer
        </button>
      </div>
    </div>
  );
}

// L'application ne s'affiche qu'une fois la base ouverte et les données chargées
initStorage()
  .then(() =>
    root.render(
      <StrictMode>
        <App />
      </StrictMode>,
    ),
  )
  .catch((err) => {
    console.error(err);
    root.render(<StorageError message={err instanceof Error ? err.message : String(err)} />);
  });
