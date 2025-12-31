"use server";

export async function handleGeneratePlaylist(prevState: any, formData: FormData) {
    return {
      message: "Cette action a été désactivée (local-first). Utilisez la génération client-side.",
      errors: { form: ["Server action disabled"] },
      tasks: prevState?.tasks ?? [],
    };
}
export async function handleGetRecommendations(formData: FormData) {
  return {
    recommendations: [],
    error: "Cette action a été désactivée (local-first). Utilisez la recommandation client-side.",
  };
}
