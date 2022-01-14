import { useState } from "react";
import { useRouter } from "next/router";
import { Menu, message } from "antd";
import { LogoutOutlined } from "@ant-design/icons";

import { logoutUser } from "@/hooks/login";
import Spinner from "@/components/spinner";

export default function AppMenuItems({ mode, items, onClickHandler, selected }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const onLogout = () => {
    setLoading(true);
    logoutUser()
      .then((data) => {
        setLoading(false);
        message.success(data.message);
        router.push("/login");
      })
      .catch((err) => {
        setLoading(false);
        message.error(err.message);
      });
  };

  return (
    <>
      {loading && <Spinner />}
      <Menu
        style={{ justifyContent: "end" }}
        theme="dark"
        defaultSelectedKeys={["1"]}
        selectedKeys={[selected]}
        mode={mode}
      >
        {items.map((item) => (
          <Menu.Item onClick={() => onClickHandler(item.url, item.id)} key={item.id} icon={item.icon}>
            {item.title}
          </Menu.Item>
        ))}
        <Menu.Item key="8" icon={<LogoutOutlined />} onClick={onLogout}>
          Logout
        </Menu.Item>
      </Menu>
    </>
  );
}
