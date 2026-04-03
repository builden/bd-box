import { Button } from '../src/shared/components';

export function App() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-2xl font-bold mb-4">Aivis Next Demo</h1>
      <p className="mb-4">Click the floating button below</p>

      {/* Floating Action Button */}
      <div className="fixed bottom-8 right-8">
        <Button variant="primary" className="rounded-full w-14 h-14 shadow-lg">
          +
        </Button>
      </div>
    </div>
  );
}
