"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion";

export function FaqsSection() {
  return (
    <section className="mx-auto min-h-75 w-full max-w-4xl">
      <div className="flex flex-col items-center justify-center gap-4 px-4 py-16">
        <h2 className="font-heading text-balance font-black text-4xl md:text-5xl lg:font-black">
          FaQs
        </h2>
        <p className="text-muted-foreground">Your questions answered here.</p>
      </div>

      <Accordion className="space-y-2" collapsible type="single">
        {faqs.map((item) => (
          <AccordionItem
            className="border-b-0!"
            key={item.id}
            value={item.id.toString()}
          >
            <AccordionTrigger className="bg-muted px-4 hover:no-underline dark:bg-muted/50">
              {item.title}
            </AccordionTrigger>

            <AccordionContent className="p-4">{item.content}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}

const faqs = [
  {
    id: 0,
    title: "What is TeamComms?",
    content:
      "TeamComms is a Multi-tenant real-time communication platform. It organizes communications in teams and threads.",
  },
  {
    id: 1,
    title: "Do it has AI features?",
    content:
      "Yes, TeamComms has AI for message composing and thread summarization.",
  },
  {
    id: 2,
    title: "Is Teamcomms free?",
    content: "Yes, Teamcomms is free to use YET.",
  },
  {
    id: 3,
    title: "Can I create an Organization?",
    content:
      "Yes, you can create an Organization on Teamcomms. Just sign up and create your first organization, Invite your friends in the organization by creating a team.",
  },
  {
    id: 4,
    title: "Are messages in TeamComms real-time?",
    content:
      "Yes, messages, reactions and threads in TeamComms are updated in real-time.",
  },
  {
    id: 5,
    title: "Is TeamComms open source?",
    content: "Yes, TeamComms is open source and available on GitHub.",
  },
];
