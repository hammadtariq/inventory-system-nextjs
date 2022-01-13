import { LogoutOutlined } from "@ant-design/icons";
import { Menu } from "antd";

export default function AppMenuItems({ mode, items, onClickHandler, selected }) {
  return (
    <>
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
        <Menu.Item key="8" icon={<LogoutOutlined />}>
          Logout
        </Menu.Item>
      </Menu>
    </>
  );
}
