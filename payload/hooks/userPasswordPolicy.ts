import { APIError, type CollectionConfig } from "payload";

export const USER_PASSWORD_MIN_LENGTH = 12;

type UserHooks = NonNullable<CollectionConfig["hooks"]>;
type UserBeforeOperationHook =
  NonNullable<UserHooks["beforeOperation"]>[number];

export const enforceUserPasswordPolicy: UserBeforeOperationHook = ({
  args,
  operation
}) => {
  if (
    operation !== "create" &&
    operation !== "update" &&
    operation !== "resetPassword"
  ) {
    return args;
  }

  const data =
    args && typeof args === "object" && "data" in args
      ? (args.data as Record<string, unknown> | undefined)
      : undefined;
  const password = data?.password;

  if (
    password === undefined ||
    password === null ||
    (operation === "update" && password === "")
  ) {
    return args;
  }

  if (
    typeof password !== "string" ||
    password.length < USER_PASSWORD_MIN_LENGTH
  ) {
    throw new APIError(
      `Пароль должен содержать не менее ${USER_PASSWORD_MIN_LENGTH} символов.`,
      400
    );
  }

  return args;
};
