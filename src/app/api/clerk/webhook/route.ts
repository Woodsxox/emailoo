import { prisma } from "@/server/db";
import { Prisma } from "@/generated/prisma/client";

export const POST = async (req: Request) => {
  try {
    // Parse the webhook payload
    const payload = await req.json();
    const { data, type } = payload;

    console.log("🔔 Clerk Webhook Received:", {
      type,
      userId: data?.id,
      timestamp: new Date().toISOString(),
    });

    // Log full payload structure for debugging (only in development)
    if (process.env.NODE_ENV === "development") {
      console.log("📦 Full Webhook Payload:", JSON.stringify(payload, null, 2));
    }

    // Only handle user created or updated
    if (type !== "user.created" && type !== "user.updated") {
      console.log(`⏭️  Ignoring event type: ${type}`);
      return new Response("Ignored", { status: 200 });
    }

    // Validate required data
    if (!data) {
      console.error("❌ Webhook data is missing");
      return new Response("Missing data", { status: 400 });
    }

    const userId = data.id;
    if (!userId) {
      console.error("❌ User ID is missing from webhook data");
      return new Response("Missing user ID", { status: 400 });
    }

    // Extract email with improved fallback strategies (your better approach)
    let emailAddress: string | null = null;

    // Strategy 1: Use primary_email_address object (your better approach)
    if (data.primary_email_address?.email_address) {
      emailAddress = data.primary_email_address.email_address;
    } else if (data.primaryEmailAddress?.emailAddress) {
      emailAddress = data.primaryEmailAddress.emailAddress;
    }

    // Strategy 2: Find primary email from email_addresses array
    if (
      !emailAddress &&
      data.email_addresses &&
      Array.isArray(data.email_addresses)
    ) {
      // Find the primary email address
      const primaryEmail = data.email_addresses.find(
        (email: any) =>
          email.id === data.primary_email_address_id ||
          email.primary === true ||
          email.verification?.status === "verified",
      );

      if (primaryEmail?.email_address) {
        emailAddress = primaryEmail.email_address;
      } else if (data.email_addresses[0]?.email_address) {
        // Fallback to first email if no primary found
        emailAddress = data.email_addresses[0].email_address;
      }
    }

    // Strategy 3: Try camelCase format (some API versions)
    if (!emailAddress && data.emailAddresses?.[0]?.emailAddress) {
      emailAddress = data.emailAddresses[0].emailAddress;
    }

    // Strategy 4: Direct email field (unlikely but possible)
    if (!emailAddress && data.email) {
      emailAddress = data.email;
    }

    // Log email extraction result
    console.log("📧 Email Extraction:", {
      found: !!emailAddress,
      email: emailAddress ? `${emailAddress.substring(0, 3)}***` : "null",
      emailAddressesCount: data.email_addresses?.length || 0,
      primaryEmailId: data.primary_email_address_id,
      hasPrimaryEmailObject: !!data.primary_email_address,
    });

    // Validate email before proceeding
    if (!emailAddress?.includes("@")) {
      console.error("❌ Invalid or missing email address:", {
        userId,
        emailAddress,
        emailAddresses: data.email_addresses,
        primaryEmailAddress: data.primary_email_address,
      });
      return new Response("Missing email", { status: 400 });
    }

    // Extract user data with fallbacks
    const firstName = data.first_name || data.firstName || "";
    const lastName = data.last_name || data.lastName || "";
    const imageUrl =
      data.image_url || data.profile_image_url || data.imageUrl || "";

    console.log("👤 User Data:", {
      userId,
      email: `${emailAddress.substring(0, 3)}***`,
      firstName,
      lastName,
      hasImage: !!imageUrl,
    });

    // Use upsert to handle duplicate webhook deliveries (idempotency)
    try {
      const user = await prisma.user.upsert({
        where: { id: userId },
        update: {
          emailAddress,
          firstName,
          lastName,
          imageUrl: imageUrl || undefined, // Only update if provided
        },
        create: {
          id: userId,
          emailAddress,
          firstName,
          lastName,
          imageUrl: imageUrl || undefined,
        },
      });

      console.log("✅ User created/updated successfully:", {
        userId: user.id,
        email: `${user.emailAddress.substring(0, 3)}***`,
      });

      return new Response("OK", { status: 200 });
    } catch (dbError) {
      // Handle specific Prisma errors
      if (dbError instanceof Prisma.PrismaClientKnownRequestError) {
        if (dbError.code === "P2002") {
          console.error("❌ Duplicate entry error:", {
            code: dbError.code,
            target: dbError.meta?.target,
            userId,
          });
          // This shouldn't happen with upsert, but log it
          return new Response("Duplicate entry", { status: 409 });
        }
        if (dbError.code === "P2003") {
          console.error("❌ Foreign key constraint error:", {
            code: dbError.code,
            userId,
          });
          return new Response("Database constraint error", { status: 400 });
        }
      }

      // Log unexpected database errors
      console.error("❌ Database error:", {
        error: dbError,
        userId,
        emailAddress: `${emailAddress?.substring(0, 3)}***`,
        errorMessage:
          dbError instanceof Error ? dbError.message : String(dbError),
        errorStack: dbError instanceof Error ? dbError.stack : undefined,
      });

      throw dbError; // Re-throw to be caught by outer catch
    }
  } catch (error) {
    // Handle JSON parsing errors
    if (error instanceof SyntaxError) {
      console.error("❌ Invalid JSON in webhook payload:", error.message);
      return new Response("Invalid JSON", { status: 400 });
    }

    // Handle all other errors
    console.error("❌ Webhook processing error:", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    // Return 500 to let Clerk know to retry
    return new Response("Internal Server Error", { status: 500 });
  }
};
