import { CopyLinkButton } from "@/components/share/copy-link-button";
import { PROGRAM_SHELF_LEAD, PROGRAM_SHELF_TITLE } from "@/lib/messages";
import {
  type PublicProgramCard,
  publicProgramCards,
  publicProgramUrl,
} from "@/lib/share/program-public";

export function ProgramShelf({ origin }: { origin?: string }) {
  const cards = publicProgramCards();

  return (
    <section id="programs" className="flex w-full scroll-mt-6 flex-col gap-2">
      <h2 className="px-1 text-sm font-medium text-muted-foreground">
        {PROGRAM_SHELF_TITLE}
      </h2>
      <p className="px-1 text-sm leading-relaxed text-muted-foreground">
        {PROGRAM_SHELF_LEAD}
      </p>
      <ul className="card-surface w-full divide-y divide-border/70 px-5">
        {cards.map((card) => (
          <ProgramShelfRow
            key={card.id}
            card={card}
            url={origin ? publicProgramUrl(origin, card.id) : card.path}
          />
        ))}
      </ul>
    </section>
  );
}

function ProgramShelfRow({
  card,
  url,
}: {
  card: PublicProgramCard;
  url: string;
}) {
  return (
    <li className="flex flex-col gap-2 py-3">
      <a href={card.path} className="min-w-0">
        <span className="block text-lg font-medium">{card.name}</span>
        <span className="mt-0.5 block text-sm leading-relaxed text-muted-foreground">
          {card.summary}
        </span>
      </a>
      <div className="flex items-center justify-between gap-3">
        <span className="min-w-0 text-sm text-muted-foreground">
          {card.path}
        </span>
        <CopyLinkButton url={url} />
      </div>
    </li>
  );
}
