import { Menu, Layout } from "antd";
import { DesktopOutlined, PieChartOutlined, FileOutlined, TeamOutlined, UserOutlined } from "@ant-design/icons";
const { Sider } = Layout;
const { SubMenu } = Menu;

export default function AppSider({ collapsed, onCollapse }) {
  return (
    <Sider collapsible collapsed={collapsed} onCollapse={onCollapse}>
      <div className="logo" />
      <Menu theme="dark" defaultSelectedKeys={["1"]} mode="inline">
        <Menu.Item key="1" icon={<PieChartOutlined />}>
          Option 1
        </Menu.Item>
        <Menu.Item key="2" icon={<DesktopOutlined />}>
          Option 2
        </Menu.Item>
        <SubMenu key="sub1" icon={<UserOutlined />} title="Customer">
          <Menu.Item key="3">Customer 1</Menu.Item>
          <Menu.Item key="4">Customer 2</Menu.Item>
          <Menu.Item key="5">Customer 3</Menu.Item>
        </SubMenu>
        <SubMenu key="sub2" icon={<TeamOutlined />} title="Company">
          <Menu.Item key="6">Company 1</Menu.Item>
          <Menu.Item key="8">Company 2</Menu.Item>
        </SubMenu>
        <Menu.Item key="9" icon={<FileOutlined />}>
          Reports
        </Menu.Item>
      </Menu>
    </Sider>
  );
}
