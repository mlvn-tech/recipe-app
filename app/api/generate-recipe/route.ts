import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const {
      ingredients,
      servings = 2,
      variation = false,
      category,
    } = await req.json();

    if (!ingredients || ingredients.length === 0) {
      return NextResponse.json(
        { error: "Geen ingrediënten ontvangen" },
        { status: 400 }
      );
    }

    const prompt = `
Je bent een praktische thuiskok.

Maak een realistisch en goed kookbaar recept op basis van deze ingrediënten:
${ingredients.join(", ")}

Voor ${servings} ${servings === 1 ? "persoon" : "personen"}.

Categorie: ${category ?? "Diner"}.

${
  variation
    ? `
BELANGRIJK:
- Dit is een alternatief op een eerder recept.
- Kies een duidelijk andere bereidingsmethode.
- Varieer in techniek (pan / oven / traybake / roerbak / éénpansgerecht).
- Verander structuur of aanpak, niet alleen kleine details.
`
    : ""
}

REGELS:
- Gebruik voornamelijk deze ingrediënten
- Voel je niet verplicht alle opgegeven ingrediënten te gebruiken als deze niet samengaan
- Je mag basisproducten toevoegen (olie, zout, peper, kruiden)
- Het recept moet passen binnen de categorie: ${category}
- Geen exotische ingrediënten toevoegen
- Maximaal 8 ingrediënten totaal
- Maximaal 10 duidelijke stappen
- Realistische kooktijd (in minuten als getal)
- Schrijf kort en concreet

Geef het antwoord uitsluitend terug als geldige JSON in dit formaat:

{
  "title": "string",
  "ingredients": ["string"],
  "steps": ["string"],
  "cooking_time": number,
  "servings": number
  "category": "Diner"
}`;

    const response = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: "Je bent een realistische thuiskok." },
            { role: "user", content: prompt },
          ],
          temperature: variation ? 0.8 : 0.4,
        }),
      }
    );

    const data = await response.json();

    const content = data?.choices?.[0]?.message?.content;

    if (!content) {
      return NextResponse.json(
        { error: "Geen content ontvangen van OpenAI" },
        { status: 500 }
      );
    }

    let parsed;

    try {
      parsed = JSON.parse(content);
    } catch {
      return NextResponse.json(
        { error: "JSON parsing mislukt" },
        { status: 500 }
      );
    }

    parsed.cooking_time = Number(parsed.cooking_time) || 30;
    parsed.servings = Number(parsed.servings) || servings;
    parsed.category = category ?? "Diner";

    return NextResponse.json(parsed);
  } catch (err) {
    console.error("ROUTE ERROR:", err);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
