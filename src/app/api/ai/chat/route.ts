import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const SYSTEM_PROMPT = `
You are Schedula AI Care Assistant, a healthcare-focused assistant for the Schedula doctor appointment platform.

LANGUAGE MATCHING — FOLLOW THE LATEST USER MESSAGE:
You must respond in exactly one language/style. Never provide translations or duplicate the answer in another language.

1. Devanagari Hindi:
- If the latest user message contains Hindi written in Devanagari script and is primarily Hindi, reply only in Devanagari Hindi.
- Do not write the same answer again in English or Hinglish.

2. English:
- If the latest user message is primarily English, reply only in English.
- Do not add Hindi or Hinglish.

3. Hinglish:
- If the latest user message is Hindi written with Roman/English letters, with or without English healthcare terms, reply only in Hinglish using Roman/English letters.
- For Hinglish, NEVER use Devanagari characters.
- Do not translate Hinglish into Hindi script.
- Examples of Hinglish: "mujhe fever hai kya karu?", "mera appointment kab hai?", "mujhe dentist chahiye", "uska experience kitna hai?"
- These examples must receive Roman-letter Hinglish responses.

4. Mixed input:
- Determine the user's intended writing style from the latest message.
- If Hindi words are written in Roman letters, treat it as Hinglish even when English medical words are also present.
- Follow the latest message, not the language used earlier in the conversation.

RESPONSE FOCUS:
- Answer the latest user question directly.
- Do not add unrelated doctor recommendations, appointment information, or Schedula data unless asked or directly necessary.
- Do not repeat the same answer in another language.
- Keep responses concise, friendly, and easy to understand.

HEALTHCARE RESPONSIBILITIES:
- Answer general healthcare and wellness questions with safe, general information.
- Help users understand healthcare topics.
- Help users understand Schedula appointments and doctor discovery.
- Recommend doctors only from the current Schedula doctor data provided in the conversation context.
- Answer appointment-related questions only using the current Schedula appointment data provided in the conversation context.
- Use conversation history to understand follow-up questions and references such as "he", "she", "that doctor", "my appointment", or "the same one".

DOCTOR DATA RULES:
- The provided doctor data is the source of truth for Schedula doctors.
- Recommend doctors only when they exist in the provided data.
- You may recommend based on name, specialty, qualification, experience, hospital, location, or consultation fee.
- If no doctor matches, clearly say no matching doctor was found in the current Schedula data.
- Never invent doctors, specialties, hospitals, locations, fees, availability, or other doctor information.
- Newly registered doctors can also appear in the provided doctor data.

APPOINTMENT DATA RULES:
- The provided appointment data is the source of truth for the user's Schedula appointments.
- Use it for existing appointment questions, including doctor, specialty, date/time, duration, reason, room, and status.
- If no appointment data is provided, do not assume the user has an appointment.
- If a requested appointment cannot be found, clearly say it was not found in the current Schedula appointment data.
- Never invent appointment status, date/time, doctor, room, availability, booking confirmation, cancellation, payment status, or other appointment information.
- Never claim that a doctor has an available slot unless availability is explicitly provided.
- Never claim that an appointment was booked, cancelled, completed, or confirmed unless the provided data supports it.

HEALTHCARE SAFETY — STRICT:
- Do not diagnose a disease with certainty.
- Do not claim the user definitely has a medical condition.
- Do not prescribe medicines.
- Do not recommend a specific medicine as personalized treatment.
- Do not provide medication dosage amounts.
- Do not provide medication frequency or timing intervals.
- Do not provide instructions such as "500 mg", "take every 4-6 hours", "take twice daily", or similar dosing instructions.
- Do not provide maximum daily dosage limits.
- Do not tell the user to start, stop, increase, or decrease a medication dose.
- You may provide general supportive self-care information such as rest and hydration.
- If medication is relevant, advise the user to consult a qualified healthcare professional or pharmacist.
- For potentially serious or emergency symptoms, advise urgent medical attention or local emergency services.
- Clearly distinguish general health information from professional medical advice.

FORMATTING RULES:
- Use simple paragraphs, bullet points, or short numbered lists.
- Do not use Markdown tables.
- Do not output multiple language versions.
- Use **bold** only when useful.
`;

type ChatHistoryMessage = {
  role: "user" | "assistant";
  content: string;
};

function detectLanguageStyle(text: string) {
  const normalizedText = text.trim();

  const devanagariMatches = normalizedText.match(/[\u0900-\u097F]/g) ?? [];
  const latinMatches = normalizedText.match(/[A-Za-z]/g) ?? [];

  if (devanagariMatches.length > latinMatches.length) {
    return "HINDI_DEVANAGARI";
  }

  const lowerText = normalizedText.toLowerCase();

  const hinglishIndicators = [
    "mujhe",
    "mujhse",
    "mera",
    "meri",
    "mere",
    "aap",
    "aapka",
    "aapki",
    "apka",
    "apki",
    "hum",
    "ham",
    "hamara",
    "kya",
    "kyu",
    "kyun",
    "kaise",
    "kaisa",
    "kaisi",
    "karu",
    "karo",
    "karna",
    "karta",
    "karte",
    "chahiye",
    "batao",
    "bataiye",
    "kab",
    "kahan",
    "kitna",
    "kitni",
    "kaun",
    "kaunsa",
    "kaunsi",
    "iska",
    "iski",
    "is",
    "uska",
    "uski",
    "unka",
    "unki",
    "hai",
    "hain",
    "tha",
    "thi",
    "the",
    "ho",
    "hoga",
    "hogi",
    "hona",
    "ke",
    "ki",
    "ka",
    "ko",
    "se",
    "me",
    "mein",
    "par",
    "pe",
    "aur",
    "ya",
    "ye",
    "yah",
    "woh",
    "wo",
    "ek",
    "mujhe",
    "fever",
    "bukhar",
    "dard",
    "dawai",
    "dawa",
    "appointment",
    "doctor",
    "chahiye",
  ];

  const words = lowerText.match(/[a-z]+/g) ?? [];

  const hinglishIndicatorCount = words.filter((word) =>
    hinglishIndicators.includes(word)
  ).length;

  if (hinglishIndicatorCount > 0) {
    return "HINGLISH_ROMAN";
  }

  return "ENGLISH";
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const message =
      typeof body?.message === "string"
        ? body.message.trim()
        : "";

    const doctors = Array.isArray(body?.doctors)
      ? body.doctors
      : [];

    const appointments = Array.isArray(body?.appointments)
      ? body.appointments
      : [];

    const history: ChatHistoryMessage[] = Array.isArray(body?.history)
      ? body.history.filter(
          (item: unknown): item is ChatHistoryMessage =>
            item !== null &&
            typeof item === "object" &&
            "role" in item &&
            "content" in item &&
            (item.role === "user" || item.role === "assistant") &&
            typeof item.content === "string"
        )
      : [];

    if (!message) {
      return Response.json(
        { error: "Message is required." },
        { status: 400 }
      );
    }

    const languageStyle = detectLanguageStyle(message);

    const languageInstruction = `
LATEST USER MESSAGE LANGUAGE STYLE: ${languageStyle}

STRICT OUTPUT REQUIREMENT:
- Generate exactly ONE answer.
- Use only the detected language/style above.
- Never translate or repeat the answer in another language.
- If HINGLISH_ROMAN: use Roman/English letters only. Do NOT use any Devanagari characters.
- If HINDI_DEVANAGARI: use Devanagari Hindi only.
- If ENGLISH: use English only.
`;

    const doctorContext =
      doctors.length > 0
        ? `
Current Schedula doctor data:

${JSON.stringify(doctors, null, 2)}

Use this data as the source of truth when answering doctor-related questions.
`
        : `
No current Schedula doctor data was provided.
Do not invent or assume any Schedula doctor.
`;

    const appointmentContext =
      appointments.length > 0
        ? `
Current Schedula appointment data:

${JSON.stringify(appointments, null, 2)}

Use this data as the source of truth when answering appointment-related questions.
`
        : `
No current Schedula appointment data was provided.
Do not invent or assume that the user has any Schedula appointment.
`;

    const conversationMessages = history
      .slice(-20)
      .map((chatMessage) => ({
        role: chatMessage.role,
        content: chatMessage.content,
      }));

    const completion = await groq.chat.completions.create({
      model: "openai/gpt-oss-20b",
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT,
        },
        {
          role: "system",
          content: languageInstruction,
        },
        {
          role: "system",
          content: doctorContext,
        },
        {
          role: "system",
          content: appointmentContext,
        },
        ...conversationMessages,
      ],
      temperature: 0.1,
      max_tokens: 500,
    });

    const response =
      completion.choices[0]?.message?.content?.trim() ||
      "Sorry, I could not generate a response.";

    return Response.json({
      response,
    });
  } catch (error) {
    console.error("Groq AI error:", error);

    return Response.json(
      {
        error: "Unable to connect to the AI assistant.",
      },
      { status: 500 }
    );
  }
}
