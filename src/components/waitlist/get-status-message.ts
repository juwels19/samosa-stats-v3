type WaitlistAccessStatus =
  | "not_found"
  | "pending"
  | "invited"
  | "completed"
  | "rejected"
  | "approved";

export function getStatusMessage(status: WaitlistAccessStatus) {
  switch (status) {
    case "rejected":
      return "That email is not currently approved for access.";
    case "pending":
      return "That email is still under review.";
    case "invited":
    case "completed":
    case "approved":
      return "Your invite is ready. Sign in with this email to continue.";
    case "not_found":
      return "We don't see an approved invite for that email yet.";
  }
}
