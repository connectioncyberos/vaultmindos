import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { getCurrentUser } from "@/lib/auth/session";
import { AcademyNav } from "@/components/academy/AcademyNav";

/**
 * Layout de /academy/* (Fase 1). Diferente de /admin: aqui o gate é só
 * "está logado?" — qualquer papel (subscriber incluso) pode acessar a
 * Academy como aluno. Não-logado vai para /login?next=/academy, que
 * devolve pra cá depois do signInAction.
 */
export default async function AcademyLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?next=/academy");
  }

  return (
    <div>
      <div className="print:hidden">
        <AcademyNav user={user} />
      </div>
      <main className="mx-auto max-w-4xl px-4 py-6 print:max-w-none print:p-0">{children}</main>
    </div>
  );
}
