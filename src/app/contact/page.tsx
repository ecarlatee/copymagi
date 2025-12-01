export default function Contact() {
  return (
    <div className="flex flex-col items-center justify-center p-4 sm:p-8">
      <main className="w-full max-w-2xl bg-card/50 backdrop-blur-lg border rounded-3xl p-8 flex flex-col items-center gap-6 shadow-2xl">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold">Contact</h1>
        </div>
        <div className="text-center space-y-4">
          <a
            href="https://eyeswoke.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            eyeswoke.com
          </a>
        </div>
      </main>
    </div>
  );
}
