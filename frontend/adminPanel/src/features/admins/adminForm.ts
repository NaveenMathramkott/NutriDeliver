export interface AdminFormValues {
  email: string;
  name: string;
  password: string;
  role: string;
  permissions: string[];
}

export const emptyAdminForm: AdminFormValues = {
  email: "",
  name: "",
  password: "",
  role: "admin",
  permissions: [],
};
