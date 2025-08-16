import Image from "next/image";
import SearchPrompts from "./blocks/search-prompts";

export default function Features() {
    const models = [
        {
            label: "ChatGPT",
            image: "/assets/models/gpt.png",
        },
        {
            label: "Perplexity",
            image: "/assets/models/perplexity.png",
        },
        {
            label: "Claude",
            image: "/assets/models/claude.png",
        },
        {
            label: "Gemini",
            image: "/assets/models/gemini.png",
        },
        {
            label: "Grok",
            image: "/assets/models/grok.png",
        },
        {
            label: "Google AI",
            image: "/assets/models/google.png",
        },
        {
            label: "Meta AI",
            image: "/assets/models/meta.png",
        },
        {
            label: "DeepSeek",
            image: "/assets/models/deepseek.png",
        },
    ]
  return (
    <div className="flex flex-col items-center justify-center bg-background py-20 px-4">
      <div className="container mx-auto flex flex-col items-center justify-center gap-5">
        <h1 className="text-2xl sm:text-[3.4rem] font-bold bricolage">Analyze. Monitor. Stay Ahead.</h1>
        <div className="flex flex-wrap gap-4">
            {models.map((model) => (
                <div key={model.label} className="flex flex-col gap-2 items-center justify-center group cursor-pointer">
                    <Image src={model.image} alt={model.label} width={77} height={77} className="group-hover:scale-110 transition-all duration-400" draggable={false} />
                    <p className="text-sm text-neutral-200 w-20 text-center opacity-0 group-hover:opacity-100 transition-all duration-400 font-bold">{model.label}</p>
                </div>
            ))}
        </div>
        <p className="text-lg text-neutral-400 max-w-xl sm:text-center">
          <span className="text-white">AI search is rewriting brand discovery.</span> We make sure you&apos;re the
          one being found. From GPT to DeepSeek, see exactly how AI platforms
          talk about your brand. No blind spots. No missed mentions. Just full
          visibility across the AI landscape.
        </p>
        <SearchPrompts />
      </div>
    </div>
  );
}
