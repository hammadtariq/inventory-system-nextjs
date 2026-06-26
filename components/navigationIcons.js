import {
  ApartmentOutlined,
  DashboardOutlined,
  DatabaseOutlined,
  DollarCircleOutlined,
  FileOutlined,
  FilePptOutlined,
  ShopOutlined,
  TeamOutlined,
  UnorderedListOutlined,
  UserAddOutlined,
  UserOutlined,
} from "@ant-design/icons";

const navigationIcons = {
  apartment: <ApartmentOutlined />,
  dashboard: <DashboardOutlined />,
  database: <DatabaseOutlined />,
  file: <FileOutlined />,
  list: <UnorderedListOutlined />,
  money: <DollarCircleOutlined />,
  presentation: <FilePptOutlined />,
  shop: <ShopOutlined />,
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
