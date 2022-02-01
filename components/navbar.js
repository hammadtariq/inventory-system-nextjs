import { Button, Drawer } from "antd";
import { useEffect, useState } from "react";
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
import NextLink from "next/link";
import AppMenuItems from "./menuItems";
import styles from "@/styles/Navbar.module.css";

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
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const [isSelected, setIsSelected] = useState();

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

  useEffect(() => {
    const splitUrl = router.asPath.split("/").slice(1, router.asPath.length);
    const activeItem = items.find((item) => {
      if (splitUrl.length > 0 && item.url === `/${splitUrl[0]}`) {
        return item;
      }
    });
    const activeId = activeItem ? activeItem.id : items[0].id;
    setIsSelected(activeId);
  }, [router]);

  return (
    <>
      <NextLink href="/" passHref>
        <div className="logo" onClick={() => onClickHandler(items[0].url, items[0].id)}>
          Inventory
        </div>
      </NextLink>
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
