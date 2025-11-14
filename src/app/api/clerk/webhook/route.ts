import { prisma } from "@/server/db";

export const POST = async (req: Request) => {
  const { data, type } = await req.json();

  console.log("Clerk Webhook:", data);

  // Ignore events you don’t care about
  if (type !== "user.created") {
    return new Response("Ignored", { status: 200 });
  }

  // Try both patterns
  const emailAddress =
    data.email_addresses?.[0]?.email_address ||
    data.emailAddresses?.[0]?.emailAddress ||
    data.primary_email_address_id || // fallback ID
    null;

  const firstName = data.first_name || "";
  const lastName = data.last_name || "";
  const imageUrl = data.image_url || data.profile_image_url || "";
  const userId = data.id;

  // You should prevent inserting null emailAddress
  await prisma.user.create({
    data: {
      id: userId,
      emailAddress,
      firstName,
      lastName,
      imageUrl,
    },
  });

  return new Response("OK", { status: 200 });
};
