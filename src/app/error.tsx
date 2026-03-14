"use client";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Что-то пошло не так</h2>
        <p className="text-sm text-gray-500 mb-4">{error.message}</p>
        <button onClick={reset} className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700">
          Попробовать снова
        </button>
      </div>
    </div>
  );
}
