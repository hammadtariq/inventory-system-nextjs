"use client";
import { Avatar, Drawer, Dropdown, message } from "antd";
import { CloseOutlined, LogoutOutlined, MenuOutlined, SettingOutlined } from "@ant-design/icons";
import Image from "next/image";
import { useMemo, useState } from "react";
import { useRouter } from "next/router";

import Logo from "../public/logo.png";
import AppMenuItems from "./menuItems";
import { withNavigationIcons } from "./navigationIcons";
import { logoutUser } from "@/hooks/login";
import {
  getActiveNavigationItem,
  getMobileNavigationItems,
  getNavigationItems,
  getToggledDrawerOpen,
} from "@/lib/navigation";
import styles from "@/styles/DashboardNavigation.module.css";
import StorageUtils from "@/utils/storage.util";

export default function MobileDashboardNav() {
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const user = StorageUtils.getItem("user");
  const initials = `${user?.fisrtName?.charAt(0).toUpperCase() || ""}${user?.lastName?.charAt(0).toUpperCase() || ""}`;

  const items = useMemo(() => withNavigationIcons(getNavigationItems(user?.role)), [user?.role]);
  const shortcutItems = useMemo(() => withNavigationIcons(getMobileNavigationItems(user?.role)), [user?.role]);
  const activeItem = getActiveNavigationItem(items, router.pathname);

  const navigateTo = (url) => {
    setDrawerOpen(false);
    router.push(url);
  };

  const onLogout = async () => {
    try {
      const data = await logoutUser();
      message.success(data.message);
      router.push("/login");
    } catch (err) {
      message.error(err?.message || "An error occurred during logout");
    }
  };

  const menuProps = {
    items: [
      { key: "settings", icon: <SettingOutlined />, label: "Settings" },
      { key: "logout", icon: <LogoutOutlined />, label: "Logout" },
    ],
    onClick: ({ key }) => {
      if (key === "logout") {
        onLogout();
      }
    },
  };

  return (
    <>
      <header className={styles.mobileTopBar}>
        <button
          type="button"
          className={styles.mobileIconButton}
          onClick={() => setDrawerOpen(getToggledDrawerOpen)}
          aria-label={drawerOpen ? "Close navigation" : "Open navigation"}
          aria-expanded={drawerOpen}
        >
          <MenuOutlined />
        </button>

        <button type="button" className={styles.mobileBrand} onClick={() => navigateTo("/dashboard")}>
          <Image src={Logo} width={26} height={26} alt="" aria-hidden="true" />
          <span>{activeItem?.title || "Dashboard"}</span>
        </button>

        <Dropdown menu={menuProps} trigger={["click"]} placement="bottomRight">
          <button type="button" className={styles.mobileAvatarButton} aria-label="Open profile menu">
            <Avatar size={30} className={styles.mobileAvatar}>
              {initials}
            </Avatar>
          </button>
        </Dropdown>
      </header>

      <Drawer
        className={styles.mobileDrawer}
        title={
          <div className={styles.drawerTitle}>
            <Image src={Logo} width={30} height={30} alt="" aria-hidden="true" />
            <span>VAST APPAREL</span>
          </div>
        }
        closeIcon={<CloseOutlined />}
        open={drawerOpen}
        placement="left"
        onClose={() => setDrawerOpen(false)}
        width={300}
      >
        <AppMenuItems
          mode="inline"
          items={items}
          onClickHandler={navigateTo}
          selected={activeItem?.id}
          collapsed={false}
        />
      </Drawer>

      <nav className={styles.mobileBottomNav} aria-label="Common admin actions">
        {shortcutItems.map((item) => {
          const selected = activeItem?.id === item.id;

          return (
            <button
              key={item.id}
              type="button"
              className={`${styles.mobileBottomItem}${selected ? ` ${styles.mobileBottomItemActive}` : ""}`}
              onClick={() => navigateTo(item.url)}
              aria-current={selected ? "page" : undefined}
            >
              <span className={styles.mobileBottomIcon}>{item.icon}</span>
              <span className={styles.mobileBottomLabel}>{item.title}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
