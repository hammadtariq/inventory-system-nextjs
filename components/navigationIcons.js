import {
  AccountBookOutlined,
  ApartmentOutlined,
  AuditOutlined,
  BarChartOutlined,
  DashboardOutlined,
  DollarCircleOutlined,
  FileTextOutlined,
  RollbackOutlined,
  ShopOutlined,
  ShoppingCartOutlined,
  ShoppingOutlined,
  CreditCardOutlined,
  TagsOutlined,
  TeamOutlined,
  UserAddOutlined,
  UserOutlined,
} from "@ant-design/icons";

const navigationIcons = {
  accountBook: <AccountBookOutlined />,
  apartment: <ApartmentOutlined />,
  audit: <AuditOutlined />,
  barChart: <BarChartOutlined />,
  cart: <ShoppingCartOutlined />,
  dashboard: <DashboardOutlined />,
  fileText: <FileTextOutlined />,
  money: <DollarCircleOutlined />,
  rollback: <RollbackOutlined />,
  creditCard: <CreditCardOutlined />,
  shop: <ShopOutlined />,
  shopping: <ShoppingOutlined />,
  tags: <TagsOutlined />,
  team: <TeamOutlined />,
  user: <UserOutlined />,
  userAdd: <UserAddOutlined />,
};

export function withNavigationIcons(items) {
  return items.map((item) => ({
    ...item,
    icon: navigationIcons[item.iconKey],
  }));
}
