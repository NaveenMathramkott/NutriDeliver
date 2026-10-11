export interface CategoryFormValues {
  name: string;
  description: string;
  image: string;
  isActive: boolean;
}

export const emptyCategoryForm: CategoryFormValues = {
  name: "",
  description: "",
  image: "",
  isActive: true,
};
