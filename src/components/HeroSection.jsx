import slidePreview from '../assets/slidepolish.png'

function HeroSection() {
  return (
    <section className="min-h-[calc(100vh-200px)] px-6 py-12 md:py-20">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-start gap-12 md:flex-row md:items-center">
        <div className="flex-1 text-white">
          <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
            Highlight &rarr; Polish &rarr; Done
          </h1>
          <p className="mt-6 max-w-md text-base text-slate-300">
            Select the content you want to elevate, let SlidePolish refine it, and ship a deck worthy of the room in minutes.
          </p>
        </div>
        <div className="flex-1 w-full md:pl-6">
          <img
            src={slidePreview}
            alt="SlidePolish preview"
            className="w-full max-w-lg rounded-3xl shadow-2xl shadow-black/25"
          />
        </div>
      </div>
    </section>
  )
}

export default HeroSection

