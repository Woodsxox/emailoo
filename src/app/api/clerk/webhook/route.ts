import { prisma } from "@/server/db";

// Make sure you set CLERK_API_KEY in Vercel environment variables
const CLERK_API_KEY = process.env.CLERK_API_KEY;

export const POST = async (req: Request) => {
  try {
    const body = await req.json();
    const { data, type } = body;

    console.log("🔔 Webhook received:", JSON.stringify(body, null, 2));

    if (type !== "user.created") {
      console.log("ℹ️ Ignored event type:", type);
      return new Response("Ignored", { status: 200 });
    }

    const userId = data?.id;
    if (!userId) {
      console.error("❌ No user ID in webhook payload");
      return new Response("No user ID", { status: 400 });
    }

    // Fetch full user from Clerk API
    const res = await fetch(`https://api.clerk.com/v1/users/${userId}`, {
      headers: {
        Authorization: `Bearer ${CLERK_API_KEY}`,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      console.error("❌ Failed to fetch user from Clerk:", await res.text());
      return new Response("Failed to fetch user", { status: 500 });
    }

    const clerkUser = await res.json();
    console.log("✉️ Clerk user fetched:", clerkUser);

    // Extract email (primary email)
    const primaryEmail = clerkUser.email_addresses?.find(
      (e: any) => e.id === clerkUser.primary_email_address_id,
    )?.email_address;

    if (!primaryEmail) {
      console.error("❌ No primary email found for user");
      return new Response("No email found", { status: 400 });
    }

    // Upsert user in DB
    const user = await prisma.user.upsert({
      where: { emailAddress: primaryEmail },
      update: {
        firstName: clerkUser.first_name || clerkUser.firstName || "",
        lastName: clerkUser.last_name || clerkUser.lastName || "",
        imageUrl:
          clerkUser.image_url ||
          clerkUser.imageUrl ||
          clerkUser.profile_image_url ||
          null,
        updatedAt: new Date(),
      },
      create: {
        emailAddress: primaryEmail,
        firstName: clerkUser.first_name || clerkUser.firstName || "",
        lastName: clerkUser.last_name || clerkUser.lastName || "",
        imageUrl:
          clerkUser.image_url ||
          clerkUser.imageUrl ||
          clerkUser.profile_image_url ||
          null,
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
