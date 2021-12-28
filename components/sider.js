import { DesktopOutlined, FileOutlined, PieChartOutlined, TeamOutlined, UserOutlined } from "@ant-design/icons";
import { Layout, Menu } from "antd";
import { useRouter } from "next/router";

const { Sider } = Layout;
const { SubMenu } = Menu;

export default function AppSider({ collapsed, onCollapse }) {
  const router = useRouter();
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
          <Menu.Item onClick={() => router.push("/customers")} key="3">
            List
          </Menu.Item>
          <Menu.Item onClick={() => router.push("/customers/create")} key="4">
            Create
          </Menu.Item>
        </SubMenu>
        <SubMenu key="sub2" icon={<TeamOutlined />} title="Company">
          <Menu.Item onClick={() => router.push("/company")} key="6">
            List
          </Menu.Item>
          <Menu.Item onClick={() => router.push("/company/create")} key="7">
            Create
          </Menu.Item>
        </SubMenu>
        <Menu.Item key="8" icon={<FileOutlined />}>
          Reports
        </Menu.Item>
      </Menu>
    </Sider>
  );
}
