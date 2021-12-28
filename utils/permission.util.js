import get from "lodash/get";
import { adminPermissions, editorPermissions } from "../data/permission";

const permissions = {
  ADMIN: adminPermissions,
  EDITOR: editorPermissions,
};

class PermissionsUtil {
  static instance;

  constructor() {
    if (this.instance) {
      return this.instance;
    }

    this.instance = this;
  }

  setPermissions(role) {
    this.permissions = permissions[role];
  }

  clearPermissions() {
    this.permissions = {};
  }

  getPermissionString(permission) {
    // if (isString(permission)) return permission;

    let str = "";
    const { action, category } = permission;

    if (category) str += `${category}_`;
    if (action) str += `${action}`;

    return str;
  }

  checkAuth(actionStr) {
    const str = this.getPermissionString(actionStr);
    const _permissions = get(this.permissions, str);

    return _permissions;
  }
}

const permissionsUtil = new PermissionsUtil();
export default permissionsUtil;
