import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ itemId: string }> },
) {
  const { itemId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", _request.url));
  }

  const { data: item } = await supabase
    .from("budget_items")
    .select("receipt_path")
    .eq("id", itemId)
    .single();

  if (!item?.receipt_path) {
    return NextResponse.json({ error: "No receipt uploaded" }, { status: 404 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin.storage
    .from("receipts")
    .createSignedUrl(item.receipt_path, 300);

  if (error || !data) {
    return NextResponse.json({ error: "Could not generate link" }, { status: 500 });
  }

  return NextResponse.redirect(data.signedUrl);
}
