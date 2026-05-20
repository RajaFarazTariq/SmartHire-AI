export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <main className="flex flex-col items-center justify-center py-32 px-16 text-center">
        <h1 className="text-5xl font-bold tracking-tight text-gray-900 mb-4">
          AI Resume Screening System
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl">
          Intelligent candidate screening and ranking powered by AI. Extract skills,
          score candidates, and streamline your recruitment process.
        </p>
        <div className="flex flex-col gap-4 text-base font-medium sm:flex-row">
          <a
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-blue-600 text-white transition-colors hover:bg-blue-700 md:w-[158px]"
            href="/dashboard"
          >
            Get Started
          </a>
          <a
            className="flex h-12 w-full items-center justify-center rounded-full border border-solid border-gray-300 px-5 transition-colors hover:bg-gray-100 md:w-[158px]"
            href="/docs"
          >
            Documentation
          </a>
        </div>
      </main>
    </div>
  );
}
