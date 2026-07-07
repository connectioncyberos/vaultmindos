import { redirect } from "next/navigation";

/** /vagas — atalho antigo, a tela real vive dentro do layout autenticado da Academy. */
export default function VagasRedirectPage() {
  redirect("/academy/vagas");
}
