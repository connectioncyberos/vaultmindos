/**
 * Banco de perguntas da simulação de entrevista — v1 sem IA (fixo no
 * código, sem tela de administração). Foco no público do Portal de
 * Empregabilidade: quem nunca trabalhou ou está se recolocando. Ver
 * blueprint seção 14.
 */
export interface InterviewQuestion {
  slug: string;
  question: string;
  tip: string;
}

export const INTERVIEW_QUESTIONS: InterviewQuestion[] = [
  {
    slug: "fale-sobre-voce",
    question: "Fale um pouco sobre você.",
    tip: "Comece pelo presente (o que estuda/faz hoje), depois um pouco do passado relevante, e termine com o que busca agora.",
  },
  {
    slug: "por-que-esta-vaga",
    question: "Por que você quer esta vaga / esta área?",
    tip: "Conecte algo que você já fez (mesmo que fora do trabalho) com o que a vaga pede.",
  },
  {
    slug: "sem-experiencia",
    question: "Você não tem experiência profissional registrada — por que deveríamos te contratar?",
    tip: "Fale de cursos concluídos, projetos pessoais, voluntariado ou responsabilidades que você já assumiu (mesmo informais).",
  },
  {
    slug: "ponto-forte",
    question: "Qual é o seu maior ponto forte?",
    tip: "Escolha um só e dê um exemplo concreto de quando ele apareceu.",
  },
  {
    slug: "ponto-fraco",
    question: "Qual é um ponto que você está desenvolvendo?",
    tip: "Seja honesto, mas mostre que já está fazendo algo a respeito (ex.: um curso, uma prática nova).",
  },
  {
    slug: "trabalho-em-equipe",
    question: "Conte sobre uma situação em que você trabalhou em equipe.",
    tip: "Pode ser da escola, de um projeto, de um time esportivo — o que importa é mostrar como você colabora.",
  },
  {
    slug: "lidar-pressao",
    question: "Como você lida com prazos apertados ou pressão?",
    tip: "Dê um exemplo real, mesmo pequeno, de como você organizou o tempo pra entregar algo.",
  },
  {
    slug: "onde-se-ve",
    question: "Onde você se vê daqui a alguns anos?",
    tip: "Mostre que você quer crescer dentro da área, sem prometer demais.",
  },
  {
    slug: "duvidas-empresa",
    question: "Você tem alguma pergunta pra gente?",
    tip: "Sempre tenha pelo menos uma pergunta pronta — mostra interesse real na vaga.",
  },
];
