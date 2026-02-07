export interface TreeNode {
  id: string;
  text: string;
  parentId: string | null;
  order: number;
}
