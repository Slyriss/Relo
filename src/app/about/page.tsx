import { Navbar } from "@/components/navbar";

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <h1 className="text-4xl font-semibold tracking-normal">About Relo</h1>
        <p className="mt-5 text-lg leading-8 text-muted-foreground">
          Relo is built for professional communities where the most valuable outcome is a relationship
          that continues after the room clears. We help organizers engineer better collisions and prove
          the value of those moments with respectful, useful software.
        </p>
      </main>
    </>
  );
}
