import {
  FileOutlined,
  FilePptOutlined,
  TeamOutlined,
  UserOutlined,
  ShopOutlined,
  DatabaseOutlined,
} from "@ant-design/icons";
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
        <SubMenu key="sub3" icon={<FilePptOutlined />} title="Purchase Order">
          <Menu.Item onClick={() => router.push("/purchase")} key="8">
            List
          </Menu.Item>
          <Menu.Item onClick={() => router.push("/purchase/create")} key="9">
            Create
          </Menu.Item>
        </SubMenu>
        <Menu.Item key="10" onClick={() => router.push("/inventory")} icon={<ShopOutlined />}>
          Inventory
        </Menu.Item>
        <SubMenu key="sub5" icon={<FilePptOutlined />} title="Sales">
          <Menu.Item onClick={() => router.push("/sales")} key="12">
            List
          </Menu.Item>
          <Menu.Item onClick={() => router.push("/sales/create")} key="13">
            Create
          </Menu.Item>
        </SubMenu>
        <SubMenu key="sub6" icon={<DatabaseOutlined />} title="Ledger">
          <Menu.Item onClick={() => router.push("/ledger")} key="14">
            List
          </Menu.Item>
          <Menu.Item onClick={() => router.push("/ledger/create")} key="15">
            Create
          </Menu.Item>
        </SubMenu>
        <Menu.Item key="19" icon={<FileOutlined />}>
          Reports
        </Menu.Item>
      </Menu>
    </Sider>
  );
}
