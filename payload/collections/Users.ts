import type { CollectionConfig, FieldAccess } from "payload";
import { avatarPresetOptions } from "../admin/avatar-presets";
import { adminSectionHero, adminSectionHeroField } from "../admin/section-hero";
import { adminGroups } from "../admin/structure";
import {
  canAccessAdmin,
  cmsRoleOptions,
  denyAccess,
  isAdminUser,
  ownUserOrAdmin
} from "../access/rbac";
import {
  USER_INVITATION_EXPIRATION_MS,
  userAccessEmailHtml,
  userAccessEmailSubject
} from "../../lib/admin/user-invitations";
import {
  deriveUserDisplayName,
  protectUserProfileUpdate
} from "../hooks/protectUserProfile";
import {
  activateInvitationAfterPasswordSet,
  blockUnacceptedInvitationLogin
} from "../hooks/userInvitations";
import { enforceUserPasswordPolicy } from "../hooks/userPasswordPolicy";

const invitationFieldAccess: {
  create: FieldAccess;
  read: FieldAccess;
  update: FieldAccess;
} = {
  create: () => false,
  read: ({ req }) => isAdminUser(req.user),
  update: () => false
};

export const Users: CollectionConfig = {
  slug: "users",
  labels: {
    singular: { ru: "Сотрудник админки", en: "Admin user" },
    plural: { ru: "Администраторы и редакторы", en: "Users" }
  },
  admin: {
    group: adminGroups.users,
    hidden: ({ user }) => !isAdminUser(user),
    components: {
      beforeList: [
        adminSectionHero("users"),
        {
          path: "@/app/(payload)/components/AdminUserInvitationPanel",
          exportName: "AdminUserInvitationPanel"
        }
      ]
    },
    useAsTitle: "displayName",
    defaultColumns: [
      "avatarPreset",
      "displayName",
      "email",
      "role",
      "invitationStatus"
    ],
    listSearchableFields: ["firstName", "lastName", "displayName", "email"],
    description: {
      ru: "Доступы сотрудников к CMS. Раздел не управляет клиентами сайта, только пользователями админки.",
      en: "CMS staff access."
    },
    pagination: { defaultLimit: 20, limits: [10, 20, 50] }
  },
  access: {
    admin: canAccessAdmin,
    create: denyAccess,
    delete: ({ req }) => isAdminUser(req.user),
    read: ownUserOrAdmin,
    unlock: ownUserOrAdmin,
    update: ownUserOrAdmin
  },
  auth: {
    lockTime: 10 * 60 * 1000,
    maxLoginAttempts: 5,
    cookies: {
      sameSite: "Lax",
      secure: true
    },
    forgotPassword: {
      expiration: USER_INVITATION_EXPIRATION_MS,
      generateEmailHTML: (args) => {
        if (!args?.req || !args.token) {
          return "Ссылка для создания пароля временно недоступна.";
        }
        return userAccessEmailHtml({
          req: args.req,
          token: args.token,
          user: args.user ?? {}
        });
      },
      generateEmailSubject: (args) =>
        userAccessEmailSubject(args?.user ?? {})
    }
  },
  hooks: {
    afterLogin: [activateInvitationAfterPasswordSet],
    beforeLogin: [blockUnacceptedInvitationLogin],
    beforeOperation: [enforceUserPasswordPolicy],
    beforeChange: [deriveUserDisplayName],
    beforeValidate: [protectUserProfileUpdate]
  },
  fields: [
    adminSectionHeroField("users"),
    {
      name: "email",
      label: { ru: "Email для входа", en: "Login email" },
      type: "email",
      required: true,
      unique: true,
      access: {
        update: ({ req }) => isAdminUser(req.user)
      },
      admin: {
        description: {
          ru: "Служебный адрес для входа. Изменить его может только администратор.",
          en: "Login address. Only an administrator can change it."
        }
      }
    },
    {
      name: "name",
      label: { ru: "ФИО (старое служебное поле)", en: "Legacy full name" },
      type: "text",
      access: {
        update: ({ req }) => isAdminUser(req.user)
      },
      admin: {
        hidden: true,
        description: { ru: "Сохранено для совместимости со старыми записями. Новые данные заполняйте в отдельных полях." }
      }
    },
    {
      type: "row",
      fields: [
        {
          name: "firstName",
          label: { ru: "Имя", en: "First name" },
          type: "text",
          admin: { width: "50%", placeholder: "Иван" }
        },
        {
          name: "lastName",
          label: { ru: "Фамилия", en: "Last name" },
          type: "text",
          admin: { width: "50%", placeholder: "Петров" }
        }
      ]
    },
    {
      type: "row",
      fields: [
        {
          name: "displayName",
          label: { ru: "Отображаемое имя", en: "Display name" },
          type: "text",
          admin: {
            components: {
              Cell: {
                path: "@/app/(payload)/components/AvatarPresetField",
                exportName: "UserDisplayNameCell"
              }
            },
            readOnly: true,
            width: "50%",
            placeholder: "Иван Петров",
            description: { ru: "Формируется автоматически из имени и фамилии." }
          }
        },
        {
          name: "position",
          label: { ru: "Должность", en: "Position" },
          type: "text",
          admin: { width: "50%", placeholder: "Контент-менеджер" }
        }
      ]
    },
    {
      name: "avatarPreset",
      label: { ru: "Аватар профиля", en: "Profile avatar" },
      type: "select",
      defaultValue: "ember",
      required: true,
      options: [...avatarPresetOptions],
      admin: {
        description: {
          ru: "Выберите персонажа производственной команды. Все 16 аватаров уже оптимизированы и быстро работают на любых устройствах.",
          en: "Choose one of 16 optimized industrial team characters."
        },
        components: {
          Cell: {
            path: "@/app/(payload)/components/AvatarPresetField",
            exportName: "AvatarPresetCell"
          },
          Field: {
            path: "@/app/(payload)/components/AvatarPresetField",
            exportName: "AvatarPresetField"
          }
        }
      }
    },
    {
      name: "role",
      label: { ru: "Роль в CMS", en: "CMS role" },
      type: "select",
      defaultValue: "editor",
      required: true,
      access: {
        update: ({ req }) => isAdminUser(req.user)
      },
      admin: {
        description: { ru: "Определяет уровень доступа сотрудника к разделам админки." }
      },
      options: [...cmsRoleOptions]
    },
    {
      name: "invitationStatus",
      label: { ru: "Доступ к аккаунту", en: "Account access" },
      type: "select",
      defaultValue: "active",
      required: true,
      access: invitationFieldAccess,
      options: [
        { label: { ru: "Активен", en: "Active" }, value: "active" },
        {
          label: { ru: "Ожидает принятия", en: "Invitation pending" },
          value: "pending"
        },
        {
          label: { ru: "Письмо не доставлено", en: "Delivery failed" },
          value: "delivery_failed"
        },
        { label: { ru: "Доступ отозван", en: "Revoked" }, value: "revoked" }
      ],
      admin: {
        components: {
          Cell: {
            path: "@/app/(payload)/components/AdminUserInvitationPanel",
            exportName: "InvitationStatusCell"
          }
        },
        position: "sidebar",
        readOnly: true
      }
    },
    {
      name: "invitedAt",
      label: { ru: "Когда приглашён", en: "Invited at" },
      type: "date",
      access: invitationFieldAccess,
      admin: {
        date: { pickerAppearance: "dayAndTime" },
        position: "sidebar",
        readOnly: true
      }
    },
    {
      name: "invitationLastSentAt",
      label: { ru: "Последняя отправка приглашения", en: "Last invitation sent" },
      type: "date",
      access: invitationFieldAccess,
      admin: { hidden: true, readOnly: true }
    },
    {
      name: "invitationExpiresAt",
      label: { ru: "Ссылка действует до", en: "Invitation expires at" },
      type: "date",
      access: invitationFieldAccess,
      admin: {
        date: { pickerAppearance: "dayAndTime" },
        position: "sidebar",
        readOnly: true
      }
    },
    {
      name: "invitationAcceptedAt",
      label: { ru: "Когда приглашение принято", en: "Invitation accepted at" },
      type: "date",
      access: invitationFieldAccess,
      admin: { hidden: true, readOnly: true }
    },
    {
      name: "invitedBy",
      label: { ru: "Кто пригласил", en: "Invited by" },
      type: "relationship",
      relationTo: "users",
      access: invitationFieldAccess,
      admin: { hidden: true, readOnly: true }
    }
  ]
};
