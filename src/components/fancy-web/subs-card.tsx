export default function SubsCard({
  title,
  description,
  price,
}: {
  title: string;
  description: string;
  price: string;
}) {
    const backgrounds = [
        {
            name: 'Premium Plan',
            background: 'url(https://images.unsplash.com/photo-1635776062127-d379bfcba9f8?w=800&amp;q=80)',
        },
        {
            name: 'Plus Plan',
            background: 'url(https://images.unsplash.com/photo-1635776063328-153b13e3c245?w=800&amp;q=80)',
        },
        {
            name: 'Pro Plan',
            background: 'url(https://images.unsplash.com/photo-1635776062360-af423602aff3?w=800&amp;q=80)',
        }
    ]
  return (
    <div
    className="scale-in group transition-all duration-300 visible cursor-pointer max-w-lg mx-auto"
    style={{ transform: 'transform: translateY(0px) scale(1)' }}
  >
    <div
      className="relative transform overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-600 to-cyan-800 p-6 shadow-lg transition-all duration-300 group-hover:scale-105 hover:shadow-xl"
      style={{
        background: backgrounds.find((b) => b.name === title)?.background || '',
        backgroundSize: 'cover',
      }}
    >
      <div className="absolute inset-0 bg-black/10"></div>
      <div className="relative items-center justify-center flex flex-col">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-white/20">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            data-lucide="workflow"
            className="lucide lucide-workflow h-6 w-6 text-white"
          >
            <rect width="8" height="8" x="3" y="3" rx="2"></rect>
            <path d="M7 11v4a2 2 0 0 0 2 2h4"></path>
            <rect width="8" height="8" x="13" y="13" rx="2"></rect>
          </svg>
        </div>
        <h3 className="mb-2 font-sans text-3xl font-bold text-white">
          {title}
        </h3>
        <p className="mb-4 font-sans text-sm text-white/80">
          {description}
        </p>
        <div className="flex items-center text-white/60">
          <span className="font-sans text-3xl font-bold">{price}</span>
        </div>
      </div>
    </div>
  </div>
  );
}