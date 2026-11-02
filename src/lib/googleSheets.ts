import { google } from "googleapis";

export const getGoogleSheetsClient = async () => {
  const email = process.env.GOOGLE_CLIENT_EMAIL;
  // Replace \\n with actual newlines
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!email || !privateKey) {
    throw new Error("Missing Google API Credentials in .env.local");
  }

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: email,
      private_key: privateKey,
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  const client = await auth.getClient();
  const sheets = google.sheets({ version: "v4", auth: client as any });

  return sheets;
};

export const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
