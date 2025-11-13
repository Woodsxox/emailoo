import { prisma } from "@/server/db";

export const POST = async (req: Request) => {
  try {
    const body = await req.json();
    const { data, type } = body;

    console.log("🔔 Webhook received:", JSON.stringify(body, null, 2));

    if (type !== "user.created") {
      console.log("ℹ️ Ignored event type:", type);
      return new Response("Ignored", { status: 200 });
    }

    // Try multiple ways to extract email
    const emailFromPayload =
      data?.email_addresses?.[0]?.email_address ||
      data?.emailAddresses?.[0]?.emailAddress ||
      data?.email ||
      (() => {
        try {
          const jsonStr = JSON.stringify(data);
          const match = /"email_address"\s*:\s*"([^"]+)"/.exec(jsonStr);
          return match?.[1];
        } catch {
          return undefined;
        }
      })();

    if (!emailFromPayload) {
      console.error("❌ No email found in webhook payload");
      return new Response("No email found", { status: 400 });
    }

    console.log("✉️ Email resolved:", emailFromPayload);

    // Upsert user into DB
    const user = await prisma.user.upsert({
      where: { emailAddress: emailFromPayload },
      update: {
        firstName: data.first_name || data.firstName || "",
        lastName: data.last_name || data.lastName || "",
        imageUrl:
          data.image_url || data.imageUrl || data.profile_image_url || null,
        updatedAt: new Date(),
      },
      create: {
        emailAddress: emailFromPayload,
        firstName: data.first_name || data.firstName || "",
        lastName: data.last_name || data.lastName || "",
        imageUrl:
          data.image_url || data.imageUrl || data.profile_image_url || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    console.log("✅ User saved in DB:", user.emailAddress);
    return new Response("User saved", { status: 200 });
  } catch (error) {
    console.error("❌ Clerk webhook error:", error);
    return new Response("Server Error", { status: 500 });
  }
};
