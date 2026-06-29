"use client";
import { Layout, Avatar, Dropdown, message } from "antd";
import { MenuUnfoldOutlined, MenuFoldOutlined, SettingOutlined, LogoutOutlined } from "@ant-design/icons";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import AppMenuItems from "./menuItems";
import Link from "next/link";
import Image from "next/image";
import Logo from "../public/logo.png";
import { logoutUser } from "@/hooks/login";
import { withNavigationIcons } from "./navigationIcons";
import { getActiveNavigationItem, getNavigationItems } from "@/lib/navigation";
import StorageUtils from "@/utils/storage.util";
import styles from "@/styles/Navbar.module.css";

const { Sider } = Layout;

export default function AppNavbar(props = {}) {
  const { collapsed = false, onCollapseChange = () => {} } = props;

  const router = useRouter();
  const [isSelected, setIsSelected] = useState();
  const user = StorageUtils.getItem("user");
  const items = useMemo(() => {
    return withNavigationIcons(getNavigationItems(user?.role));
  }, [user?.role]);

  const onClickHandler = (url, id) => {
    setIsSelected(id);
    router.push(url);
  };
  const initials = `${user?.fisrtName?.charAt(0).toUpperCase() || ""}${user?.lastName?.charAt(0).toUpperCase() || ""}`;

  useEffect(() => {
    const activeItem = getActiveNavigationItem(items, router.pathname);
    setIsSelected(activeItem?.id || items[0].id);
  }, [items, router.pathname]);

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

  const menuProps = {
    items: [
      { key: "settings", icon: <SettingOutlined />, label: "Settings" },
      { key: "logout", icon: <LogoutOutlined />, label: "Logout" },
    ],
    onClick: handleMenuClick,
    style: { backgroundColor: "#5f82a36c", width: "120px" },
  };

  return (
    <Sider collapsed={collapsed} onCollapse={onCollapseChange} collapsedWidth={60} width={250} className={styles.sider}>
      <div className={collapsed ? styles.logoRowCollapsed : styles.logoRow}>
        <Link
          href="/dashboard"
          onClick={() => onClickHandler(items[0].url, items[0].id)}
          className={collapsed ? styles.logoLinkCollapsed : styles.logoLink}
        >
          <Image src={Logo} width={30} height={30} alt="Logo" />
          <h2 className={styles.logoText}>{!collapsed && "VAST APPAREL"}</h2>
        </Link>

        <button
          type="button"
          onClick={() => onCollapseChange(!collapsed)}
          className={collapsed ? styles.collapseButtonCollapsed : styles.collapseButton}
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

      <div className={styles.accountMenu}>
        <Dropdown
          menu={menuProps}
          trigger={["click"]}
          placement="left"
          onOpenChange={(open) => setDropdownVisible(open)}
          open={dropdownVisible}
        >
          <button
            type="button"
            onClick={() => setDropdownVisible(!dropdownVisible)}
            className={collapsed ? styles.accountButtonCollapsed : styles.accountButton}
          >
            <Avatar
              style={{
                backgroundColor: "#6395ff",
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
                  {user?.fisrtName} {user?.lastName}
                </span>
                <span style={{ fontSize: "12px", color: "#b9b9b9ff" }}>{user?.email}</span>
              </div>
            )}
          </button>
        </Dropdown>
      </div>
    </Sider>
  );
}
