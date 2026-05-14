import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/layout/PageHeader";

export const metadata: Metadata = {
  title: "Seus dados",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <p className="vl-eyebrow">{title}</p>
      <div className="text-sm text-foreground/65 leading-relaxed space-y-2">
        {children}
      </div>
    </section>
  );
}

export default function SobreDadosPage() {
  return (
    <div className="space-y-8">
      <PageHeader title="Seus dados" />

      <Section title="Armazenamento">
        <p>
          Seus registros ficam guardados nos servidores do VivaLeve,
          acessíveis apenas com a sua conta. Nenhum dado é compartilhado
          com terceiros.
        </p>
      </Section>

      <Section title="Uso offline">
        <p>
          O VivaLeve funciona sem conexão para leitura das páginas já
          carregadas. Novos registros são sincronizados automaticamente
          quando a conexão retorna.
        </p>
        <p>
          Em caso de uso prolongado offline, os dados permanecem na
          memória do dispositivo e são enviados na próxima conexão.
        </p>
      </Section>

      <Section title="Inteligência artificial">
        <p>
          Quando ativado, o VivaLeve usa modelos de linguagem para gerar
          resumos semanais. Esses resumos são gerados a partir dos seus
          registros e não são armazenados permanentemente.
        </p>
        <p>
          Os resumos não são diagnósticos. O VivaLeve não interpreta dados
          médicos nem oferece recomendações clínicas.
        </p>
      </Section>

      <Section title="Exportação">
        <p>
          Você pode exportar todos os seus registros a qualquer momento
          pela página de perfil. O arquivo gerado é de sua propriedade.
        </p>
      </Section>

      <Section title="Exclusão">
        <p>
          A exclusão da conta remove permanentemente todos os seus dados
          dos nossos servidores. Essa ação não pode ser desfeita.
        </p>
      </Section>

      <div className="h-px bg-border/40" aria-hidden="true" />

      <p className="text-[12px] text-muted-foreground/35 leading-relaxed">
        O VivaLeve não vende dados, não exibe anúncios e não usa seus
        registros para treinar modelos de IA sem consentimento explícito.
      </p>
    </div>
  );
}
