export const adminPermissions = {
  customer_create: true,
  customer_edit: true,
  customer_delete: true,

  company_create: true,
  company_edit: true,
  company_delete: true,

  inventory_edit: true,

  transaction_create: true,

  purchase_approve: true,
  purchase_edit: true,

  item_create: true,
  item_edit: true,
  item_delete: true,

  sales_approve: true,
  sales_edit: true,

  cheques_approve: true,
};

export const editorPermissions = {
  customer_create: true,
  customer_edit: true,
  customer_delete: false,

  company_create: true,
  company_edit: true,
  company_delete: false,

  inventory_edit: false,

  purchase_edit: true,

  transaction_create: true,

  item_create: true,
  item_edit: true,
  item_delete: false,

  sales_approve: false,
  sales_edit: true,

  cheques_approve: false,
};
