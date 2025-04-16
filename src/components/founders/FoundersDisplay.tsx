import { FaLinkedin } from 'react-icons/fa';

interface Founder {
  url: string;
  title: string;
}

interface FoundersDisplayProps {
  founders: Founder[];
}

export default function FoundersDisplay({ founders }: FoundersDisplayProps) {
  return (
    <div>
      <h3 className="text-2xl font-normal text-white">
        Founders
      </h3>
      <div className="bg-background rounded-md p-6 border border-zinc-800 mt-3">
        <div className="space-y-4">
          {founders.map((founder, index) => (
            <a
              key={index}
              href={founder.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block group"
            >
              <div className="flex items-center space-x-5 p-5 bg-zinc-900/20 rounded-lg border border-zinc-800 hover:bg-blue-800/20 hover:border-blue-500 hover:shadow-sm transition-all duration-200">
                <div className="flex-shrink-0">
                  <div className="w-[52px] h-[52px] rounded-full bg-gradient-to-br from-blue-900/20 to-blue-800/30 flex items-center justify-center">
                    <svg
                      className="w-7 h-7 text-blue-500/80"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-medium text-neutral-100 group-hover:text-blue-400 transition-colors duration-200">
                    {founder.title}
                  </p>
                  <div className="inline-flex items-center mt-1 text-sm text-neutral-400 group-hover:text-blue-400 transition-colors duration-200">
                    <FaLinkedin className="mr-1.5 text-[15px] opacity-80" />
                    <span>View LinkedIn Profile</span>
                  </div>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
} 