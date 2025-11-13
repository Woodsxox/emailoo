import { prisma } from "@/server/db";

export const POST = async (req: Request) => {
  try {
    const { data, type } = await req.json();
    if (type !== "user.created")
      return new Response("Ignored", { status: 200 });

    // Extract email from various possible locations
    const email =
      data?.email_addresses?.[0]?.email_address ||
      data?.emailAddresses?.[0]?.emailAddress ||
      data?.email;

    // Fallback: try to extract from JSON string if needed
    const emailFromString =
      email ||
      (() => {
        try {
          const jsonStr = JSON.stringify(data);
          const match = /"email_address"\s*:\s*"([^"]+)"/.exec(jsonStr);
          return match?.[1];
        } catch {
          return undefined;
        }
      })();

    if (!emailFromString)
      return new Response("No email found", { status: 200 });

    const user = await prisma.user.upsert({
      where: { emailAddress: emailFromString },
      update: {
        firstName: data.first_name || data.firstName || "",
        lastName: data.last_name || data.lastName || "",
        imageUrl:
          data.image_url || data.imageUrl || data.profile_image_url || null,
        updatedAt: new Date(),
      },
      create: {
        emailAddress: emailFromString,
        firstName: data.first_name || data.firstName || "",
        lastName: data.last_name || data.lastName || "",
        imageUrl:
          data.image_url || data.imageUrl || data.profile_image_url || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    console.log("✅ User saved:", user.emailAddress);
    return new Response("User saved", { status: 200 });
  } catch (e) {
    console.error("❌ Clerk webhook error:", e);
    return new Response("Server Error", { status: 500 });
  }
};
