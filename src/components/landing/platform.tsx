import Image from "next/image";
import { Button } from "../ui/button";

export default function Platform() {
  const features = [
    {
        label: "AI Native Search",
        description: "Analyze how AI Search Engines like ChatGPT, Perplexity, Gemini and Claude perceive your brand and the gaps they miss."
    },
    {
        label: "Multi Platform Coverage",
        description: "We monitor performance across all major platforms for a complete picture."
    },
    {
        label: "Track Brand Perception",
        description: "Monitor sentiment and understand how different AI models portray your brand image."
    }
  ]
  return (
    <div className="flex flex-col lg:flex-row px-4 items-start justify-between w-full h-full mx-auto overflow-hidden relative py-20">
      <div className="flex flex-col items-start justify-center mx-auto max-w-5xl w-full gap-20">
        <span>
            <p className="text-xl mb-5">We will help you understand</p>
            <h1 className="text-5xl max-w-xl mb-3">
            The <strong className="text-blue-600">answers</strong> AI gives. The <strong className="text-blue-600">sources</strong> AI trusts.{" "}
            </h1>
            <h1 className="text-5xl max-w-xl mb-4">
            The <strong className="text-blue-600">brands</strong> AI loves. And the <strong className="text-blue-600">gaps</strong> they miss.{" "}
            </h1>
            <div className="flex items-center gap-4 mt-10">
                <Button className="bg-blue-600 text-black hover:bg-blue-500 rounded-lg">Get your free report</Button>
                <Button className="bg-white text-black hover:bg-gray-100 rounded-lg">Request a demo</Button>
            </div>
        </span>

        <div className="flex flex-wrap items-start justify-between w-full gap-2">
          {features.map((feature, index) => (
            <div key={feature.label} className="flex items-start gap-8">
              <div className="flex flex-col items-start justify-center gap-2">
                <h2 className="text-xl font-bold">{feature.label}</h2>
                <p className="text-md text-neutral-400 max-w-[300px]">{feature.description}</p>
              </div>
              {index < features.length - 1 && (
                <div className="w-px h-25 bg-neutral-900"></div>
              )}
            </div>
          ))}
        </div>
      </div>
      <Image src="/assets/models.webp" alt="models" width={1000} height={1000} draggable={false} className="lg:w-[600px] lg:h-[600px] lg:absolute -right-10 lg:translate-x-30" />
    </div>
  );
}
