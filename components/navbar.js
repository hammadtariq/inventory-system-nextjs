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
} from "@ant-design/icons";

const items = [
  {
    id: "1",
    title: "Customers",
    url: "/customers",
    icon: <UserOutlined />,
  },
  {
    id: "2",
    title: "Company",
    url: "/company",
    icon: <TeamOutlined />,
  },
  {
    id: "3",
    title: "Purchase",
    url: "/purchase",
    icon: <FileOutlined />,
  },
  {
    id: "4",
    title: "Inventory",
    url: "/inventory",
    icon: <ShopOutlined />,
  },
  {
    id: "5",
    title: "Sales",
    url: "/sales",
    icon: <FileOutlined />,
  },
  {
    id: "6",
    title: "Ledger",
    url: "/ledger",
    icon: <DatabaseOutlined />,
  },
  {
    id: "7",
    title: "Reports",
    url: "/reports",
    icon: <FilePptOutlined />,
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
