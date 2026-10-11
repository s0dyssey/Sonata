import { ensembleTypes } from "@/lib/mock-data";
import StageCard from "../StageCard";
import { Container, SectionHeader } from "../ui";

export default function StagesSection() {
  return (
    <section id="stages" aria-labelledby="stages-title" className="bg-section-stages py-24 sm:py-32">
      <Container>
        <SectionHeader title={<span id="stages-title">Two stages. One league.</span>}>
          Each season you&rsquo;re drafted into a virtual ensemble with players at your level. Pick the stage
          that fits your instrument. The global ranking counts both.
        </SectionHeader>

        <div className="mt-14 grid gap-6 lg:mt-20 lg:grid-cols-2">
          {ensembleTypes.map((stage) => (
            <StageCard key={stage.id} stage={stage} />
          ))}
        </div>
      </Container>
    </section>
  );
}
