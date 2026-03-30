import AuditLog from "@/models/AuditLog";
import { connectDB } from "@/lib/db/connect";

export async function logAction({
  tenantId,
  userId,
  action,
  resourceType,
  resourceId,
  details,
  ipAddress
}: {
  tenantId: any;
  userId: any;
  action: "CREATE" | "UPDATE" | "DELETE" | "LOGIN";
  resourceType: string;
  resourceId?: any;
  details?: string;
  ipAddress?: string;
}) {
  try {
    await connectDB();
    await AuditLog.create({
      tenantId,
      userId,
      action,
      resourceType,
      resourceId,
      details,
      ipAddress
    });
  } catch (error) {
    console.error("Audit Log Error:", error);
  }
}
