import { APIError, type CollectionConfig } from "payload";

import { isPendingInvitation } from "@/lib/admin/user-invitations";

type InvitationUser = {
  id: number | string;
  invitationStatus?: unknown;
};

type UserHooks = NonNullable<CollectionConfig["hooks"]>;
type UserBeforeLoginHook = NonNullable<UserHooks["beforeLogin"]>[number];
type UserAfterLoginHook = NonNullable<UserHooks["afterLogin"]>[number];

function isVerifiedInvitationReset(
  invitationStatus: unknown,
  data: unknown
): boolean {
  if (
    !isPendingInvitation(invitationStatus) ||
    !data ||
    typeof data !== "object"
  ) {
    return false;
  }

  const resetData = data as Record<string, unknown>;
  return (
    typeof resetData.token === "string" &&
    resetData.token.length > 0 &&
    !("email" in resetData) &&
    !("username" in resetData)
  );
}

export const blockUnacceptedInvitationLogin: UserBeforeLoginHook = ({
  req,
  user
}) => {
  const invitationUser = user as InvitationUser;
  if (invitationUser.invitationStatus === "active") return user;

  // Payload also runs beforeLogin after a successful reset-password token
  // exchange. That request contains the verified reset token and must pass so
  // the employee can accept the invitation.
  const acceptingInvitation = isVerifiedInvitationReset(
    invitationUser.invitationStatus,
    req.data
  );

  if (acceptingInvitation) return user;

  throw new APIError(
    invitationUser.invitationStatus === "revoked"
      ? "Доступ к аккаунту отозван администратором."
      : "Сначала примите приглашение из письма.",
    403
  );
};

export const activateInvitationAfterPasswordSet: UserAfterLoginHook = async ({
  req,
  user
}) => {
  const invitationUser = user as InvitationUser;
  const acceptingInvitation = isVerifiedInvitationReset(
    invitationUser.invitationStatus,
    req.data
  );
  if (!acceptingInvitation) return user;

  const acceptedAt = new Date().toISOString();
  await req.payload.db.updateOne({
    id: invitationUser.id,
    collection: "users",
    data: {
      invitationAcceptedAt: acceptedAt,
      invitationExpiresAt: null,
      invitationStatus: "active",
      updatedAt: acceptedAt
    },
    req,
    returning: false
  });

  return {
    ...user,
    invitationAcceptedAt: acceptedAt,
    invitationExpiresAt: null,
    invitationStatus: "active"
  };
};
