import Navbar from "@/components/marketing/navbar";
import Hero from "@/components/marketing/hero";
import Features from "@/components/marketing/features";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main>
        <Hero />
        <Features />
      </main>
    </div>
  );
}