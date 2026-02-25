import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { title } = await req.json();

    if (!title) {
      return NextResponse.json(
        { error: "Geen titel ontvangen" },
        { status: 400 }
      );
    }

const { ingredients, servings, category, variation } = await req.json();
console.log("CATEGORY RECEIVED:", category);

    const prompt = `
Realistic food photography of ${title}.
Natural light.
Shot from an angle, top-down diagonal.
Minimal background.
Appetizing.
High detail.
No text.
Do NOT add any extra vegetables or ingredients.
Do NOT include broccoli, zucchini, carrots, or other vegetables unless explicitly listed.
The dish must visually contain only the listed ingredients.
No extra garnish.
No side dishes.
No additional toppings.
Professional food photography.
`;

    const response = await fetch(
      "https://api.openai.com/v1/images/generations",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-image-1",
          prompt,
          size: "1024x1024",
        }),
      }
    );

    const data = await response.json();

    console.log("OPENAI IMAGE RAW:", data);

    if (!data?.data?.[0]?.b64_json) {
      return NextResponse.json(
        { error: "Geen afbeelding gegenereerd" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      imageBase64: data.data[0].b64_json,
    });
  } catch (err) {
    console.error("Image route error:", err);
    return NextResponse.json(
      { error: "Kon afbeelding niet genereren" },
      { status: 500 }
    );
  }
}