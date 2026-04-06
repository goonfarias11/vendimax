"use client";

type Props = {
  params: { slug: string };
};

export default function TutorialDetail({ params }: Props) {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <p className="text-sm uppercase tracking-wide text-primary/80 font-semibold">Tutorial</p>
      <h1 className="text-3xl font-bold text-gray-900 mt-2">
        {params.slug.replace(/-/g, " ")}
      </h1>
      <p className="text-gray-600 mt-3">
        Estamos preparando el paso a paso detallado para este tutorial. Si lo necesitas con urgencia,
        escribe a <a className="text-primary font-medium" href="mailto:soportevendimax@gmail.com">soportevendimax@gmail.com</a>.
      </p>
    </div>
  );
}
