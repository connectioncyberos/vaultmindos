import { getCurrentUser } from "@/lib/auth/session";
import { INTERVIEW_QUESTIONS } from "@/lib/interview/questions";
import { getMyInterviewAnswers } from "@/lib/interview/queries";
import { saveInterviewAnswerAction } from "./actions";

/**
 * /academy/entrevista — simulação de entrevista v1 (Fase 2, sem IA).
 * Perguntas roteirizadas fixas (lib/interview/questions.ts) + resposta
 * em texto do próprio candidato + autoavaliação de confiança — um
 * espaço de prática e autorreflexão, não uma correção automática.
 */
export default async function EntrevistaPage() {
  const user = (await getCurrentUser())!;
  const answers = await getMyInterviewAnswers(user.id);

  const respondidas = INTERVIEW_QUESTIONS.filter((q) => answers.get(q.slug)?.answer).length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium uppercase tracking-wide text-neutral-500">Academy · Empregabilidade</p>
        <h1 className="text-3xl font-bold leading-tight text-neutral-100">Simulação de entrevista</h1>
        <p className="text-base leading-relaxed text-neutral-400">
          Pratique respostas escritas pras perguntas mais comuns de uma entrevista de primeiro emprego.
          Ninguém corrige — é um espaço seu pra treinar e ganhar confiança.
        </p>
        <p className="text-sm text-neutral-500">
          {respondidas} de {INTERVIEW_QUESTIONS.length} perguntas praticadas
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {INTERVIEW_QUESTIONS.map((q, i) => {
          const saved = answers.get(q.slug);
          return (
            <div key={q.slug} className="rounded-md border border-neutral-800 bg-neutral-900 p-5">
              <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">Pergunta {i + 1}</p>
              <p className="mt-1 text-base font-semibold text-neutral-100">{q.question}</p>
              <p className="mt-1 text-xs italic text-neutral-500">💡 {q.tip}</p>

              <form action={saveInterviewAnswerAction} className="mt-3 flex flex-col gap-3">
                <input type="hidden" name="question_slug" value={q.slug} />
                <textarea
                  name="answer"
                  rows={4}
                  defaultValue={saved?.answer ?? ""}
                  placeholder="Escreva sua resposta aqui..."
                  className="rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-100"
                />
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-neutral-500">Confiança:</span>
                    {[1, 2, 3, 4, 5].map((value) => (
                      <button
                        key={value}
                        type="submit"
                        name="confidence_rating"
                        value={value}
                        className={`h-7 w-7 rounded-full border text-xs font-medium ${
                          saved?.confidenceRating === value
                            ? "border-emerald-500 bg-emerald-600 text-white"
                            : "border-neutral-700 text-neutral-500 hover:border-emerald-500"
                        }`}
                      >
                        {value}
                      </button>
                    ))}
                  </div>
                  <button
                    type="submit"
                    className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-500"
                  >
                    Salvar resposta
                  </button>
                </div>
              </form>
            </div>
          );
        })}
      </div>
    </div>
  );
}
