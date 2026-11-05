import { NextResponse } from "next/server";
import {
  getProfile,
  getEnergy,
  saveProfile,
  setBudgetControls,
  setWomenFriendlyPrivacy,
  saveFamilyMembers,
  clearProfileData,
} from "@/server/profile";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key") ?? "default";
  const energyOnly = searchParams.get("energy") === "true";

  try {
    if (energyOnly) {
      const data = await getEnergy(key);
      return NextResponse.json(data);
    }
    const profile = await getProfile(key);
    return NextResponse.json(profile);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch profile";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await saveProfile(body);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save profile";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === "budgetControls" || action === "setBudgetControls") {
      const result = await setBudgetControls(body);
      return NextResponse.json(result);
    }
    if (action === "womenFriendlyPrivacy" || action === "setWomenFriendlyPrivacy") {
      const result = await setWomenFriendlyPrivacy(body);
      return NextResponse.json(result);
    }
    if (action === "familyMembers" || action === "saveFamilyMembers") {
      const result = await saveFamilyMembers(body);
      return NextResponse.json(result);
    }
    if (action === "clearData" || action === "clearProfileData") {
      const result = await clearProfileData(body);
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to patch profile";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

