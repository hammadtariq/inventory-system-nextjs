import { Layout, Avatar, Dropdown, Menu, message } from "antd";
import {
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  DashboardOutlined,
  UserOutlined,
  TeamOutlined,
  UnorderedListOutlined,
  FileOutlined,
  ShopOutlined,
  DatabaseOutlined,
  FilePptOutlined,
  DollarCircleOutlined,
  SettingOutlined,
  LogoutOutlined,
} from "@ant-design/icons";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import AppMenuItems from "./menuItems";
import Link from "next/link";
import Image from "next/image";
import Logo from "../public/vast-apparel.png";
import { logoutUser } from "@/hooks/login";
import StorageUtils from "@/utils/storage.util";

const { Sider } = Layout;

const items = [
  { id: "1", title: "Overview", url: "/", icon: <DashboardOutlined /> },
  { id: "2", title: "Customers", url: "/customers", icon: <UserOutlined /> },
  { id: "3", title: "Company", url: "/company", icon: <TeamOutlined /> },
  { id: "4", title: "Items List", url: "/items", icon: <UnorderedListOutlined /> },
  { id: "5", title: "Purchase", url: "/purchase", icon: <FileOutlined /> },
  { id: "6", title: "Inventory", url: "/inventory", icon: <ShopOutlined /> },
  { id: "7", title: "Sales", url: "/sales", icon: <FileOutlined /> },
  { id: "8", title: "Ledger", url: "/ledger", icon: <DatabaseOutlined /> },
  { id: "9", title: "Reports", url: "/reports", icon: <FilePptOutlined /> },
  { id: "10", title: "Cheques", url: "/cheques", icon: <DollarCircleOutlined /> },
];

export default function AppNavbar({ collapsed, onCollapseChange }) {
  const router = useRouter();
  const [isSelected, setIsSelected] = useState();
  const user = StorageUtils.getItem("user");
  const onClickHandler = (url, id) => {
    setIsSelected(id);
    router.push(url);
  };
  const initials = `${user?.fisrtName?.charAt(0).toUpperCase() || ""}${user?.lastName?.charAt(0).toUpperCase() || ""}`;

  useEffect(() => {
    const baseRoute = `/${router.pathname.split("/")[1] || ""}`;
    const activeItem = items.find((item) => item.url === baseRoute);
    setIsSelected(activeItem?.id || items[0].id);
  }, [router.pathname]);

  const [dropdownVisible, setDropdownVisible] = useState(false);

  const onLogout = async () => {
    try {
      const data = await logoutUser();
      message.success(data.message);
      router.push("/login");
    } catch (err) {
      message.error(err?.message || "An error occurred during logout");
    }
  };

  const handleMenuClick = ({ key }) => {
    if (key === "logout") {
      onLogout();
    } else if (key === "settings") {
      console.log("Settings clicked");
    }
  };

  const menu = (
    <Menu
      onClick={handleMenuClick}
      style={{
        backgroundColor: "#5f82a36c",
        width: "120px",
      }}
    >
      <Menu.Item key="settings" icon={<SettingOutlined />}>
        Settings
      </Menu.Item>
      <Menu.Item key="logout" icon={<LogoutOutlined />}>
        Logout
      </Menu.Item>
    </Menu>
  );

  return (
    <Sider
      collapsed={collapsed}
      onCollapse={onCollapseChange}
      collapsedWidth={60}
      width={250}
      style={{
        height: "100vh",
        position: "fixed",
        left: 0,
        top: 0,
        bottom: 0,
        background: "#001529",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: collapsed ? "column" : "row",
          alignItems: "center",
          justifyContent: collapsed ? "center" : "space-between",
          paddingTop: collapsed ? "22px" : "0px",
        }}
      >
        <Link href="/" passHref>
          <div
            onClick={() => onClickHandler(items[0].url, items[0].id)}
            style={{
              display: "flex",
              alignItems: "center",
              cursor: "pointer",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              padding: collapsed ? "0" : "0px 0px 0px",
            }}
          >
            <Image src={Logo} width={50} height={50} alt="" />
            <h2
              style={{
                fontWeight: "bold",
                fontSize: "30px",
                color: "#fff",
                paddingTop: "15px",
              }}
            >
              {!collapsed && "INVENTORY"}
            </h2>
          </div>
        </Link>
        <button
          type="text"
          onClick={() => onCollapseChange(!collapsed)}
          style={{
            color: "#fff",
            backgroundColor: "#001529",
            padding: "0px",
            border: "none",
            cursor: "pointer",
            paddingRight: collapsed ? "0px" : "5px",
          }}
        >
          {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
        </button>
      </div>

      <div>
        <AppMenuItems
          mode="inline"
          items={items}
          onClickHandler={onClickHandler}
          selected={isSelected}
          collapsed={collapsed}
        />
      </div>

      <div style={{ bottom: 0, position: "absolute", width: "100%" }}>
        <Dropdown
          overlay={menu}
          trigger={["click"]}
          placement="left"
          onVisibleChange={(visible) => setDropdownVisible(visible)}
          visible={dropdownVisible}
        >
          <div
            onClick={() => setDropdownVisible(!dropdownVisible)}
            style={{
              padding: collapsed ? "10px 1px 12px 12px" : "20px 20px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              borderTop: "1px solid rgba(255, 255, 255, 0.1)",
            }}
          >
            <Avatar
              style={{
                backgroundColor: "#fff",
                color: "#001527",
                fontWeight: "bold",
                marginRight: "10px",
              }}
            >
              {initials}
            </Avatar>

            {!collapsed && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  lineHeight: "1.2",
                }}
              >
                <span style={{ fontWeight: "500", color: "#fff" }}>
                  {user.fisrtName} {user.lastName}
                </span>
                <span style={{ fontSize: "12px", color: "#b9b9b9ff" }}>{user.email}</span>
              </div>
            )}
          </div>
        </Dropdown>
      </div>
    </Sider>
  );
}
