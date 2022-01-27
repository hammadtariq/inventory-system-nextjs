import { Button, Drawer } from "antd";
import { useState } from "react";
import AppMenuItems from "./menuItems";
import styles from "@/styles/Navbar.module.css";
import { useRouter } from "next/router";
import {
  DatabaseOutlined,
  FileOutlined,
  FilePptOutlined,
  ShopOutlined,
  TeamOutlined,
  UserOutlined,
  UnorderedListOutlined,
  DollarCircleOutlined,
  DashboardOutlined,
} from "@ant-design/icons";

const items = [
  {
    id: "1",
    title: "Overview",
    url: "/",
    icon: <DashboardOutlined />,
  },
  {
    id: "2",
    title: "Customers",
    url: "/customers",
    icon: <UserOutlined />,
  },
  {
    id: "3",
    title: "Company",
    url: "/company",
    icon: <TeamOutlined />,
  },
  {
    id: "4",
    title: "Items List",
    url: "/items",
    icon: <UnorderedListOutlined />,
  },
  {
    id: "5",
    title: "Purchase",
    url: "/purchase",
    icon: <FileOutlined />,
  },
  {
    id: "6",
    title: "Inventory",
    url: "/inventory",
    icon: <ShopOutlined />,
  },
  {
    id: "7",
    title: "Sales",
    url: "/sales",
    icon: <FileOutlined />,
  },
  {
    id: "8",
    title: "Ledger",
    url: "/ledger",
    icon: <DatabaseOutlined />,
  },
  {
    id: "9",
    title: "Reports",
    url: "/reports",
    icon: <FilePptOutlined />,
  },
  {
    id: "10",
    title: "Cheques",
    url: "/cheques",
    icon: <DollarCircleOutlined />,
  },
];

export default function AppNavbar() {
  const [visible, setVisible] = useState(false);
  const [isSelected, setIsSelected] = useState("0");
  const router = useRouter();

  const onClickHandler = (url, id) => {
    setIsSelected(id);
    router.push(url);
  };

  const showDrawer = () => {
    setVisible(true);
  };

  const onClose = () => {
    setVisible(false);
  };

  return (
    <>
      <div className={styles.navigationBar}>
        <AppMenuItems mode="horizontal" items={items} onClickHandler={onClickHandler} selected={isSelected} />
      </div>
      <Button className={styles.barsMenu} type="primary" onClick={showDrawer}>
        <span className={styles.barsBtn}></span>
      </Button>
      <Drawer className="drawer" title="" placement="right" onClose={onClose} visible={visible}>
        <AppMenuItems mode="vertical" items={items} onClickHandler={onClickHandler} selected={isSelected} />
      </Drawer>
    </>
  );
}
