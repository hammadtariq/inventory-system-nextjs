import {
  AccountBookOutlined,
  ApartmentOutlined,
  BarChartOutlined,
  DashboardOutlined,
  DollarCircleOutlined,
  FileTextOutlined,
  RollbackOutlined,
  ShopOutlined,
  ShoppingCartOutlined,
  ShoppingOutlined,
  TagsOutlined,
  TeamOutlined,
  UserAddOutlined,
  UserOutlined,
} from "@ant-design/icons";

const navigationIcons = {
  accountBook: <AccountBookOutlined />,
  apartment: <ApartmentOutlined />,
  barChart: <BarChartOutlined />,
  cart: <ShoppingCartOutlined />,
  dashboard: <DashboardOutlined />,
  fileText: <FileTextOutlined />,
  money: <DollarCircleOutlined />,
  rollback: <RollbackOutlined />,
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
